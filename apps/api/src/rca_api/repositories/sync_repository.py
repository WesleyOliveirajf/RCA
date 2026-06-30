from datetime import datetime

from supabase import Client


class SyncLogRepository:
    def __init__(self, supabase: Client):
        self._db = supabase

    def salvar(self, log: dict) -> dict:
        result = self._db.table("sync_logs").insert(log).execute()
        return result.data[0]

    def ultimo(self) -> dict | None:
        result = (
            self._db.table("sync_logs")
            .select("*")
            .order("inicio", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        return result.data

    def listar_recentes(self, limite: int = 10) -> list[dict]:
        result = (
            self._db.table("sync_logs")
            .select("*")
            .order("inicio", desc=True)
            .limit(limite)
            .execute()
        )
        return result.data or []

    def buscar_config(self, chave: str, default: str = "") -> str:
        result = self._db.table("configuracoes").select("valor").eq("chave", chave).maybe_single().execute()
        if not result.data:
            return default
        valor = result.data.get("valor")
        return str(valor).strip('"') if valor is not None else default
