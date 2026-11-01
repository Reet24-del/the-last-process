# First playable version: implementation review

Reviewed locally on November 1, 2026. This is a playable local build, not a completed challenge submission.

Follow-up: the repository was published, and Ultramarine subsequently passed a live generation and API integration check. See `ULTRAMARINE_TEST.md` for evidence and usage accounting. The table below records the original first-version review.

## What is implemented

| Part | Implementation | Evidence |
| --- | --- | --- |
| Three puzzles and two endings | Authored rules in `app/content.py`; progression in `app/game.py` | Unit/API tests and complete browser play-through |
| Saves | Transactional SQLite, opaque tokens, 24-hour idle expiry | Resume after refresh verified; separate sessions and concurrent answer tests |
| Resident | Actual `gemma-4-26b-a4b-it` through Google Gen AI SDK | Full prompt and browser hint call returned live Gemma dialogue |
| Reliable help | Three authored hint levels, displayed separately from dialogue | Fallback browser run, API tests and live run |
| Interface | React components, responsive file rail/reader/resident, native text and controls | Desktop 1672×941 and mobile 390×844 browser checks |
| Sound | Quiet synthesized ambient tones, off by default | Browser toggle check; no ElevenLabs claim |
| Ultramarine writer | OpenAI SDK at Paper Instruments' endpoint, bounded generation, schema validation, usage ledger | Mocked provider/validation/cost tests; real call pending local key |
| Deployment | Multi-stage Dockerfile and explicitly free Render blueprint | Frontend production build passed; container and cloud deployment pending |
| Submission | DEV template draft with required tags and honest pending states | Not published; final links, credits and category evidence still required |

## Critical findings and fixes

1. **Generated text must not own game state.** The API never interprets dialogue as a command. Only the answer validator advances the stage. A generated casebook can replace diary prose, not clues or answers.
2. **An AI hint can still be misleading.** A separately displayed authored hint remains authoritative. This does not establish perfect dialogue accuracy or complete prompt-injection resistance.
3. **Provider settings need a real test.** Full prompts returned a server error during initial calls with a custom sampling override. The default sampling configuration succeeded, including through the browser. The override was removed; this observation is not presented as a universal provider bug.
4. **Hidden retries can defeat a request budget.** Google SDK retries are disabled. Each hosted call has a 15-second timeout and a 1,024-token output ceiling. The Ultramarine CLI also disables retries and bounds output to 3,072 tokens.
5. **Duplicate submissions can race.** SQLite write transactions and an expected-stage check allow only one concurrent duplicate answer to unlock a file. The concurrency test passes.
6. **Fallback must be honest.** The response and UI distinguish actual Gemma dialogue from scripted text. A configured key is not proof that every subsequent call will succeed.
7. **Credentials and saves do not belong in the repository.** `.env`, `.env.ultramarine`, database files, build outputs and node modules are ignored. Only variable names appear in examples. The browser never receives a provider key.
8. **A refresh should not strand a player.** The browser resumes via its local token; expired or missing sessions start a fresh game. Storage denial is handled with an in-memory token for the current page.

## Verification

- 20 pytest tests passed. One upstream Starlette/httpx deprecation warning remains; it did not fail a check.
- Ruff import/basic correctness checks passed.
- Prettier checks and Vite production build passed.
- Browser flow: wrong answer → authored or live hint → all three answers → final choice → reload/resume → restart confirmation. Both ending choices are covered by backend tests; browser checks cover their visible results.
- No application runtime errors appeared in the exercised browser paths. Mobile checks found no horizontal page overflow.
- The Browser plugin is not available in this session, so installed Playwright Chromium was used for local verification. Native Safari is used for external service sign-in.

## Visual comparison

The ImageGen concept establishes a near-black desktop, parchment text, acid-yellow controls, a serif masthead, a left file rail, central reader and right resident portrait. The implementation was compared at the concept's 1672×941 dimensions.

| Comparison | Review and adjustment |
| --- | --- |
| Layout | Preserved three-pane desktop. Mobile moves files above the reader and places the resident below it. |
| Typography | Preserved serif title and monospaced interface; increased reader text and corrected row height to keep the footer visible. |
| Palette | Near-black base, muted parchment text and restrained yellow selection/buttons preserved. |
| Asset | Generated a separate grainy ghost portrait and placed it in the resident rail; no rasterized UI controls. |
| Controls and copy | Restart, file selection, answer/Submit, ghost/Send, Recovery and Sound remain native and interactive. |
| Intentional differences | Locked-file icons, privacy/source labels, reliable hint display and restart confirmation support the real workflow. The concept's heavy distressed frame texture is omitted to protect readability. |

## Remaining limitations

- No public repository or deployment has been claimed. Docker has not been built locally because the Docker CLI is unavailable.
- Ultramarine is implemented but not live-verified until a key is saved and a generated casebook is accepted. No fabricated usage ledger is provided.
- Free-host local storage is ephemeral; production durability needs a persistent database. Saves and model budgets are not shared across replicas; the deployment uses one worker.
- The public demo has bounded sessions/messages/calls but no account system or billing-grade distributed abuse protection. A process restart resets its model budget.
- Google receives the ghost message and fictional clue on request. A local bounded dialogue history is retained with progress; this is not a private local-model deployment.
- DigitalOcean's connected account was identified as belonging to someone else and is not used. The user's own sign-in is pending. MongoDB, Sentry and ElevenLabs are not claimed as completed integrations.
- Final DEV publication needs actual creator credits, verified links, rule/eligibility confirmation, the user's approval, and any applicable settled sponsor cost.
