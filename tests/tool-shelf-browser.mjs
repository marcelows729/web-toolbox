import assert from 'node:assert/strict'
import {navigate,evaluate,send,click,wait,finish} from './browser-client.mjs'
import {tools} from '../src/tools/registry.ts'
const key='poketsuru-tool-shelf-v1'
const ids=tools.map(tool=>tool.id)
const read=()=>evaluate(`JSON.parse(localStorage.getItem('${key}'))`)
const card=id=>`.tool-card[data-tool-id="${id}"] .favorite-button`
const visible=()=>evaluate(`[...document.querySelectorAll('.tool-card')].map(el=>el.dataset.toolId)`)

await navigate('/')
await evaluate(`localStorage.removeItem('${key}');history.replaceState(null,'','/')`)
await navigate('/')
{
 for(const id of ids)await click(card(id))
 assert.deepEqual((await read()).favorites,[...ids].reverse())
 await click('.collection-button:nth-child(2)')
 assert.deepEqual(await visible(),[...ids].reverse())
 await click(card(ids[0]));await click('.collection-button:nth-child(1)');await click(card(ids[0]));await click('.collection-button:nth-child(2)')
 const expected=[ids[0],...ids.slice(1).reverse()]
 assert.deepEqual(await visible(),expected)
 await navigate('/');await click('.collection-button:nth-child(2)')
 assert.deepEqual(await visible(),expected)
 for(const tool of tools)await navigate(tool.path)
 assert.deepEqual((await read()).recent,ids.slice(-8).reverse())
 await navigate(tools.at(-4).path)
 assert.deepEqual((await read()).recent,[ids.at(-4),...ids.slice(-8).reverse().filter(id=>id!==ids.at(-4))])
 await navigate('/');await click('.collection-button:nth-child(3)')
 assert.deepEqual(await visible(),(await read()).recent)
 await click('.text-button')
 assert.deepEqual((await read()).recent,[])
 assert.deepEqual((await read()).favorites,expected)
 for(const raw of ['{','null',JSON.stringify({version:2,favorites:ids}), 'x'.repeat(65537)]){
  await evaluate(`localStorage.setItem('${key}',${JSON.stringify(raw)})`)
  await navigate('/')
  assert.equal(await evaluate(`document.querySelectorAll('.favorite-button[aria-pressed="true"]').length`),0)
 }
 const mixed={version:1,favorites:['deleted-tool',ids[0],3,ids[0],ids[1]],recent:[ids[1],'deleted-tool',ids[0],ids[1]]}
 await evaluate(`localStorage.setItem('${key}',${JSON.stringify(JSON.stringify(mixed))})`)
 await navigate('/');await click('.collection-button:nth-child(2)')
 assert.deepEqual(await visible(),ids.slice(0,2))
 await click('.collection-button:nth-child(3)')
 assert.deepEqual(await visible(),[ids[1],ids[0]])
 await evaluate(`localStorage.removeItem('${key}')`);await navigate('/')
 console.log('PASS: all35 favorites order/remove/readd/reload; recent max8/dedup/revisit/clear; corrupt/version/oversize/deleted IDs')
}
await click('.collection-button:nth-child(1)')
const created=await send('Target.createTarget',{url:'about:blank'})
const targets=await(await fetch('http://127.0.0.1:9222/json')).json()
const ws=new WebSocket(targets.find(t=>t.id===created.targetId).webSocketDebuggerUrl)
await new Promise(r=>ws.addEventListener('open',r,{once:true}))
let serial=0;const pending=new Map()
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result)}})
const bs=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})
const be=async expression=>{const r=await bs('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
await bs('Page.enable')
await bs('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window),wrappers=new WeakMap();window.shelfEvents=[];window.delayShelfEvents=false;window.addEventListener=function(type,listener,...args){if(type!=='storage')return add(type,listener,...args);const wrapped=event=>{if(window.delayShelfEvents)window.shelfEvents.push(()=>listener(event));else listener(event)};wrappers.set(listener,wrapped);return add(type,wrapped,...args)};window.removeEventListener=function(type,listener,...args){return remove(type,type==='storage'?(wrappers.get(listener)||listener):listener,...args)};window.flushShelfEvents=()=>{window.delayShelfEvents=false;window.shelfEvents.splice(0).forEach(run=>run())}})()`})
await bs('Page.navigate',{url:'http://127.0.0.1:5173/'})
for(let i=0;i<100;i++){if(await be(`!!document.querySelector('.favorite-button')`))break;await wait(50)}
const button=id=>`.tool-card[data-tool-id="${id}"] .favorite-button`
const favorites=()=>`[...document.querySelectorAll('.tool-card .favorite-button[aria-pressed="true"]')].map(b=>b.closest('.tool-card').dataset.toolId)`
await be('window.delayShelfEvents=true')
await click(button('json-formatter'))
await wait(200)
assert.ok(await be('window.shelfEvents.length>0'),'Actual native storage event queued')
await be(`document.querySelector(${JSON.stringify(button('sha256'))}).click()`)
await wait(150)
const stored=await be(`JSON.parse(localStorage.getItem('${key}')).favorites`)
await be('window.flushShelfEvents()');await wait(150)
const shown=await be(favorites())
console.log(JSON.stringify({case:'delayed-native-event',stored,shown}))
assert.deepEqual([...shown].sort(),[...stored].sort())
// Deny writes in B only. A remains able to save and emits a native event.
await be(`window.savedSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='${key}')throw new DOMException('audit write denied','QuotaExceededError');return window.savedSetItem.call(this,k,v)}`)
await be(`document.querySelector(${JSON.stringify(button('json-formatter'))}).click()`);await wait(100)
assert.equal(await be(`!!document.querySelector('.storage-notice')`),true)
await click(button('character-counter'));await wait(200)
const notice=await be(`!!document.querySelector('.storage-notice')`)
console.log(JSON.stringify({case:'write-denied-after-external-save',notice}))
assert.equal(notice,true)
await be('Storage.prototype.setItem=window.savedSetItem')
await be(`document.querySelector(${JSON.stringify(button('sha256'))}).click()`);await wait(150)
assert.equal(await be(`!!document.querySelector('.storage-notice')`),false)
{
 // Read failure on sync must preserve the in-memory shelf and report failure.
 const before=await be(favorites())
 await be(`window.savedGetItem=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k==='${key}')throw new DOMException('audit read denied','SecurityError');return window.savedGetItem.call(this,k)}`)
 await click(button('uuid-generator'));await wait(200)
 assert.deepEqual(await be(favorites()),before)
 assert.equal(await be(`!!document.querySelector('.storage-notice')`),true)
 await be('Storage.prototype.getItem=window.savedGetItem')
 await be(`document.querySelector(${JSON.stringify(button('sha256'))}).click()`);await wait(150)
 assert.equal(await be(`!!document.querySelector('.storage-notice')`),false)
 // Delayed clear event must not discard a later successful save.
 await be('window.delayShelfEvents=true')
 await evaluate(`localStorage.removeItem('${key}')`);await wait(150)
 await be(`document.querySelector(${JSON.stringify(button('json-formatter'))}).click()`);await wait(150)
 const latest=await be(`JSON.parse(localStorage.getItem('${key}')).favorites`)
 await be('window.flushShelfEvents()');await wait(150)
 assert.deepEqual((await be(favorites())).sort(),[...latest].sort())
 await evaluate(`localStorage.removeItem('${key}')`);await wait(150)
 assert.deepEqual(await be(favorites()),[])
 await be(`document.querySelector(${JSON.stringify(button('sha256'))}).click()`);await wait(150)
 await evaluate('localStorage.clear()');await wait(150)
 assert.deepEqual(await be(favorites()),[])
}
// An inaccessible localStorage getter at startup must still permit memory use.
await bs('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('audit unavailable','SecurityError')}})`})
await bs('Page.navigate',{url:'http://127.0.0.1:5173/'})
for(let i=0;i<100;i++){if(await be(`!!document.querySelector('.favorite-button')`))break;await wait(50)}
assert.equal(await be(`!!document.querySelector('.storage-notice')`),true)
await be(`document.querySelector(${JSON.stringify(button('sha256'))}).click()`);await wait(150)
assert.deepEqual(await be(favorites()),['sha256'])
await bs('Page.navigate',{url:'http://127.0.0.1:5173/'})
await wait(300)
assert.deepEqual(await be(favorites()),[])
console.log('PASS: denied storage getter, in-memory favorite and reload without persistence')
ws.close();await send('Target.closeTarget',{targetId:created.targetId});finish()
console.log('PASS: native two-tab last-save sync, delayed clear, write/read failures and recovery')
