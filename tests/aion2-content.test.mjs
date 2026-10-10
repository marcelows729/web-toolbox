import assert from 'node:assert/strict'
import {test} from 'node:test'
import {TASKS} from '../src/tools/aion2-checklist/master.ts'
import {DEFAULT,change,configure,project,periodKey,nextReset,entryKey,readStore,capacity} from '../src/tools/aion2-checklist/logic.ts'
const task=id=>TASKS.find(t=>t.id===id)
const config={...DEFAULT.config,automatic:true}
const at=s=>Date.parse(s)
const before=at('2026-10-14T15:59:59.999+09:00'), boundary=before+1
test('日次・水曜週次の境界と次回時刻',()=>{
  for(const id of ['duty','explore-krao'])assert.notEqual(periodKey(task(id),before,config),periodKey(task(id),boundary,config))
  assert.equal(nextReset(before,config,true),boundary)
  assert.equal(nextReset(boundary,config,true),boundary+7*86400000)
  assert.equal(nextReset(boundary,config),boundary+86400000)
})
test('固定回数リセット・蓄積は複数日補充して上限で止める・未入力は0',()=>{
  let store={...structuredClone(DEFAULT),config}
  store=change(task('duty'),store,5,before)
  assert.equal(project(task('duty'),store.entries[entryKey(task('duty'),config)],boundary,config).value,0)
  const future=change(task('duty'),store,2,boundary).entries[entryKey(task('duty'),config)]
  const backward=project(task('duty'),future,before,config)
  assert.equal(backward.value,2)
  assert.equal(project(task('duty'),backward,boundary,config).value,2)
  store=change(task('nightmare'),store,3,before)
  const entry=store.entries[entryKey(task('nightmare'),config)]
  assert.equal(project(task('nightmare'),entry,boundary,config).value,5)
  assert.equal(project(task('nightmare'),entry,boundary+20*86400000,config).value,14)
  assert.equal(project(task('nightmare'),undefined,boundary,config).value,0)
  assert.equal(project(task('nightmare'),entry,boundary,{...config,automatic:false}).value,3)
})
test('資源回復の端数時間を変更後も保持、逆行時計・上限',()=>{
  const energy=task('od-energy'), hour=3600000
  let store=change(energy,{...structuredClone(DEFAULT),config},10,boundary)
  store=change(energy,store,20,boundary+2*hour)
  const entry=store.entries[entryKey(energy,config)]
  assert.equal(project(energy,entry,boundary+3*hour-1,config).value,20)
  assert.equal(project(energy,entry,boundary+3*hour,config).value,35)
  assert.equal(project(energy,entry,boundary-hour,config).value,20)
  assert.equal(project(energy,entry,boundary+200*hour,config).value,560)
  assert.equal(capacity(energy,{...config,subscription:true}),840)
})
test('アカウント内サーバー共有・キャラ独立・区切り文字の衝突なし',()=>{
  assert.equal(entryKey(task('duty'),config),entryKey(task('duty'),{...config,characterId:'sub'}))
  for(const part of [{accountId:'other'},{serverId:'other'}])assert.notEqual(entryKey(task('duty'),config),entryKey(task('duty'),{...config,...part}))
  assert.notEqual(entryKey(task('nightmare'),config),entryKey(task('nightmare'),{...config,characterId:'sub'}))
  assert.notEqual(entryKey(task('nightmare'),{...config,serverId:'a:b',characterId:'c'}),entryKey(task('nightmare'),{...config,serverId:'a',characterId:'b:c'}))
  const accountTask={...task('attendance'),scope:'account'}
  assert.equal(entryKey(accountTask,config),entryKey(accountTask,{...config,characterId:'sub',serverId:'other'}))
  assert.notEqual(entryKey(accountTask,config),entryKey(accountTask,{...config,accountId:'other'}))
})
test('保存JSON・表示設定往復と不正型/日時/巨大データ拒否',()=>{
  const store=change(task('nightmare'),{...structuredClone(DEFAULT),config,disabled:['attendance'],view:{tab:'weekly',search:'遠征',optional:true}},2,boundary)
  assert.deepEqual(readStore(JSON.stringify(store)),store)
  for(const part of [{config:[]},{entries:true},{config:{...config,weeklyDay:7}},{config:{...config,automatic:'yes'}},{entries:{bad:{value:1,anchor:'bad'}}},{disabled:['unknown']},{view:{tab:'no',search:'',optional:false}}])assert.throws(()=>readStore(JSON.stringify({...store,...part})))
  assert.throws(()=>readStore(' '.repeat(1048577)))
  assert.throws(()=>readStore('{'))
  assert.notEqual(readStore(null),DEFAULT)
})
test('時計設定変更は全キャラを旧設定で精算、無効期間は遡及回復しない',()=>{
  const nightmare=task('nightmare')
  let store=change(nightmare,{...structuredClone(DEFAULT),config},2,before)
  store=configure(store,{characterId:'sub'},before)
  store=change(nightmare,store,3,before)
  store=configure(store,{resetHourJst:17},boundary)
  assert.deepEqual(Object.values(store.entries).map(e=>e.value),[4,5])
  store=configure(store,{automatic:false},boundary)
  store=configure(store,{automatic:true},boundary+10*86400000)
  assert.deepEqual(Object.values(store.entries).map(e=>e.value),[4,5])
  for(const e of Object.values(store.entries))assert.equal(project(nightmare,e,boundary+10*86400000,store.config).value,e.value)
})
