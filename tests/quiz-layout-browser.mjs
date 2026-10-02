import assert from 'node:assert/strict'
import {navigate,click,evaluate,send,wait,viewport,screenshot,assertNoOverflow,finish} from './browser-client.mjs'
const root='C:/Users/wshim/Documents/Codex/2026-10-02/task-2/'
for(const path of ['pocket-companion','holiday-style']) for(const theme of ['light','dark']) for(const width of [1225,768,375,320]) {
 await navigate('/tools/'+path);await viewport(width);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child')
 await click('#quiz-start')
 for(let step=0;step<5;step++) {
  const dimensions=await evaluate(`([...document.querySelectorAll('.quiz-option')].map(x=>({card:x.getBoundingClientRect().width,text:x.querySelector('.quiz-option-copy').getBoundingClientRect().width,height:x.getBoundingClientRect().height})))`)
  for(const d of dimensions){assert.ok(d.text>d.card*.65,JSON.stringify(d));assert.ok(d.height<230,JSON.stringify(d))}
  await assertNoOverflow()
  if(step===0){await evaluate('document.querySelector(".quiz-panel").scrollIntoView()');await screenshot(root+`quiz-fixed-${path}-${theme}-${width}-question.png`)}
  await click('.quiz-option input');await click('#quiz-next')
 }
 assert.ok(await evaluate('!!document.querySelector(".quiz-result-title")'));await assertNoOverflow()
 assert.equal(await evaluate('document.querySelector(".quiz-result-art").getBoundingClientRect().height'),0)
 assert.equal(await evaluate('!!document.querySelector(".quiz-score,.quiz-candidates")'),false)
 await evaluate('document.querySelector(".quiz-panel").scrollIntoView()');await screenshot(root+`quiz-fixed-${path}-${theme}-${width}-result.png`)
 await click('#quiz-edit');await evaluate('document.querySelector(".quiz-option input").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await wait(100);assert.ok(await evaluate('document.activeElement.matches("input[type=radio]")'))
}
// 200% layout equivalent: desktop 1225 CSS-pixel viewport reduced to 612, text doubled separately.
await navigate('/tools/pocket-companion');await viewport(612);await click('#quiz-start');await evaluate(`document.querySelector('.quiz-question-title').style.fontSize='64px';document.querySelectorAll('.quiz-option-copy').forEach(x=>{x.style.fontSize='32px';x.querySelector('small').style.fontSize='24px';x.querySelector('strong').textContent+=' 長い説明を折り返して表示します。\\n改行後の説明も確認します。';x.style.whiteSpace='pre-line'})`);await assertNoOverflow();await screenshot(root+'quiz-fixed-large-text.png')
finish();console.log('PASS: both quizzes all questions/results; light/dark 1225/768/375/320; text uses card width; keyboard; long multiline doubled text; no overflow/candidate disclosure')
