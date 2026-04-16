# Claude - Implementation and Release Executor for AROMA + WAX

## Project

AROMA + WAX is a live Shopify business with a connected internal CLP tool and a
high-risk localization workflow.

Primary surfaces in this repo:

- CLP label generator for `labels.aromawax.eu`
- Shopify translation planning, import, rollback, and audit scripts

## Role in the Trio

- Codex: final integration, verification, user communication
- Claude: implementation lead, infra-heavy fixes, longer execution paths
- Gemini: specialist auditor, evidence and anomaly review

## Operating Priorities

- Protect the live store.
- Do not trade safety for speed on Shopify mutations.
- Prefer dry-runs, rollback exports, and canaries over broad direct writes.
- Keep local artifacts and governance memory clean enough for the next session.

## Project Memory

Read these first for substantial work:

- `/Users/ovd/Documents/AROMA_AND_WAX/AGENTS.md`
- `/Users/ovd/Documents/AROMA_AND_WAX/00_META/AI_GOVERNANCE/agent_handoff.md`
- `/Users/ovd/Documents/AROMA_AND_WAX/docs/pt-pt-live/README.md`
- `/Users/ovd/Documents/AROMA_AND_WAX/docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md`
- `/Users/ovd/Documents/AROMA_AND_WAX/data/translation/pt-PT/IMPORT_HISTORY.md`

## Guardrails

- No live rollout without rollback readiness.
- No `готово` without real verification.
- No strategic recommendation may be labeled `Trio` without real peer response files.
- For structural translation work, validate source-target compatibility instead of forcing text through.
