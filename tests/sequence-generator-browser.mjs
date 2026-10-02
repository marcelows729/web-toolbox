import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {navigate,evaluate,send,wait,click,input,viewport,assertNoOverflow,screenshot,finish,requests} from './browser-client.mjs'
const value=id=>evaluate(`document.querySelector('#sequence-${id}').value`)
const output=()=>value('output')
const fill=async patch=>{for(const [field,v]of Object.entries(patch))await input('#sequence-'+field,v)}
const paste=async(field,text)=>{await evaluate(`(()=>{const e=document.querySelector('#sequence-${field}'),data=new DataTransfer();data.setData('text/plain',${JSON.stringify(text)});e.setSelectionRange(0,e.value.length);e.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}))})()`);await wait(50)}
const key=async(k,code)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:k,windowsVirtualKeyCode:code,...(k==='Enter'?{text:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:k,windowsVirtualKeyCode:code});await wait(50)}
export async function checkSequenceGenerator(){
 await send('Emulation.setFocusEmulationEnabled',{enabled:true})
 await send('Browser.grantPermissions',{origin:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',permissions:['clipboardReadWrite','clipboardSanitizedWrite']})
 for(const theme of ['light','dark'])for(const width of [320,375,768,1280]){
  await viewport(width);await navigate('/tools/sequence-generator');await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child');assert.equal(await output(),'');assert.equal(await evaluate(`document.querySelector('#sequence-copy').disabled`),true)
  await evaluate(`document.querySelector('#sequence-start').focus()`);await key('Tab',9);assert.equal(await evaluate('document.activeElement.id'),'sequence-count')
  await fill({count:'3',width:'3',prefix:'受付-',suffix:'.jpg'});await evaluate(`document.querySelector('#sequence-run').focus()`);await key('Enter',13);assert.equal(await output(),'受付-001.jpg\n受付-002.jpg\n受付-003.jpg')
  await click('#sequence-copy');assert.equal(await evaluate("navigator.clipboard.readText().then(text=>text.replace(/\\r\\n/g,'\\n'))"),await output());assert.equal(await evaluate(`document.querySelector('.text-format-status').textContent`),'コピーしました')
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');await screenshot((process.env.TEST_SCREENSHOT_DIR||process.env.TEMP||'.')+'/sequence-'+theme+'-'+width+'.png');await assertNoOverflow()
  await input('#sequence-start','-1');assert.equal(await output(),'');assert.equal(await evaluate(`document.querySelector('.text-format-status').textContent`),'');await click('#sequence-run');assert.equal(await output(),'受付--001.jpg\n受付-000.jpg\n受付-001.jpg')
  // Pending copy keeps its click-time payload, but cannot restore stale feedback/output.
  await evaluate(`window.nativeSequenceWrite=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=text=>new Promise((resolve,reject)=>{window.sequencePayload=text;window.resolveSequenceCopy=resolve;window.rejectSequenceCopy=reject})`)
  await click('#sequence-copy');const prior=await output();assert.equal(await evaluate('window.sequencePayload'),prior);await input('#sequence-count','2');await evaluate('window.resolveSequenceCopy()');await wait(50);assert.equal(await output(),'');assert.equal(await evaluate(`document.querySelector('.text-format-status').textContent`),'')
  await click('#sequence-run');await click('#sequence-copy');await click('#sequence-run');await evaluate(`window.rejectSequenceCopy(new Error('denied'))`);await wait(50);assert.equal(await output(),'受付--001.jpg\n受付-000.jpg');assert.equal(await evaluate(`!!document.querySelector('#sequence-error')`),false)
  await evaluate('navigator.clipboard.writeText=window.nativeSequenceWrite');await click('#sequence-clear');assert.equal(await output(),'');assert.equal(await value('start'),'1');assert.equal(await evaluate('document.activeElement.id'),'sequence-start')
  console.log('PASS sequence '+theme+' '+width+' keyboard/copy/stale results')
 }
 await fill({start:'－２',count:'５',step:'＋１',width:'３'});await click('#sequence-run');assert.equal(await output(),'-002\n-001\n000\n001\n002')
 await fill({start:'9007199254740991',count:'3',step:'1',width:''});await click('#sequence-run');assert.equal(await output(),'9007199254740991\n9007199254740992\n9007199254740993')
 await fill({start:'-1',count:'10000',width:'9'});const began=Date.now();await click('#sequence-run');assert.equal((await output()).length,100000);assert.ok(Date.now()-began<3000,'bounded maximum input completes');await assertNoOverflow();await input('#sequence-start','-2');await click('#sequence-run');assert.match(await evaluate(`document.querySelector('#sequence-error').textContent`),/100,000/);assert.equal(await output(),'')
 for(const [field,bad]of [['count','10001'],['start','1.5'],['step','1e3'],['width','21']]){await click('#sequence-clear');await input('#sequence-'+field,bad);await click('#sequence-run');assert.equal(await output(),'');assert.ok(await evaluate(`!!document.querySelector('#sequence-error')`))}
 await click('#sequence-clear');await click('#sequence-run');for(const [field,text]of [['start','1'.repeat(33)],['prefix','x'.repeat(101)],['suffix','a\nb']]){const old=await value(field);await paste(field,text);assert.equal(await value(field),old);assert.equal(await output(),'');assert.equal(await evaluate(`document.querySelector('#sequence-run').disabled`),true);await click('#sequence-clear')}
 await input('#sequence-prefix','private-sequence-marker');await click('#sequence-run');assert.equal(await evaluate(`JSON.stringify(localStorage).includes('private-sequence-marker')||JSON.stringify(sessionStorage).includes('private-sequence-marker')||location.search!==''`),false);assert.equal(requests.some(r=>(r.url+r.body).includes('private-sequence-marker')),false)
 await evaluate(`navigator.clipboard.writeText=()=>Promise.reject(new Error('denied'))`);await click('#sequence-copy');assert.match(await evaluate(`document.querySelector('#sequence-error').textContent`),/手動/);assert.ok((await output()).includes('private-sequence-marker'));await evaluate('navigator.clipboard.writeText=window.nativeSequenceWrite')
 if(await evaluate("document.querySelector('.detail-favorite').getAttribute('aria-pressed')")!=='true')await click('.detail-favorite');await click('.tool-navigation a');await input('#tool-search','連番');assert.ok(await evaluate(`!!document.querySelector('.tool-card[data-tool-id="sequence-generator"]')`));await click('.tool-card[data-tool-id="sequence-generator"] a');assert.equal(await output(),'');assert.equal(await value('prefix'),'');assert.equal(await evaluate(`document.querySelector('.detail-favorite').getAttribute('aria-pressed')`),'true')
 console.log('PASS sequence boundaries/fullwidth/exact integer/paste rejection/privacy/favorite and fresh entry')
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){await checkSequenceGenerator();finish()}
