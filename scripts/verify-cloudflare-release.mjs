const base = process.env.VERIFY_BASE_URL ?? 'https://disordat.org'
const routes = [
  ['/', /disordat/i, 'text/html'],
  ['/llms.txt', /https:\/\/disordat\.org\/vs\/batman-vs-superman\.md/, 'text/plain'],
  ['/matchups', /matchups/i, 'text/html'],
  ['/vs/batman-vs-superman.md', /Batman.*Superman/s, 'text/markdown'],
  ['/debates/fandoms', /Fandom/i, 'text/html'],
  ['/debates/goat', /Sports GOAT/i, 'text/html'],
  ['/debates/food', /Food/i, 'text/html'],
  ['/debates/travel', /Travel/i, 'text/html'],
  ['/vs/batman-vs-superman', /Batman.*Superman/s, 'text/html'],
]
for (const [path, expected, type] of routes) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) })
  const body = await response.text()
  if (response.status !== 200 || !response.headers.get('content-type')?.includes(type) || !expected.test(body)) {
    throw new Error(`${path}: expected 200 ${type} with current verdict content; got ${response.status}`)
  }
  console.log(`${path}: 200 ${type}; content verified`)
}
const path = '/vs/batman-vs-superman/opengraph-image'
const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) })
const bytes = Buffer.from(await response.arrayBuffer())
if (response.status !== 200 || !response.headers.get('content-type')?.includes('image/png') || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== 1200 || bytes.readUInt32BE(20) !== 630) {
  throw new Error(`${path}: expected a valid 1200×630 PNG; got HTTP ${response.status}`)
}
console.log(`${path}: 200 image/png; 1200×630 share card verified`)
