import assert from 'node:assert/strict'
import {navigate,evaluate,send,click,viewport,screenshot,assertNoOverflow,finish,wait} from './browser-client.mjs'
const root=(process.env.TEMP || '.').replaceAll('\\','/')+'/poketsuru-review-';
for(const theme of ['light','dark']){
 await viewport(1280);await navigate('/');await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child');await wait(500);await screenshot(root+`home-${theme}.png`);await assertNoOverflow();
 await viewport(320);await screenshot(root+`mobile-${theme}.png`);await assertNoOverflow();
 for(const [id,title] of [['holiday-style','インドア派'],['pocket-companion','計画型']]){
  await navigate('/tools/'+id);await evaluate(`document.documentElement.dataset.theme='${theme}'`);
  const safe=async()=>assert.equal(await evaluate(`/配点|合計が|同点|紹介順|1点|コンパス|相棒|アウトドア派|実践型/.test(document.body.innerText)`),false);
  await safe();await click('#quiz-start');await click('input[value="a"]');await click('#quiz-next');await click('#quiz-back');assert.equal(await evaluate('document.querySelector("input[value=a]").checked'),true);
  for(let i=0;i<5;i++){await click('input[value="a"]');await click('#quiz-next')}
  assert.equal(await evaluate('document.querySelector(".quiz-result-title").textContent'),title);await safe();await assertNoOverflow();await screenshot(root+`${id}-${theme}.png`);
  await send('Browser.grantPermissions',{permissions:['clipboardReadWrite','clipboardSanitizedWrite'],origin:'http://127.0.0.1:5173'});await click('#quiz-copy');const copied=await evaluate('navigator.clipboard.readText()');assert.ok(copied.includes(title));assert.ok(!/手がかり|同点|配点|1点/.test(copied));
  await click('#quiz-edit');await click('input[value="b"]');for(let i=0;i<5;i++){if(i)await click('input[value="b"]');await click('#quiz-next')};assert.ok(await evaluate('!!document.querySelector(".quiz-result-title")'));await click('#quiz-restart');assert.ok(await evaluate('!!document.querySelector("#quiz-start")'));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.ok(await evaluate('document.activeElement.tagName!=="BODY"'));
 }
}
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await navigate('/');assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'),'auto');finish();console.log('PASS: themes, 320px, quiz back/edit/reset/copy, spoiler absence, keyboard, reduced motion');
