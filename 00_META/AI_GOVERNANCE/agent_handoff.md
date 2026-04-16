# Agent Handoff

Updated: 2026-04-16

## Current verified state

- pt-PT live rollout is closed and audited.
- Canonical entrypoint for that state:
  `/Users/ovd/Documents/AROMA_AND_WAX/docs/pt-pt-live/README.md`
- Final live audit:
  `/Users/ovd/Documents/AROMA_AND_WAX/docs/pt-pt-live/PT_PT_LIVE_IMPLEMENTATION_AUDIT_2026-04-16.md`

## Critical constraints

- Live Shopify mutations are high-risk and require dry-run plus rollback.
- Product variant label canon is `450 g / 2 kg / 250 ml`.
- Do not treat current live pt-PT copy as source of truth when a local canon is already approved.

## What was just added

- Trio governance scaffold for AROMA + WAX
- project-memory files:
  - `/Users/ovd/Documents/AROMA_AND_WAX/AGENTS.md`
  - `/Users/ovd/Documents/AROMA_AND_WAX/GEMINI.md`
  - `/Users/ovd/Documents/AROMA_AND_WAX/CLAUDE.md`
- local governance root:
  `/Users/ovd/Documents/AROMA_AND_WAX/00_META/AI_GOVERNANCE`
- real Trio smoke call completed successfully:
  `/Users/ovd/Documents/AROMA_AND_WAX/00_META/AI_GOVERNANCE/TRIO_CALLS/2026-04-16_aroma_trio_smoke`
  with both:
  - `RESPONSES/CLAUDE_RESPONSE.md`
  - `RESPONSES/GEMINI_RESPONSE.md`
- operator handoff pack for a second Codex operator:
  - `/Users/ovd/Documents/AROMA_AND_WAX/docs/operator-handoff/README.md`
  - `/Users/ovd/Documents/AROMA_AND_WAX/docs/operator-handoff/FIRST_PROMPT_FOR_NEW_CODEX.md`
  - `/Users/ovd/Documents/AROMA_AND_WAX/docs/operator-handoff/LOCAL_SETUP_CHECKLIST.md`

## Next safe first step

- Transfer the repo through git on branch `codex/ptpt-handoff`, configure fresh local Shopify credentials on the receiving Mac, and start the next Codex session from the operator handoff pack.
