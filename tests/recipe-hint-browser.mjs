import assert from 'node:assert/strict'
import {navigate,input,click,evaluate,send,wait,viewport,screenshot,assertNoOverflow,finish} from './browser-client.mjs'
await send('Browser.grantPermissions',{origin:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',permissions:['clipboardReadWrite','clipboardSanitizedWrite']})
for (const theme of ['light','dark']) {
 await navigate('/tools/recipe-scaler');await viewport(320)
 await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child')
 await input('#ingredient-name-1','砂糖');await input('#ingredient-amount-1','1/2');await click('#recipe-calculate')
 assert.match(await evaluate('document.querySelector("#calculation-error").textContent'),/分数/)
 assert.equal(await evaluate('document.querySelectorAll("#ingredient-amount-help").length'),1)
 assert.match(await evaluate('document.querySelector("#ingredient-amount-help").textContent'),/1\/2 は 0\.5 と入力/)
 assert.equal(await evaluate('document.querySelector("#ingredient-amount-1").getAttribute("aria-describedby")'),'ingredient-amount-help calculation-error')
 await evaluate('document.querySelector("#ingredient-amount-help").scrollIntoView({block:"center"})');await assertNoOverflow();await screenshot(`C:/Users/wshim/Documents/Codex/2026-10-02/task-2/recipe-hint-${theme}-320.png`)
 await input('#ingredient-amount-1','0.5');assert.equal(await evaluate('!!document.querySelector("#calculation-error")'),false)
 assert.equal(await evaluate('document.querySelector("#ingredient-amount-1").getAttribute("aria-describedby")'),'ingredient-amount-help')
 await evaluate('document.querySelector("#recipe-calculate").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await wait(200)
 assert.match(await evaluate('document.querySelector("#calculation-output").value'),/0\.75/)
 await click('#calculation-copy');assert.match(await evaluate('navigator.clipboard.readText()'),/砂糖.*0\.75/)
 await input('#ingredient-amount-1','０．５');await click('#recipe-calculate');assert.match(await evaluate('document.querySelector("#calculation-output").value'),/0\.75/)
 await click('#ingredient-add');assert.equal(await evaluate('document.querySelector("#ingredient-amount-2").getAttribute("aria-describedby")'),'ingredient-amount-help')
 await assertNoOverflow()
}
finish();console.log('PASS: fraction error → decimal correction; fullwidth; actual clipboard; shared description/new row; native Enter; light/dark320')

