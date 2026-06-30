import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import pyodbc

from rca_api.config import get_settings

EXCEL_ALIASES = {
    "sisplan_id": ("sisplan_id", "codigo", "cod_cliente", "cliente_id", "id_cliente"),
    "razao_social": ("razao_social", "razao", "cliente", "nome", "nome_cliente"),
    "nome_fantasia": ("nome_fantasia", "fantasia", "apelido", "nome_ajustado_razao_social_grupo"),
    "cnpj": ("cnpj", "cpf_cnpj"),
    "telefone": ("telefone", "fone", "celular", "whatsapp"),
    "email": ("email", "e_mail"),
    "endereco": ("endereco", "logradouro"),
    "cidade": ("cidade", "municipio"),
    "estado": ("estado", "uf"),
    "segmento": ("segmento", "grupo", "desc_grupo"),
    "ultima_compra": (
        "ultima_compra",
        "dt_ultima_compra",
        "data_ultima_compra",
        "dt_ultimo_ped",
    ),
    "valor_historico": (
        "valor_historico",
        "valor_total",
        "total_compras",
        "faturamento",
        "valor_liq_ult_ped",
    ),
    "qtd_compras": ("qtd_compras", "quantidade_compras", "pedidos", "qtd_pedidos"),
}


def _normalizar_nome_coluna(nome: str) -> str:
    normalized = nome.strip().lower()
    for old, new in (
        ("ç", "c"),
        ("ã", "a"),
        ("á", "a"),
        ("à", "a"),
        ("â", "a"),
        ("é", "e"),
        ("ê", "e"),
        ("í", "i"),
        ("ó", "o"),
        ("ô", "o"),
        ("õ", "o"),
        ("ú", "u"),
    ):
        normalized = normalized.replace(old, new)
    normalized = re.sub(r"[^a-z0-9]+", "_", normalized)
    return normalized.strip("_")


def _primeiro_valor(row: dict[str, Any], aliases: tuple[str, ...]) -> Any:
    for alias in aliases:
        if alias in row and row[alias] not in (None, ""):
            return row[alias]
    return None


def _parse_date(value: Any) -> date | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, (int, float)):
        return datetime.fromordinal(datetime(1899, 12, 30).toordinal() + int(value)).date()

    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(text[:10], fmt).date()
        except ValueError:
            continue
    return None


def _parse_decimal(value: Any) -> float:
    if value in (None, ""):
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip().replace("R$", "").replace(" ", "")
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return float(Decimal(text))
    except (InvalidOperation, ValueError):
        return 0.0


def _parse_int(value: Any) -> int:
    if value in (None, ""):
        return 0
    try:
        return int(float(str(value).replace(",", ".")))
    except ValueError:
        return 0


def _meses_desde(data: date | None, hoje: date | None = None) -> int | None:
    if not data:
        return None
    referencia = hoje or date.today()
    return max(0, (referencia - data).days // 30)


def _mapear_row(row: dict[str, Any]) -> dict:
    normalizada = {_normalizar_nome_coluna(k): v for k, v in row.items()}
    ultima_compra = _parse_date(_primeiro_valor(normalizada, EXCEL_ALIASES["ultima_compra"]))

    return {
        "sisplan_id": str(_primeiro_valor(normalizada, EXCEL_ALIASES["sisplan_id"]) or "").strip(),
        "razao_social": str(
            _primeiro_valor(normalizada, EXCEL_ALIASES["razao_social"]) or ""
        ).strip(),
        "nome_fantasia": _primeiro_valor(normalizada, EXCEL_ALIASES["nome_fantasia"]),
        "cnpj": _primeiro_valor(normalizada, EXCEL_ALIASES["cnpj"]),
        "telefone": _primeiro_valor(normalizada, EXCEL_ALIASES["telefone"]),
        "email": _primeiro_valor(normalizada, EXCEL_ALIASES["email"]),
        "endereco": _primeiro_valor(normalizada, EXCEL_ALIASES["endereco"]),
        "cidade": _primeiro_valor(normalizada, EXCEL_ALIASES["cidade"]),
        "estado": _primeiro_valor(normalizada, EXCEL_ALIASES["estado"]),
        "segmento": _primeiro_valor(normalizada, EXCEL_ALIASES["segmento"]),
        "ultima_compra": ultima_compra,
        "valor_historico": _parse_decimal(
            _primeiro_valor(normalizada, EXCEL_ALIASES["valor_historico"])
        ),
        "qtd_compras": _parse_int(_primeiro_valor(normalizada, EXCEL_ALIASES["qtd_compras"])),
    }


def _connection_string() -> str:
    settings = get_settings()
    excel_path = Path(settings.sisplan_excel_path).expanduser() if settings.sisplan_excel_path else None
    if not excel_path:
        project_root = Path(__file__).resolve().parents[5]
        excel_files = sorted((project_root / "odbc").glob("*.xls*"))
        if not excel_files:
            raise FileNotFoundError("Nenhum arquivo Excel encontrado na pasta odbc")
        excel_path = excel_files[0]

    if not excel_path.exists():
        raise FileNotFoundError(f"Arquivo Excel não encontrado: {excel_path}")

    return (
        f"DRIVER={settings.sisplan_excel_odbc_driver};"
        f"DBQ={excel_path};"
        'Extended Properties="Excel 12.0 Xml;HDR=YES;IMEX=1";'
        "ReadOnly=1;"
    )


def ler_planilha(sheet: str | None = None) -> list[dict]:
    settings = get_settings()
    sheet_name = (sheet or settings.sisplan_excel_sheet).strip().rstrip("$")
    range_name = settings.sisplan_excel_range.strip()
    table_name = f"[{sheet_name}${range_name}]" if range_name else f"[{sheet_name}$]"

    conn = pyodbc.connect(_connection_string(), timeout=30, autocommit=True)
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [column[0] for column in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        conn.close()


def buscar_clientes_inativos(min_meses: int, max_meses: int) -> list[dict]:
    clientes: list[dict] = []
    for raw_row in ler_planilha():
        cliente = _mapear_row(raw_row)
        meses_inativo = _meses_desde(cliente["ultima_compra"])
        if not cliente["sisplan_id"] or not cliente["razao_social"] or meses_inativo is None:
            continue
        if min_meses <= meses_inativo <= max_meses:
            cliente["ultima_compra"] = cliente["ultima_compra"].isoformat()
            clientes.append(cliente)

    return sorted(clientes, key=lambda item: item["valor_historico"], reverse=True)
