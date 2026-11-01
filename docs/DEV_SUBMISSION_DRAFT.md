---
title: "The Last Process: I built a haunted desktop whose AI can't rewrite the rules"
published: false
tags: devchallenge, hf26challenge, ai, opensource
---

<!-- Before publishing: insert verified demo/code links and screenshots, credit every actual teammate with DEV handles, confirm challenge eligibility and rules, reconcile sponsor cost, and remove this note. This file is a draft, not a submitted entry. -->

## What I Built

An abandoned desktop. Three corrupted files. One process that never stopped waiting.

**The Last Process** is a short browser escape room for *Ghost in the Machine*. You recover fragments of a fictional programmer's diary, talk to the resident of her computer, and decide how to close the archive.

The resident uses Gemma 4. The locks don't.

That distinction is the heart of the project: the AI can make the room feel alive, but it cannot change the puzzle answers, invent an unlock command, or strand a player behind an impossible riddle.

## Demo

Public demo: pending deployment and verification.

The intended demo takes about a minute: trace the returning signal, decode a message, recover the last heartbeat time, and read Mara's final letter. Asking for help produces an in-character response alongside a reliable authored hint.

Sound starts off. There are no jump scares or real system commands. All people and events in the game are fictional.

## Code

Public repository: pending publication.

The application code is MIT licensed. Puzzle rules, provider calls, save storage and the React interface are separate modules. The repository includes tests and a one-service Docker build.

## How I Built It

The frontend is React and Vite. FastAPI serves the built client and a small HTTP API. SQLite stores progression using opaque session tokens, so a refresh can resume a game on the same running host.

Gemma 4, through Google's Gemini API, receives the current fictional clue, the player's message and an approved hint. It writes the resident's dialogue. Python validates every answer and decides what unlocks next.

I deliberately display the authored hint separately from generated dialogue. If the model is wrong or the provider is unavailable, the player still has a path forward. The interface labels fallback text instead of pretending a model call succeeded.

An optional Ultramarine writer produces validated diary fragments at build time. Its schema accepts story paragraphs, not puzzle rules. This integration must be live-verified before it is included as a completed sponsor category.

Tests cover stale answers, concurrent submissions, progression, endings, limits, invalid generated writing and provider failure. Browser checks cover the whole game, save/resume and a narrow mobile viewport. Measured results and screenshots will be inserted after the final deployed build is verified.

I used Codex to assist implementation, tests and review, and ImageGen for the resident portrait and visual concept. The interactive desktop itself is native code, not a screenshot.

## Why Does Open Innovation Matter?

A ghost story shouldn't have to be tied to one inference endpoint.

Gemma's open weights offer a path to running the resident through a compatible local runtime in a future version. This demo uses hosted Gemma; it does not claim local inference. The game engine and story format stay independent of the model, so the room can survive a provider change.

Publishing the rules and tests also makes an AI design decision inspectable: generated atmosphere and authoritative state are different responsibilities. Other builders can reuse that boundary in their own games.

## The Spirit of It

The haunting isn't that the machine contains a person. It's that a convincing voice can make us forget the difference.

Both endings let the listener stop. One keeps the words. Neither asks a simulation to keep waiting forever.

## Prize Categories

- **Best Use of Gemma:** intended entry, pending final deployed live-call verification. Gemma plays the resident, reacts to the current clue and adds atmosphere to the help flow.
- **Ultramarine:** include only after a real casebook generation is accepted, its usage ledger is reviewed, and the final category name and settled cost are confirmed.
- **Hosting categories:** include only the services actually deployed and demonstrated in the final build.

<!-- Final review must replace pending statements with evidence, remove unqualified categories and add the actual creator/team DEV usernames. -->
