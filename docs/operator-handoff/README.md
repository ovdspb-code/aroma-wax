# Operator Handoff Pack

This pack is the clean entrypoint for handing the project to a second operator
or to another Codex instance on a different Mac.

## What this pack is for

Use it when you want the next operator to inherit:

- the current CLP tool state
- the completed pt-PT live rollout
- the live-safe rollback and audit surface
- the operating rules for future Shopify work

## Important rule about paths

Many older project documents were authored on the original machine and use the
absolute prefix:

```text
/Users/ovd/Documents/AROMA_AND_WAX/
```

On a different Mac, read that as:

```text
<your local clone root>/
```

The file names and relative paths are still the source of truth.

## Important rule about secrets

Do not copy `.env.local` from another machine.

On the receiving Mac:

- create a fresh local `.env.local`
- use that operator's own Shopify Dev App credentials
- keep tokens, client secrets, and local passwords out of git

## Current verified state

- The CLP tool lives in this repo and remains the operational app surface.
- pt-PT is already live and published on the storefront route `/pt/`.
- The pt-PT rollout is backed by rollback snapshots, import history, guard
  reports, and a final live audit.
- The next strategic problem is not "is Portuguese live?" but "how to unify the
  client workflow so Portuguese is not managed as a special case."

## Reading order

1. [First prompt for the next Codex](FIRST_PROMPT_FOR_NEW_CODEX.md)
2. [Local setup checklist](LOCAL_SETUP_CHECKLIST.md)
3. [pt-PT live pack](../pt-pt-live/README.md)
4. [Final pt-PT live audit](../pt-pt-live/PT_PT_LIVE_IMPLEMENTATION_AUDIT_2026-04-16.md)
5. [pt-PT context capsule](../PT_PT_TRANSLATION_CONTEXT_CAPSULE.md)
6. [Admin handoff](../ADMIN_HANDOFF.md)
7. [Colleague handoff](../COLLEAGUE_HANDOFF.md)
8. `AGENTS.md`
9. `CLAUDE.md`
10. `GEMINI.md`
11. `00_META/AI_GOVERNANCE/README.md`

## Git transfer workflow

Recommended transfer path:

1. Push this handoff branch.
2. On the receiving Mac:
   - clone or fetch the repo
   - checkout `codex/ptpt-handoff`
   - configure a fresh `.env.local`
   - run only read-only validation first
3. Start the next Codex from `FIRST_PROMPT_FOR_NEW_CODEX.md`.

## What is not bundled in this repo

- Shopify secrets
- Vercel secrets
- Codex auth/session state
- the external Trio harness repo itself

If the receiving operator wants Trio on their machine, they need to either:

- clone the external `TRIO_ORCHESTRATION` repo and keep the same local path, or
- update the absolute Trio harness paths inside the local governance docs on
  their own clone

## Minimum safe first validation

After checkout and local setup, the receiving operator should be able to run:

```bash
git status --short
npm install
npm run build
npm run i18n:plan-import
```

No live write is needed for the first validation pass.
