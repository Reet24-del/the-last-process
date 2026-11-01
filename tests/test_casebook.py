import json
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from pydantic import ValidationError

from app.casebook import Casebook, Fragments, load_casebook
from app.game import submit, view
from app.store import Store
from scripts.generate_casebook import generate, usage_record


def test_bad_story_falls_back_without_breaking_game(tmp_path):
    file = tmp_path / "case.json"
    file.write_text('{"source":"unknown","fragments":["broken"]}')
    result = load_casebook(file)
    assert result.source == "authored"
    assert len(result.fragments) == 3


def test_casebook_cannot_change_rules(tmp_path):
    fragments = ["Mara left a quiet fragment of her story in this file."] * 3
    book = Casebook(source="ultramarine-1-flash", fragments=fragments)
    storage = Store(str(tmp_path / "game.sqlite3"))
    _, state = storage.create()
    assert view(state, book)["recovered"] == []
    assert not submit(state, 0, "memory", book)["correct"]
    result = submit(state, 0, "west", book)
    assert result["message"] == fragments[0]
    assert result["game"]["story_source"] == "ultramarine-1-flash"
    with pytest.raises(ValidationError):
        Fragments.model_validate({"fragments": fragments, "answer": "override"})


def test_ultramarine_request_is_bounded_and_uses_correct_provider_model():
    client = SimpleNamespace(chat=SimpleNamespace(completions=Mock()))
    generate(client)
    kwargs = client.chat.completions.create.call_args.kwargs
    assert kwargs["model"] == "ultramarine-1-flash"
    assert kwargs["max_completion_tokens"] == 3072
    assert kwargs["response_format"] == {"type": "json_object"}


def test_cost_uses_cached_tokens_and_reasoning_output():
    response = SimpleNamespace(
        usage=SimpleNamespace(
            prompt_tokens=2000,
            completion_tokens=1000,
            prompt_tokens_details=SimpleNamespace(cached_tokens=1000),
        )
    )
    record = usage_record(response)
    assert record["estimated_cost_usd"] == pytest.approx(0.00068)
    assert "billing receipt" not in json.dumps(record)
    assert usage_record(SimpleNamespace(usage=None))["estimated_cost_usd"] is None
