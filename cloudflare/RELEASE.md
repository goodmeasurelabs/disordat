# Release verification

Pull requests run typecheck, offline tests, the OpenNext build, and a Wrangler dry run without deployment credentials. Pushes to `main` validate, rebuild that same revision in the `cloudflare-production` environment, then check current-main parity and existing runtime bindings before publishing. Manual workflow runs on main default to inspection only. Existing branch protections remain intact.

The inherited organization secret `CLOUDFLARE_DEPLOY_TOKEN` is reused. The preflight requires the existing Upstash Redis URL/token bindings and records the active deployment/version IDs for rollback. No values are persisted. Provider read failures or unconfigured resource bindings stop the release. A successful preflight proves binding presence; comparison against the old host’s encrypted Redis values requires a separate authorized provider-side check.

After deployment, the workflow records the new provider version, verifies the GitHub source annotation and preserved binding names/types, and checks the homepage, `/llms.txt`, `/matchups`, `/vs/batman-vs-superman.md`, `/debates/fandoms`, `/vs/batman-vs-superman`, and the 1200×630 PNG share card. Inspect the before/after evidence in the Actions job summary. These checks are read-only and do not cast votes or call the AI judge.

Retain original hosting and the preflight Worker version for rollback. Do not remove old provider integrations or data services as part of this release. DNS and MX are unchanged by the CI configuration.
