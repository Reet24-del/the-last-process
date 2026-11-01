# Ultramarine live verification

Verified November 1, 2026 using `ultramarine-1-flash` at the official Paper Instruments API with the locally saved key.

- Two real requests: the first response failed schema validation and was rejected; the second completed with `finish_reason: stop` and passed the unchanged validator. The first response body was not retained, so its precise schema mismatch is not diagnosed.
- Accepted three fictional diary fragments, reviewed for narrative fit and separation from puzzle rules. Character lengths: 289, 332 and 297.
- Across both requests: 430 input tokens and 484 output tokens including reasoning. Calculated total cost: **$0.00030650 USD**, using the published rates recorded in the ledger. This is an estimate from reported usage, not a settled billing receipt.
- Artifacts: `app/case.generated.json` and `docs/ultramarine-runs.jsonl`. Both attempts, including the rejected response, are accounted for.
- All 20 tests passed after adding the generated content. An API integration check confirmed that the first correct answer unlocks the actual generated fragment with source `ultramarine-1-flash`.
- The local game was restarted to load the casebook. No provider key is included in these artifacts.
- No generator code or validation constraints were changed for this test. The reviewed story and usage ledger are included in the repository for deployment.
