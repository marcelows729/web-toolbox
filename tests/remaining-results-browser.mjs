import assert from 'node:assert/strict'
import {navigate,evaluate,send,click,wait,viewport,assertNoOverflow,screenshot,finish} from './browser-client.mjs'
const origin=new URL(process.env.TEST_BASE_URL||'http://127.0.0.1:5173').origin
const root=(process.env.TEST_SCREENSHOT_DIR||process.env.TEMP||'.').replaceAll('\\','/')
await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Page.bringToFront')
await send('Browser.grantPermissions',{permissions:['clipboardReadWrite','clipboardSanitizedWrite'],origin})
const action=async(text,scope='.tool-panel',index=0)=>{assert.ok(await evaluate(`!!Array.from(document.querySelectorAll(${JSON.stringify(scope+' button')})).filter(b=>b.textContent.trim()===${JSON.stringify(text)})[${index}]`),text);await evaluate(`Array.from(document.querySelectorAll(${JSON.stringify(scope+' button')})).filter(b=>b.textContent.trim()===${JSON.stringify(text)})[${index}].click()`);await wait(40)}
const set=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e instanceof HTMLSelectElement?HTMLSelectElement.prototype:e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e instanceof HTMLSelectElement?'change':'input',{bubbles:true}))})()`);await wait(30)}
const date=async(id,day='02')=>{for(const [part,v]of [['year','2026'],['month','10'],['day',day]])await set('#'+id+'-'+part,v)}
const notifications=()=>evaluate(`Array.from(document.querySelectorAll('.copy-feedback,.quiz-copy-feedback,.text-format-status,.calculation-status')).map(e=>e.textContent).filter(t=>t.includes('コピー')).join('|')`)
const alerts=()=>evaluate(`Array.from(document.querySelectorAll('.error-box')).map(e=>e.textContent).join('|')`)
const bodyOutput=()=>evaluate('document.querySelector(".tool-panel textarea[readonly]")?.value||""')
const defer=()=>evaluate(`window.copies=[];window.originalWrite=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=text=>new Promise((resolve,reject)=>copies.push({text,resolve,reject}))`)
const complete=async(index,reject=false)=>{await evaluate(`copies[${index}].${reject?'reject(new Error("denied"))':'resolve()'}`);await wait(40)}
const restore=()=>evaluate('navigator.clipboard.writeText=window.originalWrite')
const leave=async()=>{await click('.brand-link');assert.equal(await evaluate('!!document.querySelector(".tool-panel")'),false)}
const noNotification=async()=>{assert.equal(await notifications(),'');assert.equal(await alerts(),'')}

const common=[
 ['ipv4-cidr',[['#cidr-address','192.168.1.10']],'計算'],
 ['sha256',[['#hash-text','abc']],'ハッシュ生成・照合'],
 ['radix-converter',[['#radix-input','10']],'変換'],
 ['html-escape',[['#html-input','<x>']],'エスケープ'],
 ['percentage-calculator',[['#percentage-first','1'],['#percentage-second','2']],'計算'],
 ['unit-converter',[],'変換する'],['bill-splitter',[],'割り勘を計算する'],
 ['unit-price-comparison',[['#product-price-1','100'],['#product-amount-1','100'],['#product-price-2','200'],['#product-amount-2','100']],'単価を比較'],
 ['recipe-scaler',[['#ingredient-name-1','卵'],['#ingredient-amount-1','1']],'分量を計算'],
 ['text-formatter',[['#text-format-input','abc']],'整形する'],
 ['holiday-style',[],'quiz'],['pocket-companion',[],'quiz'],
 // All existing consumers of the changed shared hook, including the fixed four.
 ['json-formatter',[['#json-input','{"a":1}']],'Format'],['sql-in-generator',[['#sql-in-input','1,2']],'Generate'],
 ['url-encode-decode',[['#url-encode-input','a b']],'Encode'],['base64-encode-decode',[['#base64-input','abc']],'Encode'],
]
const openCommon=async(t)=>{
 await navigate('/tools/'+t[0]);for(const [id,v]of t[1])await set(id,v)
 if(t[2]==='quiz'){await click('#quiz-start');for(let i=0;i<5;i++){await click('input[value="a"]');await click('#quiz-next')}}
 else await action(t[2]);assert.ok(await bodyOutput(),t[0])
}
const copyCommon=t=>t[2]==='quiz'?click('#quiz-copy'):action(['text-formatter','unit-price-comparison','recipe-scaler'].includes(t[0])?'結果をコピー':'Copy')
let raceCount=0,fieldCount=0
for(const t of common){
 // Completion order must follow the newest copy attempt, in both directions.
 for(const latestFails of [false,true]){
  await openCommon(t);await defer();await copyCommon(t);await copyCommon(t);await complete(1,latestFails);await complete(0,!latestFails)
  if(latestFails){assert.ok((await alerts()).includes('コピーできません'));assert.equal(await notifications(),'')}
  else {assert.ok((await notifications()).includes('コピーしました'));assert.equal(await alerts(),'')}
  await restore();raceCount++
 }
 await openCommon(t);await copyCommon(t);assert.ok((await notifications()).includes('コピーしました'))
 // Exercise every visible input/select. Existing tests handle file and row limits.
 const fields=t[2]==='quiz'?[]:await evaluate(`Array.from(document.querySelectorAll('.tool-panel input[id]:not([type=file]):not([type=hidden]),.tool-panel select[id],.tool-panel textarea[id]:not([readonly])')).map(e=>({id:e.id,type:e.type,value:e.value,next:e instanceof HTMLSelectElement?Array.from(e.options).find(o=>o.value!==e.value)?.value:null}))`)
 for(const f of fields){
  await openCommon(t);await defer();await copyCommon(t)
  if(f.type==='checkbox')await click('#'+f.id)
  else await set('#'+f.id,f.next??(f.value+'0'))
  await complete(0);await restore();await noNotification();assert.equal(await bodyOutput(),'');fieldCount++;raceCount++
 }
 for(const kind of ['clear','navigation','mode'])for(const reject of [false,true]){
  await openCommon(t);await defer();await copyCommon(t)
  if(kind==='navigation')await leave()
  else if(kind==='clear'){
   if(t[2]==='quiz')await click('#quiz-restart')
   else await action(t[0]==='text-formatter'?'リセット':t[0]==='unit-price-comparison'||t[0]==='recipe-scaler'?'リセット':'Clear')
  } else if(t[2]==='quiz')await click('#quiz-edit')
  else {
   const selector=await evaluate(`document.querySelector('.tool-panel .toggle-option:not(.is-selected)')?'.tool-panel .toggle-option:not(.is-selected)':document.querySelector('.tool-panel select')?'.tool-panel select':null`)
   if(!selector){await leave()}
   else if(selector==='.tool-panel select'){const value=await evaluate(`Array.from(document.querySelector(${JSON.stringify(selector)}).options).find(o=>o.value!==document.querySelector(${JSON.stringify(selector)}).value).value`);await set(selector,value)}
   else await click(selector)
  }
  await complete(0,reject);await restore();await noNotification();assert.equal(await bodyOutput(),'');raceCount++
 }
 console.log('PASS shared:',t[0],'all input/settings invalidation, clear/leave, delayed and overlapping copy')
}

const legacy=[
 {id:'character-counter',prepare:async()=>set('#character-counter-input','abc'),copy:()=>action('Copy'),edit:()=>set('#character-counter-input','abcd'),clear:()=>action('Clear'),output:()=>evaluate('document.querySelector(".stats-grid strong").textContent')},
 {id:'text-diff',prepare:async()=>{await set('#text-diff-input-a','a');await set('#text-diff-input-b','b');await action('Compare')},copy:()=>action('Copy'),edit:()=>set('#text-diff-input-a','c'),clear:()=>action('Clear'),output:()=>evaluate('document.querySelector(".text-diff-output")?.textContent||""')},
 {id:'uuid-generator',prepare:()=>action('Generate'),copy:()=>action('Copy'),edit:()=>set('#uuid-count-input','2'),clear:()=>action('Clear'),output:()=>evaluate('document.querySelector("#uuid-output").value')},
 {id:'timestamp-converter',prepare:async()=>{await set('#timestamp-input','0');await action('変換','.converter-card:first-child')},copy:()=>action('Copy','.converter-card:first-child'),edit:()=>set('#timestamp-input','1'),clear:()=>action('Clear','.converter-card:first-child'),output:()=>evaluate('document.querySelector(".converter-card:first-child .result-box")?.textContent||""')},
]
for(const t of legacy){
 const open=async()=>{await navigate('/tools/'+t.id);await t.prepare()}
 await open();await t.copy();assert.ok((await notifications()).includes('コピーしました'));await t.edit();assert.equal(await notifications(),'')
 if(t.id!=='character-counter')assert.equal(await t.output(),'')
 for(const kind of ['edit','clear','navigation','rerun'])for(const reject of [false,true]){
  await open();await defer();await t.copy();if(kind==='edit')await t.edit();if(kind==='clear')await t.clear();if(kind==='navigation')await leave();if(kind==='rerun'){if(t.id==='character-counter')await t.edit();else await t.prepare()}
  await complete(0,reject);await restore();await noNotification();raceCount++
 }
 for(const latestFails of [false,true]){await open();await defer();await t.copy();await t.copy();await complete(1,latestFails);await complete(0,!latestFails);await restore();assert.ok((await notifications()).includes(latestFails?'コピーに失敗':'コピーしました'));raceCount++}
 // Actual clipboard content and original UUID/text diff calculation semantics.
 await open();await t.copy();assert.ok(await evaluate('navigator.clipboard.readText()'))
 if(t.id==='character-counter')assert.equal(await t.output(),'3')
 if(t.id==='text-diff')assert.equal((await evaluate('navigator.clipboard.readText()')).replace(/\r\n/g,'\n'),'-a\n+b')
 if(t.id==='uuid-generator'){
  const before=await t.output();assert.match(before,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
  await defer();await t.copy();await click('.toggle-option:last-child');await complete(0);await restore();assert.equal(await t.output(),before.toUpperCase());assert.equal(await notifications(),'');raceCount++
 }
 console.log('PASS legacy:',t.id,'edit, clear, rerun, leave, clipboard order and semantics')
}

// The two panels must invalidate only their own stale result.
for(const id of ['date-calculator','japanese-era-converter','timestamp-converter']){
 await navigate('/tools/'+id)
 if(id==='date-calculator'){
  await date('date-start');await date('date-end','04');await action('計算','.converter-card:first-child');assert.ok(await evaluate('document.querySelector(".converter-card:first-child .result-box").textContent.includes("2日")'))
  await date('base-date');await set('#day-offset','1');await action('計算','.converter-card:last-child')
  await set('#date-end-day','05');assert.equal(await evaluate('!!document.querySelector(".converter-card:first-child .result-box")'),false);assert.equal(await evaluate('!!document.querySelector(".converter-card:last-child .result-box")'),true)
  await click('.converter-card:last-child .toggle-option:last-child');assert.equal(await evaluate('!!document.querySelector(".result-box")'),false)
  await action('計算','.converter-card:last-child');assert.ok(await evaluate('document.querySelector(".converter-card:last-child .result-box").textContent.includes("2026-10-01")'))
 }else if(id==='japanese-era-converter'){
  await date('gregorian-date-input');await action('変換','.converter-card:first-child');await set('#era-month-input','10');await set('#era-day-input','02');await action('変換','.converter-card:last-child')
  await set('#gregorian-date-input-day','03');assert.equal(await evaluate('!!document.querySelector(".converter-card:first-child .result-box")'),false);assert.equal(await evaluate('!!document.querySelector(".converter-card:last-child .result-box")'),true)
  for(const [field,v]of [['#era-select','平成'],['#era-year-input','2'],['#era-month-input','11'],['#era-day-input','03']]){await action('変換','.converter-card:last-child');await set(field,v);assert.equal(await evaluate('!!document.querySelector(".converter-card:last-child .result-box")'),false)}
 }else{
  await set('#timestamp-input','0');await action('変換','.converter-card:first-child');await date('datetime-date-input');await set('#datetime-time-input','12:00');await action('変換','.converter-card:last-child')
  await click('.converter-card:first-child .toggle-option:last-child');assert.equal(await evaluate('!!document.querySelector(".converter-card:first-child .result-box")'),false);assert.equal(await evaluate('!!document.querySelector(".converter-card:last-child .result-box")'),true)
  await click('.converter-card:last-child .toggle-option:last-child');assert.equal(await evaluate('!!document.querySelector(".result-box")'),false)
  for(const [field,v]of [['#datetime-date-input-year','2025'],['#datetime-date-input-month','11'],['#datetime-date-input-day','03'],['#datetime-time-input','13:00']]){await action('変換','.converter-card:last-child');await defer();await action('Copy','.converter-card:last-child');await set(field,v);await complete(0);await restore();await noNotification();assert.equal(await evaluate('!!document.querySelector(".converter-card:last-child .result-box")'),false);raceCount++}
  await action('変換','.converter-card:last-child');await action('現在時刻');assert.equal(await evaluate('!!document.querySelector(".converter-card:last-child .result-box")'),false)
  await set('#timestamp-input','0');await action('変換','.converter-card:first-child');await action('現在Timestamp');assert.equal(await evaluate('!!document.querySelector(".converter-card:first-child .result-box")'),false)
 }
 // An unchanged date input blur must leave a valid result available.
 const dateField=id==='date-calculator'?'#base-date-day':id==='japanese-era-converter'?'#gregorian-date-input-day':'#datetime-date-input-day'
 await action(id==='date-calculator'?'計算':'変換',id==='japanese-era-converter'?'.converter-card:first-child':'.converter-card:last-child')
 await evaluate(`document.querySelector('${dateField}').focus();document.querySelector('${dateField}').blur()`);await wait(40);assert.ok(await evaluate('!!document.querySelector(".result-box")'))
 await action('Clear','.converter-card:last-child');await action('Clear','.converter-card:first-child');assert.equal(await evaluate('!!document.querySelector(".result-box")'),false)
 console.log('PASS panels:',id,'all edits/modes/current shortcuts, independent results, unchanged blur, clear')
}

// Delay the real QR canvas result: Promise flattening gives an actual pending
// QRCode.toDataURL operation while edits/Clear/navigation happen.
for(const change of ['edit','clear','navigation','newer'])for(const reject of [false,true]){
 await navigate('/tools/qr-code-generator');await set('#qr-generator-input','old')
 await evaluate(`window.qrs=[];window.nativeDataURL=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(...args){const value=nativeDataURL.apply(this,args);return new Promise((resolve,reject)=>qrs.push({value,resolve,reject}))}`)
 await action('生成');assert.equal(await evaluate('qrs.length'),1)
 if(change==='edit')await set('#qr-generator-input','new')
 if(change==='clear')await action('Clear')
 if(change==='navigation')await leave()
 if(change==='newer'){await set('#qr-generator-input','new');await action('生成');await evaluate('qrs[1].resolve(qrs[1].value)');await wait(40)}
 await evaluate(`qrs[0].${reject?'reject(new Error("old QR failure"))':'resolve(qrs[0].value)'};HTMLCanvasElement.prototype.toDataURL=window.nativeDataURL`);await wait(40)
 assert.equal(await evaluate('!!document.querySelector(".qr-preview-image")'),change==='newer');if(change==='newer')assert.equal(await evaluate('document.querySelector(".qr-preview-image").src===qrs[1].value'),true);else {await noNotification();assert.equal(await evaluate('document.querySelector(".copy-feedback")?.textContent||""'),'')};raceCount++
}
await navigate('/tools/qr-code-generator');await set('#qr-generator-input','abc');await action('生成');assert.equal(await evaluate('document.querySelector(".qr-preview-image").naturalWidth'),256);await set('#qr-generator-input','');await action('生成');assert.ok(await alerts());await set('#qr-generator-input','new');await noNotification();console.log('PASS QR: pending edit/clear/leave, newer result wins, real PNG/error reset')

// Native keyboard generation/editing rather than synthetic onChange alone.
await navigate('/tools/uuid-generator');await evaluate('document.querySelector(".primary-button").focus()')
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(40);assert.ok(await bodyOutput())
await evaluate('document.querySelector("#uuid-count-input").focus();document.querySelector("#uuid-count-input").select()')
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'2',code:'Digit2',windowsVirtualKeyCode:50,text:'2'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'2',code:'Digit2',windowsVirtualKeyCode:50});await wait(40);assert.equal(await bodyOutput(),'')

// Real SHA async digest completion, including failure, is invalidated on edits.
for(const reject of [false,true]){
 await navigate('/tools/sha256');await set('#hash-text','abc');await evaluate('window.nativeDigest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=()=>new Promise((resolve,reject)=>{window.digestOK=resolve;window.digestFail=reject})');await action('ハッシュ生成・照合');await set('#hash-text','abcd');await evaluate(`crypto.subtle.digest=window.nativeDigest;window.${reject?'digestFail(new Error("old failure"))':'digestOK(new Uint8Array(32).buffer)'}`);await wait(40);assert.equal(await bodyOutput(),'');await noNotification();raceCount++
}
// Roulette has no clipboard action; its pending timer is invalidated correctly.
await navigate('/tools/roulette-picker');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await click('#draw-roulette');await set('#roulette-candidates','A\nB');await wait(1900);assert.equal(await evaluate('!!document.querySelector(".roulette-result strong")'),false)
await click('#draw-roulette');await click('#reset-roulette');await wait(1900);assert.equal(await evaluate('!!document.querySelector(".roulette-result strong")'),false);await click('#draw-roulette');await leave();await wait(1900);await noNotification();console.log('PASS roulette: pending edits/reset/leave, clipboard N/A')

const remaining=common.slice(0,12).map(t=>t[0]).concat(legacy.map(t=>t.id),['date-calculator','japanese-era-converter','qr-code-generator','roulette-picker','image-resizer','image-joiner'])
assert.equal(new Set(remaining).size,22)
for(const theme of ['light','dark']){
 await viewport(320)
 for(const id of remaining){await navigate('/tools/'+id);await evaluate(`document.documentElement.dataset.theme='${theme}'`);await assertNoOverflow();await evaluate('document.querySelector(".tool-panel textarea:not([readonly]),.tool-panel input:not([type=hidden]):not([type=file]),.tool-panel button")?.focus()');assert.notEqual(await evaluate('document.activeElement.tagName'),'BODY',id);await evaluate('document.querySelector(".theme-option:first-child").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.notEqual(await evaluate('document.activeElement.tagName'),'BODY',id)}
 for(const id of ['character-counter','text-diff','uuid-generator','date-calculator','timestamp-converter','japanese-era-converter','qr-code-generator']){
  await navigate('/tools/'+id);await evaluate(`document.documentElement.dataset.theme='${theme}'`)
  const item=legacy.find(t=>t.id===id)
  if(item)await item.prepare()
  else if(id==='date-calculator'){await date('base-date');await set('#day-offset','1');await action('計算','.converter-card:last-child')}
  else if(id==='japanese-era-converter'){await date('gregorian-date-input');await action('変換','.converter-card:first-child')}
  else{await set('#qr-generator-input','日本語 😀');await action('生成')}
  await assertNoOverflow();await evaluate('document.querySelector(".result-box,#uuid-output,.text-diff-output,.stats-grid,.qr-preview-panel")?.scrollIntoView({behavior:"instant",block:"center"})');await screenshot(`${root}/remaining-${id}-${theme}-320.png`)
 }
}
finish();console.log(`PASS: 22 remaining tools + all 16 shared consumers; ${fieldCount} input controls, ${raceCount} races, 44 light/dark 320px keyboard layouts. Image async regressions run in test:browser.`)
