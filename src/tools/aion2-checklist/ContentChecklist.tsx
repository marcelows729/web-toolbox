import {useEffect, useRef, useState} from 'react'
import {TASKS, DATA_SOURCE, NAME_SOURCE, CONFIRMED_DUNGEONS, MASTER_BUILD} from './master'
import {DEFAULT, readStore, project, change, configure, capacity, entryKey, nextReset, type Store, type Config} from './logic'
import './content.css'
export const CONTENT_STORAGE = 'poketsuru-aion2-content-v1'
const labels = {all:'すべて',daily:'日課・蓄積',weekly:'週課',timer:'資源'}
function load() {
  let raw:string|null=null
  try {raw=localStorage.getItem(CONTENT_STORAGE); return {raw,data:readStore(raw),error:''}}
  catch {return {raw,data:structuredClone(DEFAULT),error:'保存データを読み込めません。自動保存を停止しています。JSONで退避できます。'}}
}
export default function ContentChecklist() {
  const [initial]=useState(load), [data,setData]=useState(initial.data), [now,setNow]=useState(Date.now)
  const [error,setError]=useState(initial.error), [notice,setNotice]=useState(''), [preview,setPreview]=useState<Store|null>(null)
  const [locked,setLocked]=useState(false), baseline=useRef(initial.raw), ready=useRef(false), revision=useRef(0), blocked=useRef(!!initial.error)
  useEffect(()=>{
    let active=true, release:(()=>void)|undefined
    if(navigator.locks) void navigator.locks.request(CONTENT_STORAGE,{ifAvailable:true},async lock=>{
      if(!active||!lock) return
      ready.current=true; setLocked(true)
      await new Promise<void>(resolve=>{release=resolve})
    }).catch(()=>{if(active)setError('保存ロックを取得できません。JSONで退避してください。')})
    else setError('このブラウザは安全なタブ間保存を利用できません。変更はJSONで退避してください。')
    const tick=()=>setNow(Date.now()), timer=setInterval(tick,30000)
    window.addEventListener('focus',tick)
    // The generation intentionally invalidates pending file reads on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return ()=>{active=false; ready.current=false; release?.(); clearInterval(timer); window.removeEventListener('focus',tick); revision.current++}
  },[])
  function commit(next:Store, replaceCorrupt=false) {
    revision.current++; setPreview(null); setData(next); setNow(Date.now()); setNotice('')
    if((blocked.current&&!replaceCorrupt)||!ready.current) {setError(blocked.current?'保存データを読み込めなかったため自動保存を停止しています。JSON復元の確認操作で置き換えられます。':'保存できません。同時編集中の別タブを閉じて再読込してください。変更はJSONで退避できます。'); return}
    try {
      if(localStorage.getItem(CONTENT_STORAGE)!==baseline.current) throw Error('別タブで保存内容が変更されました。JSONで退避して再読込してください。')
      const raw=JSON.stringify(next); readStore(raw); localStorage.setItem(CONTENT_STORAGE,raw); baseline.current=raw; blocked.current=false; setError(''); setNotice('このブラウザに保存しました。')
    } catch(cause) {setError(cause instanceof Error?cause.message:'保存できません。JSONで退避してください。')}
  }
  function config(part:Partial<Config>) {
    commit(configure(data,part,Date.now()))
  }
  const tasks=TASKS.filter(t=>(data.view.optional||t.enabled)&&!data.disabled.includes(t.id)&&t.level<=data.config.level&&(data.view.tab==='all'||t.cycle===data.view.tab)&&t.title.includes(data.view.search))
  const eligible=tasks.filter(t=>t.mode==='check'||t.mode==='progress')
  const done=eligible.filter(t=>project(t,data.entries[entryKey(t,data.config)],now,data.config).value>=capacity(t,data.config)).length
  const date=(n:number)=>new Date(n).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})
  return <section className="tool-panel aion2-content" aria-labelledby="aion2-content-title">
    <h2 id="aion2-content-title">コンテンツ別の回数管理</h2>
    <p>マスター {MASTER_BUILD}。回数・補充・共有範囲は非公式資料による候補値です。日本語名の一部は暫定です。ゲーム内表示を優先してください。</p>
    <p>蓄積・資源は初回「未入力」です。実際の残数を入力してから計算を開始します。下の自由入力チェック表とは別に保存します。</p>
    <details className="aion2-content-config"><summary>キャラクター・計算設定：{data.config.serverId} / {data.config.characterId}（Lv.{data.config.level}）</summary>
    <div className="aion2-content-settings">
      {(['accountId','serverId','characterId'] as const).map((key,i)=><label className="field-label" key={key}>{['アカウント識別名','サーバー識別名','キャラクター識別名'][i]}<input aria-label={['アカウント識別名','サーバー識別名','キャラクター識別名'][i]} maxLength={40} value={data.config[key]} onChange={e=>{if(e.target.value.trim()) config({[key]:e.target.value})}} /></label>)}
      <label className="field-label">レベル<input type="number" min={1} max={100} value={data.config.level} onChange={e=>{const n=Number(e.target.value); if(Number.isInteger(n)&&n>=1&&n<=100)config({level:n})}} /></label>
      <label className="field-label">リセット時刻（日本時間）<select value={data.config.resetHourJst} onChange={e=>config({resetHourJst:Number(e.target.value)})}>{Array.from({length:24},(_,i)=><option key={i} value={i}>{i}:00</option>)}</select></label>
      <label className="field-label">週次リセット曜日<select value={data.config.weeklyDay} onChange={e=>config({weeklyDay:Number(e.target.value)})}>{['日','月','火','水','木','金','土'].map((s,i)=><option key={i} value={i}>{s}曜日</option>)}</select></label>
    </div>
    <label className="aion2-content-check"><input type="checkbox" checked={data.config.automatic} onChange={e=>config({automatic:e.target.checked})} />ゲーム内で時刻・補充仕様を確認し、自動リセット・回復計算を有効にする</label>
    <label className="aion2-content-check"><input type="checkbox" checked={data.config.subscription} onChange={e=>config({subscription:e.target.checked})} />オードエネルギー上限840を使用（通常560・要確認）</label>
    </details>
    <p>設定上の次回：日次 {date(nextReset(now,data.config))} ／ 週次 {date(nextReset(now,data.config,true))}（日本時間）。初期値の16時・水曜はタイムゾーン未確認です。</p>
    <div className="toggle-group" aria-label="コンテンツ区分">{(Object.keys(labels) as (keyof typeof labels)[]).map(tab=><button type="button" key={tab} className={'toggle-option'+(data.view.tab===tab?' is-active':'')} aria-pressed={data.view.tab===tab} onClick={()=>commit({...data,view:{...data.view,tab}})}>{labels[tab]}</button>)}</div>
    <label className="field-label">コンテンツ検索<input maxLength={120} value={data.view.search} onChange={e=>commit({...data,view:{...data.view,search:e.target.value}})} /></label>
    <label className="aion2-content-check"><input type="checkbox" checked={data.view.optional} onChange={e=>commit({...data,view:{...data.view,optional:e.target.checked}})} />任意項目も表示</label>
    <p>表示中のチェック・固定回数：{done} / {eligible.length} 完了（蓄積枠・資源は対象外）</p>
    <div className="aion2-content-grid">{tasks.map(task=>{
      const key=entryKey(task,data.config), entered=!!data.entries[key], value=project(task,data.entries[key],now,data.config).value, cap=capacity(task,data.config), stock=task.mode==='stock'||task.mode==='resource'
      const update=(n:number)=>commit(change(task,data,n,Date.now()))
      return <article key={task.id} className="aion2-content-card" data-content-id={task.id}>
        <h3>{task.title}</h3><p className="calculation-help">{task.category} · Lv.{task.level}+ · {task.scope==='server'?'同一アカウントのサーバー共有（候補）':task.scope==='account'?'アカウント共有（候補）':'キャラクター別（候補）'}<br />{CONFIRMED_DUNGEONS.some(name=>task.title.endsWith(name))?'ダンジョン名は公式表記と照合済み・区分名は要確認':'日本語名は要確認'} · 数値は非公式資料</p>
        {task.note&&<p>{task.note}</p>}
        <label className="field-label">{stock?'保有残数':'完了数'}{!entered&&stock?'（未入力）':''}<input aria-label={task.title+(stock?'の保有残数':'の完了数')} type="number" min={0} max={cap} step={1} value={entered||!stock?value:''} placeholder="ゲーム内の残数" onChange={e=>{const n=Number(e.target.value); if(e.target.value!==''&&Number.isInteger(n)&&n>=0&&n<=cap)update(n)}} /></label>
        <p>上限 {cap}{task.refill?` ／ 補充 +${task.refill}${task.mode==='resource'?' / 3時間':' / 日'}`:''}</p>
        <div className="action-row"><button type="button" className="secondary-button" disabled={!entered||value<=0} aria-label={task.title+'を1減らす'} onClick={()=>update(value-1)}>−1</button><button type="button" className="secondary-button" disabled={value>=cap} aria-label={task.title+'を1増やす'} onClick={()=>update(value+1)}>＋1</button>{task.mode==='check'&&<button type="button" className="primary-button" onClick={()=>update(value?0:1)}>{value?'未完了に戻す':'完了'}</button>}</div>
        {stock&&entered&&cap-value<(task.refill??0)&&<p className="calculation-help">次回補充で上限を超える可能性があります。</p>}
        <button type="button" className="text-button" onClick={()=>commit({...data,disabled:[...data.disabled,task.id]})}>{task.title}を非表示</button>
      </article>
    })}</div>
    {tasks.length===0&&<p>表示条件に一致するコンテンツはありません。</p>}
    <details className="aion2-content-hidden"><summary>非表示項目の再表示（{data.disabled.length}件）</summary>{TASKS.filter(t=>data.disabled.includes(t.id)).map(t=><button type="button" className="secondary-button" key={t.id} onClick={()=>commit({...data,disabled:data.disabled.filter(id=>id!==t.id)})}>{t.title}を再表示</button>)}</details>
    <div className="action-row"><button type="button" className="secondary-button" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='poketsuru-aion2-content.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000)}}>コンテンツ管理JSONを書き出す</button></div>
    <label className="field-label">コンテンツ管理JSONから復元<input type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0]; e.target.value=''; const token=++revision.current; setPreview(null); if(!file)return; try{if(file.size>1048576)throw Error('JSONは1 MiBまでです。'); const parsed=readStore(await file.text()); if(token===revision.current)setPreview(parsed)}catch(cause){if(token===revision.current)setError((cause as Error).message)}}} /></label>
    {preview&&<div className="aion2-restore-preview"><p>{Object.keys(preview.entries).length}件の進捗と表示・計算設定で、コンテンツ管理全体を置き換えます。読み込めなかった保存データも上書きします。自由入力チェック表は別です。</p><button className="primary-button" type="button" onClick={()=>commit(preview,true)}>確認した内容で置き換える</button><button className="secondary-button" type="button" onClick={()=>setPreview(null)}>やめる</button></div>}
    {(!locked||error)&&<p className="error-box" role="alert">{error||'保存ロックを取得できるまで変更は保存されません。別タブで開いている場合は閉じて再読込してください。'}</p>}
    <p role="status">{notice}</p>
    <p>識別名は管理用です。ログイン情報を入力する必要はありません。進捗・表示設定はこのブラウザだけに保存され、ゲーム連携・外部送信はありません。</p>
    <p>照合資料：<a href={NAME_SOURCE} target="_blank" rel="noreferrer">公式日本語コンテンツ紹介</a> ／ <a href={DATA_SOURCE} target="_blank" rel="noreferrer">非公式の回数資料</a>。固有名詞・回数・共有範囲・資源回復の基準時刻はゲーム内で確認してください。</p>
  </section>
}
