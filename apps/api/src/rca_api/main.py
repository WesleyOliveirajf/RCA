from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from rca_api.config import get_settings
from rca_api.core.exceptions import register_exception_handlers
from rca_api.core.logging import setup_logging
from rca_api.core.middleware import RequestIdMiddleware, limiter
from rca_api.jobs.scheduler import configurar_scheduler, encerrar_scheduler
from rca_api.routers import (
    clientes,
    contatos,
    dashboard,
    health,
    pipeline,
    qualificacao,
    sync,
    usuarios,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    configurar_scheduler()
    yield
    encerrar_scheduler()


def create_app() -> FastAPI:
    settings = get_settings()

    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment)

    app = FastAPI(
        title="Sistema RCA API",
        description="Reativação Comercial Automatizada",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    )

    register_exception_handlers(app)

    prefix = "/api"
    app.include_router(health.router)
    app.include_router(clientes.router, prefix=prefix)
    app.include_router(pipeline.router, prefix=prefix)
    app.include_router(contatos.router, prefix=prefix)
    app.include_router(qualificacao.router, prefix=prefix)
    app.include_router(sync.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    app.include_router(usuarios.router, prefix=prefix)

    return app


app = create_app()
