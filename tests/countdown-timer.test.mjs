import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createCountdown, parseCountdownFields, formatCountdownTime, validateCountdownDuration, MAX_COUNTDOWN_MS } from '../src/tools/countdown-timer/timer.ts'
import { tools } from '../src/tools/registry.ts'
const fields=(hours='',minutes='',seconds='')=>({hours,minutes,seconds})
const fixture=(duration=1000)=>{let time=100;return {clock:createCountdown(()=>time,duration),set:value=>{time=value}}}
test('カウントダウン: 1秒・空欄0・24h境界・0禁止・入力検証',()=>{
 assert.equal(parseCountdownFields(fields('','','1')),1000);assert.equal(parseCountdownFields(fields('24','0','0')),MAX_COUNTDOWN_MS);assert.equal(parseCountdownFields(fields('23','59','59')),MAX_COUNTDOWN_MS-1000);assert.equal(parseCountdownFields(fields('00','01',' 02 ')),62000);
 for(const value of [fields(),fields('0','0','0'),fields('24','0','1'),fields('24','1'),fields('25'),fields('0','60'),fields('0','0','60'),fields('-1'),fields('1.5'),fields('1e1'),fields('000'),fields('1','Infinity'),fields('1','0','+1')])assert.throws(()=>parseCountdownFields(value));
 for(const value of [0,-1000,1001,999,MAX_COUNTDOWN_MS+1000,NaN,Infinity])assert.throws(()=>validateCountdownDuration(value));assert.doesNotThrow(()=>validateCountdownDuration(MAX_COUNTDOWN_MS))
})
test('カウントダウン: 起点差分・pause/resume・停止時間除外・連打',()=>{
 const {clock,set}=fixture(10000);assert.deepEqual(clock.snapshot(),{duration:10000,remaining:10000,status:'idle'});clock.start();clock.start();set(1100);assert.equal(clock.snapshot().remaining,9000);assert.equal(clock.pause().status,'paused');clock.pause();set(91100);assert.equal(clock.snapshot().remaining,9000);clock.start();clock.start();set(92100);assert.equal(clock.pause().remaining,8000);assert.equal(clock.reset().remaining,10000);assert.equal(clock.snapshot().status,'idle')
})
test('カウントダウン: 1秒の終了直前・ちょうど0・二重終了/再startなし',()=>{
 const {clock,set}=fixture();clock.start();set(1099.99);assert.equal(clock.snapshot().status,'running');assert.equal(formatCountdownTime(clock.snapshot().remaining),'00:00:01');set(1100);assert.deepEqual(clock.snapshot(),{duration:1000,remaining:0,status:'finished'});set(999999);for(let i=0;i<10;i++){assert.equal(clock.snapshot().remaining,0);assert.equal(clock.pause().status,'finished');assert.equal(clock.start().status,'finished')};assert.equal(clock.reset().status,'idle');assert.equal(clock.start().status,'running')
})
test('カウントダウン: 24h・描画なしlong gap・逆行/負/非有限で増加しない',()=>{
 const {clock,set}=fixture(MAX_COUNTDOWN_MS);clock.start();set(100+23*3600000);assert.equal(clock.snapshot().remaining,3600000);for(const value of [-10,50,NaN,Infinity,-Infinity]){set(value);assert.equal(clock.snapshot().remaining,3600000)};set(100+MAX_COUNTDOWN_MS*3);assert.equal(clock.snapshot().remaining,0);assert.equal(clock.snapshot().status,'finished')
})
test('カウントダウン: 計測中とpause中の改入力禁止・終了/入力変更で旧状態消去',()=>{
 const {clock,set}=fixture(5000);clock.start();assert.throws(()=>clock.configure(1000),/リセット/);assert.throws(()=>clock.invalidate(),/リセット/);clock.pause();assert.throws(()=>clock.configure(2000),/リセット/);assert.equal(clock.snapshot().duration,5000);clock.reset();assert.equal(clock.configure(2000).remaining,2000);assert.throws(()=>clock.configure(0));assert.equal(clock.snapshot().remaining,2000);clock.start();set(10000);assert.equal(clock.snapshot().status,'finished');assert.equal(clock.configure(3000).status,'idle');assert.equal(clock.snapshot().remaining,3000);clock.invalidate();assert.equal(clock.snapshot().duration,0);assert.throws(()=>clock.start());assert.equal(clock.snapshot().status,'idle')
})
test('カウントダウン: reset/改入力/離脱後に古い更新で終了しない',()=>{
 const {clock,set}=fixture();clock.start();const oldRefresh=()=>clock.snapshot();set(2100);clock.reset();assert.deepEqual(oldRefresh(),{duration:1000,remaining:1000,status:'idle'});clock.configure(5000);clock.start();set(2200);assert.equal(oldRefresh().remaining,4900);clock.reset();clock.configure(2000);assert.equal(oldRefresh().remaining,2000);assert.equal(oldRefresh().status,'idle');clock.clear();assert.deepEqual(oldRefresh(),{duration:0,remaining:0,status:'idle'})
})
test('カウントダウン: 残り秒切り上げ・負数なし・24h表記',()=>{
 for(const [input,expected]of[[0,'00:00:00'],[0.01,'00:00:01'],[999.99,'00:00:01'],[1000,'00:00:01'],[1000.01,'00:00:02'],[60001,'00:01:01'],[3600000,'01:00:00'],[MAX_COUNTDOWN_MS,'24:00:00'],[-1,'00:00:00'],[NaN,'00:00:00']])assert.equal(formatCountdownTime(input),expected)
})
test('カウントダウン: 34件登録/lazy/操作のみlive/音・保存・通信・権限なし',()=>{
 assert.equal(tools.length,35);const entry=tools.find(t=>t.id==='countdown-timer');assert.equal(entry.path,'/tools/countdown-timer');assert.equal(entry.category,'general');const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.ok(app.includes("lazy(() => import('./tools/countdown-timer/CountdownTimer'))"));assert.ok(app.includes('<Route path="/tools/countdown-timer" element={<CountdownTimer />} />'));
 const source=readFileSync(new URL('../src/tools/countdown-timer/CountdownTimer.tsx',import.meta.url),'utf8');assert.match(source,/音は鳴りません/);assert.match(source,/aria-live="off"/);assert.match(source,/disabled={active}/);assert.doesNotMatch(source,/Date\.now|localStorage|sessionStorage|fetch\(|Audio\(|Notification|vibrate|requestPermission/)
})
