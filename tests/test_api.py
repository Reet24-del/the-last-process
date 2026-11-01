import pytest
from fastapi.testclient import TestClient

from app.ghost import Ghost
from app.main import create_app
from app.store import Store


@pytest.fixture
def client(tmp_path):
    with TestClient(
        create_app(Store(str(tmp_path / "api.sqlite3")), Ghost())
    ) as client:
        yield client


def session(client):
    response = client.post("/api/sessions", json={})
    assert response.status_code == 201
    return {"Authorization": "Bearer " + response.json()["token"]}


def test_health_schema_and_auth(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/api/session").status_code == 401
    assert client.get("/docs").status_code == 200
    assert "/api/answer" in client.get("/openapi.json").json()["paths"]


def test_end_to_end_api(client):
    headers = session(client)
    for i, answer in enumerate(["west", "memory", "0314"]):
        result = client.post(
            "/api/answer", headers=headers, json={"stage": i, "answer": answer}
        )
        assert result.status_code == 200
        assert result.json()["correct"]
    final = client.post("/api/ending", headers=headers, json={"choice": "release"})
    assert final.json()["game"]["ending"]["title"] == "Process complete."


def test_fallback_hint_is_honest_and_bounded(client):
    headers = session(client)
    response = client.post("/api/ghost", headers=headers, json={"message": "help me"})
    assert response.status_code == 200
    assert response.json()["source"] == "scripted"
    assert response.json()["hint"]
    assert response.headers["cache-control"] == "no-store"
    assert (
        client.post(
            "/api/ghost", headers=headers, json={"message": "again"}
        ).status_code
        == 429
    )


def test_payload_validation(client):
    headers = session(client)
    assert (
        client.post(
            "/api/answer", headers=headers, json={"stage": 0, "answer": "x" * 101}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/ghost", headers=headers, json={"message": "x" * 501}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/ending", headers=headers, json={"choice": "arbitrary"}
        ).status_code
        == 422
    )
