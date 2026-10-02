import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { tools } from '../src/tools/registry.ts'
import { HOME_DESCRIPTION, HOME_TITLE, pageMetadata } from '../src/utils/pageMetadata.ts'
import DatePartsInput from '../src/components/forms/DatePartsInput.tsx'
import UuidGenerator from '../src/tools/uuid-generator/UuidGenerator.tsx'
test('ページ情報: 全28ツールの名称と説明、URL大小文字と末尾スラッシュ',()=>{
 const titles=new Set()
 for(const tool of tools){
   for(const path of [tool.path,tool.path+'/',tool.path.toUpperCase()])assert.deepEqual(pageMetadata(path),{title:tool.name+' | ぽけつる',description:tool.description})
   titles.add(pageMetadata(tool.path).title)
 }
 assert.equal(titles.size,28)
})
test('ページ情報: トップと未知URLを独立した内容に戻す',()=>{
 assert.deepEqual(pageMetadata('/'),{title:HOME_TITLE,description:HOME_DESCRIPTION})
 assert.equal(pageMetadata('/tools/not-real').title,'ページが見つかりません | ぽけつる')
 assert.equal(pageMetadata('/tools/duration-calculator/extra').title,'ページが見つかりません | ぽけつる')
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
 assert.ok(html.includes('<title>'+HOME_TITLE+'</title>'))
 assert.ok(html.includes(HOME_DESCRIPTION))
})
test('関連ツール: 登録された全宛先が実在し名称・パスを持つ',()=>{
 const ids=new Set(tools.map(t=>t.id))
 for(const tool of tools)for(const id of tool.relatedTools||[]){assert.ok(ids.has(id),tool.id+' '+id);assert.notEqual(id,tool.id)}
 assert.equal(tools.find(t=>t.id==='pocket-companion').name,'行動スタイル診断')
})
test('日付入力: 日付グループの名前と年・月・日へのエラー関連付け',()=>{
 const markup=renderToStaticMarkup(createElement(DatePartsInput,{id:'start',label:'開始日',describedBy:'start-error',value:{year:'',month:'',day:''},onChange(){}}))
 assert.ok(markup.includes('role="group"'))
 assert.ok(markup.includes('aria-label="開始日"'))
 assert.equal((markup.match(/aria-describedby="start-error"/g)||[]).length,3)
 for(const part of ['year','month','day'])assert.ok(markup.includes('for="start-'+part+'"'))
 const valid=renderToStaticMarkup(createElement(DatePartsInput,{id:'valid',value:{year:'2026',month:'10',day:'2'},onChange(){}}))
 assert.equal(valid.includes('aria-describedby'),false)
})
test('UUID入力: 説明の参照先が実在する',()=>{
 const markup=renderToStaticMarkup(createElement(UuidGenerator))
 assert.ok(markup.includes('aria-describedby="uuid-count-help"'))
 assert.ok(markup.includes('id="uuid-count-help"'))
 assert.ok(markup.includes('生成件数は1〜100の整数'))
})

test('日付入力: 可視ラベルをグループ名として参照する',()=>{
 const markup=renderToStaticMarkup(createElement(DatePartsInput,{id:'date',labelledBy:'date-label',value:{year:'',month:'',day:''},onChange(){}}))
 assert.ok(markup.includes('role="group" aria-labelledby="date-label"'))
 const date=readFileSync(new URL('../src/tools/date-calculator/DateCalculator.tsx',import.meta.url),'utf8')
 for(const id of ['date-start','date-end','base-date']){assert.ok(date.includes('htmlFor="'+id+'-year"'));assert.ok(date.includes('labelledBy="'+id+'-label"'))}
})
