import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createStopwatch, formatStopwatchTime, stopwatchText, MAX_STOPWATCH_MS, MAX_LAPS } from '../src/tools/stopwatch/clock.ts'
import { tools } from '../src/tools/registry.ts'
const fixture = () => { let time = 100; return { clock: createStopwatch(() => time), set: value => { time = value } } }
test('ストップウォッチ: 起点差分・停止時間除外・再開・繰り返し操作', () => {
 const {clock,set}=fixture();assert.equal(clock.snapshot().elapsed,0);clock.start();set(1100);assert.equal(clock.snapshot().elapsed,1000);clock.start();set(2100);assert.equal(clock.pause().elapsed,2000);clock.pause();set(92100);assert.equal(clock.snapshot().elapsed,2000);clock.start();clock.start();set(92600);assert.equal(clock.pause().elapsed,2500);assert.equal(clock.reset().elapsed,0);assert.equal(clock.snapshot().running,false)
})
test('ストップウォッチ: 描画なしの長時間・24h超・時間上限で自動停止', () => {
 const {clock,set}=fixture();clock.start();set(100+49*3600000+1234);assert.equal(formatStopwatchTime(clock.snapshot().elapsed),'49:00:01.23');set(100+MAX_STOPWATCH_MS+50000);const limit=clock.snapshot();assert.equal(limit.elapsed,MAX_STOPWATCH_MS);assert.equal(limit.limited,true);assert.equal(limit.running,false);assert.equal(clock.start().running,false);assert.equal(clock.lap().laps.length,0);assert.equal(formatStopwatchTime(limit.elapsed),'999:59:59.99');clock.reset();assert.equal(clock.start().running,true)
})
test('ストップウォッチ: 区間・合計・停止中無効・同時ラップ・100件上限', () => {
 const {clock,set}=fixture();assert.equal(clock.lap().laps.length,0);clock.start();set(1100);assert.deepEqual(clock.lap().laps,[{total:1000,interval:1000}]);assert.deepEqual(clock.lap().laps.at(-1),{total:1000,interval:0});clock.pause();set(101100);assert.equal(clock.lap().laps.length,2);clock.start();set(101600);assert.deepEqual(clock.lap().laps.at(-1),{total:1500,interval:500});for(let i=3;i<120;i++){set(101600+i);clock.lap()};assert.equal(clock.snapshot().laps.length,MAX_LAPS);assert.equal(clock.snapshot().running,true);const snap=clock.snapshot();snap.laps[0].total=-1;assert.equal(clock.snapshot().laps[0].total,1000);assert.equal(clock.reset().laps.length,0)
})
test('ストップウォッチ: 時計逆行・負値・非有限を防御、ラップ逆転なし', () => {
 const {clock,set}=fixture();clock.start();set(1100);clock.lap();for(const time of [-100,500,NaN,Infinity,-Infinity]){set(time);const view=clock.lap();assert.equal(view.elapsed,1000);assert.equal(view.laps.at(-1).interval,0)};set(2100);assert.equal(clock.pause().elapsed,2000);set(-200);clock.start();set(2200);assert.equal(clock.snapshot().elapsed,2100)
})
test('ストップウォッチ: 表示切り捨てとコピー時点・100ラップのテキスト', () => {
 for(const [input,output]of[[0,'00:00:00.00'],[9.999,'00:00:00.00'],[10,'00:00:00.01'],[59999,'00:00:59.99'],[60000,'00:01:00.00'],[3600000,'01:00:00.00'],[-1,'00:00:00.00'],[NaN,'00:00:00.00'],[Infinity,'00:00:00.00']])assert.equal(formatStopwatchTime(input),output);
 const {clock,set}=fixture();clock.start();set(1100);clock.lap();const view=clock.snapshot(),text=stopwatchText(view);set(2100);assert.match(text,/合計時間：00:00:01.00/);assert.match(text,/計測中（コピー時点）/);assert.match(text,/ラップ 1：区間 00:00:01.00 \/ 合計 00:00:01.00/);assert.equal(stopwatchText(view),text);assert.match(stopwatchText(clock.pause()),/停止中/);set(100+MAX_STOPWATCH_MS);clock.start();set(100+2*MAX_STOPWATCH_MS);assert.match(stopwatchText(clock.snapshot()),/上限で停止/)
})
test('ストップウォッチ: 全41件・明示lazy・通信保存権限なし', () => {
 assert.equal(tools.length,41);const tool=tools.find(t=>t.id==='stopwatch');assert.equal(tool.path,'/tools/stopwatch');assert.equal(tool.category,'general');const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.ok(app.includes("lazy(() => import('./tools/stopwatch/Stopwatch'))"));assert.ok(app.includes('<Route path="/tools/stopwatch" element={<Stopwatch />} />'));
 const source=readFileSync(new URL('../src/tools/stopwatch/Stopwatch.tsx',import.meta.url),'utf8');assert.match(source,/aria-live="off"/);assert.doesNotMatch(source,/Date\.now|localStorage|sessionStorage|fetch\(|Notification|vibrate/);assert.equal(new Set(tools.map(t=>t.id)).size,41)
})
