# Cloudflare deployment

Production: https://disordat.org/ — Worker `gm-disordat` in David’s Cloudflare account (`ee641897681cddb2b23b18fb4b639034`).

The **Deploy Cloudflare** workflow validates pull requests without deployment credentials. Each push to `main` validates, checks that its revision is still current, records the active Worker version and binding names, and deploys with `--keep-vars`. It uses the existing organization secret `CLOUDFLARE_DEPLOY_TOKEN`; no new credential or database is needed. A manual run defaults to `inspect`, which checks the current Worker without publishing; select `deploy` to release current main.

Before publishing, both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` must already exist on the Worker. The preflight stops for missing Redis bindings or other runtime resources absent from the deployment configuration. It logs only binding names/types and deployment IDs, never secret or variable values. After publishing it verifies source commit and preserved binding names/types, then checks the live homepage, agent-readable routes, matchup/hub/verdict pages, and PNG share card.

`wrangler.ci.jsonc` excludes custom-domain management. DNS and Google Workspace MX are not changed by this workflow. Runtime secrets remain encrypted on the existing Worker. `wrangler.jsonc` retains the original domain setup for separately authorized migration work; do not use it for routine CI releases.

## November 2026 compatibility

The migration is rebased onto the November 4 main content, including verdicts, hubs, markdown twins, votes, and share cards. OpenNext rejects Next.js 15 after its two-year support window; the build therefore uses Next.js 16.3.8, which is supported by the existing OpenNext 1.20.8 adapter, plus the patched React 19.1 release. Next.js 16 uses the ESLint CLI/flat config and a webpack build for OpenNext. Route parameters are awaited, and the existing product content is retained. The new React effect advisory remains a warning for existing browser synchronization behavior.

The original hosting remains available for rollback. Record the successful Actions run and its before/after Worker versions; see [release verification](RELEASE.md).
