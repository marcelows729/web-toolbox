import assert from 'node:assert/strict'
import {test} from 'node:test'
const {formatJson,minifyJson}=await import('../src/tools/json-formatter/conversion.ts')
const {buildSqlInList}=await import('../src/tools/sql-in-generator/conversion.ts')
const {getEncodedValue,getDecodedValue}=await import('../src/tools/url-encode-decode/conversion.ts')
const {toBase64,fromBase64}=await import('../src/tools/base64-encode-decode/conversion.ts')
test('JSON: 整形と圧縮の意味・Unicode・無効入力を維持',()=>{
 assert.equal(formatJson('{"日本語":"😀","a":[1,true,null]}'),'{\n  "日本語": "😀",\n  "a": [\n    1,\n    true,\n    null\n  ]\n}')
 assert.equal(minifyJson(' { "a": [1, true, null] } '),'{"a":[1,true,null]}')
 assert.equal(formatJson('null'),'null');assert.equal(minifyJson('"text"'),'"text"')
 for(const value of ['', '{', 'undefined'])assert.throws(()=>formatJson(value),SyntaxError)
})
test('SQL IN: 文字列エスケープ・重複と件数・数値表記を維持',()=>{
 assert.deepEqual(buildSqlInList(" O'Reilly, 日本語\nO'Reilly ",'string',true),{output:"('O''Reilly', '日本語')",error:'',count:2})
 assert.deepEqual(buildSqlInList('+01, -.5, 2, 2','number',false),{output:'(+01, -.5, 2, 2)',error:'',count:4})
 for(const input of ['', '1,nope','1,1e3']){const r=buildSqlInList(input,'number',true);assert.equal(r.output,'');assert.equal(r.count,null);assert.ok(r.error)}
})
test('URL: 部分と全体の予約文字・空白・日本語の変換を維持',()=>{
 assert.equal(getEncodedValue('日本語 😀 /?&+','component'),'%E6%97%A5%E6%9C%AC%E8%AA%9E%20%F0%9F%98%80%20%2F%3F%26%2B')
 assert.equal(getEncodedValue('https://example.com/日本語?q=a b&x=1','full-url'),'https://example.com/%E6%97%A5%E6%9C%AC%E8%AA%9E?q=a%20b&x=1')
 assert.equal(getDecodedValue('%2F%3F%26%20','component'),'/?& ')
 assert.equal(getDecodedValue('%2F%3F%26%20','full-url'),'%2F%3F%26 ')
 for(const mode of ['component','full-url'])assert.throws(()=>getDecodedValue('%ZZ',mode),URIError)
})
test('Base64: UTF-8・改行・空白除去と不正UTF-8の拒否を維持',()=>{
 assert.equal(toBase64('日本語 😀\nabc'),'5pel5pys6KqeIPCfmIAKYWJj')
 assert.equal(fromBase64('5pel 5pys\n6Kqe'),'日本語')
 assert.equal(fromBase64(toBase64('😀\r\n e\u0301')),'😀\r\n e\u0301')
 assert.throws(()=>fromBase64('@@@'));assert.throws(()=>fromBase64('/w=='))
})
