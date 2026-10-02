import assert from 'node:assert/strict'
import { navigate, evaluate, send, input, click, viewport, screenshot, assertNoOverflow, finish, wait } from './browser-client.mjs'
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173'
const root=(process.env.TEST_SCREENSHOT_DIR || process.env.TEMP || '.').replaceAll('\\','/')+'/'
const select=async(id,value)=>{await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(100)}
const absent=async()=>{assert.equal(await evaluate('!!document.querySelector(".duration-total")'),false);assert.equal(await evaluate('document.querySelector("#calculation-copy").disabled'),true);assert.equal(await evaluate('document.querySelector(".calculation-status").textContent'), '')}
const total=async(text)=>{await click('#duration-calculate');assert.equal(await evaluate('document.querySelector(".duration-total")?.textContent'),text)}
await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Page.bringToFront')
await send('Browser.grantPermissions',{permissions:['clipboardReadWrite','clipboardSanitizedWrite'],origin:base})
await viewport(1280);await navigate('/tools/duration-calculator')
await input('#duration-seconds-1','59');await click('#duration-add');assert.equal(await evaluate('document.activeElement.id'),'duration-hours-2');await input('#duration-seconds-2','1');await total('0時間1分0秒')
await click('#calculation-copy');assert.equal(await evaluate('document.querySelector(".calculation-status").textContent'),'コピーしました');assert.ok((await evaluate('navigator.clipboard.readText()')).includes('合計秒: 60秒'))
await input('#duration-seconds-2','2');await absent()
await click('#calculation-reset');await total('0時間0分0秒')
await input('#duration-hours-1','23');await click('#duration-add');await input('#duration-hours-2','2');await total('25時間0分0秒')
await select('#duration-operation-2','subtract');await absent();await total('21時間0分0秒')
await input('#duration-hours-1','1');await total('-1時間0分0秒')
assert.ok((await evaluate('document.querySelector("#calculation-output").value')).includes('-01:00:00'))
await input('#duration-hours-1','２');await total('0時間0分0秒')
await input('#duration-minutes-1','60');await click('#duration-calculate');assert.ok(await evaluate('document.querySelector(".error-box").textContent.includes("0〜59")'));await absent()
await input('#duration-minutes-1','');assert.equal(await evaluate('!!document.querySelector(".error-box")'),false)
await input('#duration-hours-1','1000000');await click('#duration-calculate');assert.ok(await evaluate('!!document.querySelector(".error-box")'))
for(const bad of ['1.5','-1','abc']){await input('#duration-hours-1',bad);await click('#duration-calculate');assert.ok(await evaluate('!!document.querySelector(".error-box")'))}
await click('#calculation-reset');for(let i=1;i<20;i++)await click('#duration-add');assert.equal(await evaluate('document.querySelectorAll(".duration-row").length'),20);assert.equal(await evaluate('document.querySelector("#duration-add").disabled'),true)
await evaluate(`(()=>{for(const el of document.querySelectorAll('.duration-fields input')){const value=el.id.includes('hours')?'999999':'59';Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}})()`);await wait(200);await total('19999999時間59分40秒');assert.ok(await evaluate('document.querySelector("#calculation-output").value.includes("71999999980秒")'));await assertNoOverflow()
await evaluate(`(()=>{for(const el of document.querySelectorAll('.duration-row select')){Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,'subtract');el.dispatchEvent(new Event('change',{bubbles:true}));}})()`);await wait(200);await total('-19999999時間59分40秒');await assertNoOverflow()
await click('#calculation-reset');for(let i=1;i<20;i++)await click('#duration-add')
await total('0時間0分0秒');await click('[aria-label="時間20を削除"]');await absent();assert.equal(await evaluate('document.activeElement.id'),'duration-hours-19');assert.equal(await evaluate('document.querySelector("#duration-add").disabled'),false)
await click('#calculation-reset');await input('#duration-hours-1','999999');await input('#duration-minutes-1','59');await input('#duration-seconds-1','59');await total('999999時間59分59秒')
// Actual Tab and Enter through the form; no synthetic submit.
await click('#calculation-reset');await evaluate('document.querySelector("#duration-hours-1").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await evaluate('document.activeElement.id'),'duration-minutes-1')
await input('#duration-minutes-1','1');await evaluate('document.querySelector("#duration-minutes-1").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(200);assert.equal(await evaluate('document.querySelector(".duration-total").textContent'),'0時間1分0秒')
// Editing during clipboard completion must not revive feedback.
await evaluate(`window.realCopy=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=()=>new Promise(resolve=>window.resolveCopy=resolve)`);await click('#calculation-copy');await input('#duration-seconds-1','1');await evaluate('window.resolveCopy()');await wait(200);await absent();await evaluate('navigator.clipboard.writeText=window.realCopy')
for(const theme of ['light','dark'])for(const width of [1280,320]){
 await viewport(width);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child');await wait(600);await click('#calculation-reset');await input('#duration-hours-1','23');await click('#duration-add');await input('#duration-hours-2','4');await total('27時間0分0秒');await assertNoOverflow()
 await evaluate('window.scrollTo({top:0,behavior:"instant"})');await screenshot(root+`duration-${theme}-${width}-input.png`)
 await evaluate('document.querySelector(".calculation-result").scrollIntoView({block:"center",behavior:"instant"})');await screenshot(root+`duration-${theme}-${width}-result.png`)
 await click('#calculation-copy');const copied=(await evaluate('navigator.clipboard.readText()')).replace(/\r\n/g,'\n');assert.equal(copied,'時間の足し算・引き算\n合計: 27時間0分0秒\nHH:MM:SS: 27:00:00\n合計分: 1620分（小数6桁まで）\n合計秒: 97200秒')
}
await viewport(320);await input('#duration-hours-1','999999');await input('#duration-minutes-1','59');await input('#duration-seconds-1','59');await total('1000003時間59分59秒');await assertNoOverflow()
// Existing shelf stores tool IDs only; memory input does not survive navigation.
await click('.detail-favorite');assert.ok(await evaluate('Object.values(localStorage).some(value=>value.includes("duration-calculator"))'));assert.equal(await evaluate('location.search'), '')
await navigate('/');await input('#tool-search','動画時間');assert.ok(await evaluate(`!!document.querySelector('a[href="/tools/duration-calculator"]')`))
await navigate('/tools/duration-calculator');assert.equal(await evaluate('document.querySelector("#duration-hours-1").value'),'');await absent()
for(const path of ['/tools/date-calculator','/tools/timestamp-converter','/tools/unit-converter']){await navigate(path);await assertNoOverflow();assert.ok(await evaluate('!!document.querySelector(".tool-panel")'))}
await input('#measurement-value','1');await click('#convert-units');assert.equal(await evaluate('document.querySelector("textarea[readonly]").value'),'100 cm')
await navigate('/tools/timestamp-converter');await input('#timestamp-input','0');await click('.primary-button');assert.ok(await evaluate('document.body.innerText.includes("1970-01-01")'))
finish();console.log('PASS: duration boundaries,20 rows,edit/add/delete/reset invalidation,actual clipboard,Tab/Enter,copy race,4 layouts,shelf/search/privacy,existing date/timestamp/unit routes')
