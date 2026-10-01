export const MAX_HASH_BYTES = 20 * 1024 * 1024

export function validateHashSize(size: number) {
  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_HASH_BYTES) {
    throw new Error('入力の上限は20 MiB（20,971,520バイト）です。')
  }
}

export function normalizeExpected(value: string): string {
  const expected = value.trim()
  if (expected && !/^[0-9a-f]{64}$/i.test(expected)) {
    throw new Error('期待値は64桁の16進数で入力してください。照合しない場合は空欄にします。')
  }
  return expected.toLowerCase()
}

export async function sha256Bytes(bytes: ArrayBuffer, subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle): Promise<string> {
  validateHashSize(bytes.byteLength)
  if (!subtle) throw new Error('SHA-256を利用できません。HTTPSまたはlocalhostでWeb Crypto API対応ブラウザを使用してください。')
  try {
    const digest = await subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  } catch {
    throw new Error('SHA-256の計算に失敗しました。ブラウザの対応状況と使用可能なメモリを確認してください。')
  }
}

export async function sha256Text(text: string): Promise<string> {
  // UTF-16の長さによる事前チェックの後、UTF-8の正確なバイト数を確認する。
  validateHashSize(text.length)
  const bytes = new TextEncoder().encode(text)
  validateHashSize(bytes.byteLength)
  return sha256Bytes(bytes.buffer)
}

