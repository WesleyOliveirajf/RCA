def calcular_prioridade(cliente_data: dict) -> str:
    valor = float(cliente_data.get("valor_historico") or 0)
    ultima_compra = cliente_data.get("ultima_compra")

    meses = 6
    if ultima_compra:
        from datetime import date, datetime

        if isinstance(ultima_compra, str):
            ultima = date.fromisoformat(ultima_compra[:10])
        elif isinstance(ultima_compra, datetime):
            ultima = ultima_compra.date()
        else:
            ultima = ultima_compra
        meses = (date.today() - ultima).days // 30

    if valor > 50000 or meses >= 10:
        return "alta"
    if valor > 20000 or meses >= 8:
        return "media"
    return "baixa"
