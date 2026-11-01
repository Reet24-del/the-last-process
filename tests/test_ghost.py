from types import SimpleNamespace
from unittest.mock import Mock

from app.ghost import MODEL, Ghost


def test_calls_correct_model_and_falls_back_without_leaking_exception():
    ghost = Ghost()
    ghost.client = SimpleNamespace(models=Mock())
    ghost.client.models.generate_content.return_value = SimpleNamespace(
        text="The archive remembers you."
    )
    assert ghost.reply({"hint": "look back"}) == ("The archive remembers you.", MODEL)
    assert ghost.client.models.generate_content.call_args.kwargs["model"] == MODEL
    ghost.client.models.generate_content.side_effect = RuntimeError(
        "secret provider response"
    )
    text, source = ghost.reply({"hint": "look back"})
    assert source == "scripted-fallback"
    assert "secret" not in text


def test_global_call_budget():
    ghost = Ghost()
    ghost.client = SimpleNamespace(models=Mock())
    ghost.calls = 200
    assert ghost.reply({})[1] == "scripted"
    ghost.client.models.generate_content.assert_not_called()
