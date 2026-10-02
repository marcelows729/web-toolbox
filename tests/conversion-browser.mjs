import assert from 'node:assert/strict'
import {navigate,evaluate,send,input,wait,viewport,screenshot,assertNoOverflow,finish} from './browser-client.mjs'

const origin = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:5173').origin
const screenshotRoot = (process.env.TEST_SCREENSHOT_DIR || process.env.TEMP || '.').replaceAll('\\','/')
await send('Emulation.setFocusEmulationEnabled',{enabled:true})
await send('Page.bringToFront')
await send('Browser.grantPermissions',{permissions:['clipboardReadWrite','clipboardSanitizedWrite'],origin})
const tools = [
  {id:'json-formatter',prefix:'json',value:'{"日本語":"😀","n":1}',execute:'Format',expected:'{\n  "日本語": "😀",\n  "n": 1\n}',invalid:'{',fail:'Format'},
  {id:'sql-in-generator',prefix:'sql-in',value:"O'Reilly, 日本語, O'Reilly",execute:'Generate',expected:"('O''Reilly', '日本語')",invalid:'',fail:'Generate'},
  {id:'url-encode-decode',prefix:'url-encode',value:'日本語 😀 /?&+',execute:'Encode',expected:encodeURIComponent('日本語 😀 /?&+'),invalid:'%ZZ',fail:'Decode'},
  {id:'base64-encode-decode',prefix:'base64',value:'日本語 😀\nabc',execute:'Encode',expected:Buffer.from('日本語 😀\nabc').toString('base64'),invalid:'@@@',fail:'Decode'},
]
const action = async text => {
  assert.ok(await evaluate(`Array.from(document.querySelectorAll('.action-row button')).some(b=>b.textContent.trim()===${JSON.stringify(text)})`))
  await evaluate(`Array.from(document.querySelectorAll('.action-row button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`)
  await wait(50)
}
const state = t => evaluate(`({output:document.querySelector('#${t.prefix}-output').value,disabled:Array.from(document.querySelectorAll('.action-row button')).find(b=>b.textContent.trim()==='Copy').disabled,feedback:document.querySelector('.copy-feedback')?.textContent.trim()||'',error:document.querySelector('.error-box')?.textContent.trim()||'',count:document.querySelector('.field-label-sm')?.textContent||''})`)
const clean = async t => assert.deepEqual(await state(t),{output:'',disabled:true,feedback:'',error:'',count:''},t.id)
const generate = async t => {await input('#'+t.prefix+'-input',t.value);await action(t.execute);assert.equal((await state(t)).output,t.expected)}
const deferCopy = async () => evaluate(`window.realWrite=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=()=>new Promise((resolve,reject)=>{window.finishCopy=resolve;window.failCopy=reject})`)
const completeCopy = async reject => {await evaluate(`navigator.clipboard.writeText=window.realWrite;window.${reject?'failCopy(new Error("Denied"))':'finishCopy()'}`);await wait(50)}
let raceChecks=0
for (const t of tools) {
  await navigate('/tools/'+t.id);await clean(t)
  await generate(t);await action('Copy')
  assert.equal((await evaluate('navigator.clipboard.readText()')).replace(/\r\n/g,'\n'),t.expected)
  assert.equal((await state(t)).feedback,'コピーしました')
  await input('#'+t.prefix+'-input',t.value+' ');await clean(t)
  await input('#'+t.prefix+'-input',t.invalid);await action(t.fail)
  assert.ok((await state(t)).error);assert.equal((await state(t)).output,'');assert.equal((await state(t)).disabled,true)
  await input('#'+t.prefix+'-input',t.value);await clean(t);await action(t.execute)
  await action('Copy');await action(t.execute);assert.equal((await state(t)).feedback,'')
  await action('Clear');await clean(t);assert.equal(await evaluate(`document.querySelector('#${t.prefix}-input').value`),'')
  await input('#'+t.prefix+'-input',t.value)
  await evaluate(`(()=>{Array.from(document.querySelectorAll('.action-row button')).find(b=>b.textContent.trim()===${JSON.stringify(t.execute)}).click();const el=document.querySelector('#${t.prefix}-input');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(t.value+'x')});el.dispatchEvent(new Event('input',{bubbles:true}));})()`)
  await wait(50);await clean(t) // invalidate the pending run before its await completes

  // Real asynchronous clipboard completion, including failure, must be ignored
  // after edits, Clear, rerun, changed options, or React route unmount.
  const changes=['input','clear','rerun','navigation']
  if (t.id==='sql-in-generator') changes.push('mode','dedupe')
  if (t.id==='url-encode-decode') changes.push('mode')
  for (const change of changes) for (const reject of [false,true]) {
    await navigate('/tools/'+t.id);await generate(t);await deferCopy();await action('Copy')
    if(change==='input') await input('#'+t.prefix+'-input',t.value+'x')
    if(change==='clear') await action('Clear')
    if(change==='rerun') await action(t.execute)
    if(change==='mode') {await evaluate('document.querySelectorAll(".toggle-option")[1].click()');await wait(50)}
    if(change==='dedupe') {await evaluate('document.querySelector(".checkbox-row input").click()');await wait(50)}
    if(change==='navigation') {
      await evaluate('document.querySelector(".brand-link").click()');await wait(100)
      // Keep the same document so the old promise really completes after unmount.
      assert.equal(await evaluate('!!document.querySelector(".tool-panel")'),false)
    }
    await completeCopy(reject)
    if(change==='navigation') assert.equal(await evaluate('!!document.querySelector(".copy-feedback,.error-box")'),false)
    else if(change==='rerun') {const s=await state(t);assert.equal(s.output,t.expected);assert.equal(s.feedback,'');assert.equal(s.error,'')}
    else await clean(t)
    raceChecks++
  }
  await navigate('/tools/'+t.id);await generate(t)
  await evaluate('navigator.clipboard.writeText=()=>Promise.reject(new Error("Denied"))');await action('Copy')
  assert.ok((await state(t)).error.includes('手動でコピー'));await input('#'+t.prefix+'-input',t.value+'x');await clean(t)
  console.log('PASS:',t.id,'edit/error/clear/rerun, real clipboard and delayed-copy races')
}

// Mode and calculation semantics remain unchanged.
await navigate('/tools/json-formatter');await input('#json-input',' { "a": [1, true, null] } ');await action('Minify');assert.equal((await state(tools[0])).output,'{"a":[1,true,null]}')
await navigate('/tools/sql-in-generator');await input('#sql-in-input','+01, -.5, 2, 2');await evaluate('document.querySelectorAll(".toggle-option")[1].click()');await action('Generate');assert.equal((await state(tools[1])).output,'(+01, -.5, 2)')
await evaluate('document.querySelector(".checkbox-row input").click()');await clean(tools[1]);await action('Generate');assert.equal((await state(tools[1])).output,'(+01, -.5, 2, 2)');assert.equal((await state(tools[1])).count,'件数: 4件')
await input('#sql-in-input','1, nope');await action('Generate');assert.ok((await state(tools[1])).error.includes('nope'));assert.equal((await state(tools[1])).count,'')
await navigate('/tools/url-encode-decode');await input('#url-encode-input','https://example.com/日本語?q=a b&x=1');await evaluate('document.querySelectorAll(".toggle-option")[1].click()');await action('Encode');assert.equal((await state(tools[2])).output,encodeURI('https://example.com/日本語?q=a b&x=1'))
await input('#url-encode-input','%2F%3F%26%20');await action('Decode');assert.equal((await state(tools[2])).output,decodeURI('%2F%3F%26%20'));await evaluate('document.querySelectorAll(".toggle-option")[0].click()');await clean(tools[2]);await action('Decode');assert.equal((await state(tools[2])).output,'/?& ')
await navigate('/tools/base64-encode-decode');await input('#base64-input','5pel 5pys\n6Kqe');await action('Decode');assert.equal((await state(tools[3])).output,'日本語');await input('#base64-input','/w==');await action('Decode');assert.ok((await state(tools[3])).error)

for(const theme of ['light','dark']) for(const width of [1280,320]) {
  await viewport(width)
  for(const t of tools) {
    await navigate('/tools/'+t.id);await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);await generate(t);await assertNoOverflow()
    await evaluate('document.querySelector(".tool-panel").scrollIntoView({behavior:"instant",block:"start"})')
    await screenshot(`${screenshotRoot}/conversion-${t.id}-${theme}-${width}.png`)
    await evaluate(`document.querySelector('#${t.prefix}-input').focus()`)
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'x',code:'KeyX',windowsVirtualKeyCode:88,text:'x'})
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'x',code:'KeyX',windowsVirtualKeyCode:88});await wait(50);await clean(t)
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
    assert.equal(await evaluate('document.activeElement.tagName'),'BUTTON')
    // Execute via actual keyboard Enter and confirm output is available again.
    // SQL/URL focus first enters the mode buttons, so focus the execute control.
    await evaluate(`Array.from(document.querySelectorAll('.action-row button')).find(b=>b.textContent.trim()===${JSON.stringify(t.execute)}).focus()`)
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(50)
    if(t.id==='json-formatter') assert.ok((await state(t)).error) // x makes JSON invalid
    else assert.ok((await state(t)).output)
  }
}
finish()
console.log(`PASS: ${raceChecks} delayed clipboard races, mode/Unicode/numeric semantics, 16 light/dark desktop/320px and native keyboard checks`)
