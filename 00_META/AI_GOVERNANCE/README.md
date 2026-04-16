# AROMA + WAX Trio Governance

This folder is the local operating surface for real Trio orchestration on the
AROMA + WAX project.

## Purpose

Use this layer when a decision is too risky to remain single-agent:

- high-risk Shopify writes
- release or rollback decisions
- localization strategy pivots
- disputed audit findings
- catalog identity interventions

## Layout

- `agent_handoff.md` - current cross-agent handoff
- `session_log.md` - compact session history
- `TRIO_CALLS/` - stateless Trio review artifacts
- `TRIO_WORK_SESSIONS/` - persistent multi-turn Trio work artifacts

## Shared harness

External harness location:

`/Users/ovd/Documents/TRIO_ORCHESTRATION`

Primary commands:

```zsh
/Users/ovd/Documents/TRIO_ORCHESTRATION/bin/trio-call \
  --project aromawax \
  --slug reviewer_pass \
  --question "Review the current risk and return concrete implementation concerns."
```

```zsh
/Users/ovd/Documents/TRIO_ORCHESTRATION/bin/trio-work \
  start \
  --project aromawax \
  --slug rollout_review \
  --agents claude,gemini \
  --question "Start a long-form release safety review."
```

```zsh
/Users/ovd/Documents/TRIO_ORCHESTRATION/bin/trio-work \
  send \
  --project aromawax \
  --work-id 2026-04-16_rollout_review \
  --question "Continue from the last turn and review the new evidence."
```

## Rules

- Trio means real response files, not simulated peer voices.
- `TRIO_CALLS` and `TRIO_WORK_SESSIONS` are ignored in git except for `.gitkeep`.
- Keep the handoff readable enough that another agent can resume without guesswork.
