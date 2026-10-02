import assert from 'node:assert/strict'
import { checkCharacterCounter } from './character-counter-browser.mjs'
import { checkAspectRatio } from './aspect-ratio-browser.mjs'
import { checkTextReplace } from './text-replace-browser.mjs'
import { checkQuizLayout } from './quiz-layout-browser.mjs'
import { tools } from '../src/tools/registry.ts'
import { navigate, evaluate, send, input, click, viewport, wait, assertNoOverflow, finish } from './browser-client.mjs'

const poll = async expression => {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (await evaluate(expression)) return
    await wait(40)
  }
  throw new Error(`Timed out: ${expression}`)
}
const key = async (key, code, text) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code, ...(text ? { text } : {}) })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code })
  await wait(80)
}
const select = async (selector, value) => {
  await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await wait(80)
}
const fixtures = async () => {
  await evaluate(`(async()=>{window.fixtureFiles=[];for(const [name,width,height,color]of[['red.png',40,20,'red'],['blue.png',20,20,'blue'],['alpha.png',20,20,null]]){const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');x.fillStyle=color||'red';x.fillRect(0,0,color?width:width/2,height);const blob=await new Promise(r=>c.toBlob(r,'image/png'));window.fixtureFiles.push(new File([blob],name,{type:'image/png'}));c.width=0;c.height=0}})()`)
}
const load = async (indices, settle = true) => {
  await evaluate(`(()=>{const dt=new DataTransfer();for(const index of ${JSON.stringify(indices)})dt.items.add(window.fixtureFiles[index]);const input=document.querySelector('#image-files');input.value='';input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  if (settle) await wait(60)
}
const idle = () => poll("!document.querySelector('.tool-panel [role=status]').textContent.includes('画像を確認')")
const pixel = () => evaluate(`(async()=>{const blob=await(await fetch(document.querySelector('#image-download').href)).blob();const b=await createImageBitmap(blob),c=document.createElement('canvas');c.width=b.width;c.height=b.height;const x=c.getContext('2d');x.drawImage(b,0,0);const result={mime:blob.type,width:b.width,height:b.height,right:[...x.getImageData(b.width-1,Math.floor(b.height/2),1,1).data]};b.close();c.width=0;c.height=0;return result})()`)
const pauseDecode = () => evaluate("window.nativeDecode=createImageBitmap.bind(window);window.decodeCount=0;window.createImageBitmap=(...args)=>new Promise(resolve=>{window.decodeCount++;window.resumeDecode=()=>resolve(window.nativeDecode(...args))})")
const settings = id => id === 'image-resizer'
  ? ['image-width','image-height','image-format','image-quality','image-enlarge']
  : ['image-direction','image-cross','image-gap','image-background']

await send('Emulation.setFocusEmulationEnabled', { enabled: true })
await send('Page.bringToFront')
await viewport(1280)
await navigate('/')
await evaluate('localStorage.clear()')
await navigate('/')
let routeChecks = 0
for (const tool of tools) {
  for (const pathname of [tool.path, `${tool.path}/`, tool.path.toUpperCase(), `${tool.path.toUpperCase()}/`]) {
    await navigate(pathname)
    assert.ok(await evaluate("!!document.querySelector('.tool-navigation .detail-favorite')"), pathname)
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('poketsuru-tool-shelf-v1')).recent[0]"), tool.id, pathname)
    assert.equal(await evaluate('location.pathname'), pathname, 'No redirection to another URL')
    routeChecks++
  }
  const recent = await evaluate("JSON.parse(localStorage.getItem('poketsuru-tool-shelf-v1')).recent")
  await navigate(`${tool.path}/not-real`)
  assert.ok(await evaluate("!!document.querySelector('.not-found-panel')"))
  assert.equal(await evaluate("!!document.querySelector('.tool-navigation')"), false)
  assert.deepEqual(await evaluate("JSON.parse(localStorage.getItem('poketsuru-tool-shelf-v1')).recent"), recent)
  routeChecks++
}
console.log(`PASS: ${routeChecks} known/variant/unknown route checks`)
await navigate('/TOOLS/IMAGE-RESIZER/')
await click('.detail-favorite')
await send('Page.reload')
await poll("document.querySelector('.detail-favorite')?.getAttribute('aria-pressed')==='true'")
await click('.tool-navigation a')
await click('.collection-button:nth-child(2)')
assert.equal(await evaluate("document.querySelector('.tool-card').dataset.toolId"), 'image-resizer')

for (const id of ['image-resizer','image-joiner']) {
  await navigate(`/tools/${id}`)
  await fixtures()
  await pauseDecode()
  await load(id === 'image-resizer' ? [0] : [0,1])
  await poll('window.decodeCount===1')
  assert.ok(await evaluate("document.querySelector('.tool-panel [role=status]').textContent.includes('読み込みが終わるまで設定は変更できません')"))
  for (const name of settings(id)) assert.equal(await evaluate(`document.querySelector('#${name}').disabled`), true, name)
  assert.equal(await evaluate("document.querySelector('#image-clear').disabled"), false)
  assert.equal(await evaluate("document.querySelector('#image-files').disabled"), false)
  await evaluate("document.querySelector('#image-files').focus()")
  await key('Tab', 9)
  assert.equal(await evaluate('document.activeElement.id'), 'image-clear', 'Keyboard skips disabled settings')
  await evaluate('window.resumeDecode()')
  if (id === 'image-joiner') { await poll('window.decodeCount===2'); await evaluate('window.resumeDecode()') }
  await idle()
  assert.equal(await evaluate("document.querySelector('#image-process').disabled"), false)
  for (const name of settings(id)) assert.equal(await evaluate(`document.querySelector('#${name}').disabled`), false, name)
  await evaluate('window.createImageBitmap=window.nativeDecode')
  if (id === 'image-resizer') await select('#image-format','image/png')
  await click('#image-process'); await idle()
  assert.ok(await evaluate("!!document.querySelector('#image-download')"))

  // Settings remain editable during encoding; a stale encoder result cannot reappear.
  await evaluate("window.nativeToBlob=HTMLCanvasElement.prototype.toBlob;window.encodeReady=false;HTMLCanvasElement.prototype.toBlob=function(cb,...args){window.nativeToBlob.call(this,blob=>{window.encodeReady=true;window.finishEncode=()=>cb(blob)},...args)}")
  await click('#image-process'); await poll('window.encodeReady')
  const field = id === 'image-resizer' ? '#image-width' : '#image-cross'
  assert.equal(await evaluate(`document.querySelector('${field}').disabled`), false)
  await input(field,'100'); await evaluate('window.finishEncode()'); await wait(120)
  assert.equal(await evaluate("!!document.querySelector('#image-download')"), false)
  await evaluate('HTMLCanvasElement.prototype.toBlob=window.nativeToBlob')
  await click('#image-process'); await idle(); assert.ok(await evaluate("!!document.querySelector('#image-download')"))

  // Clearing during load restores settings and suppresses the canceled preview.
  await pauseDecode(); await load(id === 'image-resizer' ? [0] : [0,1]); await poll('window.decodeCount===1')
  await click('#image-clear'); await evaluate('window.resumeDecode()'); await wait(120)
  assert.equal(await evaluate("document.querySelectorAll('.image-source,.image-order-list li').length"), 0)
  assert.equal(await evaluate(`document.querySelector('${field}').disabled`), false)
  await evaluate('window.createImageBitmap=window.nativeDecode')
  await load(id === 'image-resizer' ? [1] : [1,0]); await idle()
  assert.equal(await evaluate("document.querySelector('#image-process').disabled"), false)
  await click('#image-process'); await idle()
  const out = await pixel(); assert.equal(out.mime,'image/png')
  if (id === 'image-resizer') assert.deepEqual(out.right,[0,0,255,255])
  // A replacement selected before the old decoder finishes owns the loading state.
  await pauseDecode(); await load(id === 'image-resizer' ? [0] : [0,1]); await poll('window.decodeCount===1')
  await load(id === 'image-resizer' ? [1] : [1,0])
  await evaluate('window.resumeDecode()'); await poll('window.decodeCount===2')
  assert.equal(await evaluate(`document.querySelector('${field}').disabled`), true)
  await evaluate('window.resumeDecode()')
  if (id === 'image-joiner') { await poll('window.decodeCount===3'); await evaluate('window.resumeDecode()') }
  await idle(); await evaluate('window.createImageBitmap=window.nativeDecode')
  assert.equal(await evaluate("document.querySelector('.image-source strong,.image-order-list strong').textContent.includes('blue.png')"), true)
  await click('#image-clear')
}
console.log('PASS: loading guard/status/keyboard/cancel/reselection; settings edit during output; real image outputs')

// Recreate the reported race with a real 9MP PNG and CPU throttling, without replacing APIs.
await navigate('/tools/image-resizer')
await evaluate("(async()=>{const c=document.createElement('canvas');c.width=3000;c.height=3000;const x=c.getContext('2d');x.fillStyle='red';x.fillRect(0,0,3000,3000);const b=await new Promise(r=>c.toBlob(r,'image/png'));window.fixtureFiles=[new File([b],'native-9mp.png',{type:'image/png'})];c.width=0;c.height=0})()")
await send('Emulation.setCPUThrottlingRate', { rate: 10 })
await load([0], false)
assert.equal(await evaluate("document.querySelector('#image-width').disabled"), true)
await evaluate("document.querySelector('#image-width').focus()")
await key('1',49,'1')
await idle(); await send('Emulation.setCPUThrottlingRate', { rate: 1 })
assert.equal(await evaluate("document.querySelector('#image-width').value"),'1200')
assert.equal(await evaluate("document.querySelectorAll('.image-source').length"),1)
assert.equal(await evaluate("document.querySelector('#image-process').disabled"),false)
await select('#image-format','image/png'); await input('#image-width','100'); await input('#image-height','100'); await click('#image-process'); await idle()
assert.deepEqual(await pixel(),{mime:'image/png',width:100,height:100,right:[255,0,0,255]})
console.log('PASS: real 9MP PNG/10x CPU loading race and subsequent resize')

let mobileChecks = 0
for (const theme of ['light','dark']) {
  await viewport(320); await navigate('/')
  await click(`[aria-label="テーマを${theme === 'light' ? 'Light' : 'Dark'}に切り替える"]`)
  for (const tool of tools) { await navigate(`${tool.path.toUpperCase()}/`); await assertNoOverflow(); assert.ok(await evaluate("!!document.querySelector('.detail-favorite')")); mobileChecks++ }
  for (const id of ['image-resizer','image-joiner']) {
    await navigate(`/tools/${id}`); await fixtures(); await pauseDecode(); await load(id === 'image-resizer' ? [2] : [2,1]); await poll('window.decodeCount===1'); await assertNoOverflow()
    assert.ok(await evaluate("document.querySelector('.tool-panel [role=status]').textContent.includes('設定は変更できません')"))
    await evaluate('window.resumeDecode()'); if (id === 'image-joiner') { await poll('window.decodeCount===2'); await evaluate('window.resumeDecode()') }; await idle(); await evaluate('window.createImageBitmap=window.nativeDecode')
    if (id === 'image-resizer') await select('#image-format','image/png')
    await click('#image-process'); await idle(); await assertNoOverflow(); mobileChecks+=2
  }
}
await checkCharacterCounter()
await checkAspectRatio()
await checkTextReplace()
await checkQuizLayout()
finish()
console.log(`PASS: ${mobileChecks} light/dark mobile layout checks; no runtime exceptions/unexpected requests`)
