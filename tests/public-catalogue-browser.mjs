import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {tools} from '../src/tools/registry.ts'
import {categoryLabels} from '../src/types/tool.ts'
import {SITE_ORIGIN,cataloguePaths} from '../scripts/sync-catalogue.mjs'
import {navigate,evaluate,click,viewport,assertNoOverflow,screenshot,finish} from './browser-client.mjs'
export async function checkPublicCatalogue(){
 await navigate('/');assert.equal(await evaluate('document.querySelector(".hero-facts strong").textContent'),String(tools.length));assert.equal(await evaluate('document.querySelectorAll(".tool-card").length'),tools.length)
 const labels=await evaluate('[...document.querySelectorAll(".category-filter")].map(el=>el.textContent)');for(const category of new Set(tools.map(tool=>tool.category)))assert.ok(labels.includes(categoryLabels[category]))
 const xml=await evaluate('(async()=>{const r=await fetch("/sitemap.xml"),text=await r.text(),doc=new DOMParser().parseFromString(text,"application/xml");return {status:r.status,type:r.headers.get("content-type"),errors:doc.querySelectorAll("parsererror").length,urls:[...doc.querySelectorAll("loc")].map(el=>el.textContent)}})()');assert.equal(xml.status,200);assert.match(xml.type,/xml/);assert.equal(xml.errors,0);assert.deepEqual(xml.urls,cataloguePaths(tools).map(path=>SITE_ORIGIN+path));const robots=await evaluate('(async()=>{const r=await fetch("/robots.txt");return {status:r.status,type:r.headers.get("content-type"),body:await r.text()}})()');assert.equal(robots.status,200);assert.match(robots.type,/text\/plain/);assert.equal(robots.body.trim(),'Sitemap: '+SITE_ORIGIN+'/sitemap.xml')
 const mismatch=[];let checked=0
 for(const tool of tools){await navigate(tool.path);const data=await evaluate('({title:document.title,heading:document.querySelector(".tool-header h1")?.textContent,links:[...document.querySelectorAll("a[href]")].map(a=>new URL(a.getAttribute("href"),location.href)).filter(url=>url.origin===location.origin&&url.pathname.startsWith("/tools/")).map(url=>url.pathname)})');if(data.heading?.replace(/\s/g,'')!==tool.name.replace(/\s/g,''))mismatch.push({path:tool.path,name:tool.name,heading:data.heading});assert.equal(data.title,tool.name+' | ぽけつる');for(const path of data.links)assert.ok(tools.some(entry=>entry.path===path),tool.path+': '+path);checked++}
 assert.deepEqual(mismatch,[],'Visible tool names match registry')
 for(const theme of ['light','dark']){await navigate('/');await viewport(320);await click(theme==='light'?'.theme-option:first-child':'.theme-option:last-child');await assertNoOverflow();assert.equal(await evaluate('document.querySelectorAll(".tool-card").length'),tools.length);if(process.env.TEST_SCREENSHOT_DIR){await evaluate('document.querySelector(".results-heading").scrollIntoView({block:"start",behavior:"instant"})');await screenshot(process.env.TEST_SCREENSHOT_DIR+'/public-catalogue-'+theme+'-320.png')}}
 console.log('PASS: XML parsed with '+xml.urls.length+' URLs; text/plain robots; home count/categories; '+checked+' names/titles/internal-link targets; light-dark320')
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){await checkPublicCatalogue();finish()}
