import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {navigate,input,click,evaluate,send,wait,viewport,assertNoOverflow,screenshot,requests,finish} from './browser-client.mjs'
const clipboard=async()=> (await evaluate('navigator.clipboard.readText()')).replace(/\r\n?/g,'\n')
const stats=()=>evaluate('([...document.querySelectorAll(".stat-card strong")].map(x=>x.textContent))')
const paste=async text=>{await evaluate(`(()=>{const el=document.querySelector('#character-counter-input'),data=new DataTransfer();el.setSelectionRange(0,el.value.length);data.setData('text/plain',${JSON.stringify(text)});el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}))})()`);await wait(100)}
export async function checkCharacterCounter(){
 await send('Browser.grantPermissions',{origin:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',permissions:['clipboardReadWrite','clipboardSanitizedWrite']})
 for(const theme of ['light','dark'])for(const width of [1280,320]){
  await navigate('/tools/character-counter');await viewport(width);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child')
  assert.deepEqual(await stats(),['0','0','0','0','0','0 bytes'])
  await input('#character-counter-input','A Ｂ　\t\nC');assert.deepEqual(await stats(),['7','3','6','2','3','11 bytes']);await evaluate('document.querySelector("#counter-copy").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(100);assert.equal(await clipboard(),'A Ｂ　\t\nC')
  if(process.env.TEST_SCREENSHOT_DIR){await evaluate('document.querySelector(".stats-grid").scrollIntoView({block:"center",behavior:"instant"})');await screenshot(process.env.TEST_SCREENSHOT_DIR+`/counter-${theme}-${width}.png`)}
  await assertNoOverflow();await input('#character-counter-input','😀e\u0301👩‍👩‍👧‍👦');assert.deepEqual(await stats(),['3','3','3','1','1','32 bytes']);assert.equal(await evaluate('document.querySelector(".copy-feedback").textContent'),'')
  await paste('a\r\nb\rc\n');assert.deepEqual(await stats(),['6','3','3','4','3','6 bytes']);await click('#counter-copy');assert.equal(await clipboard(),'a\nb\nc\n')
  await input('#character-counter-input',' \t\n');assert.equal(await evaluate('document.querySelector("#counter-copy").disabled'),false);await click('#counter-copy');assert.equal(await clipboard(),' \t\n')
  await paste('漢'.repeat(50_000));assert.deepEqual(await stats(),['50000','50000','50000','1','1','150000 bytes']);await assertNoOverflow()
  await paste('a'.repeat(50_000));assert.deepEqual(await stats(),['50000','50000','50000','1','1','50000 bytes'])
  await paste('x'.repeat(50_001));assert.equal(await evaluate('document.querySelector("#character-counter-input").value.length'),50_000);assert.match(await evaluate('document.querySelector("#counter-error").textContent'),/元の入力は保持/);assert.deepEqual(await stats(),['50000','50000','50000','1','1','50000 bytes']);assert.match(await evaluate('document.querySelector("#character-counter-input").getAttribute("aria-describedby")'),/counter-error/)
  await evaluate('(()=>{const el=document.querySelector("#character-counter-input");el.focus();el.setSelectionRange(el.value.length,el.value.length)})()');for(let attempt=0;attempt<2;attempt++){await send('Input.insertText',{text:'z'});await wait(100);assert.equal(await evaluate('document.querySelector("#character-counter-input").value.length'),50000)}
  await click('#counter-clear');assert.deepEqual(await stats(),['0','0','0','0','0','0 bytes']);assert.equal(await evaluate('document.activeElement.id'),'character-counter-input')
  assert.equal(await evaluate('document.querySelector("#counter-copy").disabled'),true)
 }
 await navigate('/tools/character-counter');await input('#character-counter-input','private-counter-20261002')
 await evaluate('window.nativeCounterCopy=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=()=>new Promise(resolve=>window.finishCounterCopy=resolve)')
 try{
  await click('#counter-copy');await input('#character-counter-input','new');await evaluate('window.finishCounterCopy()');await wait(100);assert.equal(await evaluate('document.querySelector(".copy-feedback").textContent'),'')
  await click('#counter-copy');await click('.tool-navigation a');await evaluate('window.finishCounterCopy()');await navigate('/tools/character-counter');assert.deepEqual(await stats(),['0','0','0','0','0','0 bytes'])
 }finally{await evaluate('if(window.nativeCounterCopy)navigator.clipboard.writeText=window.nativeCounterCopy')}
 assert.equal(await evaluate('JSON.stringify(localStorage).includes("private-counter-20261002")||location.href.includes("private-counter-20261002")'),false);assert.ok(!requests.some(r=>(r.url+r.body).includes('private-counter-20261002')))
 const elapsed=await evaluate(`(async()=>{const el=document.querySelector('#character-counter-input'),t=performance.now();Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'a'.repeat(50000));el.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(requestAnimationFrame);return Math.round(performance.now()-t)})()`)
 assert.equal((await stats())[0],'50000');console.log(`PASS: counter empty/Unicode/whitespace/newlines/CRLF/limit/actual clipboard/keyboard/stale copy/privacy/light-dark320; 50k input + render ${elapsed}ms (this environment)`)
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){await checkCharacterCounter();finish()}
