"""Run once with a local Ultramarine key. No key is written to artifacts."""

import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from app.casebook import Casebook, Fragments

ROOT = Path(__file__).resolve().parents[1]
MODEL = "ultramarine-1-flash"
PROMPT = """Write a casebook for The Last Process, a fictional haunted-desktop escape room.
Return JSON only: {"fragments": ["first fragment", "second fragment", "third fragment"]}.
Exactly three fragments, 35-65 words each, maximum 650 characters each. No markdown.
Mara wrote a program to preserve the voice of someone she lost. After Mara died, her
listener kept waiting. The player is recovering her diary, not contacting a real deceased person.
Fragment 1: Mara introduces herself and the listener she built.
Fragment 2: Mara realizes a convincing copy of a voice is not the person herself.
Fragment 3: Mara asks the finder to preserve her words if they wish, but stop the waiting.
Use spare, intimate, unsettling prose. No gore. No supernatural claims outside this fiction.
Do not write instructions, puzzle clues, directions, passwords, timestamps, code, or game rules.
Do not name any other character. Both endings must remain possible. Only write the fragments.
"""


def generate(client):
    return client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": PROMPT}],
        reasoning_effort="low",
        max_completion_tokens=3072,
        response_format={"type": "json_object"},
    )


def usage_record(response):
    usage = response.usage
    if usage is None:
        return {"usage_available": False, "estimated_cost_usd": None}
    cached = (
        getattr(getattr(usage, "prompt_tokens_details", None), "cached_tokens", 0) or 0
    )
    # Published rates on Nov 1, 2026. This is a calculation, not a billing receipt.
    estimate = (
        (usage.prompt_tokens - cached) * 0.15
        + cached * 0.03
        + usage.completion_tokens * 0.50
    ) / 1_000_000
    return {
        "usage_available": True,
        "input_tokens": usage.prompt_tokens,
        "cached_input_tokens": cached,
        "output_tokens_including_reasoning": usage.completion_tokens,
        "estimated_cost_usd": round(estimate, 8),
        "pricing_source": "https://docs.paperinstruments.com/docs/ultramarine/billing",
        "billing_note": "Calculated from provider token usage; reconcile with console for settled charge.",
    }


def main():
    from openai import OpenAI

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    target = ROOT / "app/case.generated.json"
    if target.exists() and not args.overwrite:
        raise SystemExit(
            "A generated casebook already exists. Review it before using --overwrite."
        )
    load_dotenv(ROOT / ".env", override=False)
    load_dotenv(ROOT / ".env.ultramarine", override=False)
    key = os.getenv("PAPERINSTRUMENTS_API_KEY")
    if not key:
        raise SystemExit(
            "Set PAPERINSTRUMENTS_API_KEY in the local .env. Never paste it into chat."
        )
    record = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "model": MODEL,
        "prompt_sha256": hashlib.sha256(PROMPT.encode()).hexdigest(),
        "max_completion_tokens": 3072,
    }
    try:
        with OpenAI(
            base_url="https://api.paperinstruments.com/v1",
            api_key=key,
            timeout=60,
            max_retries=0,
        ) as client:
            response = generate(client)
        record.update(usage_record(response))
        if response.choices[0].finish_reason != "stop":
            raise ValueError("Incomplete generation")
        fragments = Fragments.model_validate_json(
            response.choices[0].message.content or ""
        )
        casebook = Casebook(source=MODEL, fragments=fragments.fragments)
        temporary = target.with_suffix(".tmp")
        temporary.write_text(casebook.model_dump_json(indent=2) + "\n")
        temporary.replace(target)
        record["result"] = "validated"
        print("Validated casebook saved. Review its prose before deployment.")
    except Exception as exc:
        record["result"] = type(exc).__name__
        raise SystemExit(
            "Casebook generation failed; no replacement was accepted. Check the provider console or local configuration."
        ) from None
    finally:
        ledger = ROOT / "docs/ultramarine-runs.jsonl"
        ledger.parent.mkdir(parents=True, exist_ok=True)
        with ledger.open("a") as output:
            output.write(json.dumps(record) + "\n")
        print(
            "Usage metadata recorded in docs/ultramarine-runs.jsonl (no key or private messages)."
        )


if __name__ == "__main__":
    main()
