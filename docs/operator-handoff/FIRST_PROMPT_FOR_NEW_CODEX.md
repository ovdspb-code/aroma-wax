# First Prompt For The Next Codex

Paste this as the first real prompt on the receiving machine after the repo is
checked out and `.env.local` is configured:

```text
You are taking over the AROMA + WAX project from another Codex session.

Before doing anything else, read these files in order:

1. docs/operator-handoff/README.md
2. docs/operator-handoff/LOCAL_SETUP_CHECKLIST.md
3. docs/pt-pt-live/README.md
4. docs/pt-pt-live/PT_PT_LIVE_IMPLEMENTATION_AUDIT_2026-04-16.md
5. docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md
6. docs/ADMIN_HANDOFF.md
7. AGENTS.md
8. CLAUDE.md
9. GEMINI.md
10. 00_META/AI_GOVERNANCE/README.md
11. 00_META/AI_GOVERNANCE/agent_handoff.md
12. 00_META/AI_GOVERNANCE/session_log.md

Then run only these safe checks:

- git status --short
- git branch --show-current
- npm run build
- npm run i18n:plan-import

Do not run live write commands.
Do not run Langwill auto-translation.
Do not publish or restore anything.
Do not touch Shopify until you have reported back.

Return only:

- current verified live state
- current branch and repo cleanliness
- any env or scope blockers on this machine
- unresolved risks
- the next safe first step
```

## One more portability note

If an older file mentions:

```text
/Users/ovd/Documents/AROMA_AND_WAX/...
```

interpret it as the matching path inside the current local clone.
