# Local Setup Checklist

Use this on the receiving Mac before the next operator touches Shopify.

## 1. Get the repo state

```bash
git fetch origin
git checkout codex/ptpt-handoff
git pull --ff-only
```

## 2. Create fresh local secrets

Do not copy another machine's `.env.local`.

Start from `.env.example` and create a new local file with the receiving
operator's own credentials:

```bash
cp .env.example .env.local
```

Then fill in:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `APP_PASSWORD`
- `USE_MOCK_DATA`

Optional fallback only if needed:

- `SHOPIFY_ACCESS_TOKEN`

## 3. Verify Shopify access model

The receiving operator's Shopify Dev App should have the scopes required for
the CLP tool and the pt-PT localization workflow.

Minimum pt-PT-related scopes:

- `read_products`
- `write_products`
- `read_translations`
- `write_translations`
- `read_locales`
- `write_locales`
- `read_content`
- `read_legal_policies`
- `read_themes`
- `read_markets`
- `write_markets`

The reference doc is:

- [docs/PT_PT_SHOPIFY_TRANSLATION_SCOPES.md](../PT_PT_SHOPIFY_TRANSLATION_SCOPES.md)

## 4. Safe first commands only

Run these before any write path:

```bash
git status --short
git branch --show-current
npm install
npm run build
npm run i18n:plan-import
```

Optional storefront sanity check:

```bash
curl -I -L -s https://aromawax.eu/pt/ | sed -n '1,20p'
```

## 5. What not to do on first contact

Do not do any of the following before the receiving operator has reported the
current state back:

- `npm run i18n:import-pt-pt`
- any restore script
- any publish mutation
- any theme patch script
- Langwill auto-translate

## 6. Trio note

The repo includes project-side Trio governance files, but the shared harness
repo itself is external.

If Trio is needed on the receiving Mac:

- either clone `TRIO_ORCHESTRATION` to the same local path used on the original
  machine, or
- update the absolute Trio harness paths in the local governance docs after
  checkout

If Trio is not needed immediately, it is safe to ignore this for the first
validation session.

## 7. Canonical source pack

The most important pt-PT source-of-truth entrypoint is:

- [docs/pt-pt-live/README.md](../pt-pt-live/README.md)

That file fans out to:

- live audit
- rollback snapshots
- guard reports
- wave rewrites
- catalog anomaly audits

## 8. Current strategic state

The completed work already transferred into the repo includes:

- the CLP tool
- the full pt-PT live rollout pack
- rollback artifacts
- Trio governance scaffold

The next major decision area is:

- how to unify the client-facing localization workflow so pt-PT no longer feels
  operationally separate from the Langwill-managed locales
