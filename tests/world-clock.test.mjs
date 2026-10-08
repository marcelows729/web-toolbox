import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {MemoryRouter} from 'react-router-dom'
import {addWorldCity,initialWorldCities,MAX_WORLD_CITIES,removeWorldCity,WORLD_CITIES,worldClockSnapshot,worldClockText} from '../src/tools/world-clock/clock.ts'
import {tools} from '../src/tools/registry.ts'
import {filterToolList} from '../src/utils/toolSearch.ts'
import {parseShelf} from '../src/state/toolShelf.ts'
const row=(id,iso)=>worldClockSnapshot(['tokyo','utc',...(!['tokyo','utc'].includes(id)?[id]:[])],Date.parse(iso)).rows.find(row=>row.city.id===id)
const time=(id,iso)=>{const value=row(id,iso);return [value.date,value.weekday,value.time,value.offset]}
test('世界時計: 7地域の夏冬オフセット・日本語曜日・24時間表示',()=>{
 const winters={'tokyo':['21:34:56','UTC+09:00'],'utc':['12:34:56','UTC+00:00'],'new-york':['07:34:56','UTC-05:00'],'los-angeles':['04:34:56','UTC-08:00'],'london':['12:34:56','UTC+00:00'],'paris':['13:34:56','UTC+01:00'],'sydney':['23:34:56','UTC+11:00']}
 const summers={'tokyo':['21:34:56','UTC+09:00'],'utc':['12:34:56','UTC+00:00'],'new-york':['08:34:56','UTC-04:00'],'los-angeles':['05:34:56','UTC-07:00'],'london':['13:34:56','UTC+01:00'],'paris':['14:34:56','UTC+02:00'],'sydney':['22:34:56','UTC+10:00']}
 for(const city of WORLD_CITIES){assert.deepEqual(time(city.id,'2026-01-15T12:34:56Z'),['2026-01-15','木',...winters[city.id]]);assert.deepEqual(time(city.id,'2026-07-15T12:34:56Z'),['2026-07-15','水',...summers[city.id]])}
})
test('世界時計: 米国のDST開始/終了で欠ける時刻と繰返す時刻をIntlで扱う',()=>{
 assert.deepEqual(time('new-york','2026-03-08T06:59:59Z'),['2026-03-08','日','01:59:59','UTC-05:00']);assert.deepEqual(time('new-york','2026-03-08T07:00:00Z'),['2026-03-08','日','03:00:00','UTC-04:00'])
 assert.deepEqual(time('new-york','2026-11-01T05:59:59Z'),['2026-11-01','日','01:59:59','UTC-04:00']);assert.deepEqual(time('new-york','2026-11-01T06:00:00Z'),['2026-11-01','日','01:00:00','UTC-05:00'])
 assert.equal(row('los-angeles','2026-03-08T09:59:59Z').offset,'UTC-08:00');assert.equal(row('los-angeles','2026-03-08T10:00:00Z').offset,'UTC-07:00')
})
test('世界時計: 欧州と南半球のDST境界',()=>{
 assert.deepEqual(time('london','2026-03-29T00:59:59Z'),['2026-03-29','日','00:59:59','UTC+00:00']);assert.deepEqual(time('london','2026-03-29T01:00:00Z'),['2026-03-29','日','02:00:00','UTC+01:00'])
 assert.equal(row('paris','2026-03-29T00:59:59Z').offset,'UTC+01:00');assert.equal(row('paris','2026-03-29T01:00:00Z').offset,'UTC+02:00')
 assert.deepEqual(time('london','2026-10-25T00:59:59Z'),['2026-10-25','日','01:59:59','UTC+01:00']);assert.deepEqual(time('london','2026-10-25T01:00:00Z'),['2026-10-25','日','01:00:00','UTC+00:00'])
 assert.deepEqual(time('sydney','2026-04-04T15:59:59Z'),['2026-04-05','日','02:59:59','UTC+11:00']);assert.deepEqual(time('sydney','2026-04-04T16:00:00Z'),['2026-04-05','日','02:00:00','UTC+10:00'])
 assert.deepEqual(time('sydney','2026-10-03T15:59:59Z'),['2026-10-04','日','01:59:59','UTC+10:00']);assert.deepEqual(time('sydney','2026-10-03T16:00:00Z'),['2026-10-04','日','03:00:00','UTC+11:00'])
})
test('世界時計: 日付/年跨ぎとUTC真夜中は24時へ置換しない',()=>{
 assert.deepEqual(time('tokyo','2025-12-31T23:59:59Z'),['2026-01-01','木','08:59:59','UTC+09:00'])
 assert.deepEqual(time('new-york','2026-01-01T00:00:00Z'),['2025-12-31','水','19:00:00','UTC-05:00'])
 assert.deepEqual(time('utc','2026-01-01T00:00:00Z'),['2026-01-01','木','00:00:00','UTC+00:00'])
 assert.deepEqual(time('tokyo','2026-07-15T15:30:00Z'),['2026-07-16','木','00:30:00','UTC+09:00'])
})
test('世界時計: 初期4・固定基準2・最大6・重複/未知を拒否・非破壊',()=>{
 const ids=initialWorldCities(),original=[...ids];assert.equal(ids.length,4);assert.equal(MAX_WORLD_CITIES,6)
 let next=addWorldCity(addWorldCity(ids,'los-angeles'),'paris');assert.equal(next.length,6);assert.deepEqual(ids,original)
 assert.throws(()=>addWorldCity(next,'sydney'),/最大6/);assert.throws(()=>addWorldCity(ids,'new-york'),/同じ都市/)
 assert.throws(()=>removeWorldCity(ids,'tokyo'),/基準/);assert.throws(()=>removeWorldCity(ids,'utc'),/基準/)
 next=addWorldCity(removeWorldCity(next,'new-york'),'sydney');assert.equal(next.length,6);assert.deepEqual(next.slice(0,2),['tokyo','utc'])
 for(const invalid of ['unknown','__proto__','Asia/Tokyo','<b>city</b>'])assert.throws(()=>addWorldCity(ids,invalid))
 for(const invalid of [['utc','tokyo'],['tokyo','utc','utc'],['tokyo','utc','unknown'],WORLD_CITIES.map(city=>city.id)])assert.throws(()=>worldClockSnapshot(invalid,Date.now()))
})
test('世界時計: 単一瞬間のコピー内容は年月日/曜日/秒/offset/順序を整合し固定',()=>{
 const snapshot=worldClockSnapshot(initialWorldCities(),Date.parse('2025-12-31T23:59:59.999Z')),text=worldClockText(snapshot)
 assert.match(text,/UTC基準：2025-12-31T23:59:59\.999Z/);assert.match(text,/東京（日本）：2026-01-01（木） 08:59:59 UTC\+09:00/)
 assert.equal(text.split('\n').length,6);worldClockSnapshot(initialWorldCities(),Date.parse('2026-01-01T00:00:00Z'));assert.equal(worldClockText(snapshot),text)
 for(const invalid of [NaN,Infinity,-Infinity,8.64e15+1])assert.throws(()=>worldClockSnapshot(initialWorldCities(),invalid))
})
test('世界時計: 登録/検索/棚/lazy/初期copy無効/秒のlive読み上げと保存送信なし',async()=>{
 const id='world-clock',entry=tools.find(tool=>tool.id===id);assert.equal(entry.category,'datetime');assert.equal(entry.path,'/tools/'+id)
 for(const query of ['世界時計','時差','ニューヨーク','東京','UTC','world clock','日付・時間'])assert.ok(filterToolList(tools,query,'all').some(tool=>tool.id===id))
 assert.deepEqual(parseShelf(JSON.stringify({version:1,favorites:[id],recent:[id]})).recent,[id])
 const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.ok(app.includes("lazy(() => import('./tools/world-clock/WorldClock'))"));assert.ok(app.includes('<Route path="/tools/world-clock" element={<WorldClock />} />'))
 const {default:Component}=await import('../src/tools/world-clock/WorldClock.tsx');const markup=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(Component)))
 assert.match(markup,/id="world-clock-copy"[^>]*disabled/);assert.ok(markup.includes('aria-live="off"'));assert.ok(markup.includes('for="world-clock-city"'));assert.ok(markup.includes('端末の時計'))
 for(const file of ['clock.ts','WorldClock.tsx'])assert.doesNotMatch(readFileSync(new URL('../src/tools/world-clock/'+file,import.meta.url),'utf8'),/fetch\s*\(|localStorage|sessionStorage|sendBeacon|Notification|geolocation|URLSearchParams|dangerouslySetInnerHTML/)
})
