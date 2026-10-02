import assert from 'node:assert/strict'
import {tools} from '../src/tools/registry.ts'
import {navigate,evaluate,send,input,click,wait,viewport,assertNoOverflow,screenshot,finish} from './browser-client.mjs'
const root=(process.env.TEST_SCREENSHOT_DIR||process.env.TEMP||'.').replaceAll('\\','/')+'/'
const key=async(key,code,text)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code,...(text?{text}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code});await wait(100)}
await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Page.bringToFront');await viewport(320)
await navigate('/');await evaluate(`history.replaceState({...history.state,usr:null},'',location.href)`);await navigate('/')
const home='ぽけつる - ちょっと便利なWebツール集'
for(const theme of ['light','dark']){
 await navigate('/');await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child');await wait(500)
 for(const tool of tools){
  assert.equal(await evaluate('document.title'),home)
  await click(`.tool-card[data-tool-id="${tool.id}"] a`)
  assert.equal(await evaluate('document.title'),tool.name+' | ぽけつる')
  assert.equal(await evaluate('document.querySelector(\'meta[name="description"]\').content'),tool.description)
  assert.equal(await evaluate('document.querySelector("h1").textContent'),tool.name)
  const evidence=await evaluate(`(()=>{const visible=el=>el.getClientRects().length>0&&!el.closest('[aria-hidden="true"]')&&getComputedStyle(el).opacity!=='0';const controls=[...document.querySelectorAll('main input,main textarea,main select')].filter(visible);const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return {missing:controls.filter(el=>![...el.labels||[]].some(l=>l.textContent.trim())&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')).map(el=>el.outerHTML.slice(0,140)),broken:[...document.querySelectorAll('[aria-describedby],[aria-labelledby]')].flatMap(el=>([el.getAttribute('aria-describedby'),el.getAttribute('aria-labelledby')].filter(Boolean).join(' ').split(/\\s+/)).filter(id=>!document.getElementById(id))),duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),links:[...document.querySelectorAll('main a[href^="/"]')].map(el=>({path:el.getAttribute('href'),text:el.textContent.trim()})),intro:document.querySelector('.tool-header p')?.textContent}})()`)
  assert.deepEqual(evidence.missing,[],tool.id);assert.deepEqual(evidence.broken,[],tool.id);assert.deepEqual(evidence.duplicates,[],tool.id);assert.ok(evidence.intro?.trim(),tool.id)
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('label[for]')].filter(el=>!el.control).map(el=>el.htmlFor)`),[],tool.id+' visible label targets')
  for(const link of evidence.links){const target=tools.find(t=>t.path===link.path);assert.ok(link.path==='/'||target,tool.id+' '+link.path);if(target){assert.equal(link.text,target.name);await click(`main a[href="${target.path}"]`);assert.equal(await evaluate('document.title'),target.name+' | ぽけつる');await navigate(tool.path)}}
  await assertNoOverflow()
  await evaluate('document.querySelector(".tool-navigation a").focus()');await key('Tab',9);assert.equal(await evaluate('document.activeElement.classList.contains("detail-favorite")'),true);await key('Tab',9);assert.equal(await evaluate('document.activeElement.closest("main")!==null'),true);assert.equal(await evaluate('document.activeElement.matches(":focus-visible")'),true)
  await evaluate('document.querySelector(".tool-navigation a").focus()');await key('Enter',13,'\r');assert.equal(await evaluate('location.pathname'),'/');assert.equal(await evaluate('document.title'),home)
 }
}
// Both independent date/time panels, all input-validating tools, and quiz groups.
const cases=[
 ['duration-calculator','#duration-minutes-1','60','#duration-calculate','#duration-minutes-1'],['text-formatter','#text-format-input','x'.repeat(50001),null,'#text-format-input'],
 ['unit-price-comparison',null,null,'#price-calculate','#product-price-1'],['recipe-scaler',null,null,'#recipe-calculate','#ingredient-name-1'],
 ['unit-converter','#measurement-value','bad','#convert-units','#measurement-value'],['bill-splitter','#bill-people','0','#split-bill','#bill-people'],['roulette-picker','#roulette-candidates','one',null,'#roulette-candidates'],
 ['json-formatter','#json-input','{','.primary-button','#json-input'],['sql-in-generator',null,null,'.primary-button','#sql-in-input'],['timestamp-converter','#timestamp-input','bad','.primary-button','#timestamp-input'],
 ['timestamp-converter',null,null,'.converter-card:nth-child(2) .primary-button','#datetime-date-input-year'],
 ['url-encode-decode',null,null,'.primary-button','#url-encode-input'],['base64-encode-decode',null,null,'.primary-button','#base64-input'],['uuid-generator','#uuid-count-input','101','.primary-button','#uuid-count-input'],
 ['date-calculator',null,null,'.date-calculator-primary-button','#date-start-year'],['date-calculator',null,null,'.converter-card:nth-child(2) .date-calculator-primary-button','#base-date-year'],
 ['japanese-era-converter',null,null,'.primary-button','#gregorian-date-input-year'],['japanese-era-converter','#era-year-input','0','.converter-card:nth-child(2) .primary-button','#era-year-input'],
 ['qr-code-generator',null,null,'.primary-button','#qr-generator-input'],['ipv4-cidr',null,null,'.primary-button','#cidr-address'],['sha256','#hash-expected','bad','.primary-button','#hash-expected'],['radix-converter',null,null,'.primary-button','#radix-input'],['percentage-calculator',null,null,'.primary-button','#percentage-first'],
 ['image-resizer','#image-files',null,null,'#image-files'],['image-joiner','#image-files',null,null,'#image-files'],['holiday-style',null,null,'#quiz-next','.quiz-options'],['pocket-companion',null,null,'#quiz-next','.quiz-options']
]
for(const theme of ['light','dark']){
 await navigate('/');await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child')
 for(const [id,selector,value,button,target] of cases){
  await navigate('/tools/'+id)
  if(id==='holiday-style'||id==='pocket-companion')await click('#quiz-start')
  if(selector==='#image-files'){await evaluate(`(()=>{const d=new DataTransfer();d.items.add(new File(['bad'],'bad.png',{type:'image/png'}));const el=document.querySelector('#image-files');el.files=d.files;el.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(200)}else if(selector)await input(selector,value)
  if(button)await click(button)
  const refs=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(target)});return (el.getAttribute('aria-describedby')||'').split(/\\s+/).filter(Boolean).map(id=>({id,exists:!!document.getElementById(id),alert:document.getElementById(id)?.getAttribute('role')==='alert',text:document.getElementById(id)?.textContent}));})()`)
  assert.ok(refs.some(ref=>ref.alert&&ref.text),id+' '+target);assert.ok(refs.every(ref=>ref.exists),id);await assertNoOverflow()
  if(['uuid-generator','duration-calculator','date-calculator','json-formatter'].includes(id)){await wait(500);await evaluate(`document.querySelector(${JSON.stringify(target)}).scrollIntoView({block:'center',behavior:'instant'})`);await screenshot(root+'clarity-'+id+'-'+theme+target.replaceAll(/[^a-z]/gi,'')+'.png')}
 }
}
// Error description is exposed in Edge's accessibility tree, not just present in HTML.
await navigate('/tools/json-formatter');await input('#json-input','{');await click('.primary-button');const tree=await send('Accessibility.getFullAXTree');const field=tree.nodes.find(node=>!node.ignored&&node.role?.value==='textbox'&&node.name?.value==='Input');assert.ok(field?.description?.value.includes('JSONの解析に失敗しました'))
await input('#json-input','{}');assert.equal(await evaluate('document.querySelector("#json-input").hasAttribute("aria-describedby")'),false)
await navigate('/tools/date-calculator');await click('#date-start-label');assert.equal(await evaluate('document.activeElement.id'),'date-start-year');const dates=await send('Accessibility.getFullAXTree');assert.ok(dates.nodes.some(node=>!node.ignored&&node.role?.value==='group'&&node.name?.value==='開始日'));assert.ok(dates.nodes.some(node=>!node.ignored&&node.role?.value==='group'&&node.name?.value==='終了日'))
await navigate('/tools/not-real');assert.equal(await evaluate('document.title'),'ページが見つかりません | ぽけつる');await navigate('/');assert.equal(await evaluate('document.title'),home)
finish();console.log('PASS: '+tools.length*2+' SPA routes/back/keyboard/light-dark320 checks; real related links; labels and descriptions; 54 input-error/group relationships; Edge AX error description; home/not-found restoration')
