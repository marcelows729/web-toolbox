import assert from 'node:assert/strict'
import {navigate,evaluate,send,wait,click,input,viewport,assertNoOverflow,screenshot,finish,requests} from './browser-client.mjs'
import {tools} from '../src/tools/registry.ts'
const root=(process.env.TEST_SCREENSHOT_DIR||process.env.TEMP||'.').replaceAll('\\','/')+'/'
const poll=async expr=>{for(let i=0;i<150;i++){if(await evaluate(expr))return;await wait(30)}throw Error(expr)}
const view=()=>evaluate(`({query:document.querySelector('#tool-search').value,category:document.querySelector('.category-filter[aria-pressed=true]').textContent,collection:document.querySelector('.collection-button[aria-pressed=true]').textContent,ids:[...document.querySelectorAll('.tool-card')].map(e=>e.dataset.toolId)})`)
const enter=async selector=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus({preventScroll:true})`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(150)}
const back=async()=>{await evaluate('history.back()');await poll(`!!document.querySelector('#tool-search')`);await wait(100)}
await send('Emulation.setFocusEmulationEnabled',{enabled:true});await navigate('/');await evaluate(`localStorage.clear();history.replaceState({...history.state,usr:null},'',location.href)`);await navigate('/')
for(const theme of ['light','dark'])for(const width of [320,375,768,1280]){
 await viewport(width);await evaluate(`history.replaceState({...history.state,usr:null},'',location.href)`);await navigate('/');await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child');await evaluate('window.scrollTo({top:0,behavior:"instant"})');await wait(150);await assertNoOverflow();await screenshot(root+'home-discovery-'+theme+'-'+width+'.png')
 assert.equal(await evaluate(`document.querySelectorAll('.home-use-case').length`),3)
 assert.equal(await evaluate(`!!document.querySelector('.pocket-ticket')`),false)
 assert.equal(await evaluate(`document.querySelector('#home-characters').getAttribute('href')`),'/tools/character-counter')
 await evaluate(`document.querySelector('#home-characters').focus({preventScroll:true})`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await evaluate('document.activeElement.id'),'home-images')
 const length=await evaluate('history.length')
 await enter('#home-images');let selected=await view();assert.equal(selected.query,'画像');assert.equal(selected.category,'すべて');assert.ok(selected.collection.includes('すべての道具'));assert.equal(await evaluate('document.activeElement.id'),'tool-search');assert.equal(await evaluate('history.length'),length)
 for(const id of ['image-crop','image-resizer','image-rotate','image-joiner'])assert.ok(selected.ids.includes(id))
 await enter('.tool-card[data-tool-id="image-crop"] a');await poll(`!!document.querySelector('.tool-header')`);await back();assert.deepEqual(await view(),selected)
 await evaluate('history.forward()');await poll(`!!document.querySelector('.tool-header')`);await click('.tool-navigation a');assert.deepEqual(await view(),selected)
 await enter('#home-datetime');selected=await view();assert.equal(selected.query,'日付・時間');assert.equal(selected.category,'すべて');assert.deepEqual(selected.ids,tools.filter(t=>['countdown-timer','stopwatch','duration-calculator','timestamp-converter','date-calculator','japanese-era-converter'].includes(t.id)).map(t=>t.id));assert.equal(await evaluate('document.activeElement.id'),'tool-search')
 await enter('.tool-card[data-tool-id="date-calculator"] a');await poll(`!!document.querySelector('.tool-header')`);await back();assert.deepEqual(await view(),selected);await assertNoOverflow()
}
// Direct character shortcut keeps the user's current search/category/shelf for return.
await navigate('/');await click('#home-datetime');await click('.category-filter:first-child');await input('#tool-search','SHA');await evaluate(`document.querySelector('.category-filter:nth-child(2)').click()`);await wait(100)
if(await evaluate(`document.querySelector('.tool-card[data-tool-id="sha256"] .favorite-button').getAttribute('aria-pressed')`)!=='true')await click('.tool-card[data-tool-id="sha256"] .favorite-button')
await click('.collection-button:nth-child(2)');const prior=await view();await enter('#home-characters');await poll(`!!document.querySelector('#character-input')||location.pathname==='/tools/character-counter'`);await back();assert.deepEqual(await view(),prior)
await click('#home-images');const images=await view();assert.equal(images.query,'画像');assert.equal(images.category,'すべて');assert.ok(images.collection.includes('すべての道具'));assert.ok(images.ids.includes('image-crop'))
await input('#tool-search','private-home-search-marker');await click('#home-datetime');assert.equal(await evaluate(`JSON.stringify(localStorage).includes('private-home-search-marker')||location.search!==''`),false);assert.equal(requests.some(r=>(r.url+r.body).includes('private-home-search-marker')),false)
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('#home-images');await assertNoOverflow();await send('Emulation.setEmulatedMedia',{features:[]})
finish();console.log('PASS: compact everyday shortcuts; light/dark320/375/768/1280; native keyboard/focus; image/date filters reset shelf; no history growth; Back/Forward/list return; direct character preserves conditions; no query persistence/transmission; reduced motion')
