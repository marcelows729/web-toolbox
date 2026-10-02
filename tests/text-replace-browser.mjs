import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import {navigate,input,click,evaluate,send,wait,viewport,assertNoOverflow,screenshot,requests,finish} from './browser-client.mjs'
const values = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).value`)
const paste = async (selector,text) => {await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)}),data=new DataTransfer();el.focus();el.setSelectionRange(0,el.value.length);data.setData('text/plain',${JSON.stringify(text)});el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}))})()`);await wait(100)}
const result = () => values('#text-replace-output')
const fill = async (body,search,replacement) => {await input('#text-replace-input',body);await input('#text-replace-search',search);await input('#text-replace-replacement',replacement)}
export async function checkTextReplace() {
 await send('Browser.grantPermissions',{origin:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',permissions:['clipboardReadWrite','clipboardSanitizedWrite']})
 for(const theme of ['light','dark']) for(const width of [1280,320]) {
  await navigate('/tools/text-replace');await viewport(width);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child')
  assert.equal(await evaluate('document.querySelector("#text-replace-run").disabled'),true)
  await evaluate('document.querySelector("#text-replace-input").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await evaluate('document.activeElement.id'),'text-replace-search')
  await fill('a,b,c',',',"','")
  await evaluate('document.querySelector("#text-replace-run").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(100)
  assert.equal(await result(),"a','b','c");assert.equal(await values('#text-replace-input'),'a,b,c');assert.match(await evaluate('document.querySelector(".text-format-status").textContent'),/2件/)
  await click('#text-replace-copy');assert.equal(await evaluate('navigator.clipboard.readText()'),"a','b','c");assert.match(await evaluate('document.querySelector(".text-format-status").textContent'),/2件.*コピーしました/)
  if(process.env.TEST_SCREENSHOT_DIR){await evaluate('document.querySelector(".tool-panel").scrollIntoView()');await screenshot(process.env.TEST_SCREENSHOT_DIR+`/text-replace-${theme}-${width}.png`)}
  await assertNoOverflow()
  await input('#text-replace-search','z');assert.equal(await result(),'');assert.equal(await evaluate('document.querySelector(".text-format-status").textContent'),'');await click('#text-replace-run');assert.equal(await result(),'a,b,c')
  await fill('ababa','aba','');await click('#text-replace-run');assert.equal(await result(),'ba')
  await fill('aaaa','aa','');await click('#text-replace-run');assert.equal(await result(),'');assert.equal(await evaluate('document.querySelector("#text-replace-copy").disabled'),false);await click('#text-replace-copy');assert.equal(await evaluate('navigator.clipboard.readText()'),'')
  await fill('a','a','aa');await click('#text-replace-run');assert.equal(await result(),'aa')
  await fill('😀 <img src=x onerror=bad()> 😀','😀','日本語');await click('#text-replace-run');assert.equal(await result(),'日本語 <img src=x onerror=bad()> 日本語');assert.equal(await evaluate('document.querySelectorAll(".tool-panel img,.tool-panel script").length'),0)
  await paste('#text-replace-input','甲\r\n乙\r甲\n乙');await paste('#text-replace-search','甲\r\n乙');await paste('#text-replace-replacement','Ａ\r\n😀');await click('#text-replace-run');assert.equal(await result(),'Ａ\n😀\nＡ\n😀')
  await fill('a'.repeat(50_000),'a','aa');await click('#text-replace-run');assert.equal((await result()).length,100_000)
  await input('#text-replace-replacement','aaa');await click('#text-replace-run');assert.match(await evaluate('document.querySelector("#text-replace-error").textContent'),/結果が100,000/);assert.equal(await result(),'');assert.equal(await evaluate('document.querySelector("#text-replace-copy").disabled'),true)
  for(const [field,limit] of [['input',50_000],['search',1_000],['replacement',10_000]]){const original=await values('#text-replace-'+field);await paste('#text-replace-'+field,'x'.repeat(limit+1));assert.equal(await values('#text-replace-'+field),original);assert.match(await evaluate('document.querySelector("#text-replace-error").textContent'),/元の入力は保持/)}
  assert.equal(await evaluate('[...document.querySelectorAll(".tool-panel textarea:not([readonly])")].every(x=>x.getAttribute("aria-describedby").split(" ").every(id=>document.getElementById(id)))'),true)
  await click('#text-replace-clear');assert.equal(await evaluate('document.activeElement.id'),'text-replace-input');assert.equal(await values('#text-replace-search'),'');assert.equal(await result(),'')
 }
 // Slow clipboard completion must not restore stale success after edit, re-run, or navigation.
 await navigate('/tools/text-replace');await fill('private-replace-20261002-本文','本文','結果');await click('#text-replace-run')
 await evaluate('window.nativeReplaceCopy=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=()=>new Promise(resolve=>window.finishReplaceCopy=resolve)')
 try {
  await click('#text-replace-copy');await input('#text-replace-replacement','新結果');await click('#text-replace-run');await evaluate('window.finishReplaceCopy()');await wait(100);assert.doesNotMatch(await evaluate('document.querySelector(".text-format-status").textContent'),/コピーしました/)
  await click('#text-replace-copy');await click('.calculation-related a[href="/tools/text-formatter"]');await evaluate('window.finishReplaceCopy()');await navigate('/tools/text-replace');assert.equal(await result(),'');assert.equal(await values('#text-replace-input'),'');assert.equal(await evaluate('document.querySelector(".text-format-status").textContent'),'')
 } finally {await evaluate('if(window.nativeReplaceCopy)navigator.clipboard.writeText=window.nativeReplaceCopy')}
 assert.equal(await evaluate('JSON.stringify(localStorage).includes("private-replace-20261002") || location.href.includes("private-replace-20261002")'),false)
 assert.ok(!requests.some(r=>/private-replace-20261002/.test(r.url+r.body)))
 // Existing formatter retains its independent operations.
 await navigate('/tools/text-formatter');await input('#text-format-input',' a \n\n a ');await click('#text-format-trimLines');await click('#text-format-removeBlankLines');await click('#text-format-dedupeLines');await click('#text-format-run');assert.equal(await values('#text-format-output'),'a')
 console.log('PASS: literal replacement/native keyboard/actual clipboard/light-dark320/multiline/limits/HTML/privacy/stale copy/formatter regression')
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {await checkTextReplace();finish()}
