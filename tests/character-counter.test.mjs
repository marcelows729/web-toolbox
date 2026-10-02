import assert from 'node:assert/strict'
import { test } from 'node:test'
import { counterSummary,normalizeCounterLines,validateCounterInput,MAX_COUNTER_UNITS } from '../src/tools/character-counter/summary.ts'
test('文字数: 空入力は全指標0、見た目のUnicode単位を維持',()=>{
 assert.deepEqual(counterSummary(''),{totalCharacters:0,withoutWhitespace:0,withoutNewlines:0,lines:0,words:0,utf8Bytes:0})
 const r=counterSummary('😀e\u0301👩‍👩‍👧‍👦');assert.equal(r.totalCharacters,3);assert.equal(r.withoutWhitespace,3);assert.equal(r.words,1);assert.equal(r.utf8Bytes,32)
})
test('文字数: 全角半角スペース・タブ・改行の除外範囲と行数',()=>{
 assert.deepEqual(counterSummary('A Ｂ　\t\nC'),{totalCharacters:7,withoutWhitespace:3,withoutNewlines:6,lines:2,words:3,utf8Bytes:11})
 assert.deepEqual(counterSummary(' \t\n'),{totalCharacters:3,withoutWhitespace:0,withoutNewlines:2,lines:2,words:0,utf8Bytes:3})
 assert.equal(counterSummary('a\n').lines,2)
 assert.equal(counterSummary('e\n\u0301').withoutNewlines,1)
})
test('文字数: CRLF・CRは画面でLFへ統一、純粋集計は従来改行単位',()=>{
 assert.equal(normalizeCounterLines('a\r\nb\rc\n'),'a\nb\nc\n')
 const raw=counterSummary('a\r\nb\rc\n');assert.equal(raw.totalCharacters,6);assert.equal(raw.lines,4);assert.equal(raw.withoutNewlines,3);assert.equal(raw.utf8Bytes,7)
 assert.equal(counterSummary(normalizeCounterLines('a\r\nb\rc\n')).utf8Bytes,6)
})
test('文字数: 50,000UTF-16上限・大きな貼付け・emoji上限',()=>{
 assert.equal(counterSummary('a'.repeat(MAX_COUNTER_UNITS)).totalCharacters,50_000)
 assert.equal(counterSummary('😀'.repeat(25_000)).totalCharacters,25_000)
 assert.throws(()=>validateCounterInput('a'.repeat(MAX_COUNTER_UNITS+1)),/50,000/)
 assert.throws(()=>counterSummary('😀'.repeat(25_001)),/50,000/)
})

test('文字数: 未対応時のコードポイントfallbackを既存どおり維持',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(Intl,'Segmenter')
 try{Object.defineProperty(Intl,'Segmenter',{value:undefined,configurable:true,writable:true});const r=counterSummary('😀e\u0301👩‍👩‍👧‍👦');assert.equal(r.totalCharacters,10);assert.equal(r.withoutWhitespace,10);assert.equal(r.utf8Bytes,32)}finally{Object.defineProperty(Intl,'Segmenter',descriptor)}
})
