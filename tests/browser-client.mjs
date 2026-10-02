import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await new Promise(r => ws.addEventListener('open', r, { once: true }))
let id = 0
const pending = new Map()
const errors = []
const external = []
export const requests = []
const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173'
const allowedOrigins = new Set([new URL(baseUrl).origin])
if (new URL(baseUrl).hostname === 'poketsuru.com') allowedOrigins.add('https://static.cloudflareinsights.com')
export const allowOrigin = origin => allowedOrigins.add(origin)
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text); if (m.method === 'Network.requestWillBeSent' && /^https?:/.test(m.params.request.url) && !allowedOrigins.has(new URL(m.params.request.url).origin)) external.push(new URL(m.params.request.url).origin); if (m.method === 'Network.requestWillBeSent' && /^https?:/.test(m.params.request.url)) requests.push({ url: m.params.request.url, body: m.params.request.postData || '' }); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(m.error); else p.resolve(m.result) } })
export const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })) })
export const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value }
export const wait = ms => new Promise(r => setTimeout(r, ms))
const waitForTool = async () => { for (let i = 0; i < 200; i++) { if (!await evaluate("!!document.querySelector('.tool-loading')")) return; await wait(50) } throw new Error('Tool loading timeout') }
export const navigate = async path => { await send('Page.navigate', { url: baseUrl + path }); for (let i = 0; i < 50; i++) { if (await evaluate("!!document.querySelector('.site-header')")) { await wait(150); await waitForTool(); return } await wait(100) } throw new Error('Navigation timeout') }
export const click = async selector => { assert.ok(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`), selector); await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await wait(150); await waitForTool() }
export const input = async (selector, value) => { await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`); await wait(150) }
export const screenshot = async file => { await fs.writeFile(file, Buffer.from((await send('Page.captureScreenshot', { captureBeyondViewport: false })).data, 'base64')) }
export const viewport = async width => { await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 }); await wait(200) }
export const assertNoOverflow = async () => { assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false) }
export const finish = () => { assert.deepEqual(errors, [], 'No browser runtime errors'); assert.deepEqual(external, [], 'No external requests'); ws.close() }
await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable'); await send('CSS.enable'); await send('Network.enable')
