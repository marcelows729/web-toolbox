import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tools } from '../src/tools/registry.ts'
import { categoryLabels } from '../src/types/tool.ts'
import { cataloguePaths, renderSitemap, renderCatalogue, renderReadme, SITE_ORIGIN, START, END, syncCatalogue } from '../scripts/sync-catalogue.mjs'
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n')

test('公開一覧: sitemap/READMEがレジストリに同期、公開URLを重複なく掲載',async()=>{
 await syncCatalogue(true)
 const xml=read('public/sitemap.xml'),urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1])
 assert.deepEqual(urls,cataloguePaths(tools).map(path=>SITE_ORIGIN+path));assert.equal(urls.length,tools.length+1);assert.equal(new Set(urls).size,urls.length)
 assert.match(xml,/xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);assert.doesNotMatch(xml,/lastmod|changefreq|priority|example|localhost|127\.0\.0\.1/)
})
test('公開一覧: 全登録の明示ルートと双方向に一致、旧URLも欠落しない',()=>{
 const app=read('src/App.tsx'),paths=[...app.matchAll(/<Route path="(\/tools\/[^" ]+)"/g)].map(m=>m[1]);assert.deepEqual([...paths].sort(),tools.map(tool=>tool.path).sort());assert.equal(new Set(paths).size,paths.length)
})
test('公開一覧: 全カテゴリ・現在名・リンク・件数をREADMEへ掲載',()=>{
 const catalogue=renderCatalogue(),readme=read('README.md');assert.ok(readme.includes(catalogue));assert.ok(catalogue.includes('公開ツール：'+tools.length+'件'));assert.ok(catalogue.includes('カテゴリ：'+new Set(tools.map(tool=>tool.category)).size+'種類'))
 for(const tool of tools){assert.ok(catalogue.includes('['+tool.name+']('+SITE_ORIGIN+tool.path+')'));assert.ok(tool.category in categoryLabels)}
 const links=[...readme.matchAll(/\/tools\/[a-z0-9-]+/g)].map(m=>m[0]);for(const path of links)assert.ok(tools.some(tool=>tool.path===path),path)
})
test('公開一覧: 追加・削除が生成物に反映され、架空更新日は作らない',()=>{
 const future={...tools[0],id:'future-check',path:'/tools/future-check',name:'追加確認'},added=[...tools,future]
 assert.ok(renderSitemap(added).includes(SITE_ORIGIN+future.path));assert.ok(renderCatalogue(added).includes('公開ツール：'+(tools.length+1)+'件'))
 assert.ok(!renderSitemap(tools.slice(1)).includes(SITE_ORIGIN+tools[0].path+'</loc>'));assert.ok(renderCatalogue(tools.slice(1)).includes('公開ツール：'+(tools.length-1)+'件'))
})
test('公開一覧: 重複・仮URL・クエリ・未知カテゴリを拒否',()=>{
 for(const path of ['https://example.com/tools/tool','/tools/tool?input=1','/tools/../tool','/tools/TOOL','/','/tools/tool/'])assert.throws(()=>renderSitemap([{...tools[0],path}]))
 assert.throws(()=>renderSitemap([tools[0],{...tools[1],path:tools[0].path}]),/Duplicate/);assert.throws(()=>renderSitemap([tools[0],{...tools[1],id:tools[0].id}]),/Duplicate/);for(const category of ['missing','constructor','__proto__'])assert.throws(()=>renderSitemap([{...tools[0],category}]),/metadata/)
})
test('公開一覧: READMEの手書き案内保持・冪等・壊れたマーカー拒否',()=>{
 const base='手書きの案内\n',result=renderReadme(base);assert.ok(result.startsWith(base));assert.equal(renderReadme(result),result)
 const manual='前\n'+START+'\n古い一覧\n'+END+'\n後\n',updated=renderReadme(manual);assert.ok(updated.startsWith('前\n'));assert.ok(updated.endsWith('\n後\n'));assert.doesNotMatch(updated,/古い一覧/)
 for(const bad of [START,END,END+START,START+START+END])assert.throws(()=>renderReadme(bad),/markers/)
})
test('公開一覧: robotsはSitemap案内だけ、許可・禁止ポリシーを追加しない',()=>{
 assert.equal(read('public/robots.txt'),'Sitemap: '+SITE_ORIGIN+'/sitemap.xml\n');assert.doesNotMatch(read('public/robots.txt'),/User-agent|Allow:|Disallow:/i)
})
test('公開一覧: ソース内の固定ツールリンクに存在しないURLがない',()=>{
 const root=fileURLToPath(new URL('../src/',import.meta.url));const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(dir,entry.name)):/\.tsx?$/.test(entry.name)?[join(dir,entry.name)]:[])
 for(const file of walk(root)){const source=readFileSync(file,'utf8');for(const match of source.matchAll(/(?:to|href)\s*=\s*["'](\/tools\/[^"']+)["']/g))assert.ok(tools.some(tool=>tool.path===match[1]),file+': '+match[1])}
})
