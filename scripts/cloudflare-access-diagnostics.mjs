import { writeFile } from 'node:fs/promises'
const token = process.env.CLOUDFLARE_DEPLOY_TOKEN
if (!token) throw new Error('Existing organization deployment token is unavailable')
const account = 'ee641897681cddb2b23b18fb4b639034'
const paths = [
  ['token-status', '/user/tokens/verify'],
  ['reference-pages-project', `/accounts/${account}/pages/projects/gm-geocss`],
  ['target-worker-settings', `/accounts/${account}/workers/scripts/gm-disordat/settings`],
  ['target-worker-deployments', `/accounts/${account}/workers/scripts/gm-disordat/deployments`],
  ['target-worker-versions', `/accounts/${account}/workers/scripts/gm-disordat/versions`],
  ['account-worker-list', `/accounts/${account}/workers/scripts`],
]
const results = await Promise.all(paths.map(async ([label, path]) => {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000),
    })
    const data = await response.json()
    const row = { label, httpStatus: response.status, success: data.success === true, errorCodes: (data.errors ?? []).map(({code}) => code) }
    if (!row.success) return row
    const result = data.result
    if (label === 'token-status') row.status = result.status
    if (label === 'reference-pages-project') row.project = { name: result.name, subdomain: result.subdomain }
    if (label === 'target-worker-settings') row.bindings = (result.bindings ?? []).map(({ name, type }) => ({name,type}))
    if (label === 'target-worker-deployments') row.active = (result.deployments ?? []).slice(0,1).map(({id,created_on,versions}) => ({id,createdOn:created_on,versions:versions.map(({version_id,percentage}) => ({versionId:version_id,percentage}))}))
    if (label === 'target-worker-versions') row.versionIds = (result.items ?? result ?? []).slice(0,3).map(({id}) => id)
    if (label === 'account-worker-list') row.targetFound = (Array.isArray(result) ? result : []).some(({id}) => id === 'gm-disordat')
    return row
  } catch {
    return { label, transportOrSchemaError: true }
  }
}))
const report = { checkedAt: new Date().toISOString(), account, worker: 'gm-disordat', mode: 'read-only', results }
console.log(JSON.stringify(report,null,2))
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `## Read-only Cloudflare access diagnostic\n\n\`\`\`json\n${JSON.stringify(report,null,2)}\n\`\`\`\n`, {flag:'a'})
