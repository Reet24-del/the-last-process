"""HTTP transport and static delivery for one deployable service."""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from starlette.concurrency import run_in_threadpool

from .casebook import load_casebook
from .game import append_reply, finish, reserve_hint, submit, view
from .ghost import MODEL, Ghost
from .store import GameError, Store

ROOT = Path(__file__).resolve().parents[1]


class Answer(BaseModel):
    model_config = ConfigDict(extra="forbid")
    stage: int = Field(ge=0, le=2)
    answer: str = Field(min_length=1, max_length=100)


class Message(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=500)


class Choice(BaseModel):
    model_config = ConfigDict(extra="forbid")
    choice: Literal["release", "preserve"]


def create_app(store=None, ghost=None):
    @asynccontextmanager
    async def lifespan(app):
        load_dotenv(ROOT / ".env", override=False)
        app.state.store = store or Store(
            os.getenv("GAME_DB_PATH", str(ROOT / "data/game.sqlite3"))
        )
        app.state.ghost = ghost or Ghost(os.getenv("GEMINI_API_KEY"))
        app.state.casebook = load_casebook(ROOT / "app/case.generated.json")
        try:
            yield
        finally:
            if app.state.ghost.client is not None:
                app.state.ghost.client.close()

    app = FastAPI(
        title="The Last Process",
        version="0.1.0",
        lifespan=lifespan,
        description="A fictional haunted desktop. Start a session, then use its token as a Bearer token in Authorization. No real commands are executed.",
    )

    @app.exception_handler(GameError)
    async def game_error(request, exc):
        return JSONResponse({"detail": exc.message}, status_code=exc.status)

    @app.middleware("http")
    async def security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Frame-Options"] = "DENY"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    def token(authorization: str = Header(default="")):
        if not authorization.startswith("Bearer ") or len(authorization) > 100:
            raise GameError("Start a recovery to receive a session token.", 401)
        return authorization[7:]

    @app.get("/health")
    def health():
        return {"status": "ok", "model": MODEL}

    @app.post("/api/sessions", status_code=201)
    def create_session(request: Request):
        key, state = request.app.state.store.create()
        return {
            "token": key,
            "game": view(state, request.app.state.casebook),
            "hosted_available": request.app.state.ghost.client is not None,
        }

    @app.get("/api/session")
    def get_session(request: Request, key=Depends(token)):
        return {
            "game": view(request.app.state.store.get(key), request.app.state.casebook),
            "hosted_available": request.app.state.ghost.client is not None,
        }

    @app.post("/api/answer")
    def answer(body: Answer, request: Request, key=Depends(token)):
        return request.app.state.store.change(
            key,
            lambda state: submit(
                state, body.stage, body.answer, request.app.state.casebook
            ),
        )

    @app.post("/api/ending")
    def ending(body: Choice, request: Request, key=Depends(token)):
        return {
            "game": request.app.state.store.change(
                key,
                lambda state: finish(state, body.choice, request.app.state.casebook),
            )
        }

    @app.post("/api/ghost")
    async def speak(body: Message, request: Request, key=Depends(token)):
        storage = request.app.state.store
        context = await run_in_threadpool(
            storage.change, key, lambda state: reserve_hint(state, body.message)
        )
        reply, source = await run_in_threadpool(request.app.state.ghost.reply, context)
        await run_in_threadpool(
            storage.change,
            key,
            lambda state: append_reply(state, body.message, reply, source),
        )
        return {
            "reply": reply,
            "source": source,
            "hint": context["hint"],
            "level": context["level"],
            "stage": context["stage"],
        }

    dist = ROOT / "web/dist"
    if dist.is_dir():
        app.mount("/", StaticFiles(directory=dist, html=True), name="web")
    return app


app = create_app()
