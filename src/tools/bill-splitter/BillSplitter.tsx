import { useState } from 'react'
import BrowserTool from '../../components/tools/BrowserTool'
import { useToolResult } from '../../components/tools/useToolResult'
import { billSummary, parseBillInteger, splitBill, yen } from './splitBill'
import type { BillSplit, CollectionMode } from './splitBill'

export default function BillSplitter() {
  const [total, setTotal] = useState('1000')
  const [people, setPeople] = useState('3')
  const [mode, setMode] = useState<CollectionMode>('exact')
  const [split, setSplit] = useState<BillSplit | null>(null)
  const result = useToolResult()
  const clearResult = () => { setSplit(null); result.reset() }
  return <BrowserTool title="割り勘計算" description="1円もずれない配分と、集めやすい金額を。" result={result} outputRows={5} onClear={() => { setTotal(''); setPeople('3'); setMode('exact'); clearResult() }} usage={<p>合計は0〜10億円、人数は1〜100人の整数です。正確に配分すると差は最大1円。10円・100円単位では全員から同額を切り上げて集金し、支払後の余りを表示します。余りを自動配分する機能はありません。</p>}>
    <div className="everyday-columns"><label className="field-label" htmlFor="bill-total">合計金額（円）<input aria-describedby={result.error ? 'tool-error' : undefined} id="bill-total" type="text" inputMode="numeric" value={total} onChange={e => { setTotal(e.target.value); clearResult() }} /></label><label className="field-label" htmlFor="bill-people">人数（人）<input aria-describedby={result.error ? 'tool-error' : undefined} id="bill-people" type="text" inputMode="numeric" value={people} onChange={e => { setPeople(e.target.value); clearResult() }} /></label></div>
    <div className="toggle-group" role="group" aria-label="集金方法">{(['exact', '10', '100'] as CollectionMode[]).map(key => <button key={key} id={`bill-mode-${key}`} className={`toggle-option ${key === mode ? 'is-selected' : ''}`} aria-pressed={key === mode} onClick={() => { setMode(key); clearResult() }}>{key === 'exact' ? '正確に配分' : `${key}円単位`}</button>)}</div>
    <button className="primary-button" id="split-bill" onClick={() => void result.run(() => { const next = splitBill(parseBillInteger(total, 0, 1000000000, '合計金額'), parseBillInteger(people, 1, 100, '人数'), mode); setSplit(next); return billSummary(next) })}>割り勘を計算する</button>
    {split && <div className="bill-result" aria-label="配分結果">{split.groups.map(item => <div className="bill-group" key={item.amount}><strong>{yen(item.amount)}</strong><span>× {item.count}人</span></div>)}<p>集金合計 <strong>{yen(split.collected)}</strong> ／ 余り <strong>{yen(split.change)}</strong></p>{split.change > 0 && <p>余った金額の扱いは、参加者と相談してください。</p>}</div>}
  </BrowserTool>
}
