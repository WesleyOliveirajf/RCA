from datetime import date, datetime
from decimal import Decimal
from typing import Any

import pyodbc

from rca_api.config import get_settings
from rca_api.integrations.excel_reader import _mapear_row as mapear_excel_row
from rca_api.integrations.excel_reader import buscar_clientes_inativos as buscar_excel_inativos

QUERY_CARTEIRA = """
WITH PEDIDOS_BASE AS (
    SELECT
        P.CODCLI,
        P.NUMERO,
        P.DT_EMISSAO,
        (
            SUM(
                COALESCE(PI.PRECO, 0)
                *
                (COALESCE(PI.QTDE, 0) + COALESCE(PI.QTDE_F, 0))
            )
            -
            (
                SUM(
                    COALESCE(PI.PRECO, 0)
                    *
                    (COALESCE(PI.QTDE, 0) + COALESCE(PI.QTDE_F, 0))
                )
                *
                (
                    COALESCE(
                        COALESCE(P.PER_DESC, 0) + COALESCE(P.PERC_DESC_EMPENHO, 0),
                        0
                    ) / 100
                )
            )
        ) AS VALOR_LIQ
    FROM sisplan.PEDIDO_001 P
    INNER JOIN sisplan.PED_ITEN_001 PI
        ON PI.NUMERO = P.NUMERO
    WHERE 1 = 1
        AND P.DT_EMISSAO >= DATE '2022-01-01'
        AND P.DT_EMISSAO <= DATE '2500-12-31'
        AND P.PERIODO >= '0'
        AND P.PERIODO <= '9999'
        AND (
            P.TELA = 'VenPedidoGrade'
            OR P.TELA = 'PEDIDO_SISPLANWEB'
        )
    GROUP BY
        P.CODCLI,
        P.NUMERO,
        P.DT_EMISSAO,
        P.PER_DESC,
        P.PERC_DESC_EMPENHO
),

PEDIDOS_POSITIVOS AS (
    SELECT
        CODCLI,
        NUMERO,
        DT_EMISSAO,
        VALOR_LIQ
    FROM PEDIDOS_BASE
    WHERE VALOR_LIQ > 0
),

ULTIMO_PEDIDO AS (
    SELECT
        CODCLI,
        NUMERO,
        DT_EMISSAO,
        VALOR_LIQ
    FROM (
        SELECT
            CODCLI,
            NUMERO,
            DT_EMISSAO,
            VALOR_LIQ,
            ROW_NUMBER() OVER (
                PARTITION BY CODCLI
                ORDER BY DT_EMISSAO DESC, NUMERO DESC
            ) AS RN
        FROM PEDIDOS_POSITIVOS
    ) X
    WHERE RN = 1
),

QTD_COMPRAS AS (
    SELECT
        CODCLI,
        COUNT(*) AS QTD_COMPRAS
    FROM PEDIDOS_POSITIVOS
    GROUP BY CODCLI
)

SELECT
    CLIENTE.CODCLI AS "Código",
    CLIENTE.NOME AS "Razão Social",
    CLIENTE.CNPJ AS "CNPJ",
    CASE
        WHEN CLIENTE.DDD_FONE IS NOT NULL
             AND TRIM(CLIENTE.DDD_FONE) <> ''
             AND CLIENTE.TELEFONE IS NOT NULL
             AND TRIM(CLIENTE.TELEFONE) <> ''
        THEN '(' || TRIM(CLIENTE.DDD_FONE) || ') ' || TRIM(CLIENTE.TELEFONE)
        WHEN CLIENTE.TELEFONE IS NOT NULL
             AND TRIM(CLIENTE.TELEFONE) <> ''
        THEN TRIM(CLIENTE.TELEFONE)
        ELSE ''
    END AS "Telefone",
    CLIENTE.EMAIL AS "E-mail",
    '' AS "Segmento",
    CLIENTE.GRUPO AS "Grupo",
    GRUPO_CLI.DESCRICAO AS "DESC_GRUPO",
    CASE
        WHEN UPPER(COALESCE(GRUPO_CLI.DESCRICAO, '')) = 'GERAL'
            THEN CLIENTE.NOME
        WHEN CLIENTE.GRUPO IS NOT NULL
             AND TRIM(CLIENTE.GRUPO) <> ''
            THEN GRUPO_CLI.DESCRICAO
        ELSE CLIENTE.NOME
    END AS "Nome Ajustado (Razão Social / Grupo)",
    CIDADE.NOME AS "Cidade",
    TABUF.DESCRICAO AS "Estado",
    CASE
        WHEN CIDADE.NOME IS NOT NULL
             AND TRIM(CIDADE.NOME) <> ''
             AND TABUF.DESCRICAO IS NOT NULL
             AND TRIM(TABUF.DESCRICAO) <> ''
        THEN TRIM(CIDADE.NOME) || ', ' || TRIM(TABUF.DESCRICAO)
        WHEN CIDADE.NOME IS NOT NULL
             AND TRIM(CIDADE.NOME) <> ''
        THEN TRIM(CIDADE.NOME)
        WHEN TABUF.DESCRICAO IS NOT NULL
             AND TRIM(TABUF.DESCRICAO) <> ''
        THEN TRIM(TABUF.DESCRICAO)
        ELSE ''
    END AS "Cidade/UF",
    '' AS "Endereço",
    CLIENTE.CODREP AS "Cód. Rep",
    REPRESEN.FANTASIA AS "Representante",
    ULTIMO_PEDIDO.DT_EMISSAO AS "Última compra",
    ULTIMO_PEDIDO.DT_EMISSAO AS "Dt. Último Ped.",
    ULTIMO_PEDIDO.NUMERO AS "Número Últ. Ped.",
    ULTIMO_PEDIDO.VALOR_LIQ AS "Valor Líq Últ. Ped.",
    COALESCE(QTD_COMPRAS.QTD_COMPRAS, 0) AS "Qtd. compras"
FROM sisplan.ENTIDADE_001 CLIENTE
LEFT JOIN sisplan.CADCEP_001 CADCEP
    ON CLIENTE.CEP = CADCEP.CEP
LEFT JOIN sisplan.CIDADE CIDADE
    ON CIDADE.CODIGO = CADCEP.CODMUN
LEFT JOIN sisplan.TABUF_001 TABUF
    ON CIDADE.COD_UF = TABUF.CODIGO
LEFT JOIN sisplan.REPRESEN_001 REPRESEN
    ON CLIENTE.CODREP = REPRESEN.CODREP
LEFT JOIN sisplan.GRUPO_CLI_001 GRUPO_CLI
    ON CLIENTE.GRUPO = GRUPO_CLI.CODIGO
INNER JOIN ULTIMO_PEDIDO
    ON ULTIMO_PEDIDO.CODCLI = CLIENTE.CODCLI
LEFT JOIN QTD_COMPRAS
    ON QTD_COMPRAS.CODCLI = CLIENTE.CODCLI
WHERE 1 = 1
    AND (
        CLIENTE.TIPO_ENTIDADE = 'x'
        OR CLIENTE.TIPO_ENTIDADE LIKE '%C%'
    )
    AND LENGTH(REGEXP_REPLACE(CLIENTE.CNPJ, '[^0-9]', '', 'g')) = 14
    AND CLIENTE.CODREP IS NOT NULL
    AND TRIM(CLIENTE.CODREP) <> ''
ORDER BY
    CLIENTE.CODCLI
"""


def _odbc_configurado() -> bool:
    settings = get_settings()
    return bool(settings.sisplan_dsn or (settings.sisplan_host and settings.sisplan_db))


def _connection_string() -> str:
    settings = get_settings()
    if settings.sisplan_dsn:
        parts = [f"DSN={settings.sisplan_dsn}"]
    else:
        parts = [
            f"DRIVER={settings.sisplan_odbc_driver}",
            f"SERVER={settings.sisplan_host}",
            f"DATABASE={settings.sisplan_db}",
        ]
        if settings.sisplan_port:
            parts.append(f"PORT={settings.sisplan_port}")

    if settings.sisplan_user:
        parts.append(f"UID={settings.sisplan_user}")
    if settings.sisplan_pass:
        parts.append(f"PWD={settings.sisplan_pass}")
    return ";".join(parts) + ";"


def get_sisplan_connection() -> pyodbc.Connection:
    return pyodbc.connect(_connection_string(), timeout=60, autocommit=True)


def _rows_to_dicts(cursor: pyodbc.Cursor) -> list[dict[str, Any]]:
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _parse_date(value: Any) -> date | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(text[:10], fmt).date()
        except ValueError:
            continue
    return None


def _meses_desde(data: date | None, hoje: date | None = None) -> int | None:
    if not data:
        return None
    referencia = hoje or date.today()
    return max(0, (referencia - data).days // 30)


def _normalizar_cliente(row: dict[str, Any]) -> dict:
    cliente = mapear_excel_row(row)
    ultima_compra = _parse_date(cliente.get("ultima_compra"))
    cliente["ultima_compra"] = ultima_compra
    if isinstance(cliente.get("valor_historico"), Decimal):
        cliente["valor_historico"] = float(cliente["valor_historico"])
    return cliente


def buscar_clientes_inativos(min_meses: int, max_meses: int) -> list[dict]:
    if not _odbc_configurado():
        return buscar_excel_inativos(min_meses, max_meses)

    clientes: list[dict] = []
    conn = get_sisplan_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(QUERY_CARTEIRA)
        for raw_row in _rows_to_dicts(cursor):
            cliente = _normalizar_cliente(raw_row)
            meses_inativo = _meses_desde(cliente["ultima_compra"])
            if not cliente["sisplan_id"] or not cliente["razao_social"] or meses_inativo is None:
                continue
            if min_meses <= meses_inativo <= max_meses:
                cliente["ultima_compra"] = cliente["ultima_compra"].isoformat()
                clientes.append(cliente)
    finally:
        conn.close()

    return sorted(clientes, key=lambda item: item["valor_historico"], reverse=True)
