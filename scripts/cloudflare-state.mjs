import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const account = 'ee641897681cddb2b23b18fb4b639034'
const worker = 'gm-disordat'
const required = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']

// Provider settings can contain plaintext values. Persist only this allowlist.
export function snapshot(settings, deployments) {
  const active = deployments.deployments?.[0]
  if (!active) throw new Error('No active Worker deployment was returned')
  return {
    worker,
    capturedAt: new Date().toISOString(),
    compatibilityDate: settings.compatibility_date,
    bindings: (settings.bindings ?? []).map(({ name, type }) => ({ name, type })).sort((a, b) => a.name.localeCompare(b.name)),
    deployment: {
      id: active.id,
      createdOn: active.created_on,
      versions: active.versions.map(({ version_id, percentage }) => ({ versionId: version_id, percentage })),
    },
  }
}

export function checkBindings(state) {
  for (const name of required) {
    if (!state.bindings.some((binding) => binding.name === name && ['plain_text', 'secret_text'].includes(binding.type))) {
      throw new Error(`Missing existing Redis binding: ${name}`)
    }
  }
  // --keep-vars preserves variables/secrets; any other resource must be explicitly
  // represented in wrangler.ci.jsonc before a release may proceed.
  const unmanaged = state.bindings.filter(({ name, type }) =>
    !['plain_text', 'secret_text', 'json'].includes(type) && !(name === 'ASSETS' && type === 'assets'))
  if (unmanaged.length) throw new Error(`Review unconfigured Worker bindings: ${unmanaged.map(({ name }) => name).join(', ')}`)
}

async function main() {
  const phase = process.argv[2] ?? 'inspect'
  if (!['before', 'after', 'inspect'].includes(phase)) throw new Error('Expected before, after, or inspect')
  const token = process.env.CLOUDFLARE_DEPLOY_TOKEN
  if (!token) throw new Error('Existing CLOUDFLARE_DEPLOY_TOKEN is required')
  async function get(path) {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}/${path}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(`Cloudflare ${path} read failed (HTTP ${res.status})`)
    return data.result
  }
  const [settings, deployments] = await Promise.all([get('settings'), get('deployments')])
  const state = snapshot(settings, deployments)
  await writeFile(`cloudflare-${phase}.json`, `${JSON.stringify(state, null, 2)}\n`)
  console.log(JSON.stringify(state, null, 2))
  checkBindings(state)
  if (phase === 'after') {
    const before = JSON.parse(await readFile('cloudflare-before.json', 'utf8'))
    for (const binding of before.bindings) {
      if (!state.bindings.some(({ name, type }) => name === binding.name && type === binding.type)) {
        throw new Error(`Worker binding changed: ${binding.name}`)
      }
    }
    const sha = process.env.GITHUB_SHA
    if (!sha || settings.annotations?.['workers/message'] !== `GitHub commit ${sha}`) {
      throw new Error('Active Worker version does not identify the expected GitHub commit')
    }
    console.log(`Verified Worker source commit ${sha}; existing bindings preserved.`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
