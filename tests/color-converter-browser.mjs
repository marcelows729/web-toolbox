import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { navigate, evaluate, send, wait, click, input, viewport, screenshot, assertNoOverflow, finish, requests } from './browser-client.mjs'
const formats=['hex','rgb','hsl']
const output=()=>evaluate(`['hex','rgb','hsl'].map(format=>document.querySelector('#color-output-'+format).value)`)
const status=()=>evaluate(`document.querySelector('.calculation-status').textContent`)
const key=async(key,code,text)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code,...(text?{text}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code});await wait(60)}
const blank=async()=>{assert.deepEqual(await output(),['','','']);assert.equal(await evaluate(`['hex','rgb','hsl'].every(format=>document.querySelector('#color-copy-'+format).disabled)`),true);assert.equal(await evaluate(`!!document.querySelector('#color-swatch')`),false)}
const fillHsl=async(h,s,l)=>{for(const[field,value]of[['h',h],['s',s],['l',l]])await input('#color-'+field,String(value))}
const pauseCopy=()=>evaluate(`window.nativeColorWrite??=navigator.clipboard.writeText.bind(navigator.clipboard);window.pendingColorCopies=[];navigator.clipboard.writeText=text=>new Promise((resolve,reject)=>window.pendingColorCopies.push({text,resolve,reject}))`)
const resumeCopy=()=>evaluate(`navigator.clipboard.writeText=window.nativeColorWrite`)
const contrast=async selector=>evaluate(`(()=>{const style=getComputedStyle(document.querySelector(${JSON.stringify(selector)}));const linear=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};const luminance=color=>{const channels=color.match(/[\\d.]+/g).slice(0,3).map(Number).map(linear);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};const a=luminance(style.color),b=luminance(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)})()`)

export async function checkColorConverter(){
  await send('Emulation.setFocusEmulationEnabled',{enabled:true})
  await send('Browser.grantPermissions',{origin:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',permissions:['clipboardReadWrite','clipboardSanitizedWrite']})
  for(const theme of ['light','dark'])for(const width of [320,375,768,1280]){
    await viewport(width);await navigate('/tools/color-converter');await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child');await blank()
    await input('#color-hex','＃２５６３ｅｂ');await evaluate(`document.querySelector('#color-hex').focus()`);await key('Enter',13,'\r');assert.deepEqual(await output(),['#2563EB','rgb(37, 99, 235)','hsl(221.2121, 83.1933%, 53.3333%)'])
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('#color-swatch')).backgroundColor`),'rgb(37, 99, 235)')
    for(const format of formats){await click('#color-copy-'+format);assert.equal(await evaluate('navigator.clipboard.readText()'),(await output())[formats.indexOf(format)]);assert.equal(await status(),format.toUpperCase()+'をコピーしました')}
    await input('#color-hex','#fff');await blank();assert.equal(await status(),'入力して「変換する」を押してください。');await click('#color-convert');assert.equal((await output())[0],'#FFFFFF')
    await input('#color-hex','#000');await click('#color-convert');assert.equal((await output())[0],'#000000');await assertNoOverflow()
    await click('#color-format-rgb');await blank();assert.equal(await evaluate(`document.querySelector('#color-format-rgb').getAttribute('aria-pressed')`),'true')
    for(const[field,value]of[['r','255'],['g','0'],['b','0']])await input('#color-'+field,value)
    await evaluate(`document.querySelector('#color-b').focus()`);await key('Tab',9);assert.equal(await evaluate('document.activeElement.id'),'color-convert');assert.ok(await evaluate(`getComputedStyle(document.activeElement).outlineStyle!=='none'`));await key('Enter',13,'\r');assert.equal((await output())[0],'#FF0000')
    await click('#color-format-hsl');await blank();await fillHsl('-120','100','50');await click('#color-convert');assert.deepEqual(await output(),['#0000FF','rgb(0, 0, 255)','hsl(240, 100%, 50%)']);await assertNoOverflow()
    assert.ok(await contrast('#color-convert')>=4.5);assert.ok(await contrast('#color-format-hsl')>=4.5)
    await evaluate(`document.querySelector('#color-convert').scrollIntoView({block:'center',behavior:'instant'})`);const {root}=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'#color-convert'});const {model}=await send('DOM.getBoxModel',{nodeId});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:(model.content[0]+model.content[2])/2,y:(model.content[1]+model.content[5])/2});assert.ok(await contrast('#color-convert')>=4.5)
    await screenshot((process.env.TEST_SCREENSHOT_DIR||process.env.TEMP||'.')+'/color-'+theme+'-'+width+'.png')
    if(width===320){await evaluate(`document.querySelector('#color-result-title').scrollIntoView({block:'start',behavior:'instant'})`);await screenshot((process.env.TEST_SCREENSHOT_DIR||process.env.TEMP||'.')+'/color-output-'+theme+'-320.png')}
    await pauseCopy();await click('#color-copy-hex');await input('#color-h','0');await evaluate('window.pendingColorCopies[0].resolve()');await wait(50);await blank();assert.equal(await status(),'入力して「変換する」を押してください。')
    await click('#color-convert');await click('#color-copy-rgb');await click('#color-convert');await evaluate(`window.pendingColorCopies[1].reject(new Error('denied'))`);await wait(50);assert.equal(await status(),'変換しました。');assert.equal(await evaluate(`!!document.querySelector('#color-error')`),false)
    await click('#color-copy-hex');await click('#color-copy-hsl');await evaluate(`window.pendingColorCopies[3].resolve();window.pendingColorCopies[2].reject(new Error('late'))`);await wait(50);assert.equal(await status(),'HSLをコピーしました')
    await click('#color-copy-rgb');await click('#color-reset');await evaluate('window.pendingColorCopies[4].resolve()');await wait(50);await blank();assert.equal(await evaluate('document.activeElement.id'),'color-hex');assert.equal(await evaluate(`document.querySelector('#color-hex').value`),'');await resumeCopy()
    console.log('PASS color '+theme+' '+width+' HEX/RGB/HSL/keyboard/focus/hover/contrast/copy/edit/races/reset')
  }
  for(const invalid of ['','　','#12','#1234','#12345678','#ggg','rgb(0,0,0)']){await input('#color-hex',invalid);await click('#color-convert');await blank();assert.ok(await evaluate(`!!document.querySelector('#color-error[role=alert]')`))}
  await click('#color-format-rgb');for(const[field,value]of[['r','37'],['g','99'],['b','235']])await input('#color-'+field,value)
  for(const value of ['','256','-1','1.5','1e2','NaN']){await input('#color-r',value);await click('#color-convert');await blank();assert.ok(await evaluate(`!!document.querySelector('#color-error')`))}
  await click('#color-format-hsl');for(const [h,s,l,code]of [['720','100','50','#FF0000'],['0','0','50','#808080'],['359.999999','100','50','#FF0000']]){await fillHsl(h,s,l);await click('#color-convert');assert.equal((await output())[0],code)}
  for(const [h,s,l]of [['360001','50','50'],['0','101','50'],['0','50','-1'],['0','0.1234567','50'],['','50','50']]){await fillHsl(h,s,l);await click('#color-convert');await blank();assert.ok(await evaluate(`!!document.querySelector('#color-error')`))}
  await click('#color-format-hex');await input('#color-hex','#19A7D3');await click('#color-convert');assert.equal(await evaluate(`JSON.stringify(localStorage).includes('19A7D3')||JSON.stringify(sessionStorage).includes('19A7D3')||location.search!==''`),false);assert.equal(requests.some(request=>(request.url+request.body).includes('19A7D3')),false)
  await pauseCopy();await evaluate(`navigator.clipboard.writeText=()=>Promise.reject(new Error('denied'))`);await click('#color-copy-hex');assert.match(await status(),/手動/);assert.equal((await output())[0],'#19A7D3');await evaluate('navigator.clipboard.writeText=undefined');await click('#color-copy-hsl');assert.match(await status(),/手動/);await resumeCopy()
  await pauseCopy();await click('#color-copy-hex');await click('.tool-navigation a');await evaluate('window.pendingColorCopies[0].resolve()');await wait(50);await input('#tool-search','色変換');assert.ok(await evaluate(`!!document.querySelector('.tool-card[data-tool-id="color-converter"]')`));await click('.tool-card[data-tool-id="color-converter"] a');await blank();assert.ok(!(await status()).includes('コピーしました'));await resumeCopy()
  if(await evaluate(`document.querySelector('.detail-favorite').getAttribute('aria-pressed')`)!=='true')await click('.detail-favorite');await click('.tool-navigation a');await input('#tool-search','カラー');assert.ok(await evaluate(`!!document.querySelector('.tool-card[data-tool-id="color-converter"]')`));await click('.tool-card[data-tool-id="color-converter"] a');await blank();assert.equal(await evaluate(`document.querySelector('.detail-favorite').getAttribute('aria-pressed')`),'true');assert.ok(await evaluate(`JSON.parse(localStorage.getItem('poketsuru-tool-shelf-v1')).recent.includes('color-converter')`))
  console.log('PASS color invalid/boundaries/clipboard rejected-unavailable/unmount/privacy/search/favorite/recent/fresh entry')
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){await checkColorConverter();finish()}
