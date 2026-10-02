import assert from 'node:assert/strict'
import {navigate,evaluate,send,wait,click,viewport,assertNoOverflow,screenshot,finish} from './browser-client.mjs'
const root=(process.env.TEST_SCREENSHOT_DIR||process.env.TEMP||'.').replaceAll('\\','/')+'/'
const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const rgb=s=>s.match(/[\d.]+/g).map(Number).slice(0,3)
let minText=Infinity,minFocus=Infinity
await navigate('/');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0})
for(const theme of ['light','dark'])for(const width of [320,375,768,1280]){
 await viewport(width);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child')
 const document=await send('DOM.getDocument')
 for(const id of ['home-characters','home-images','home-datetime']){
  const {nodeId}=await send('DOM.querySelector',{nodeId:document.root.nodeId,selector:'#'+id})
  for(const state of ['normal','hover','focus-visible','active','hover-focus']){
   const forcedPseudoClasses=state==='normal'?[]:state==='hover-focus'?['hover','focus','focus-visible']:state==='focus-visible'?['focus','focus-visible']:state==='active'?['hover','active']:[state]
   await send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses});await wait(300)
   const colors=await evaluate(`(()=>{const e=document.getElementById('${id}');const css=getComputedStyle(e);let bg=e;while(getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)'&&bg.parentElement)bg=bg.parentElement;return {background:getComputedStyle(bg).backgroundColor,foreground:[getComputedStyle(e.querySelector('strong')).color,getComputedStyle(e.querySelector('small')).color,getComputedStyle(e.lastElementChild).color],outline:css.outlineColor,outlineWidth:css.outlineWidth,outlineStyle:css.outlineStyle}})()`)
   for(const color of colors.foreground){const contrast=ratio(rgb(color),rgb(colors.background));minText=Math.min(minText,contrast);assert.ok(contrast>=4.5,theme+' '+width+' '+id+' '+state+' text contrast '+contrast.toFixed(2)+' '+JSON.stringify(colors))}
   if(state.includes('focus')){const contrast=ratio(rgb(colors.outline),rgb(colors.background));minFocus=Math.min(minFocus,contrast);assert.ok(contrast>=3);assert.equal(colors.outlineStyle,'solid');assert.equal(colors.outlineWidth,'3px')}
   await assertNoOverflow()
   if(id==='home-datetime'&&(width===320||width===1280)&&state!=='normal'){await evaluate('window.scrollTo({top:0,behavior:"instant"})');await screenshot(root+'home-state-'+theme+'-'+width+'-'+state+'.png')}
  }
  await send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]})
 }
}
// Real pointer hover must also preserve the measured label/description colours.
await viewport(1280);const point=await evaluate(`(()=>{const r=document.querySelector('#home-datetime').getBoundingClientRect();return {x:r.x+20,y:r.y+20}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});assert.equal(await evaluate(`document.querySelector('#home-datetime').matches(':hover')`),true);await wait(300)
const real=await evaluate(`getComputedStyle(document.querySelector('#home-datetime')).backgroundColor`);assert.equal(real,'rgb(27, 43, 69)')
finish();console.log('PASS: 3 entries x 2 themes x 4 widths x 5 states; minimum text/arrow '+minText.toFixed(2)+':1, focus '+minFocus.toFixed(2)+':1; real pointer hover')
