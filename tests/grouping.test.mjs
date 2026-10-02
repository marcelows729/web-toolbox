import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createGroups, parseParticipants, parseGroupCount, uniformGroupIndex, groupingSummary } from '../src/tools/random-grouping/grouping.ts'
import { tools } from '../src/tools/registry.ts'
const rng = seed => () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed }
test('組み分け: 行trim・空行・CRLF/CR/LF、同名を全員保持、Unicodeを変更しない',()=>{
 const text=' 太郎 \r\n\r花子\n太郎\n  \n👩🏽‍💻\né\né\n<img src=x onerror=alert(1)> '
 const parsed=parseParticipants(text)
 assert.deepEqual(parsed.participants.map(p=>p.name),['太郎','花子','太郎','👩🏽‍💻','é','é','<img src=x onerror=alert(1)>'])
 assert.deepEqual(parsed.participants.map(p=>p.id),[1,2,3,4,5,6,7])
 assert.deepEqual(parsed.duplicateNames,['太郎'])
 assert.deepEqual(parseParticipants('A\na').duplicateNames,[])
 assert.equal(createGroups('A\nA','2',rng(1)).groups.flat().length,2)
})
test('組み分け: 2〜100候補・100文字・全体上限・整数の組数',()=>{
 for(const text of ['', 'a','a\n'.repeat(101), 'x'.repeat(101)+'\ny','x'.repeat(30001)])assert.throws(()=>parseParticipants(text))
 assert.equal(parseParticipants('😀'.repeat(100)+'\ny').participants[0].name,'😀'.repeat(100))
 assert.equal(parseParticipants('a'.repeat(100)+'\ny').participants.length,2)
 assert.equal(parseParticipants('a\nb'+' '.repeat(29997)).participants.length,2)
 assert.equal(parseGroupCount(' ２ ',3),2)
 assert.equal(parseGroupCount('100',100),100)
 for(const value of ['', '0','1','4','2.5','-2','+2','1e2','Infinity','NaN','0x2','2人','1,000'])assert.throws(()=>parseGroupCount(value,3))
 assert.throws(()=>createGroups('a\nb','3'))
})
test('組み分け: 2名2組・100名3組・全員1組ずつと、19800分割の不変条件',()=>{
 assert.deepEqual(createGroups('a\nb','2',rng(1)).groups.map(g=>g.length),[1,1])
 const hundred=Array.from({length:100},(_,i)=>'候補名'+i).join('\n')
 assert.deepEqual(createGroups(hundred,'3',rng(2)).groups.map(g=>g.length),[34,33,33])
 assert.equal(createGroups(hundred,'100',rng(3)).groups.every(g=>g.length===1),true)
 let cases=0
 for(let n=2;n<=100;n++)for(let count=2;count<=n;count++)for(let seed=1;seed<=4;seed++){
   const text=Array.from({length:n},(_,i)=>'候補名'+i).join('\n'),copy=text
   const result=createGroups(text,String(count),rng(seed)),flat=result.groups.flat(),sizes=result.groups.map(g=>g.length)
   assert.equal(result.groups.length,count);assert.equal(flat.length,n);assert.equal(new Set(flat.map(p=>p.id)).size,n)
   assert.deepEqual(flat.map(p=>p.id).sort((a,b)=>a-b),Array.from({length:n},(_,i)=>i+1))
   assert.equal(flat.every(p=>p.name==='候補名'+(p.id-1)),true)
   assert.ok(Math.max(...sizes)-Math.min(...sizes)<=1);assert.ok(Math.min(...sizes)>=1);assert.equal(text,copy);cases++
 }
 assert.equal(cases,19800)
})
test('組み分け: Fisher-Yatesの全24通りが異なる並びに対応',()=>{
 const permutations=new Set()
 for(let first=0;first<4;first++)for(let second=0;second<3;second++)for(let third=0;third<2;third++){
   const values=[first,second,third],result=createGroups('a\nb\nc\nd','2',()=>values.shift())
   permutations.add(result.groups.flat().map(p=>p.id).join(','))
 }
 assert.equal(permutations.size,24)
})
test('組み分け: 剰余の偏りを避ける棄却・乱数失敗・非対応環境',()=>{
 let calls=0;assert.equal(uniformGroupIndex(3,()=>++calls===1?4294967295:4),1);assert.equal(calls,2)
 for(let size=1;size<=100;size++){const counts=Array(size).fill(0);for(let v=0;v<size*3;v++)counts[uniformGroupIndex(size,()=>v)]++;assert.equal(counts.every(n=>n===3),true)}
 for(const n of [NaN,Infinity,-1,0.5,4294967296])assert.throws(()=>uniformGroupIndex(3,()=>n))
 for(const size of [0,101,1.5])assert.throws(()=>uniformGroupIndex(size,()=>0))
 assert.throws(()=>uniformGroupIndex(3,()=>4294967295))
 assert.throws(()=>createGroups('a\nb','2',()=>{throw new Error('rng failed')}))
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto')
 try{Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});assert.throws(()=>createGroups('a\nb','2'),/安全な組み分け/)}finally{if(descriptor)Object.defineProperty(globalThis,'crypto',descriptor);else delete globalThis.crypto}
})
test('組み分け: コピーの候補番号・同名・HTML文字列と公開登録を保持',()=>{
 const result=createGroups('太郎\n太郎\n<img>','2',rng(1)),text=groupingSummary(result)
 for(const p of result.groups.flat())assert.ok(text.includes('候補'+p.id+': '+p.name))
 assert.ok(text.includes('同名の候補も入力順の番号'));assert.ok(text.includes('組1（2候補）'));assert.ok(text.includes('<img>'))
 const tool=tools.find(t=>t.id==='random-grouping');assert.equal(tool.path,'/tools/random-grouping');assert.equal(tool.category,'general');assert.deepEqual(tool.relatedTools,['roulette-picker'])
 const source=readFileSync(new URL('../src/tools/random-grouping/grouping.ts',import.meta.url),'utf8');assert.ok(source.includes('crypto.getRandomValues'));assert.equal(source.includes('Math.random('),false)
 for(const id of ['roulette-picker','duration-calculator','holiday-style','pocket-companion','unit-price-comparison','recipe-scaler','text-formatter'])assert.ok(tools.some(t=>t.id===id))
})
