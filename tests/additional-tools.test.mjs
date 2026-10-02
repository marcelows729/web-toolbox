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

const { calculateCidr } = await import('../src/tools/ipv4-cidr/cidr.ts')
const { sha256Bytes, sha256Text, validateHashSize, normalizeExpected, MAX_HASH_BYTES } = await import('../src/tools/sha256/hash.ts')
const { convertRadix } = await import('../src/tools/radix-converter/radix.ts')
const { escapeHtml, unescapeHtml } = await import('../src/tools/html-escape/htmlEntities.ts')
const { calculatePercentage } = await import('../src/tools/percentage-calculator/percentage.ts')
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

test('登録: 23件、ID・パス重複なし、新規5件に明示的ルートあり', () => {
  assert.equal(tools.length, 23)
  assert.equal(new Set(tools.map(tool => tool.id)).size, 23)
  assert.equal(new Set(tools.map(tool => tool.path)).size, 23)
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

test('カテゴリ: light/darkの選択・非選択・hoverで文字コントラストを保つ', () => {
  const css = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m, order) => ({ selector: m[1].trim(), body: m[2], order }))
  const declarations = body => Object.fromEntries([...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))
  const luminance = hex => {
    assert.match(hex, /^#[0-9a-f]{6}$/i)
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
  }
  for (const theme of ['light', 'dark']) {
    const variables = Object.assign({}, ...rules.filter(r => r.selector === ':root' || (theme === 'dark' && r.selector === ":root[data-theme='dark']")).map(r => declarations(r.body)))
    const resolve = value => value.replace(/var\((--[\w-]+)\)/g, (_, key) => variables[key])
    for (const selected of [false, true]) for (const hover of [false, true]) {
      const applicable = new Set(['button', '.category-filter', ...(hover ? ['button:hover', '.category-filter:hover'] : []), ...(selected ? ['.category-filter.is-selected'] : [])])
      const matches = rules.filter(r => applicable.has(r.selector)).map(r => ({ ...r, specificity: (r.selector.match(/[.:]/g) ?? []).length * 100 + (r.selector.startsWith('button') ? 1 : 0) })).sort((a, b) => a.specificity - b.specificity || a.order - b.order)
      const style = Object.assign({}, ...matches.map(r => declarations(r.body)))
      const bg = luminance(resolve(style.background))
      const fg = luminance(resolve(style.color))
      assert.ok((Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05) >= 4.5, `${theme}, selected=${selected}, hover=${hover}`)
    }
  }
})

const { emptyShelf, parseShelf, updateShelf, loadShelf, saveShelf, SHELF_KEY, RECENT_LIMIT } = await import('../src/state/toolShelf.ts')

test('道具棚: 不正・未知バージョン・過大な保存データから安全に復元', () => {
  for (const raw of [null, '', '{', 'null', '[]', '42', '{"version":2}', ' '.repeat(65537)]) assert.deepEqual(parseShelf(raw), emptyShelf())
  assert.deepEqual(parseShelf(JSON.stringify({ version: 1, favorites: 'json-formatter', recent: null })), emptyShelf())
  assert.deepEqual(parseShelf(JSON.stringify({ version: 1, favorites: ['sha256', 'unknown', 1, 'sha256', 'json-formatter'], recent: ['unknown', 'json-formatter', 'sha256', 'json-formatter'] })), { version: 1, favorites: ['sha256', 'json-formatter'], recent: ['json-formatter', 'sha256'] })
})

test('道具棚: お気に入りの追加・解除・再追加と並び順', () => {
  let shelf = emptyShelf()
  shelf = updateShelf(shelf, { type: 'favorite', id: 'json-formatter' })
  shelf = updateShelf(shelf, { type: 'favorite', id: 'sha256' })
  assert.deepEqual(shelf.favorites, ['sha256', 'json-formatter'])
  shelf = updateShelf(shelf, { type: 'favorite', id: 'json-formatter' })
  assert.deepEqual(shelf.favorites, ['sha256'])
  shelf = updateShelf(shelf, { type: 'favorite', id: 'json-formatter' })
  assert.deepEqual(shelf.favorites, ['json-formatter', 'sha256'])
  assert.deepEqual(shelf.recent, [])
  assert.equal(updateShelf(shelf, { type: 'favorite', id: 'missing' }), shelf)
})

test('道具棚: 最近使用の上限・重複除去・再訪順・消去', () => {
  let shelf = emptyShelf()
  for (const tool of tools) shelf = updateShelf(shelf, { type: 'visit', id: tool.id })
  assert.deepEqual(shelf.recent, tools.slice(-RECENT_LIMIT).reverse().map(tool => tool.id))
  const id = shelf.recent[3]
  shelf = updateShelf(shelf, { type: 'visit', id })
  assert.equal(shelf.recent[0], id)
  assert.equal(shelf.recent.filter(value => value === id).length, 1)
  assert.equal(shelf.recent.length, RECENT_LIMIT)
  assert.equal(updateShelf(shelf, { type: 'visit', id }), shelf)
  assert.equal(updateShelf(shelf, { type: 'visit', id: 'missing' }), shelf)
  shelf = updateShelf(shelf, { type: 'favorite', id })
  const cleared = updateShelf(shelf, { type: 'clear-recent' })
  assert.deepEqual(cleared.recent, [])
  assert.deepEqual(cleared.favorites, [id])
  assert.equal(updateShelf(cleared, { type: 'clear-recent' }), cleared)
  assert.equal(parseShelf(JSON.stringify({ version: 1, recent: tools.map(tool => tool.id) })).recent.length, RECENT_LIMIT)
})

test('道具棚: 保存復元・容量不足・保存拒否を扱い入力内容を保存しない', () => {
  let stored = null
  const storage = { getItem(key) { assert.equal(key, SHELF_KEY); return stored }, setItem(key, value) { assert.equal(key, SHELF_KEY); stored = value } }
  let shelf = updateShelf(emptyShelf(), { type: 'favorite', id: 'sha256' })
  shelf = updateShelf(shelf, { type: 'visit', id: 'json-formatter' })
  assert.equal(saveShelf(storage, shelf), true)
  assert.deepEqual(loadShelf(storage), { shelf, unavailable: false })
  assert.deepEqual(Object.keys(JSON.parse(stored)), ['version', 'favorites', 'recent'])
  const denied = { getItem() { throw new Error('denied') }, setItem() { throw new Error('quota') } }
  assert.deepEqual(loadShelf(denied), { shelf: emptyShelf(), unavailable: true })
  assert.equal(saveShelf(denied, shelf), false)
  assert.deepEqual(shelf.favorites, ['sha256'])
})

test('道具棚UI: 23ツールのリンクと独立したお気に入りボタン', async () => {
  const { MemoryRouter } = await import('react-router-dom')
  const { ToolShelfContext } = await import('../src/state/ToolShelfContext.ts')
  const { default: HomePage } = await import('../src/pages/HomePage.tsx')
  const markup = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ToolShelfContext.Provider, { value: { shelf: emptyShelf(), unavailable: false, toggleFavorite() {}, visit() {}, clearRecent() {} } }, createElement(HomePage))))
  assert.equal((markup.match(/class="tool-card"/g) ?? []).length, 23)
  assert.equal((markup.match(/class="favorite-button"/g) ?? []).length, 23)
  for (const tool of tools) assert.ok(markup.includes(`href="${tool.path}"`))
  for (const link of markup.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) assert.ok(!link[1].includes('<button'), 'ボタンをリンクに入れない')
})


const { convertMeasurement, formatMeasurement, parseMeasurement, unitGroups } = await import('../src/tools/unit-converter/conversion.ts')
const { splitBill, parseBillInteger, billSummary } = await import('../src/tools/bill-splitter/splitBill.ts')
const { parseCandidates, remainingCandidates, uniformIndex, wheelRotation } = await import('../src/tools/roulette-picker/roulette.ts')
test('単位: NISTの定義値・温度・絶対零度', () => {
  assert.equal(convertMeasurement(1, 'length', 'in', 'cm'), 2.54)
  assert.equal(convertMeasurement(1, 'mass', 'kg', 'g'), 1000)
  assert.equal(convertMeasurement(1, 'volume', 'm3', 'L'), 1000)
  assert.equal(convertMeasurement(1, 'area', 'ha', 'm2'), 10000)
  assert.equal(convertMeasurement(-40, 'temperature', 'C', 'F'), -40)
  assert.equal(convertMeasurement(0, 'temperature', 'C', 'F'), 32)
  assert.equal(convertMeasurement(-459.67, 'temperature', 'F', 'K'), 0)
  assert.equal(convertMeasurement(-273.15, 'temperature', 'C', 'K'), 0)
  for (const [from, value] of [['K', -0.001], ['C', -273.151], ['F', -459.671]]) assert.throws(() => convertMeasurement(value, 'temperature', from, from))
})
test('単位: 全単位の同一変換・往復・有限値', () => {
  for (const [group, definition] of Object.entries(unitGroups)) for (const from of definition.units) for (const to of definition.units) {
    assert.equal(convertMeasurement(123.45, group, from.id, from.id), 123.45)
    const converted = convertMeasurement(123.45, group, from.id, to.id)
    const back = convertMeasurement(converted, group, to.id, from.id)
    assert.ok(Math.abs(back - 123.45) < 1e-8, `${group}: ${from.id}/${to.id}`)
  }
})
test('単位: 全角・空欄・無効値・桁あふれ・負のゼロ', () => {
  assert.equal(parseMeasurement(' －４０．５ '), -40.5)
  assert.equal(parseMeasurement('１Ｅ３'), 1000)
  assert.equal(formatMeasurement(-0), '0')
  assert.ok(!formatMeasurement(Number.MAX_VALUE).includes('Infinity'))
  assert.equal(formatMeasurement(1 / 3), '0.333333333333')
  for (const input of ['', ' ', 'Infinity', 'NaN', '1,000', '1cm', '0x10', '1e309', '1e-999']) assert.throws(() => parseMeasurement(input))
  assert.throws(() => convertMeasurement(-1, 'length', 'm', 'cm'))
  assert.throws(() => convertMeasurement(1e308, 'length', 'km', 'mm'))
  assert.throws(() => convertMeasurement(1, 'length', 'unknown', 'm'))
  assert.throws(() => formatMeasurement(Infinity))
})
test('割り勘: 1000円3人・切り上げ集金・0円・1円', () => {
  assert.deepEqual(splitBill(1000, 3, 'exact').groups, [{ amount: 334, count: 1 }, { amount: 333, count: 2 }])
  const rounded = splitBill(1000, 3, '100')
  assert.deepEqual(rounded.groups, [{ amount: 400, count: 3 }])
  assert.equal(rounded.change, 200)
  assert.equal(splitBill(1000, 3, '10').change, 20)
  assert.deepEqual(splitBill(1, 3, 'exact').groups, [{ amount: 1, count: 1 }, { amount: 0, count: 2 }])
  for (const mode of ['exact', '10', '100']) assert.equal(splitBill(0, 3, mode).collected, 0)
  assert.ok(billSummary(rounded).includes('余り：200円'))
})
test('割り勘: 人数・集金・余りの保存則と境界', () => {
  for (const total of [0, 1, 2, 99, 1000, 999999999, 1000000000]) for (let people = 1; people <= 100; people++) for (const mode of ['exact', '10', '100']) {
    const result = splitBill(total, people, mode)
    assert.equal(result.groups.reduce((sum, g) => sum + g.count, 0), people)
    assert.equal(result.groups.reduce((sum, g) => sum + g.amount * g.count, 0), result.collected)
    assert.equal(result.collected - result.change, total)
    assert.ok(result.change >= 0)
    if (mode === 'exact') assert.equal(result.change, 0)
    else { assert.ok(result.change < people * Number(mode)); assert.equal(result.groups[0].amount % Number(mode), 0) }
  }
})
test('割り勘: 全角と不正な金額・人数を拒否', () => {
  assert.equal(parseBillInteger('１０００', 0, 1e9, '金額'), 1000)
  for (const total of [-1, 0.5, 1e9 + 1, Infinity, NaN]) assert.throws(() => splitBill(total, 3, 'exact'))
  for (const people of [0, -1, 101, 1.5, Infinity, NaN]) assert.throws(() => splitBill(1000, people, 'exact'))
  for (const text of ['', '1.5', '-1', '1,000', 'Infinity']) assert.throws(() => parseBillInteger(text, 0, 1e9, '金額'))
})
test('抽選: 候補境界・空行・重複・Unicode・HTML文字列', () => {
  assert.deepEqual(parseCandidates(' A \r\n\r\n 🍵\n<img src=x> '), ['A', '🍵', '<img src=x>'])
  assert.equal(parseCandidates(`${'🍵'.repeat(50)}\nB`)[0].length, 100)
  assert.throws(() => parseCandidates(`${'🍵'.repeat(51)}\nB`))
  assert.equal(parseCandidates(Array.from({ length: 20 }, (_, i) => String(i)).join('\n')).length, 20)
  for (const text of ['', 'A', 'A\n A ', 'é\ne\u0301', Array.from({ length: 21 }, (_, i) => String(i)).join('\n')]) assert.throws(() => parseCandidates(text))
})
test('抽選: rejection sampling・等確率の剰余・乱数失敗', () => {
  let calls = 0
  assert.equal(uniformIndex(3, () => ++calls === 1 ? 0xffffffff : 4), 1)
  assert.equal(calls, 2)
  for (let size = 1; size <= 20; size++) {
    const counts = Array(size).fill(0)
    for (let value = 0; value < size * 10; value++) counts[uniformIndex(size, () => value)]++
    assert.deepEqual(counts, Array(size).fill(10))
  }
  assert.throws(() => uniformIndex(3, () => 0xffffffff))
  for (const value of [-1, 2 ** 32, 0.5, NaN]) assert.throws(() => uniformIndex(2, () => value))
  for (const size of [0, 21, 1.5]) assert.throws(() => uniformIndex(size))
})
test('抽選: 選択済み除外・全件終了・結果と針の一致', () => {
  assert.deepEqual(remainingCandidates(['A', 'B'], ['A'], true), ['B'])
  assert.deepEqual(remainingCandidates(['A', 'B'], ['A', 'B'], true), [])
  assert.deepEqual(remainingCandidates(['A', 'B'], ['A'], false), ['A', 'B'])
  for (let size = 1; size <= 20; size++) for (let index = 0; index < size; index++) {
    const rotation = wheelRotation(7560, index, size)
    assert.ok(rotation >= 9360)
    assert.ok(Math.abs((rotation + (index + .5) * 360 / size) % 360) < 1e-8)
  }
})
test('一般3ツール: メタデータ・ルート・棚への復元', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const ids = ['unit-converter', 'bill-splitter', 'roulette-picker']
  for (const [index, component] of ['UnitConverter', 'BillSplitter', 'RoulettePicker'].entries()) {
    const tool = tools.find(tool => tool.id === ids[index])
    assert.equal(tool.category, 'general')
    assert.ok(tool.keywords.length && tool.description)
    assert.ok(app.includes(`<Route path="${tool.path}" element={<${component} />} />`))
  }
  assert.deepEqual(parseShelf(JSON.stringify({ version: 1, favorites: ids, recent: ids })).favorites, ids)
})

const { calculateQuiz, quizResultText, PLAY_NOTICE } = await import('../src/tools/playful-quiz/quiz.ts')
const { holidayDefinition } = await import('../src/tools/holiday-style/definition.ts')
const { companionDefinition } = await import('../src/tools/pocket-companion/definition.ts')
for (const definition of [holidayDefinition, companionDefinition]) {
  test(`${definition.title}: 全1024組合せで決定性・全結果到達・回答との一致`, () => {
    assert.equal(definition.questions.length, 5)
    const reached = Object.fromEntries(definition.outcomes.map(outcome => [outcome.id, 0]))
    for (let code = 0; code < 1024; code++) {
      const answers = definition.questions.map((question, index) => question.choices[(code >> (index * 2)) & 3].id)
      const result = calculateQuiz(definition, answers)
      assert.deepEqual(result, calculateQuiz(definition, answers))
      const chosen = definition.questions.map((question, index) => question.choices.find(choice => choice.id === answers[index]))
      const counts = Object.fromEntries(definition.outcomes.map(outcome => [outcome.id, chosen.filter(choice => choice.type === outcome.id).length]))
      assert.deepEqual(result.scores, counts)
      assert.equal(Object.values(result.scores).reduce((sum, value) => sum + value, 0), 5)
      const max = Math.max(...Object.values(counts))
      const leaders = definition.outcomes.filter(outcome => counts[outcome.id] === max)
      assert.equal(result.outcome.id, leaders[0].id)
      assert.equal(result.tied, leaders.length > 1)
      assert.deepEqual(result.matched, chosen.filter(choice => choice.type === result.outcome.id).map(choice => choice.label))
      const copy = quizResultText(definition, result)
      assert.ok(copy.includes(result.outcome.title) && copy.includes(result.outcome.action) && copy.includes(PLAY_NOTICE))
      reached[result.outcome.id]++
    }
    for (const count of Object.values(reached)) assert.ok(count > 0)
    console.log(`${definition.id}: reachable distribution ${JSON.stringify(reached)}`)
  })
}
test('遊びの診断: 定義の完全性と明確な同点ルール', () => {
  for (const definition of [holidayDefinition, companionDefinition]) {
    const ids = definition.outcomes.map(outcome => outcome.id)
    assert.equal(new Set(ids).size, 4)
    for (const question of definition.questions) {
      assert.equal(question.choices.length, 4)
      assert.equal(new Set(question.choices.map(choice => choice.id)).size, 4)
      assert.deepEqual(new Set(question.choices.map(choice => choice.type)), new Set(ids))
      assert.ok(question.title && question.note)
    }
    const types = [ids[0], ids[1], ids[0], ids[1], ids[2]]
    const answers = definition.questions.map((question, index) => question.choices.find(choice => choice.type === types[index]).id)
    const result = calculateQuiz(definition, answers)
    assert.equal(result.tied, true)
    assert.equal(result.outcome.id, ids[0])
    for (const outcome of definition.outcomes) assert.ok(outcome.title && outcome.description && outcome.action && outcome.icon)
  }
})
test('遊びの診断: 未回答・不正回答・過不足を拒否し入力を変更しない', () => {
  for (const definition of [holidayDefinition, companionDefinition]) {
    const complete = definition.questions.map(question => question.choices[0].id)
    for (const answers of [[], complete.slice(0, 4), [...complete, 'a'], ['', ...complete.slice(1)], ['unknown', ...complete.slice(1)], [null, ...complete.slice(1)]]) assert.throws(() => calculateQuiz(definition, answers))
    const original = [...complete]
    calculateQuiz(definition, complete)
    assert.deepEqual(complete, original)
  }
})
test('遊びの診断: 初期画面の免責・プライバシー・独自SVGと登録', async () => {
  const { default: PlayfulQuiz } = await import('../src/tools/playful-quiz/PlayfulQuiz.tsx')
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const [definition, component] of [[holidayDefinition, 'HolidayStyle'], [companionDefinition, 'PocketCompanion']]) {
    const markup = renderToStaticMarkup(createElement(PlayfulQuiz, { definition }))
    assert.ok(markup.includes(PLAY_NOTICE) && markup.includes('保存・送信・URLへの埋め込みはしません'))
    assert.ok(markup.includes('<svg') && !markup.includes('<img'))
    const tool = tools.find(tool => tool.id === definition.id)
    assert.equal(tool.category, 'general')
    assert.ok(tool.keywords.includes('診断'))
    assert.ok(app.includes(`<Route path="${tool.path}" element={<${component} />} />`))
  }
  const ids = [holidayDefinition.id, companionDefinition.id]
  assert.deepEqual(parseShelf(JSON.stringify({ version: 1, favorites: ids, recent: ids })).recent, ids)
})
test('遊びの診断: 回答の永続化・送信・HTML挿入を追加しない', () => {
  const source = readFileSync(new URL('../src/tools/playful-quiz/PlayfulQuiz.tsx', import.meta.url), 'utf8')
  assert.ok(!/localStorage|sessionStorage|URLSearchParams|fetch\s*\(|sendBeacon|dangerouslySetInnerHTML/.test(source))
})

const { inspectImage } = await import('../src/tools/local-image/imageHeader.ts')
const { resizeDimensions, joinDimensions, checkDimensions, outputFilename, pixelInteger, IMAGE_LIMITS } = await import('../src/tools/local-image/imageMath.ts')
const { encodeCanvas, abortIfStale, prepareImages } = await import('../src/tools/local-image/imageBrowser.ts')
const crc32 = data => { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let i=0;i<8;i++) crc=crc&1?0xedb88320^(crc>>>1):crc>>>1 } return (crc^0xffffffff)>>>0 }
const pngChunk = (name, data = Buffer.alloc(0)) => { const chunk=Buffer.alloc(data.length+12);chunk.writeUInt32BE(data.length);chunk.write(name,4);data.copy(chunk,8);chunk.writeUInt32BE(crc32(chunk.subarray(4,-4)),chunk.length-4);return chunk }
const headerPng = (width=40,height=20,extra=[]) => { const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',ihdr),...extra,pngChunk('IDAT',Buffer.from([0])),pngChunk('IEND')]) }
const webpChunk=(name,data)=>{const chunk=Buffer.alloc(8+data.length+data.length%2);chunk.write(name);chunk.writeUInt32LE(data.length,4);data.copy(chunk,8);return chunk}
const headerWebp=(chunks)=>{const body=Buffer.concat(chunks);const header=Buffer.alloc(12);header.write('RIFF');header.writeUInt32LE(body.length+4,4);header.write('WEBP',8);return Buffer.concat([header,body])}
test('画像: PNGチャンク・CRC・APNG・寸法上限', () => {
  assert.deepEqual(inspectImage(headerPng()),{width:40,height:20,mime:'image/png'})
  for(const name of ['acTL','fcTL','fdAT'])assert.throws(()=>inspectImage(headerPng(40,20,[pngChunk(name)])),/アニメーション/)
  const damaged=headerPng();damaged[20]^=1;assert.throws(()=>inspectImage(damaged))
  assert.throws(()=>inspectImage(headerPng().subarray(0,-1)))
  assert.throws(()=>inspectImage(Buffer.concat([headerPng(),Buffer.from('extra')])))
  assert.throws(()=>inspectImage(headerPng(8193,1)))
  assert.throws(()=>inspectImage(headerPng(4000,4000)))
})
test('画像: WebPのVP8・VP8L・VP8Xとアニメ指定', () => {
  const lossy=Buffer.from([0,0,0,0x9d,1,0x2a,40,0,20,0])
  const lossless=Buffer.alloc(5);lossless[0]=0x2f;lossless.writeUInt32LE(39+(19<<14),1)
  const extended=Buffer.alloc(10);extended[4]=39;extended[7]=19
  for(const chunks of [[webpChunk('VP8 ',lossy)],[webpChunk('VP8L',lossless)],[webpChunk('VP8X',extended),webpChunk('VP8 ',lossy)]])assert.deepEqual(inspectImage(headerWebp(chunks)),{width:40,height:20,mime:'image/webp'})
  extended[0]=2;assert.throws(()=>inspectImage(headerWebp([webpChunk('VP8X',extended),webpChunk('VP8 ',lossy)])),/アニメーション/)
  for(const name of ['ANIM','ANMF'])assert.throws(()=>inspectImage(headerWebp([webpChunk('VP8 ',lossy),webpChunk(name,Buffer.alloc(0))])),/アニメーション/)
  const invalid=headerWebp([webpChunk('VP8 ',lossy)]);invalid.writeUInt32LE(999,4);assert.throws(()=>inspectImage(invalid))
})
test('画像: JPEGヘッダ・偽装MIME・未対応形式・破損', () => {
  const jpeg=Buffer.from([255,216,255,192,0,8,8,0,20,0,40,3,255,218,0,2,255,217])
  assert.deepEqual(inspectImage(jpeg),{width:40,height:20,mime:'image/jpeg'})
  assert.throws(()=>inspectImage(jpeg.subarray(0,-2)))
  assert.throws(()=>inspectImage(headerPng(),'image/jpeg'),/一致/)
  assert.throws(()=>inspectImage(Buffer.from('GIF89a123456789')))
  assert.throws(()=>inspectImage(Buffer.alloc(IMAGE_LIMITS.fileBytes+1)))
})
test('画像: 縦横比・拡大なし・拡大許可・極端な比率', () => {
  assert.deepEqual(resizeDimensions({width:400,height:200},100,100),{width:100,height:50})
  assert.deepEqual(resizeDimensions({width:40,height:20},1200,1200),{width:40,height:20})
  assert.deepEqual(resizeDimensions({width:40,height:20},100,100,true),{width:100,height:50})
  assert.deepEqual(resizeDimensions({width:8192,height:1},1,1),{width:1,height:1})
  for(const size of [{width:0,height:1},{width:8193,height:1},{width:4000,height:4000},{width:Infinity,height:1}])assert.throws(()=>checkDimensions(size))
  assert.throws(()=>resizeDimensions({width:1,height:1},8192,8192,true))
})
test('画像: 横・縦結合の配置・余白・合計と出力上限', () => {
  const sizes=[{width:40,height:20},{width:20,height:20}]
  assert.deepEqual(joinDimensions(sizes,'horizontal',800,5),{size:{width:65,height:20},placements:[{width:40,height:20,x:0,y:0},{width:20,height:20,x:45,y:0}]})
  assert.deepEqual(joinDimensions(sizes,'vertical',800,5),{size:{width:20,height:35},placements:[{width:20,height:10,x:0,y:0},{width:20,height:20,x:0,y:15}]})
  assert.throws(()=>joinDimensions(sizes,'horizontal',800,201))
  assert.throws(()=>joinDimensions(sizes.slice(0,1),'horizontal',800,0))
  assert.throws(()=>joinDimensions(Array(7).fill(sizes[0]),'horizontal',800,0))
  assert.throws(()=>joinDimensions(Array(2).fill({width:4000,height:3000}),'horizontal',800,0),/合計/)
  assert.throws(()=>joinDimensions([{width:8192,height:1},{width:8192,height:1}],'horizontal',100,0))
})
test('画像: 全角設定・ファイル名・拡張子と制御文字', () => {
  assert.equal(pixelInteger('１２００',1,8192),1200)
  for(const text of ['', '1.5', '-1', 'Infinity', '99999'])assert.throws(()=>pixelInteger(text,1,8192))
  assert.equal(outputFilename('写真🍵.png','resized','image/jpeg'),'写真🍵-resized.jpg')
  assert.equal(outputFilename('a/b\u0000.webp','resized','image/png'),'a_b_-resized.png')
  assert.equal(outputFilename('','resized','image/webp'),'image-resized.webp')
})
test('画像: toBlobのMIMEフォールバック・失敗・容量超過を拒否', async () => {
  const canvas=blob=>({toBlob(callback){callback(blob)}})
  const blob=new Blob(['ok'],{type:'image/png'})
  assert.equal(await encodeCanvas(canvas(blob),'image/png',1),blob)
  await assert.rejects(encodeCanvas(canvas(blob),'image/webp',.85),/対応/)
  await assert.rejects(encodeCanvas(canvas(null),'image/png',1),/書き出/)
  await assert.rejects(encodeCanvas({toBlob(){throw Error('fail')}},'image/png',1),/失敗/)
  await assert.rejects(encodeCanvas(canvas(new Blob([new Uint8Array(IMAGE_LIMITS.outputBytes+1)],{type:'image/png'})),'image/png',1),/16 MiB/)
  await assert.rejects(encodeCanvas(canvas(blob),'image/png',Infinity))
})
test('画像: 中断・枚数・容量をデコード前に検査', async () => {
  assert.throws(()=>abortIfStale(()=>false),{name:'AbortError'})
  abortIfStale(()=>true)
  await assert.rejects(prepareImages([],1,1,()=>true))
  await assert.rejects(prepareImages([new File([new Uint8Array(IMAGE_LIMITS.fileBytes+1)],'large.png',{type:'image/png'})],1,1,()=>true),/8 MiB/)
  await assert.rejects(prepareImages([new File([headerPng()],'valid.png',{type:'image/png'})],1,1,()=>false),{name:'AbortError'})
})
test('画像2ツール: 登録・ルートと画像内容を保存送信しない構成', () => {
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8')
  for(const[id,component]of[['image-resizer','ImageResizer'],['image-joiner','ImageJoiner']]){
    const tool=tools.find(tool=>tool.id===id);assert.equal(tool.category,'general');assert.ok(tool.keywords.includes('画像'));assert.ok(app.includes(`<Route path="${tool.path}" element={<${component} />} />`))
  }
  for(const file of ['imageBrowser.ts','useImageWork.ts'])assert.ok(!/fetch\s*\(|localStorage|sessionStorage|URLSearchParams|sendBeacon/.test(readFileSync(new URL(`../src/tools/local-image/${file}`,import.meta.url),'utf8')))
})

const { normalizeToolSearch, filterToolList } = await import('../src/utils/toolSearch.ts')
const { tools: searchTools } = await import('../src/tools/registry.ts')
test('Search normalizes width, case, kana and whitespace', () => {
  assert.equal(normalizeToolSearch(' ＱＲ　ﾊｯｼｭ '), 'qr はっしゅ')
  assert.equal(filterToolList(searchTools, '　 ', 'all').length, 23)
})
test('Japanese purpose aliases find all 23 tools', () => {
  const cases = [["ジェイソン","json-formatter"],["エスキューエル","sql-in-generator"],["ﾀｲﾑｽﾀﾝﾌﾟ","timestamp-converter"],["文字を数える","character-counter"],["ＵＲＬ　エンコード","url-encode-decode"],["ベース６４","base64-encode-decode"],["識別子","uuid-generator"],["日にち","date-calculator"],["元号","japanese-era-converter"],["ＱＲ　コード","qr-code-generator"],["文章比較","text-diff"],["サブネット計算","ipv4-cidr"],["ﾊｯｼｭ","sha256"],["十六進数","radix-converter"],["タグを文字に","html-escape"],["百分率","percentage-calculator"],["写真を小さく","image-resizer"],["写真をまとめる","image-joiner"],["休みの日","holiday-style"],["相棒を選ぶ","pocket-companion"],["重さ","unit-converter"],["わりかん","bill-splitter"],["くじ引き","roulette-picker"]]
  for (const [query,id] of cases) assert.ok(filterToolList(searchTools,query,'all').some(tool=>tool.id===id),query)
})
test('Search intersects words/category/shelf without changing order or source', () => {
  const shelf = ['sha256','json-formatter','image-resizer'].map(id=>searchTools.find(tool=>tool.id===id))
  const before = [...shelf]
  assert.deepEqual(filterToolList(shelf,'','all'),before)
  assert.deepEqual(filterToolList(shelf,'ＪＳＯＮ　整形','developer').map(tool=>tool.id),['json-formatter'])
  assert.deepEqual(filterToolList(shelf,'JSON','general'),[])
  assert.deepEqual(filterToolList(shelf,'unlikely-query-xyz','all'),[])
  assert.deepEqual(shelf,before)
})
test('Unknown routes offer Japanese home guidance and three existing tools', async () => {
  const { MemoryRouter } = await import('react-router-dom')
  const { default: NotFoundPage } = await import('../src/pages/NotFoundPage.tsx')
  const markup = renderToStaticMarkup(createElement(MemoryRouter,null,createElement(NotFoundPage)))
  assert.ok(markup.includes('このページは見つかりませんでした'))
  assert.ok(markup.includes('href="/"'))
  for (const id of ['character-counter','image-resizer','date-calculator']) assert.ok(markup.includes('href="/tools/'+id+'"'))
})

const { findToolByPath } = await import('../src/utils/toolRoute.ts')
const { matchRoutes } = await import('react-router-dom')
test('道具判定: 全23ルートの大小文字・末尾スラッシュはルーターと一致', () => {
  const routes = tools.map(tool => ({ path: tool.path, id: tool.id }))
  for (const tool of tools) for (const pathname of [tool.path, tool.path+'/', tool.path.toUpperCase(), tool.path.toUpperCase()+'/']) {
    assert.equal(findToolByPath(pathname)?.id, tool.id, pathname)
    assert.equal(findToolByPath(pathname)?.id, matchRoutes(routes, pathname)?.at(-1).route.id, pathname)
  }
})
test('道具判定: 不明・部分一致・外部URLを道具として扱わない', () => {
  for (const pathname of ['/', '/tools/not-real', '/tools/image-resizer/missing', '/tools/image-resizer-extra', '//evil.example/tools/image-resizer', 'https://evil.example/tools/image-resizer']) assert.equal(findToolByPath(pathname), undefined, pathname)
})
test('画像の状態通知: 読み込みの制約と書き出し処理を区別する', async () => {
  const { default: ImageToolShell } = await import('../src/tools/local-image/ImageToolShell.tsx')
  const props = {title:'画像',description:'',originalBytes:0,busy:true,error:'',output:null}
  const loading = renderToStaticMarkup(createElement(ImageToolShell,{...props,loading:true}))
  assert.ok(loading.includes('読み込みが終わるまで設定は変更できません'))
  const processing = renderToStaticMarkup(createElement(ImageToolShell,{...props,loading:false}))
  assert.ok(processing.includes('画像を確認・処理しています'))
  assert.ok(!processing.includes('設定は変更できません'))
})
