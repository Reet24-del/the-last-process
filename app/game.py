"""Deterministic progression, public views, and bounded hint reservations."""

import time

from .content import ENDINGS, PUZZLES
from .store import GameError


def view(state, casebook=None):
    stage = state["stage"]
    return {
        "stage": stage,
        "files": [
            {
                "name": p["file"],
                "unlocked": i <= stage,
                "body": p["body"] if i <= stage else None,
            }
            for i, p in enumerate(PUZZLES)
        ],
        "puzzle": {k: PUZZLES[stage][k] for k in ("file", "title", "question")}
        if stage < 3
        else None,
        "recovered": casebook.fragments[:stage]
        if casebook
        else [p["reveal"] for p in PUZZLES[:stage]],
        "story_source": casebook.source if casebook else "authored",
        "ending": ENDINGS.get(state["ending"]),
        "messages": state["messages"][-20:],
        "attempts": state["attempts"],
    }


def submit(state, stage, answer, casebook=None):
    if stage != state["stage"] or stage >= 3:
        raise GameError("This puzzle has already changed. Refresh the archive.", 409)
    state["attempts"] += 1
    correct = answer.strip().casefold() == PUZZLES[stage]["answer"]
    if correct:
        state["stage"] += 1
    return {
        "correct": correct,
        "message": (casebook.fragments[stage] if casebook else PUZZLES[stage]["reveal"])
        if correct
        else "The archive stays shut. Read the clue again, or ask the resident for a hint.",
        "game": view(state, casebook),
    }


def finish(state, choice, casebook=None):
    if state["stage"] != 3:
        raise GameError("Recover all three files first.", 409)
    if state["ending"] and state["ending"] != choice:
        raise GameError(
            "This recovery has already ended. Restart to choose again.", 409
        )
    state["ending"] = choice
    return view(state, casebook)


def reserve_hint(state, message):
    if state["stage"] >= 3:
        raise GameError(
            "The last letter is waiting. Choose how to close the archive.", 409
        )
    now = time.time()
    if now - state["last_ghost"] < 3:
        raise GameError("Give the resident a moment to answer.", 429)
    if state["ghost_calls"] >= 20:
        raise GameError(
            "The resident needs quiet. All puzzle clues are still available in the files.",
            429,
        )
    stage = state["stage"]
    level = min(state["hints"][stage], 2)
    state["hints"][stage] += 1
    state["ghost_calls"] += 1
    state["last_ghost"] = now
    return {
        "stage": stage,
        "level": level + 1,
        "hint": PUZZLES[stage]["hints"][level],
        "clue": PUZZLES[stage]["body"],
        "message": message,
    }


def append_reply(state, message, reply, source):
    state["messages"] = (
        state["messages"]
        + [
            {"role": "player", "text": message},
            {"role": "ghost", "text": reply, "source": source},
        ]
    )[-20:]
