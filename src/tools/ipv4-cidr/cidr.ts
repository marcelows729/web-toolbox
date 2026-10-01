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

