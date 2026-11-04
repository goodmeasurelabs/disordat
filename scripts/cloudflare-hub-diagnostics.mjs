import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
const token = process.env.CLOUDFLARE_DEPLOY_TOKEN
if (!token) throw new Error('Existing scoped token is required')
const redact = (value) => String(value).replaceAll(token, '[credential]').replace(/https?:\/\/[^\s"')]+/g, '[URL]').replace(/Bearer\s+\S+/gi, 'Bearer [credential]').replace(/[A-Za-z0-9_+\/=.-]{45,}/g, '[long-value]').slice(0, 1200)
const tail = spawn('npm', ['exec', '--yes', '--package=wrangler@4.147.0', '--', 'wrangler', 'tail', 'gm-disordat', '--config', 'wrangler.ci.jsonc', '--format', 'json', '--header', 'X-GML-Release-Probe: hub-runtime'], {
  env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: 'ee641897681cddb2b23b18fb4b639034', WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_SANITIZE: 'true' },
  stdio: ['ignore','pipe','pipe'],
})
let lineBuffer = '', eventLines = null
function report(event) {
  const errors = (event.logs ?? []).filter(({level}) => level === 'error').flatMap(({message}) => message ?? []).map((value) => {
    if (typeof value === 'string') return redact(value)
    return { name: value?.name, message: value?.message ? redact(value.message) : undefined, stack: value?.stack ? redact(value.stack) : undefined }
  })
  console.log(JSON.stringify({kind:'probe-runtime',outcome:event.outcome,status:event.event?.response?.status,exceptions:(event.exceptions ?? []).map(({name,message})=>({name,message:redact(message)})),errors}))
}
tail.stdout.on('data', (chunk) => {
  lineBuffer += chunk.toString()
  let end
  while ((end = lineBuffer.indexOf('\n')) !== -1) {
    const line = lineBuffer.slice(0,end); lineBuffer = lineBuffer.slice(end+1)
    if (line === '{') eventLines = [line]
    else if (eventLines) {
      eventLines.push(line)
      if (line === '}') { try { report(JSON.parse(eventLines.join('\n'))) } catch {} eventLines = null }
    }
  }
})
tail.stderr.on('data',(chunk)=>{ if (/403|unauthoriz|permission denied/i.test(chunk.toString())) console.log(JSON.stringify({kind:'tail-access',error:'authorization failure'})) })
tail.on('error',()=>console.log(JSON.stringify({kind:'tail-start',error:'could not start scoped log reader'})))
const exit = new Promise(resolve=>tail.on('exit',resolve))
try {
  await delay(25_000)
  for (let i=0;i<2;i++) {
    try {
      const response = await fetch('https://disordat.org/debates/fandoms', {headers:{'X-GML-Release-Probe':'hub-runtime'},signal:AbortSignal.timeout(35_000)})
      await response.arrayBuffer()
      console.log(JSON.stringify({kind:'probe-response',attempt:i+1,status:response.status}))
    } catch { console.log(JSON.stringify({kind:'probe-response',attempt:i+1,error:'timeout or transport failure'})) }
    await delay(5_000)
  }
} finally { tail.kill('SIGINT'); await Promise.race([exit, delay(5_000)]); tail.kill('SIGTERM') }
