import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import {navigate,click,evaluate,send,wait,viewport,assertNoOverflow,finish} from './browser-client.mjs'

const dimensions = () => evaluate(`([...document.querySelectorAll('.quiz-option')].map(x=>({card:x.getBoundingClientRect().width,text:x.querySelector('.quiz-option-copy')?.getBoundingClientRect().width,label:x.querySelector('strong')?.textContent.trim(),detail:x.querySelector('small')?.textContent.trim()})))`)
const assertTextWidth = (cards, context) => {
 assert.equal(cards.length,4,`${context}: all choices rendered`)
 for(const d of cards) {
  assert.ok(d.label && d.detail,`${context}: label and explanation present`)
  // Relative width catches the abandoned 28px number column without font/line-height assumptions.
  assert.ok(d.text>d.card*.65,`${context}: choice text must use remaining card width ${JSON.stringify(d)}`)
 }
}

export async function checkQuizLayout() {
 let questions=0, mutationChecks=0
 for(const path of ['pocket-companion','holiday-style']) for(const theme of ['light','dark']) for(const width of [1225,768,375,320]) {
  await navigate('/tools/'+path);await viewport(width);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child');await click('#quiz-start')
  for(let step=0;step<5;step++) {
   const context=`${path} ${theme} ${width}px question ${step+1}`
   assertTextWidth(await dimensions(),context);await assertNoOverflow();questions++
   if(step===0) {
    // Mutate only this page's CSS, then always remove it. Source/build remain untouched.
    await evaluate(`(()=>{const s=document.createElement('style');s.id='quiz-width-negative-control';s.textContent='.quiz-option {grid-template-columns:18px 28px minmax(0,1fr) !important}';document.head.append(s)})()`)
    const negativeCards=await dimensions()
    try { assert.throws(()=>assertTextWidth(negativeCards,context),/choice text must use remaining card width/) }
    finally { await evaluate('document.querySelector("#quiz-width-negative-control").remove()') }
    assertTextWidth(await dimensions(),context+' restored');mutationChecks++
   }
   await click('.quiz-option input');await click('#quiz-next')
  }
  assert.ok(await evaluate('!!document.querySelector(".quiz-result-title")'));await assertNoOverflow()
  assert.equal(await evaluate('document.querySelector(".quiz-result-art").getBoundingClientRect().height'),0)
  assert.equal(await evaluate('!!document.querySelector(".quiz-score,.quiz-candidates")'),false)
  await click('#quiz-edit');await evaluate('document.querySelector(".quiz-option input").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await wait(100);assert.ok(await evaluate('document.activeElement.matches("input[type=radio]")'))
 }
 console.log(`PASS: quiz text width: ${questions} question layouts, ${mutationChecks} rejected 28px-column controls; both quizzes/light/dark/1225/768/375/320`)
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) { await checkQuizLayout();finish() }
