import { describe, expect, it } from 'vitest'
import { checkBindings, snapshot } from '../scripts/cloudflare-state.mjs'

const settings = {
  compatibility_date: '2026-10-04',
  bindings: [
    { name: 'ASSETS', type: 'assets' },
    { name: 'UPSTASH_REDIS_REST_URL', type: 'plain_text', text: 'private-url' },
    { name: 'UPSTASH_REDIS_REST_TOKEN', type: 'secret_text', text: 'private-token' },
  ],
}
const deployments = { deployments: [{ id: 'deployment-id', created_on: '2026-11-01', versions: [{ version_id: 'version-id', percentage: 100 }], author_email: 'private-author' }] }

describe('Cloudflare release preflight', () => {
  it('records the active version and binding names without provider values', () => {
    const state = snapshot(settings, deployments)
    expect(state.deployment.versions).toEqual([{ versionId: 'version-id', percentage: 100 }])
    expect(JSON.stringify(state)).not.toContain('private-')
    expect(() => checkBindings(state)).not.toThrow()
  })
  it('blocks release when an existing Redis binding is missing', () => {
    const state = snapshot({ ...settings, bindings: settings.bindings.slice(0, 2) }, deployments)
    expect(() => checkBindings(state)).toThrow('UPSTASH_REDIS_REST_TOKEN')
  })
  it('blocks removal of an unconfigured runtime resource', () => {
    const state = snapshot({ ...settings, bindings: [...settings.bindings, { name: 'EXISTING_DATA', type: 'kv_namespace', namespace_id: 'private-id' }] }, deployments)
    expect(() => checkBindings(state)).toThrow('EXISTING_DATA')
  })
  it('requires a rollback version before release', () => {
    expect(() => snapshot(settings, { deployments: [] })).toThrow('No active Worker deployment')
  })
})
