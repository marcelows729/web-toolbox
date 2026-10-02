import test from 'node:test'
import assert from 'node:assert/strict'
import {generateSequence,initialSequence,validateSequenceField,MAX_SEQUENCE_VALUE} from '../src/tools/sequence-generator/sequence.ts'
const generate=patch=>generateSequence({...initialSequence(),...patch})
test('連番: 既定値と受付番号・ファイル名、末尾改行なし',()=>{
 assert.equal(generate({count:'3'}),'1\n2\n3')
 assert.equal(generate({count:'3',width:'3',prefix:'受付-'}),'受付-001\n受付-002\n受付-003')
 assert.equal(generate({count:'2',prefix:'写真_',suffix:'.jpg'}),'写真_1.jpg\n写真_2.jpg')
})
test('連番: 正負・降順・ゼロ付近・増分0と符号外のゼロ埋め',()=>{
 assert.equal(generate({start:'-2',count:'5',width:'3'}),'-002\n-001\n000\n001\n002')
 assert.equal(generate({start:'2',count:'5',step:'-1'}),'2\n1\n0\n-1\n-2')
 assert.equal(generate({start:'-0',step:'0',count:'3'}),'0\n0\n0')
 assert.equal(generate({start:'1234',width:'2',count:'1'}),'1234')
})
test('連番: 全角数字と符号、前後空白、前後文字はそのまま',()=>{
 assert.equal(generate({start:' －２ ',step:'＋１',count:'３',width:'３',prefix:'<受付> ',suffix:' &'}),'<受付> -002 &\n<受付> -001 &\n<受付> 000 &')
})
test('連番: Numberの安全整数を超えても18桁まで正確',()=>{
 assert.equal(generate({start:'9007199254740991',count:'3'}),'9007199254740991\n9007199254740992\n9007199254740993')
 assert.equal(generate({start:MAX_SEQUENCE_VALUE.toString(),step:'-1',count:'2'}),'999999999999999999\n999999999999999998')
 assert.equal(generate({start:(-MAX_SEQUENCE_VALUE).toString(),count:'2'}),'-999999999999999999\n-999999999999999998')
})
test('連番: 開始・増分・最終番号の範囲超過を拒否',()=>{
 for(const patch of [{start:'1000000000000000000'},{step:'-1000000000000000000'},{start:MAX_SEQUENCE_VALUE.toString(),count:'2'},{start:(-MAX_SEQUENCE_VALUE).toString(),step:'-1',count:'2'}])assert.throws(()=>generate(patch),/18桁/)
})
test('連番: 件数・ゼロ埋めの境界と不正な数値',()=>{
 assert.equal(generate({count:'1',width:'20'}),'00000000000000000001')
 for(const count of ['0','-1','10001'])assert.throws(()=>generate({count}),/件数/)
 for(const width of ['-1','21'])assert.throws(()=>generate({width}),/桁数/)
 for(const field of ['start','step','count','width'])for(const value of ['1.5','1e3','0x10','1,000','1 2','--1','+','NaN','Infinity'])assert.throws(()=>generate({[field]:value}),/整数/)
 for(const field of ['start','step','count'])assert.throws(()=>generate({[field]:''}),/整数/)
 assert.equal(generate({width:' ',count:'1'}),'1')
})
test('連番: 最大件数・結果100000文字ちょうど、超過を拒否',()=>{
 const output=generate({start:'-1',count:'10000',width:'9'});assert.equal(output.length,100000);assert.equal(output.split('\n').length,10000);assert.ok(output.endsWith('000009998'))
 assert.throws(()=>generate({start:'-2',count:'10000',width:'9'}),/100,000/)
 assert.throws(()=>generate({count:'10000',width:'20',prefix:'x'.repeat(100),suffix:'y'.repeat(100)}),/100,000/)
})
test('連番: 長大入力・前後文字の改行を切り捨てず拒否、UTF16単位',()=>{
 for(const field of ['start','count','step','width'])assert.throws(()=>validateSequenceField(field,'1'.repeat(33)),/32文字/)
 for(const field of ['prefix','suffix']){assert.doesNotThrow(()=>validateSequenceField(field,'😀'.repeat(50)));assert.throws(()=>validateSequenceField(field,'😀'.repeat(51)),/100文字/);for(const value of ['x\ny','x\ry','x\u2028y','x\u2029y'])assert.throws(()=>validateSequenceField(field,value),/改行/)}
})
test('連番: 入力非破壊、再生成と独立した設定',()=>{
 const values={...initialSequence(),count:'2'};assert.equal(generateSequence(values),'1\n2');assert.equal(generateSequence({...values,start:'5'}),'5\n6');assert.equal(values.start,'1');assert.equal(generateSequence(values),'1\n2')
})
