import test from 'node:test'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {calculateElapsed,elapsedText} from '../src/tools/age-calculator/elapsed.ts'
const parts=value=>{const [year,month,day]=value.split('-');return {year,month,day}}
const elapsed=(start,end)=>calculateElapsed(parts(start),parts(end))
const units=(start,end)=>{const {years,months,days,totalDays}=elapsed(start,end);return {years,months,days,totalDays}}
test('経過年月: 同日・通常の周年前後・総日数は開始日を含めない',()=>{
 assert.deepEqual(units('2020-06-15','2020-06-15'),{years:0,months:0,days:0,totalDays:0})
 assert.deepEqual(units('2000-10-02','2026-10-02'),{years:26,months:0,days:0,totalDays:9496})
 assert.deepEqual(units('2023-06-15','2024-06-14'),{years:0,months:11,days:30,totalDays:365})
 assert.deepEqual(units('2023-06-15','2024-06-15'),{years:1,months:0,days:0,totalDays:366})
})
test('経過年月: 月末補正を毎回開始日に基づけ、補正後の日からずらさない',()=>{
 assert.deepEqual(units('2023-01-31','2023-02-28'),{years:0,months:1,days:0,totalDays:28})
 assert.deepEqual(units('2023-01-31','2023-03-30'),{years:0,months:1,days:30,totalDays:58})
 assert.deepEqual(units('2023-01-31','2023-03-31'),{years:0,months:2,days:0,totalDays:59})
 assert.deepEqual(units('2024-01-31','2024-02-28'),{years:0,months:0,days:28,totalDays:28})
 assert.deepEqual(units('2024-01-31','2024-02-29'),{years:0,months:1,days:0,totalDays:29})
})
test('経過年月: 閏日から平年末・翌月・4年後',()=>{
 assert.deepEqual(units('2020-02-29','2021-02-27'),{years:0,months:11,days:29,totalDays:364})
 assert.deepEqual(units('2020-02-29','2021-02-28'),{years:1,months:0,days:0,totalDays:365})
 assert.deepEqual(units('2020-02-29','2021-03-28'),{years:1,months:0,days:28,totalDays:393})
 assert.deepEqual(units('2020-02-29','2021-03-29'),{years:1,months:1,days:0,totalDays:394})
 assert.deepEqual(units('2020-02-29','2024-02-28'),{years:3,months:11,days:30,totalDays:1460})
 assert.deepEqual(units('2020-02-29','2024-02-29'),{years:4,months:0,days:0,totalDays:1461})
})
test('経過年月: 世紀年の閏判定、0001〜9999、年0〜99のDate補正を回避',()=>{
 assert.deepEqual(units('0001-01-01','0002-01-01'),{years:1,months:0,days:0,totalDays:365})
 assert.equal(elapsed('0099-12-31','0100-01-01').totalDays,1)
 assert.equal(elapsed('0001-01-01','9999-12-31').totalDays,3652058)
 assert.equal(elapsed('2000-02-28','2000-03-01').totalDays,2)
 assert.equal(elapsed('1900-02-28','1900-03-01').totalDays,1)
 assert.throws(()=>elapsed('1900-02-29','2000-01-01'),/存在/)
})
test('経過年月: 逆転・無効・部分日付と範囲外を拒否',()=>{
 assert.throws(()=>elapsed('2024-01-02','2024-01-01'),/基準日は/)
 for(const invalid of ['0000-01-01','10000-01-01','2024-00-01','2024-13-01','2024-04-31','2023-02-29','2024-01-00','2024-1.5-01','2024--01','24-01-01']){assert.throws(()=>elapsed(invalid,'2026-01-01'));assert.throws(()=>elapsed('0001-01-01',invalid))}
})
test('経過年月: 1万日間の不変条件（年月の非負・残日・総日数・非破壊）',()=>{
 const start=parts('1996-01-31'),saved={...start},date=new Date('1996-01-31T00:00:00Z')
 for(let i=0;i<10000;i++){const end=parts(date.toISOString().slice(0,10));const value=calculateElapsed(start,end);assert.equal(value.totalDays,i);assert.ok(value.years>=0&&value.months>=0&&value.months<12&&value.days>=0&&value.days<=30);date.setUTCDate(date.getUTCDate()+1)}assert.deepEqual(start,saved)
})
test('経過年月: ローカル今日はUTC日付に置換せず、DSTをまたぐ総日数は安定',()=>{
 const url=new URL('../src/tools/age-calculator/elapsed.ts',import.meta.url).href
 for(const [timezone,expected]of[['America/Los_Angeles','2025-12-31'],['Pacific/Kiritimati','2026-01-01'],['UTC','2026-01-01']]){
  const script='import {localTodayParts,calculateElapsed} from '+JSON.stringify(url)+';const p=localTodayParts(new Date("2026-01-01T00:30:00Z"));console.log(JSON.stringify({today:[p.year,p.month,p.day].join("-"),days:calculateElapsed({year:"2026",month:"03",day:"07"},{year:"2026",month:"03",day:"09"}).totalDays}))'
  const result=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,TZ:timezone},encoding:'utf8'}));assert.equal(result.today,expected);assert.equal(result.days,2)
 }
})
test('経過年月: コピー文字列は日付・結果・補正ルールを一致させる',()=>{
 const result=elapsed('2020-02-29','2021-02-28'),text=elapsedText(result);assert.ok(text.includes('開始日：2020-02-29'));assert.ok(text.includes('基準日：2021-02-28'));assert.ok(text.includes('満1年 0か月 0日'));assert.ok(text.includes('365日'));assert.ok(text.includes('月末'));assert.equal(elapsedText(result),text)
})
