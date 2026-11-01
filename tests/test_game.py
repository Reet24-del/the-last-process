from concurrent.futures import ThreadPoolExecutor

import pytest

from app.content import PUZZLES
from app.game import finish, reserve_hint, submit, view
from app.store import GameError, Store


@pytest.fixture
def storage(tmp_path):
    return Store(str(tmp_path / "test.sqlite3"))


def test_public_state_hides_answers_and_locked_contents(storage):
    _, state = storage.create()
    public = view(state)
    assert "answer" not in public["puzzle"]
    assert public["files"][1]["body"] is None
    assert public["files"][2]["body"] is None
    assert "hints" not in public


def test_wrong_answer_does_not_unlock(storage):
    _, state = storage.create()
    result = submit(state, 0, "north")
    assert not result["correct"]
    assert result["game"]["stage"] == 0


@pytest.mark.parametrize("choice", ["release", "preserve"])
def test_complete_game_and_persistent_ending(storage, choice):
    token, _ = storage.create()
    for stage, answer in enumerate([" WEST ", "MeMoRy", "0314"]):
        assert storage.change(token, lambda state: submit(state, stage, answer))[
            "correct"
        ]
    final = storage.change(token, lambda state: finish(state, choice))
    assert final["stage"] == 3
    assert final["ending"]
    assert Store(storage.path).get(token)["ending"] == choice


def test_stale_submission_cannot_skip_puzzle(storage):
    _, state = storage.create()
    with pytest.raises(GameError):
        submit(state, 1, "memory")
    assert state["stage"] == 0


def test_leading_zero_required(storage):
    _, state = storage.create()
    state["stage"] = 2
    assert not submit(state, 2, "314")["correct"]


def test_hint_levels_cap_and_requests_are_limited(storage):
    _, state = storage.create()
    hints = []
    for _ in range(4):
        state["last_ghost"] = 0
        hints.append(reserve_hint(state, "hint"))
    assert [h["level"] for h in hints] == [1, 2, 3, 3]
    assert hints[-1]["hint"] == PUZZLES[0]["hints"][2]
    with pytest.raises(GameError) as exc:
        reserve_hint(state, "hint")
    assert exc.value.status == 429
    state["ghost_calls"] = 20
    state["last_ghost"] = 0
    with pytest.raises(GameError):
        reserve_hint(state, "hint")


def test_cannot_finish_early_or_change_ending(storage):
    _, state = storage.create()
    with pytest.raises(GameError):
        finish(state, "release")
    state["stage"] = 3
    finish(state, "release")
    with pytest.raises(GameError):
        finish(state, "preserve")


def test_concurrent_duplicate_answers_unlock_once(storage):
    token, _ = storage.create()

    def answer(_):
        try:
            return storage.change(token, lambda state: submit(state, 0, "west"))[
                "correct"
            ]
        except GameError:
            return False

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(answer, range(4)))
    assert sum(results) == 1
    assert storage.get(token)["stage"] == 1


def test_tokens_are_independent_and_missing_session_rejected(storage):
    first, _ = storage.create()
    second, _ = storage.create()
    storage.change(first, lambda state: submit(state, 0, "west"))
    assert storage.get(second)["stage"] == 0
    with pytest.raises(GameError):
        storage.get("not-a-session")
