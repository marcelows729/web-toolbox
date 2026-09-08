import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash, webcrypto } from 'node:crypto'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Node.js 24で実行。既存のTypeScriptをメモリ内で変換し、生成物は保存しない。
// 型チェックは別途 npm run build で行う。
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL) {
      const candidate = new URL(specifier, context.parentURL)
      for (const extension of ['.ts', '.tsx']) {
        const target = new URL(`${candidate.href}${extension}`)
        if (existsSync(target)) return { url: target.href, shortCircuit: true }
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && /\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        fileName: fileURLToPath(url),
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText
      return { source, format: 'module', shortCircuit: true }
    }
    return nextLoad(url, context)
  },
})

const { calculateCidr } = await import('../src/tools/ipv4-cidr/Ipv4Cidr.tsx')
const { sha256Bytes, sha256Text, validateHashSize, normalizeExpected, MAX_HASH_BYTES } = await import('../src/tools/sha256/Sha256.tsx')
const { convertRadix } = await import('../src/tools/radix-converter/RadixConverter.tsx')
const { escapeHtml, unescapeHtml } = await import('../src/tools/html-escape/HtmlEscape.tsx')
const { calculatePercentage } = await import('../src/tools/percentage-calculator/PercentageCalculator.tsx')
const { default: BrowserTool } = await import('../src/components/tools/BrowserTool.tsx')
const { tools } = await import('../src/tools/registry.ts')

test('CIDR: 通常の/24と符号付き32bit境界', () => {
  const value = calculateCidr('192.168.1.123', '24')
  assert.equal(value.network, '192.168.1.0')
  assert.equal(value.mask, '255.255.255.0')
  assert.equal(value.last, '192.168.1.255')
  assert.equal(value.hostFirst, '192.168.1.1')
  assert.equal(value.hostLast, '192.168.1.254')
  assert.equal(value.total, 256)
  assert.equal(value.hostCount, 254)
  assert.equal(calculateCidr('255.255.255.255', '1').network, '128.0.0.0')
  assert.equal(calculateCidr(' 010.000.000.001 ', ' 8 ').network, '10.0.0.0')
})

test('CIDR: /0・/31・/32', () => {
  const zero = calculateCidr('192.168.1.1', '0')
  assert.equal(zero.network, '0.0.0.0')
  assert.equal(zero.mask, '0.0.0.0')
  assert.equal(zero.last, '255.255.255.255')
  assert.equal(zero.total, 4294967296)
  assert.equal(zero.hostFirst, '0.0.0.1')
  assert.equal(zero.hostLast, '255.255.255.254')
  assert.equal(zero.hostCount, 4294967294)
  const pair = calculateCidr('192.0.2.11', '31')
  assert.equal(pair.hostFirst, '192.0.2.10')
  assert.equal(pair.hostLast, '192.0.2.11')
  assert.equal(pair.hostCount, 2)
  assert.equal(pair.mask, '255.255.255.254')
  const single = calculateCidr('255.255.255.255', '32')
  assert.equal(single.hostFirst, '255.255.255.255')
  assert.equal(single.hostLast, single.hostFirst)
  assert.equal(single.total, 1)
  assert.equal(single.hostCount, 1)
  assert.equal(single.mask, '255.255.255.255')
})

test('CIDR: 不正入力', () => {
  for (const ip of ['', '::1', '256.1.2.3', '1.2.3', '1.2.3.4.5', '-1.2.3.4', '1. 2.3.4', '1e2.2.3.4']) {
    assert.throws(() => calculateCidr(ip, '24'))
  }
  for (const prefix of ['', '-1', '33', '1.5', '/24', '1e1']) assert.throws(() => calculateCidr('1.2.3.4', prefix))
})

test('SHA-256: 空入力・abcの既知値、UTF-8、改行保持', async () => {
  assert.equal(await sha256Text(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  assert.equal(await sha256Text('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.equal(await sha256Bytes(new ArrayBuffer(0), webcrypto.subtle), await sha256Text(''))
  for (const text of ['日本語😀', 'abc\n', 'abc\r\n', ' abc ', '\uFEFFabc']) {
    assert.equal(await sha256Text(text), createHash('sha256').update(text, 'utf8').digest('hex'))
  }
  assert.notEqual(await sha256Text('abc\n'), await sha256Text('abc'))
})

test('SHA-256: バイナリファイルと容量境界', async () => {
  const file = new File([new Uint8Array([0, 255, 128, 10])], 'binary.bin')
  const bytes = await file.arrayBuffer()
  assert.equal(await sha256Bytes(bytes), createHash('sha256').update(new Uint8Array(bytes)).digest('hex'))
  validateHashSize(0)
  validateHashSize(MAX_HASH_BYTES)
  assert.throws(() => validateHashSize(MAX_HASH_BYTES + 1))
  assert.throws(() => validateHashSize(-1))
  await assert.rejects(sha256Bytes(new ArrayBuffer(MAX_HASH_BYTES + 1)), /上限/)
})

test('SHA-256: 期待値形式とAPI失敗', async () => {
  const hash = await sha256Text('abc')
  assert.equal(normalizeExpected(` ${hash.toUpperCase()} `), hash)
  assert.equal(normalizeExpected('  '), '')
  for (const expected of ['abc', 'g'.repeat(64), 'a'.repeat(63), 'a'.repeat(65)]) assert.throws(() => normalizeExpected(expected))
  assert.notEqual(normalizeExpected('0'.repeat(64)), hash)
  await assert.rejects(sha256Bytes(new ArrayBuffer(0), null), /利用できません/)
  await assert.rejects(sha256Bytes(new ArrayBuffer(0), { digest: async () => { throw new Error('failure') } }), /計算に失敗/)
})

test('進数: 相互変換・負数・接頭辞・大きな整数', () => {
  const expected = '2進数: 11111111\n8進数: 377\n10進数: 255\n16進数: ff'
  for (const [text, radix] of [['11111111', 2], ['0o377', 8], ['+00255', 10], ['0XFF', 16]]) assert.equal(convertRadix(text, radix), expected)
  assert.equal(convertRadix('-0xff', 16), '2進数: -11111111\n8進数: -377\n10進数: -255\n16進数: -ff')
  assert.match(convertRadix('9007199254740993', 10), /16進数: 20000000000001$/)
  assert.match(convertRadix('-0', 10), /10進数: 0\n/)
  assert.doesNotThrow(() => convertRadix('f'.repeat(4096), 16))
  assert.throws(() => convertRadix('f'.repeat(4097), 16))
})

test('進数: 不正な桁、小数、接頭辞不一致', () => {
  for (const [text, base] of [['', 10], ['2', 2], ['8', 8], ['0xff', 10], ['0b10', 16], ['0x', 16], ['1.5', 10], ['1e3', 10], ['1_000', 10], ['--1', 10], ['+ 1', 10]]) assert.throws(() => convertRadix(text, base))
  assert.throws(() => convertRadix('10', 3))
})

test('HTML: 基本5文字、数値参照、1回だけの解除', () => {
  assert.equal(escapeHtml('&<>"\''), '&amp;&lt;&gt;&quot;&#39;')
  assert.equal(unescapeHtml('&amp;&lt;&gt;&quot;&apos;'), '&<>"\'')
  assert.equal(unescapeHtml('&#38;&#60;&#62;&#34;&#39;'), '&<>"\'')
  assert.equal(unescapeHtml('&#x26;&#X3C;&#x3e;&#x22;&#00039;'), '&<>"\'')
  assert.equal(unescapeHtml('&amp;lt;'), '&lt;')
  assert.equal(unescapeHtml('&nbsp; &#65; &AMP; &lt &#xZZ;'), '&nbsp; &#65; &AMP; &lt &#xZZ;')
  assert.equal(escapeHtml(''), '')
  assert.equal(unescapeHtml(''), '')
  assert.equal(unescapeHtml(escapeHtml('日本語😀<&>')), '日本語😀<&>')
})

test('共通出力: HTMLをマークアップとして挿入しない', () => {
  const output = '</textarea><script>alert(1)</script><img src=x onerror=alert(1)>'
  const markup = renderToStaticMarkup(createElement(BrowserTool, {
    title: 'test', description: 'test', usage: 'test', onClear() {},
    result: { output, busy: false, error: '', feedback: '', copy() {}, reset() {}, run() {} },
  }))
  assert.ok(!markup.includes('<script>'))
  assert.ok(!markup.includes('<img'))
  assert.ok(markup.includes('&lt;script&gt;'))
})

test('割合: 3モードと負数・100%超', () => {
  assert.equal(calculatePercentage('ratio', '25', '200', 2), '12.50%')
  assert.equal(calculatePercentage('portion', '200', '12.5', 2), '25.00')
  assert.equal(calculatePercentage('change', '100', '125', 2), '25.00%')
  assert.equal(calculatePercentage('ratio', '250', '100', 2), '250.00%')
  assert.equal(calculatePercentage('change', '-100', '-50', 2), '-50.00%')
  assert.equal(calculatePercentage('portion', '-200', '150', 2), '-300.00')
  assert.equal(calculatePercentage('portion', '0', '150', 2), '0.00')
  assert.equal(calculatePercentage('ratio', '1', '-2', 2), '-50.00%')
})

test('割合: 10進数の正確な丸めと大きな値', () => {
  assert.equal(calculatePercentage('portion', '1.005', '100', 2), '1.01')
  assert.equal(calculatePercentage('portion', '-1.005', '100', 2), '-1.01')
  assert.equal(calculatePercentage('portion', '-0.004', '100', 2), '0.00')
  assert.equal(calculatePercentage('ratio', '1', '3', 10), '33.3333333333%')
  assert.equal(calculatePercentage('portion', '2.5', '100', 0), '3')
  assert.equal(calculatePercentage('portion', '9007199254740993', '100', 0), '9007199254740993')
  assert.equal(calculatePercentage('portion', ' +.5 ', '100', 2), '0.50')
})

test('割合: ゼロ分母・不正入力・桁数制限', () => {
  assert.throws(() => calculatePercentage('ratio', '0', '0', 2), /分母/)
  assert.throws(() => calculatePercentage('change', '-0.00', '1', 2), /分母/)
  for (const value of ['', 'NaN', 'Infinity', '1e3', '1,000', '1.', '--1', '1 2', '1'.repeat(101), '0.' + '1'.repeat(21)]) {
    assert.throws(() => calculatePercentage('portion', value, '100', 2))
  }
  assert.doesNotThrow(() => calculatePercentage('portion', '1'.repeat(100), '100', 10))
  assert.doesNotThrow(() => calculatePercentage('portion', '0.' + '1'.repeat(20), '100', 10))
  for (const places of [-1, 11, 1.5]) assert.throws(() => calculatePercentage('portion', '1', '1', places))
})

test('登録: 16件、ID・パス重複なし、新規5件に明示的ルートあり', () => {
  assert.equal(tools.length, 16)
  assert.equal(new Set(tools.map(tool => tool.id)).size, 16)
  assert.equal(new Set(tools.map(tool => tool.path)).size, 16)
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const [id, category, component] of [
    ['ipv4-cidr', 'network', 'Ipv4Cidr'],
    ['sha256', 'developer', 'Sha256'],
    ['radix-converter', 'developer', 'RadixConverter'],
    ['html-escape', 'text', 'HtmlEscape'],
    ['percentage-calculator', 'general', 'PercentageCalculator'],
  ]) {
    const tool = tools.find(entry => entry.id === id)
    assert.ok(tool)
    assert.equal(tool.category, category)
    assert.equal(tool.path, `/tools/${id}`)
    assert.ok(tool.name && tool.description && tool.keywords.length)
    assert.ok(app.includes(`<Route path="${tool.path}" element={<${component} />} />`))
  }
  for (const tool of tools) {
    for (const related of tool.relatedTools ?? []) assert.ok(tools.some(entry => entry.id === related))
  }
})
