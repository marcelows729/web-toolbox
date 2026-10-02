import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateDuration, formatDuration, durationSummary, MAX_TOTAL_SECONDS } from '../src/tools/duration-calculator/duration.ts'
import { tools } from '../src/tools/registry.ts'
const row = (hours='', minutes='', seconds='', operation='add') => ({ hours, minutes, seconds, operation })
test('時間量: 秒の繰り上がり・24時間超・引き算・0・全角・空欄', () => {
  assert.equal(calculateDuration([row('','','59'),row('','','1')]),60)
  assert.equal(formatDuration(calculateDuration([row('23'),row('2')])).clock,'25:00:00')
  assert.equal(formatDuration(calculateDuration([row('27')])).human,'27時間0分0秒')
  assert.equal(formatDuration(calculateDuration([row('1'),row('2','','','subtract')])).clock,'-01:00:00')
  assert.equal(calculateDuration([row('1'),row('1','','','subtract')]),0)
  assert.equal(formatDuration(0).clock,'00:00:00')
  assert.equal(calculateDuration([row(' ２ ','０１','５９')]),7319)
  assert.equal(calculateDuration([row()]),0)
  assert.equal(formatDuration(-1).minutes,'-0.016667')
  assert.equal(formatDuration(59).minutes,'0.983333')
  assert.equal(formatDuration(60).minutes,'1')
  assert.ok(durationSummary(-60).includes('合計秒: -60秒'))
})
test('時間量: 行数・入力上限・合計上限・無効値と入力不変', () => {
  const rows=Array.from({length:20},()=>row('999999','59','59'))
  const snapshot=JSON.stringify(rows)
  assert.equal(calculateDuration(rows),MAX_TOTAL_SECONDS)
  assert.equal(calculateDuration(rows.map(r=>({...r,operation:'subtract'}))),-MAX_TOTAL_SECONDS)
  assert.equal(JSON.stringify(rows),snapshot)
  for(const rows of [[],Array.from({length:21},()=>row())])assert.throws(()=>calculateDuration(rows))
  for(const value of ['-1','+1','1.5','1e2','Infinity','NaN','1,000','１２a','0x10','1 2','1時間','1234567890123'])assert.throws(()=>calculateDuration([row(value)]))
  assert.throws(()=>calculateDuration([row('1000000')]))
  assert.throws(()=>calculateDuration([row('','60')]))
  assert.throws(()=>calculateDuration([row('','','60')]))
  assert.throws(()=>calculateDuration([row('','','','bad')]))
  for(const n of [MAX_TOTAL_SECONDS+1,0.1,NaN,Infinity])assert.throws(()=>formatDuration(n))
})
test('時間量: 2000通りの加減算で秒・表示の保存則', () => {
  for(let i=0;i<2000;i++){
    const h=i%97,m=i%60,s=(i*7)%60, operation=i%2?'add':'subtract'
    const expected=((h*3600+m*60+s)*(operation==='add'?1:-1)) || 0
    const result=calculateDuration([row(String(h),String(m),String(s),operation)])
    assert.equal(result,expected)
    const text=formatDuration(result).clock, negative=text.startsWith('-')
    const [hh,mm,ss]=text.replace('-','').split(':').map(Number)
    assert.equal((hh*3600+mm*60+ss)*(negative?-1:1),expected)
  }
})
test('時間量: 公開登録と旧26IDを保持', () => {
  const tool=tools.find(t=>t.id==='duration-calculator')
  assert.equal(tool.path,'/tools/duration-calculator')
  assert.equal(tool.category,'general')
  assert.ok(tool.keywords.includes('動画時間'))
  for(const id of ['date-calculator','timestamp-converter','unit-converter','holiday-style','pocket-companion'])assert.ok(tools.some(t=>t.id===id))
})
