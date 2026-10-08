import { useCallback, useEffect, useRef, useState } from 'react'
import { checkedText, CONFLICT_WARNING, decodeChecklist, encodeChecklist, loadSaved, MAX_JSON_BYTES, resetTasks, saveSaved, STORAGE_KEY, taskProgress, validateChecklist } from './checklist'
import type { Character, Checklist, Period } from './checklist'
import './checklist.css'
const periods: [Period, string][] = [['daily', '日課'], ['weekly', '週課']]
export default function Aion2Checklist() {
  const [initial] = useState(loadSaved)
  const [data, setData] = useState(initial.data)
  const [selected, setSelected] = useState(initial.data.characters[0]?.id ?? '')
  const [name, setName] = useState(''), [rename, setRename] = useState<string | null>(null)
  const [deleteCharacter, setDeleteCharacter] = useState<string | null>(null), deleteTarget = useRef<string | null>(null)
  const [deleteTask, setDeleteTask] = useState<{ characterId: string; taskId: string } | null>(null), taskDeleteTarget = useRef<{ characterId: string; taskId: string } | null>(null)
  const [title, setTitle] = useState(''), [period, setPeriod] = useState<Period>('daily'), [editing, setEditing] = useState<string | null>(null)
  const [characterError, setCharacterError] = useState(''), [taskError, setTaskError] = useState(''), [importError, setImportError] = useState('')
  const [warning, setWarning] = useState(initial.warning), [blocked, setBlocked] = useState(initial.blocked), [saveConfirm, setSaveConfirm] = useState(false)
  const [notice, setNotice] = useState('')
  const [lockWarning, setLockWarning] = useState(''), [conflict, setConflict] = useState(false)
  const saved = useRef(initial.raw), ownsWriter = useRef(false), releaseWriter = useRef<(() => void) | null>(null), writerGeneration = useRef(0)
  const [undo, setUndo] = useState<{ data: Checklist; selected: string } | null>(null)
  const [preview, setPreview] = useState<Checklist | null>(null), [confirmed, setConfirmed] = useState(false), [reading, setReading] = useState(false)
  const revision = useRef(0), download = useRef<string | null>(null), undoButton = useRef<HTMLButtonElement>(null), taskInput = useRef<HTMLInputElement>(null)
  const acquireWriter = useCallback(() => {
    if (ownsWriter.current) return Promise.resolve(true)
    const unavailable = 'この画面の変更は自動保存していません。同時に保存できるのは1タブです。別タブを閉じて保存を再試行するか、JSONを書き出してください。'
    if (!navigator.locks) { setLockWarning('安全なタブ間保存を利用できません。この画面の変更は保存せず、JSONで退避できます。'); return Promise.resolve(false) }
    const generation = writerGeneration.current
    return new Promise<boolean>(resolve => {
      void navigator.locks.request(STORAGE_KEY + '-writer', { ifAvailable: true }, lock => {
        if (generation !== writerGeneration.current) { resolve(false); return }
        if (ownsWriter.current) { resolve(true); return }
        if (!lock) { setLockWarning(unavailable); resolve(false); return }
        ownsWriter.current = true; setLockWarning(''); resolve(true)
        return new Promise<void>(release => { releaseWriter.current = () => { ownsWriter.current = false; release() } })
      }).catch(() => { if (generation === writerGeneration.current) setLockWarning(unavailable); resolve(false) })
    })
  }, [])
  const releaseResources = useCallback(() => {
    writerGeneration.current++; releaseWriter.current?.(); releaseWriter.current = null; revision.current++
    if (download.current) URL.revokeObjectURL(download.current)
  }, [])
  useEffect(() => {
    const generation = writerGeneration.current
    void Promise.resolve().then(() => generation === writerGeneration.current ? acquireWriter() : undefined)
    const changed = (event: StorageEvent) => { if ((event.key === STORAGE_KEY || event.key === null) && event.newValue !== saved.current) { setConflict(true); setWarning(CONFLICT_WARNING) } }
    window.addEventListener('storage', changed)
    return () => { releaseResources(); window.removeEventListener('storage', changed) }
  }, [acquireWriter, releaseResources])
  const persist = (next: Checklist) => {
    if (conflict) return false
    if (!ownsWriter.current) { setWarning(lockWarning || '保存の準備が完了していないため、この画面の変更は保存していません。保存を再試行してください。'); return false }
    const error = saveSaved(next, () => window.localStorage, saved.current); setWarning(error)
    if (error === CONFLICT_WARNING) setConflict(true)
    if (!error) { saved.current = encodeChecklist(next); setBlocked(false); setSaveConfirm(false) }
    return !error
  }
  const character = data.characters.find(item => item.id === selected)
  const clearDraft = () => { setTitle(''); setPeriod('daily'); setEditing(null); setRename(null); deleteTarget.current = null; setDeleteCharacter(null); taskDeleteTarget.current = null; setDeleteTask(null); setCharacterError(''); setTaskError('') }
  const commit = (next: Checklist, message: string, nextSelected = selected, canUndo = true) => {
    const valid = validateChecklist(next)
    setUndo(canUndo ? { data, selected } : null); setData(valid); setSelected(nextSelected)
    revision.current++; setPreview(null); setConfirmed(false); setReading(false); setImportError(''); setNotice(message); setSaveConfirm(false)
    if (!blocked) persist(valid)
  }
  const replace = (next: Character, message: string) => commit({ ...data, characters: data.characters.map(item => item.id === next.id ? next : item) }, message)
  const focusUndo = () => requestAnimationFrame(() => undoButton.current?.focus())
  const characterDescription = 'aion2-character-help' + (characterError ? ' aion2-character-error' : '')
  const taskDescription = 'aion2-task-help' + (taskError ? ' aion2-task-error' : '')
  return <div className="container tool-page aion2-checklist">
    <header className="tool-header"><h1>AION2 日課・週課チェック</h1><p>キャラクターごとに、やることを自由に登録して進捗を確認します。</p></header>
    <section className="tool-panel" aria-labelledby="aion2-characters-title">
      <h2 id="aion2-characters-title">キャラクター</h2>
      {data.characters.length > 0 && <><label className="field-label" htmlFor="aion2-character-select">表示するキャラクター<select id="aion2-character-select" value={selected} onChange={event => { setSelected(event.target.value); clearDraft() }}>{data.characters.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="action-row"><button id="aion2-rename" type="button" className="secondary-button" onClick={() => { setRename(character?.name ?? ''); setCharacterError('') }}>名前を編集</button><button id="aion2-character-delete" type="button" className="secondary-button" onClick={() => { if (character) { deleteTarget.current = character.id; setDeleteCharacter(character.id) } }}>キャラクターを削除</button></div></>}
      {deleteCharacter && <section className="aion2-restore-preview" aria-label="キャラクター削除の確認"><p>「{data.characters.find(item => item.id === deleteCharacter)?.name}」とその全タスクを削除します。</p><div className="action-row"><button id="aion2-character-delete-confirm" type="button" className="primary-button" onClick={() => { const target = deleteTarget.current; deleteTarget.current = null; if (!target) return; const characters = data.characters.filter(item => item.id !== target); commit({ ...data, characters }, 'キャラクターとそのタスクを削除しました。', characters[0]?.id ?? ''); clearDraft(); focusUndo() }}>確認したキャラクターを削除</button><button id="aion2-character-delete-cancel" type="button" className="secondary-button" onClick={() => { deleteTarget.current = null; setDeleteCharacter(null) }}>やめる</button></div></section>}
      {rename !== null && character && <form onSubmit={event => { event.preventDefault(); try { replace({ ...character, name: checkedText(rename, 'キャラクター名', 40) }, '名前を変更しました。'); setRename(null); setCharacterError('') } catch (cause) { setCharacterError((cause as Error).message) } }}><label className="field-label" htmlFor="aion2-rename-input">新しい名前<input id="aion2-rename-input" type="text" autoComplete="off" value={rename} aria-describedby={characterDescription} onChange={event => { setRename(event.target.value); setCharacterError('') }} /></label><div className="action-row"><button className="primary-button" id="aion2-rename-save">名前を保存</button><button type="button" className="secondary-button" onClick={() => { setRename(null); setCharacterError('') }}>編集をやめる</button></div></form>}
      <form onSubmit={event => { event.preventDefault(); try { const next = { id: crypto.randomUUID(), name: checkedText(name, 'キャラクター名', 40), tasks: [] }; commit({ ...data, characters: [...data.characters, next] }, 'キャラクターを追加しました。', next.id); setName(''); clearDraft(); requestAnimationFrame(() => taskInput.current?.focus()) } catch (cause) { setCharacterError((cause as Error).message) } }}><label className="field-label" htmlFor="aion2-character-name">追加するキャラクター名<input id="aion2-character-name" type="text" autoComplete="off" value={name} aria-describedby={characterDescription} onChange={event => { setName(event.target.value); setCharacterError('') }} /></label><button id="aion2-character-add" className="primary-button">キャラクターを追加</button></form>
      <p id="aion2-character-help" className="calculation-help">名前は40文字相当以内・改行なし。20人まで。サーバー等の区別も名前に含められます。</p>
      {characterError && <p id="aion2-character-error" className="error-box" role="alert">{characterError}</p>}
    </section>
    <section className="tool-panel" aria-labelledby="aion2-tasks-title"><h2 id="aion2-tasks-title">{character ? character.name + 'のチェック表' : 'やること'}</h2>
      {!character ? <p>まずキャラクター名を入力して追加してください。</p> : <>
        <form onSubmit={event => { event.preventDefault(); try { const value = checkedText(title, 'やること', 120); const tasks = editing ? character.tasks.map(task => task.id === editing ? { ...task, title: value, period } : task) : [...character.tasks, { id: crypto.randomUUID(), title: value, period, done: false }]; replace({ ...character, tasks }, editing ? 'やることを変更しました。' : 'やることを追加しました。'); setTitle(''); setEditing(null); setTaskError(''); taskInput.current?.focus() } catch (cause) { setTaskError((cause as Error).message) } }}>
          <div className="aion2-task-fields"><label className="field-label" htmlFor="aion2-task-title">やること<input ref={taskInput} id="aion2-task-title" type="text" autoComplete="off" value={title} aria-describedby={taskDescription} onChange={event => { setTitle(event.target.value); setTaskError('') }} /></label><label className="field-label" htmlFor="aion2-task-period">区分<select id="aion2-task-period" value={period} aria-describedby={taskDescription} onChange={event => { setPeriod(event.target.value as Period); setTaskError('') }}>{periods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
          <div className="action-row"><button id="aion2-task-add" className="primary-button">{editing ? '変更を保存' : 'やることを追加'}</button>{editing && <button id="aion2-edit-cancel" className="secondary-button" type="button" onClick={() => { setEditing(null); setTitle(''); setTaskError('') }}>編集をやめる</button>}</div>
        </form><p id="aion2-task-help" className="calculation-help">120文字相当以内・改行なし。1人100件、全体1,000件まで。登録済みのやることは編集できます。</p>
        {taskError && <p id="aion2-task-error" className="error-box" role="alert">{taskError}</p>}
        <div className="aion2-periods">{periods.map(([value, label]) => { const progress = taskProgress(character, value); return <section key={value} aria-labelledby={'aion2-' + value + '-title'}><h3 id={'aion2-' + value + '-title'}>{label} <span className="aion2-progress-text">{progress.done}/{progress.total}件完了</span></h3><progress value={progress.done} max={Math.max(1, progress.total)} aria-label={label + 'の進捗'} />
          {progress.total === 0 ? <p className="calculation-help">{label}はまだ登録されていません。</p> : <ul className="aion2-task-list">{character.tasks.filter(task => task.period === value).map(task => <li className="aion2-task-row" key={task.id} data-task-id={task.id}><label><input className="aion2-task-check" type="checkbox" checked={task.done} onChange={event => replace({ ...character, tasks: character.tasks.map(item => item.id === task.id ? { ...item, done: event.target.checked } : item) }, event.target.checked ? '完了にしました。' : '未完了にしました。')} /><span>{task.title}</span></label><div className="aion2-task-actions"><button type="button" className="text-button" aria-label={task.title + 'を編集'} onClick={() => { setEditing(task.id); setTitle(task.title); setPeriod(task.period); setTaskError(''); requestAnimationFrame(() => taskInput.current?.focus()) }}>編集</button><button type="button" className="text-button" aria-label={task.title + 'を削除'} onClick={() => { const target = { characterId: character.id, taskId: task.id }; taskDeleteTarget.current = target; setDeleteTask(target) }}>削除</button></div></li>)}</ul>}
          <button id={'aion2-reset-' + value} type="button" className="secondary-button" disabled={progress.done === 0} onClick={() => { replace(resetTasks(character, value), label + 'を未完了にしました。'); focusUndo() }}>{label}を未完了に</button>
        </section> })}</div>
      </>}
      {deleteTask && <section className="aion2-restore-preview" aria-label="やること削除の確認"><p>「{data.characters.find(item => item.id === deleteTask.characterId)?.tasks.find(item => item.id === deleteTask.taskId)?.title}」を削除します。</p><div className="action-row"><button id="aion2-task-delete-confirm" type="button" className="primary-button" onClick={() => { const target = taskDeleteTarget.current; taskDeleteTarget.current = null; setDeleteTask(null); if (!target) return; const owner = data.characters.find(item => item.id === target.characterId); if (!owner) return; replace({ ...owner, tasks: owner.tasks.filter(item => item.id !== target.taskId) }, 'やることを削除しました。'); if (editing === target.taskId) { setEditing(null); setTitle(''); setTaskError('') } focusUndo() }}>確認したやることを削除</button><button id="aion2-task-delete-cancel" type="button" className="secondary-button" onClick={() => { taskDeleteTarget.current = null; setDeleteTask(null) }}>やめる</button></div></section>}
      <p className="calculation-status" role="status" aria-live="polite">{notice}</p><button id="aion2-undo" ref={undoButton} className="secondary-button" type="button" disabled={!undo} onClick={() => { if (undo) { commit(undo.data, '直前の変更を取り消しました。', undo.selected, false); clearDraft() } }}>直前の変更を取り消す</button><p className="calculation-help">削除・未完了への変更も、次の変更まで取り消せます。再読込・ページ移動で取消履歴は消えます。</p>
    </section>
    <section className="tool-panel" aria-labelledby="aion2-backup-title"><h2 id="aion2-backup-title">保存・バックアップ</h2>
      <p className="calculation-help">キャラクター・やること・完了チェックを、このブラウザに保存します。アカウント同期はありません。ゲームの必須日課や回数の一覧ではなく、自分用のチェック表です。自動リセットは行いません。</p>
      {(warning || lockWarning) && <><p id="aion2-storage-error" className="error-box" role="alert">{warning || lockWarning}</p><button id="aion2-save-retry" type="button" className="secondary-button" disabled={conflict} onClick={async () => { const token = revision.current; if (!await acquireWriter() || token !== revision.current) return; if (blocked) { setSaveConfirm(true); return } if (persist(data)) setNotice('この画面の内容を保存しました。') }}>この内容で保存を再試行</button>{saveConfirm && <div className="aion2-restore-preview"><p>読み込めなかった保存データを、この画面の内容で上書きします。</p><button id="aion2-save-confirm" type="button" className="primary-button" disabled={conflict} onClick={() => { if (persist(data)) setNotice('この画面の内容を保存しました。') }}>上書きして保存</button><button type="button" className="secondary-button" onClick={() => setSaveConfirm(false)}>やめる</button></div>}</>}
      <button id="aion2-export" type="button" className="secondary-button" onClick={() => { if (download.current) URL.revokeObjectURL(download.current); const url = URL.createObjectURL(new Blob([encodeChecklist(data)], { type: 'application/json' })); download.current = url; const link = document.createElement('a'); link.href = url; link.download = 'poketsuru-aion2-checklist.json'; link.click(); setNotice('JSONを書き出しました。ダウンロード先を確認してください。') }}>JSONを書き出す</button>
      <label className="field-label" htmlFor="aion2-import">JSONから復元<input id="aion2-import" type="file" accept=".json,application/json" aria-describedby={'aion2-import-help' + (importError ? ' aion2-import-error' : '')} onChange={async event => { const file = event.target.files?.[0]; event.currentTarget.value = ''; const token = ++revision.current; setPreview(null); setConfirmed(false); setImportError(''); if (!file) { setReading(false); return } setReading(true); try { if (file.size > MAX_JSON_BYTES) throw Error('JSONは1 MiBまでです。'); const next = decodeChecklist(await file.text()); if (token === revision.current) setPreview(next) } catch (cause) { if (token === revision.current) setImportError((cause as Error).message) } finally { if (token === revision.current) setReading(false) } }} /></label>
      <p id="aion2-import-help" className="calculation-help">このツールで書き出したJSON、1 MiBまで。内容を確認してから、全キャラクターを置き換えます。</p>{reading && <p role="status">JSONを確認しています…</p>}{importError && <p id="aion2-import-error" role="alert" className="error-box">{importError}</p>}
      {preview && <section className="aion2-restore-preview" aria-label="復元の確認"><h3>復元する内容</h3><p>{preview.characters.length}キャラクター・{preview.characters.reduce((sum, item) => sum + item.tasks.length, 0)}タスク・{preview.characters.reduce((sum, item) => sum + item.tasks.filter(task => task.done).length, 0)}件完了</p><ul>{preview.characters.map(item => <li key={item.id}>{item.name}（{item.tasks.length}件）</li>)}</ul><p>現在の全{data.characters.length}キャラクターと完了チェックを置き換えます。先にJSONを書き出すと退避できます。</p><label className="aion2-confirm"><input id="aion2-import-confirm" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />全キャラクターを置き換えることを確認しました</label><div className="action-row"><button id="aion2-import-apply" type="button" className="primary-button" disabled={!confirmed} onClick={() => { commit(preview, 'JSONから復元しました。', preview.characters[0]?.id ?? ''); clearDraft(); focusUndo() }}>確認した内容で復元</button><button id="aion2-import-cancel" type="button" className="secondary-button" onClick={() => { revision.current++; setPreview(null); setConfirmed(false) }}>復元をやめる</button></div></section>}
    </section>
    <section className="tool-info"><h2>入力データについて</h2><p>このチェック表だけは、キャラクター名・タスク・完了状態を端末のブラウザ内に保存します。送信・URLへの埋め込みはしません。共有PCやブラウザのデータ消去に注意し、必要ならJSONを保管してください。書き出したJSONにも入力内容が含まれます。</p><p>ゲームとの連携や公式の必須日課・報酬・回数・リセット時刻の提供はありません。手動で日課・週課を未完了に戻してください。同時に保存するタブは1つに制限します。別タブの内容は自動更新しません。衝突した場合はJSONへ退避してから再読込してください。安全なタブ間保存を利用できないブラウザでは、変更を保存せずJSONで退避できます。</p></section>
  </div>
}
