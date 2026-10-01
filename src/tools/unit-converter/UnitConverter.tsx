import { useState } from 'react'
import BrowserTool, { useToolResult } from '../../components/tools/BrowserTool'
import { convertMeasurement, formatMeasurement, parseMeasurement, unitGroups } from './conversion'
import type { UnitGroup } from './conversion'

export default function UnitConverter() {
  const [group, setGroup] = useState<UnitGroup>('length')
  const [value, setValue] = useState('1')
  const [from, setFrom] = useState('m')
  const [to, setTo] = useState('cm')
  const result = useToolResult()
  const units = unitGroups[group].units
  const reset = () => { setValue(''); setGroup('length'); setFrom('m'); setTo('cm'); result.reset() }
  return <BrowserTool title="単位変換" description="長さ・重量・体積・面積・温度を、いつもの単位に。" result={result} outputRows={2} onClear={reset} usage={<><p>換算定数はNIST SP 811、温度はNISTの換算式に基づきます。表示は最大12桁の有効数字に丸め、大きい値・小さい値は指数表記になります。温度は絶対零度以上、その他は0以上で入力してください。</p><p>畳・カップ・通貨など定義が変わる単位は対象外です。入替は単位だけを交換します。</p><a href="https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9" target="_blank" rel="noreferrer">NIST換算表</a> · <a href="https://www.nist.gov/pml/owm/si-units-temperature" target="_blank" rel="noreferrer">温度換算式</a></>}>
    <div className="toggle-group" role="group" aria-label="単位の種類">{(Object.keys(unitGroups) as UnitGroup[]).map(key => <button className={`toggle-option ${key === group ? 'is-selected' : ''}`} aria-pressed={key === group} key={key} onClick={() => { setGroup(key); setFrom(unitGroups[key].units[0].id); setTo(unitGroups[key].units[1].id); result.reset() }}>{unitGroups[key].name}</button>)}</div>
    <label className="field-label" htmlFor="measurement-value">変換する値</label><input id="measurement-value" type="text" inputMode="decimal" value={value} onChange={e => { setValue(e.target.value); result.reset() }} />
    <div className="everyday-columns">{[['from-unit', '変換元', from, setFrom], ['to-unit', '変換先', to, setTo]].map(([id, label, selected, setter]) => <label className="field-label" key={id as string} htmlFor={id as string}>{label as string}<select id={id as string} value={selected as string} onChange={e => { (setter as typeof setFrom)(e.target.value); result.reset() }}>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>)}</select></label>)}</div>
    <div className="action-row"><button className="primary-button" id="convert-units" onClick={() => void result.run(() => `${formatMeasurement(convertMeasurement(parseMeasurement(value), group, from, to))} ${units.find(unit => unit.id === to)?.symbol}`)}>変換する</button><button className="secondary-button" id="swap-units" onClick={() => { setFrom(to); setTo(from); result.reset() }}>単位を入れ替える</button></div>
  </BrowserTool>
}
