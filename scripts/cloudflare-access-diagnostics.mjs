import { writeFile } from 'node:fs/promises'
const token = process.env.CLOUDFLARE_DEPLOY_TOKEN
if (!token) throw new Error('Existing organization deployment token is unavailable')
const account = 'ee641897681cddb2b23b18fb4b639034'
const paths = [
  ['token-status', '/user/tokens/verify'],
  ['account-token-status', `/accounts/${account}/tokens/verify`],
  ['reference-pages-project', `/accounts/${account}/pages/projects/gm-geocss`],
  ['target-worker-settings', `/accounts/${account}/workers/scripts/gm-disordat/settings`],
  ['target-worker-deployments', `/accounts/${account}/workers/scripts/gm-disordat/deployments`],
  ['target-worker-versions', `/accounts/${account}/workers/scripts/gm-disordat/versions`],
  ['account-worker-list', `/accounts/${account}/workers/scripts`],
  ['target-worker-service', `/accounts/${account}/workers/services/gm-disordat`],
]
const results = await Promise.all(paths.map(async ([label, path]) => {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000),
    })
    const data = await response.json()
    const row = { label, httpStatus: response.status, success: data.success === true, errorCodes: (data.errors ?? []).map(({code}) => code) }
    if (!row.success) {
      const messages = (data.errors ?? []).map((error) => typeof error === 'string' ? error : error.message ?? '').join(' ')
      row.errorCategories = { authorization: /permission|authoriz|forbidden|access|scope/i.test(messages), missingResource: /not found|does not exist|could not route/i.test(messages), authentication: /authentic|invalid token|invalid credential/i.test(messages) }
      return row
    }
    const result = data.result
    if (label === 'token-status' || label === 'account-token-status') row.status = result.status
    if (label === 'reference-pages-project') row.project = { name: result.name, subdomain: result.subdomain }
    if (label === 'target-worker-settings') row.bindings = (result.bindings ?? []).map(({ name, type }) => ({name,type}))
    if (label === 'target-worker-deployments') row.active = (result.deployments ?? []).slice(0,1).map(({id,created_on,versions}) => ({id,createdOn:created_on,versions:versions.map(({version_id,percentage}) => ({versionId:version_id,percentage}))}))
    if (label === 'target-worker-versions') row.versionIds = (result.items ?? result ?? []).slice(0,3).map(({id}) => id)
    if (label === 'account-worker-list') {
      const workers = Array.isArray(result) ? result : result.scripts ?? []
      row.returnedCount = workers.length
      row.targetNames = workers.map(({id}) => id).filter((id) => /disordat|skenes|judge/.test(id))
      row.resultInfo = data.result_info ? {count:data.result_info.count, totalCount:data.result_info.total_count, page:data.result_info.page,totalPages:data.result_info.total_pages} : null
    }
    if (label === 'target-worker-service') row.service = { id: result.id, defaultEnvironmentName: result.default_environment?.environment }
    return row
  } catch {
    return { label, transportOrSchemaError: true }
  }
}))
const report = { checkedAt: new Date().toISOString(), account, worker: 'gm-disordat', mode: 'read-only', results }
console.log(JSON.stringify(report,null,2))
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `## Read-only Cloudflare access diagnostic\n\n\`\`\`json\n${JSON.stringify(report,null,2)}\n\`\`\`\n`, {flag:'a'})
