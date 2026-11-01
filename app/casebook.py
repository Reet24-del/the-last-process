"""Validated optional story writing; it cannot modify puzzle rules."""

import json
import logging
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from .content import PUZZLES


class Fragments(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fragments: list[Annotated[str, Field(min_length=30, max_length=650)]] = Field(
        min_length=3, max_length=3
    )


class Casebook(Fragments):
    source: Literal["authored", "ultramarine-1-flash"] = "authored"


def load_casebook(path: Path):
    if path.is_file():
        try:
            return Casebook.model_validate(json.loads(path.read_text()))
        except (ValueError, OSError):
            logging.getLogger(__name__).warning(
                "Invalid generated casebook; using authored story"
            )
    return Casebook(fragments=[p["reveal"] for p in PUZZLES])
