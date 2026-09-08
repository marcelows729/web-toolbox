import { useState } from 'react'
import BrowserTool, { useToolResult } from '../../components/tools/BrowserTool'

function ipv4(value: number): string {
  return [24, 16, 8, 0].map(shift => Math.floor(value / 2 ** shift) % 256).join('.')
}

export function calculateCidr(address: string, prefixText: string) {
  const parts = address.trim().split('.')
  if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) {
    throw new Error('IPv4を0〜255の4つの整数で入力してください。例: 192.168.1.10')
  }
  const prefixValue = prefixText.trim()
  if (!/^\d{1,2}$/.test(prefixValue) || Number(prefixValue) > 32) {
    throw new Error('プレフィックス長を0〜32の整数で入力してください。')
  }
  const prefix = Number(prefixValue)
  const addressValue = parts.reduce((value, part) => value * 256 + Number(part), 0)
  const total = 2 ** (32 - prefix)
  const first = Math.floor(addressValue / total) * total
  const last = first + total - 1
  const hostFirst = prefix >= 31 ? first : first + 1
  const hostLast = prefix >= 31 ? last : last - 1
  return {
    network: ipv4(first),
    mask: ipv4(2 ** 32 - total),
    first: ipv4(first),
    last: ipv4(last),
    total,
    hostFirst: ipv4(hostFirst),
    hostLast: ipv4(hostLast),
    hostCount: prefix >= 31 ? total : total - 2,
    broadcast: prefix >= 31 ? 'なし（このツールの/31・/32の扱い）' : ipv4(last),
    prefix,
  }
}

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
