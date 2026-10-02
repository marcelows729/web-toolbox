import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import {navigate,input,click,evaluate,send,wait,viewport,assertNoOverflow,screenshot,requests,finish} from './browser-client.mjs'
const select=async(selector,value)=>{await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}))})()`);await wait(100)}
const text=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent`)
const value=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).value`)
const dimensions=async(w,h,target)=>{await input('#aspect-width',w);await input('#aspect-height',h);await input('#aspect-target',target)}
export async function checkAspectRatio(){
 await send('Browser.grantPermissions',{origin:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',permissions:['clipboardReadWrite','clipboardSanitizedWrite']})
 for(const theme of ['light','dark'])for(const width of [1280,320]){
  await navigate('/tools/aspect-ratio');await viewport(width);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child')
  if(width===320)assert.equal(await evaluate('getComputedStyle(document.querySelector(".aspect-presets")).gridTemplateColumns.split(" ").length'),3)
  await evaluate('document.querySelector("#aspect-width").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await evaluate('document.activeElement.id'),'aspect-height')
  await evaluate('document.querySelector("#aspect-target").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(100)
  assert.equal(await text('#aspect-ratio'),'16:9');assert.equal(await text('#aspect-size'),'1280 × 720');assert.equal(await value('#aspect-height'),'1080');assert.equal(await value('#aspect-target'),'1280')
  await click('#calculation-copy');assert.match(await evaluate('navigator.clipboard.readText()'),/1280 × 720/)
  if(process.env.TEST_SCREENSHOT_DIR){await evaluate('document.querySelector(".aspect-result").scrollIntoView({block:"center",behavior:"instant"})');await screenshot(process.env.TEST_SCREENSHOT_DIR+`/aspect-${theme}-${width}-result.png`)}
  await assertNoOverflow()
  await click('#aspect-swap');assert.equal(await evaluate('!!document.querySelector(".aspect-result")'),false);assert.equal(await value('#aspect-target'),'1280');assert.equal(await value('#aspect-width'),'1080');await input('#aspect-target','720');await click('#aspect-calculate');assert.equal(await text('#aspect-size'),'720 × 1280')
  await select('#aspect-axis','height');await input('#aspect-target','1280');await click('#aspect-calculate');assert.equal(await text('#aspect-size'),'720 × 1280');assert.equal(await value('#aspect-width'),'1080')
  await select('#aspect-axis','width');await input('#aspect-target','1280')
  for(const preset of ['1:1','4:3','3:2','16:9','9:16']){await evaluate(`([...document.querySelectorAll('.aspect-presets button')].find(x=>x.textContent===${JSON.stringify(preset)})).click()`);await click('#aspect-calculate');assert.equal(await text('#aspect-ratio'),preset);assert.equal(await value('#aspect-target'),'1280')}
  await dimensions('１２．５','７．５','１０');await click('#aspect-calculate');assert.equal(await text('#aspect-ratio'),'5:3');assert.equal(await text('#aspect-size'),'10 × 6')
  await dimensions('3','2','1');await click('#aspect-calculate');assert.match(await text('#aspect-rounding-note'),/比率と差/);await select('#aspect-rounding','decimal');await click('#aspect-calculate');assert.equal(await text('#aspect-size'),'1 × 約0.666667')
  await dimensions('2','1','3');for(const [rounding,expected]of [['round','3 × 2'],['ceil','3 × 2'],['floor','3 × 1']]){await select('#aspect-rounding',rounding);await click('#aspect-calculate');assert.equal(await text('#aspect-size'),expected)}
  await input('#aspect-target','');await click('#aspect-calculate');assert.equal(await text('#aspect-ratio'),'2:1');assert.equal(await evaluate('!!document.querySelector("#aspect-size")'),false)
  for(const bad of ['0','-1','Infinity','1000001','bad']){await input('#aspect-width',bad);await click('#aspect-calculate');assert.ok(await evaluate('!!document.querySelector("#calculation-error")'));assert.equal(await evaluate('document.querySelector("#calculation-copy").disabled'),true);assert.equal(await evaluate('document.querySelector("#aspect-width").getAttribute("aria-describedby").includes("calculation-error")'),true)}
  await dimensions('0.000001','1000000','1');await click('#aspect-calculate');assert.match(await text('#calculation-error'),/計算する側の寸法/)
  await dimensions('1000000','0.000001','');await click('#aspect-calculate');assert.equal(await text('#aspect-ratio'),'1000000000000:1');await assertNoOverflow()
  await click('#calculation-reset');assert.equal(await evaluate('document.activeElement.id'),'aspect-width');assert.equal(await value('#aspect-width'),'1920');assert.equal(await evaluate('!!document.querySelector(".aspect-result")'),false)
  if(process.env.TEST_SCREENSHOT_DIR){await evaluate('document.querySelector(".tool-panel").scrollIntoView({block:"start",behavior:"instant"})');await screenshot(process.env.TEST_SCREENSHOT_DIR+`/aspect-${theme}-${width}-form.png`)}
 }
 await navigate('/tools/aspect-ratio');await click('#aspect-calculate');await evaluate('window.nativeAspectCopy=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=()=>new Promise(resolve=>window.finishAspectCopy=resolve)')
 try{
  await click('#calculation-copy');await input('#aspect-target','640');await click('#aspect-calculate');await evaluate('window.finishAspectCopy()');await wait(100);assert.doesNotMatch(await text('.calculation-status'),/コピーしました/)
  await click('#calculation-copy');await click('.calculation-related a[href="/tools/unit-converter"]');await evaluate('window.finishAspectCopy()');await navigate('/tools/aspect-ratio');assert.equal(await evaluate('!!document.querySelector(".aspect-result")'),false);assert.equal(await text('.calculation-status'),'')
 }finally{await evaluate('if(window.nativeAspectCopy)navigator.clipboard.writeText=window.nativeAspectCopy')}
 await input('#aspect-width','private-aspect-20261002');assert.equal(await evaluate('JSON.stringify(localStorage).includes("private-aspect-20261002")||location.href.includes("private-aspect-20261002")'),false);assert.ok(!requests.some(r=>(r.url+r.body).includes('private-aspect-20261002')))
 await navigate('/tools/unit-converter');await click('#convert-units');assert.equal(await value('.tool-panel textarea[readonly]'),'100 cm')
 console.log('PASS: aspect ratios/presets/swap/both axes/no form loops/fullwidth/rounding/limits/keyboard/clipboard/privacy/light-dark320/unit regression')
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){await checkAspectRatio();finish()}
