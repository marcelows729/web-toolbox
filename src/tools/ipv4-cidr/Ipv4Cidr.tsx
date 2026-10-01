import { useState } from 'react'
import BrowserTool from '../../components/tools/BrowserTool'
import { useToolResult } from '../../components/tools/useToolResult'

import { calculateCidr } from './cidr'

export default function Ipv4Cidr() {
  const [address, setAddress] = useState('')
  const [prefix, setPrefix] = useState('24')
  const result = useToolResult()
  const calculate = () => {
    const value = calculateCidr(address, prefix)
    return [
      `ネットワーク: ${value.network}/${value.prefix}`,
      `サブネットマスク: ${value.mask}`,
      `全アドレス範囲: ${value.first} 〜 ${value.last}`,
      `総アドレス数: ${value.total}`,
      `利用可能ホスト範囲: ${value.hostFirst} 〜 ${value.hostLast}`,
      `利用可能ホスト数: ${value.hostCount}`,
      `ブロードキャスト: ${value.broadcast}`,
    ].join('\n')
  }
  return (
    <BrowserTool title="IPv4 CIDR計算" description="ネットワークアドレス、マスク、全アドレス範囲とホスト範囲を計算します。" result={result}
      onClear={() => { setAddress(''); setPrefix('24'); result.reset() }}
      usage={<>
        <p>IPv4アドレスとプレフィックス長を別々に入力します。IPv6は対象外です。前後の空白を除去し、オクテットの先頭ゼロは10進数として扱います。</p>
        <p>/0〜/30は先頭をネットワーク、末尾をブロードキャストとしてホスト範囲から除外します。/0の総数は4,294,967,296、ホスト数は4,294,967,294です。</p>
        <p>/31はポイントツーポイント接続を想定して両方のアドレスを利用可能とし、/32は単一ホストとして扱います。ホスト範囲はCIDR上の計算値であり、予約・特殊用途のアドレスを除外せず、実際の割り当て可否を保証しません。</p>
      </>}>
      <label className="field-label" htmlFor="cidr-address">IPv4アドレス</label>
      <input id="cidr-address" type="text" placeholder="192.168.1.10" value={address} onChange={event => { setAddress(event.target.value); result.reset() }} />
      <label className="field-label" htmlFor="cidr-prefix">プレフィックス長（0〜32）</label>
      <input id="cidr-prefix" type="text" inputMode="numeric" value={prefix} onChange={event => { setPrefix(event.target.value); result.reset() }} />
      <div className="action-row"><button type="button" className="primary-button" disabled={result.busy} onClick={() => void result.run(calculate)}>計算</button></div>
    </BrowserTool>
  )
}
