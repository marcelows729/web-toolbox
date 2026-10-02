import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {navigate,input,click,evaluate,send,wait,viewport,assertNoOverflow,screenshot,requests,finish} from './browser-client.mjs'
const value=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).value`)
const clipboard=async()=> (await evaluate('navigator.clipboard.readText()')).replace(/\r\n?/g,'\n')
const paste=async text=>{await evaluate(`(()=>{const el=document.querySelector('#width-input'),data=new DataTransfer();el.setSelectionRange(0,el.value.length);data.setData('text/plain',${JSON.stringify(text)});el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}))})()`);await wait(100)}
export async function checkWidthConverter(){
 await send('Browser.grantPermissions',{origin:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',permissions:['clipboardReadWrite','clipboardSanitizedWrite']})
 for(const theme of ['light','dark'])for(const width of [1280,320]){
  await navigate('/tools/width-converter');await viewport(width);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child')
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".text-format-option input")].map(x=>x.checked)'),[true,true,false,false])
  const source='Ａｂ１２！　日本語①㎏😀1️⃣\t\n',expected='Ab12！　日本語①㎏😀1️⃣\t\n'
  await input('#width-input',source);await evaluate('document.querySelector("#width-run").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(100)
  assert.equal(await value('#width-output'),expected);assert.equal(await value('#width-input'),source);assert.match(await evaluate('document.querySelector(".text-format-status").textContent'),/4文字/)
  await click('#width-copy');assert.equal(await clipboard(),expected)
  if(process.env.TEST_SCREENSHOT_DIR){await evaluate('document.querySelector("#width-output").scrollIntoView({block:"center",behavior:"instant"})');await screenshot(process.env.TEST_SCREENSHOT_DIR+`/width-${theme}-${width}-result.png`)}
  await assertNoOverflow();await click('#width-symbols');assert.equal(await value('#width-output'),'');await click('#width-spaces');await click('#width-run');assert.equal(await value('#width-output'),'Ab12! 日本語①㎏😀1️⃣\t\n')
  await click('#width-full');assert.equal(await value('#width-output'),'');await input('#width-input','Ab12! 日本語①㎏😀1️⃣\t\n');await click('#width-run');assert.equal(await value('#width-output'),source)
  await input('#width-input','<img src=x onerror=bad()>');await click('#width-run');assert.equal(await evaluate('document.querySelectorAll(".tool-panel img,.tool-panel script").length'),0)
  await click('#width-reset');await paste('Ａ\r\nＢ\tＣ');await click('#width-run');assert.equal(await value('#width-output'),'A\nB\tC')
  await evaluate('window.widthNativeWrite=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=text=>{window.widthCopyPayload=text;return window.widthNativeWrite(text)}');await click('#width-copy');assert.equal(await evaluate('window.widthCopyPayload'),'A\r\nB\tC');assert.equal(await clipboard(),'A\nB\tC')
  await input('#width-input','Ａ\nＢ\tＣx');await click('#width-run');await click('#width-copy');assert.equal(await evaluate('window.widthCopyPayload'),'A\r\nB\tCx')
  await paste('Ａ'.repeat(50_000));await click('#width-run');assert.equal((await value('#width-output')).length,50_000);assert.equal((await value('#width-output'))[0],'A')
  await paste('x'.repeat(50_001));assert.equal((await value('#width-input')).length,50_000);assert.equal(await value('#width-output'),'');assert.match(await evaluate('document.querySelector("#width-error").textContent'),/元の入力は保持/);assert.match(await evaluate('document.querySelector("#width-input").getAttribute("aria-describedby")'),/width-error/)
  await click('#width-reset');await click('#width-letters');await click('#width-digits');await input('#width-input','<img src=x onerror=bad()>');await click('#width-run');assert.equal(await value('#width-output'),'<img src=x onerror=bad()>');assert.equal(await evaluate('document.querySelectorAll(".tool-panel img,.tool-panel script").length'),0);await input('#width-input','Ａ1😀');await click('#width-run');assert.equal(await value('#width-output'),'Ａ1😀');assert.match(await evaluate('document.querySelector(".text-format-status").textContent'),/0文字/)
  await click('#width-reset');await click('#width-run');assert.equal(await value('#width-output'),'');assert.equal(await evaluate('document.querySelector("#width-copy").disabled'),false);await click('#width-copy');assert.equal(await clipboard(),'');await click('#width-reset');assert.equal(await evaluate('document.activeElement.id'),'width-input')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await assertNoOverflow()
  if(process.env.TEST_SCREENSHOT_DIR){await evaluate('document.querySelector(".tool-panel").scrollIntoView({block:"start",behavior:"instant"})');await screenshot(process.env.TEST_SCREENSHOT_DIR+`/width-${theme}-${width}-form.png`)}
 }
 await navigate('/tools/width-converter');await input('#width-input','private-width-20261002 Ａ');await click('#width-run');await evaluate('window.nativeWidthCopy=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=()=>new Promise(resolve=>window.finishWidthCopy=resolve)')
 try{await click('#width-copy');await click('#width-digits');await click('#width-run');await evaluate('window.finishWidthCopy()');await wait(100);assert.doesNotMatch(await evaluate('document.querySelector(".text-format-status").textContent'),/コピーしました/);await click('#width-copy');await click('.calculation-related a[href="/tools/text-formatter"]');await evaluate('window.finishWidthCopy()');await navigate('/tools/width-converter');assert.equal(await value('#width-input'),'');assert.equal(await value('#width-output'),'')}finally{await evaluate('if(window.nativeWidthCopy)navigator.clipboard.writeText=window.nativeWidthCopy')}
 assert.equal(await evaluate('JSON.stringify(localStorage).includes("private-width-20261002")||location.href.includes("private-width-20261002")'),false);assert.ok(!requests.some(r=>(r.url+r.body).includes('private-width-20261002')))
 await send('Emulation.setEmulatedMedia',{features:[]})
 console.log('PASS: limited width mappings/emoji/targets/direction/CRLF payload/original kept/50k limits/keyboard/actual clipboard/stale copy/privacy/light-dark320/reduced-motion')
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){await checkWidthConverter();finish()}
