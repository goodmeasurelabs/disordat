# Cloudflare deployment

Production: https://disordat.org/

Project: `gm-disordat` in David’s Cloudflare account. The manual **Deploy Cloudflare** GitHub Actions workflow builds and checks the selected source revision, deploys to this project, and verifies HTTPS.

Activation requires merging the workflow into the default branch and supplying an approved encrypted `CLOUDFLARE_DEPLOY_TOKEN` secret for the `cloudflare-production` environment or repository. The migration CLI token is temporary and is not a GitHub credential. No token value is committed or sent to GitHub by this change. The workflow is prepared; no production CI deployment has been run.

For Workers, `wrangler.ci.jsonc` preserves runtime bindings and excludes custom-domain management; domain cutovers remain separate operations. Runtime service secrets stay encrypted on the Worker. The source configuration retains full custom-domain setup for migration operations.

For Pages, Direct Upload preserves the current Pages project; no native Git connection is needed.

Original hosting remains available for rollback. Bitcoin rollback uses its approved D1 relay, not the old independent Blobs backend.

## November 2026 compatibility

The migration is rebased onto the November 4 main content, including verdicts, hubs, markdown twins, votes, and share cards. OpenNext rejects Next.js 15 after its two-year support window; the build therefore uses Next.js 16.3.8, which is supported by the existing OpenNext 1.20.8 adapter, plus the patched React 19.1 release. Next.js 16 uses the ESLint CLI/flat config and a webpack build for OpenNext. Route parameters are awaited, and the existing product content is retained. The new React effect advisory remains a warning for existing browser synchronization behavior.
