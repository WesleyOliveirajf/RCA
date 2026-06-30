from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from rca_api.core.logging import get_logger

logger = get_logger(__name__)


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str):
        super().__init__(f"{resource} não encontrado", 404)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Acesso negado"):
        super().__init__(message, 403)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Não autenticado"):
        super().__init__(message, 401)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    @app.exception_handler(Exception)
    async def generic_error_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Erro não tratado: %s", exc)
        return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})
