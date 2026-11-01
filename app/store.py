"""Small transactional save store; session tokens are bearer capabilities."""

import json
import secrets
import sqlite3
import time
from pathlib import Path


class GameError(Exception):
    def __init__(self, message: str, status: int = 400):
        self.message, self.status = message, status


class Store:
    def __init__(self, path: str):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        with self.connect() as db:
            db.execute(
                "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, state TEXT NOT NULL, updated REAL NOT NULL)"
            )

    def connect(self):
        return sqlite3.connect(self.path, timeout=10)

    def create(self):
        now = time.time()
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("DELETE FROM sessions WHERE updated < ?", (now - 86400,))
            if db.execute("SELECT count(*) FROM sessions").fetchone()[0] >= 500:
                raise GameError("The archive is busy. Please return later.", 503)
            token = secrets.token_urlsafe(32)
            state = {
                "stage": 0,
                "hints": [0, 0, 0],
                "attempts": 0,
                "ending": None,
                "messages": [],
                "ghost_calls": 0,
                "last_ghost": 0,
                "created": now,
            }
            db.execute(
                "INSERT INTO sessions VALUES (?, ?, ?)", (token, json.dumps(state), now)
            )
        return token, state

    def change(self, token, operation):
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT state, updated FROM sessions WHERE token = ?", (token,)
            ).fetchone()
            if not row or row[1] < time.time() - 86400:
                raise GameError("This session has expired. Start a new recovery.", 404)
            state = json.loads(row[0])
            result = operation(state)
            db.execute(
                "UPDATE sessions SET state = ?, updated = ? WHERE token = ?",
                (json.dumps(state), time.time(), token),
            )
        return result

    def get(self, token):
        return self.change(token, lambda state: state)
