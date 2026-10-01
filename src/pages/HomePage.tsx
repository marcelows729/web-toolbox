import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ToolCard from '../components/tools/ToolCard'
import ToolMark from '../components/tools/ToolMark'
import { tools } from '../tools/registry'
import { categoryLabels, type ToolCategory } from '../types/tool'
import { useToolShelf } from '../state/ToolShelfContext'
import { filterToolList, normalizeToolSearch } from '../utils/toolSearch'

const filterOptions: Array<'all' | ToolCategory> = ['all', 'developer', 'text', 'datetime', 'network', 'general', 'other']
type Collection = 'all' | 'favorites' | 'recent'
const collectionLabels = { all: 'すべての道具', favorites: 'お気に入り', recent: '最近使った道具' }
export default function HomePage() {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolCategory>('all')
  const [collection, setCollection] = useState<Collection>('all')
  const { shelf, clearRecent } = useToolShelf()
  const filteredTools = useMemo(() => {
    const ordered = collection === 'all' ? tools : shelf[collection === 'favorites' ? 'favorites' : 'recent'].flatMap(id => tools.filter(tool => tool.id === id))
    return filterToolList(ordered, searchText, selectedCategory)
  }, [searchText, selectedCategory, collection, shelf])
  const searchInput = useRef<HTMLInputElement>(null)
  const clearSearch = () => { setSearchText(''); searchInput.current?.focus() }
  const clearCategory = () => { setSelectedCategory('all'); searchInput.current?.focus() }
  const showAll = () => { setSearchText(''); setSelectedCategory('all'); setCollection('all'); searchInput.current?.focus() }
  const hasFilters = normalizeToolSearch(searchText).length > 0 || selectedCategory !== 'all'
  const counts = { all: tools.length, favorites: shelf.favorites.length, recent: shelf.recent.length }
  return (
    <div className="container home-page">
      <section className="hero-section">
        <div className="hero-copy"><p className="eyebrow"><span /> YOUR EVERYDAY TOOLBOX</p>
          <h1>ちいさな手間を、<br /><span>さっと、ひとつに。</span></h1>
          <p className="subtitle">ちょっと便利なツールを、ポケットに。<br />変換も、計算も、ひと息で。いつもの作業に余裕を。</p>
          <a href="#tool-search" className="hero-cta">道具を探す <span aria-hidden="true">↓</span></a>
          <div className="hero-facts"><span><strong>{tools.length}</strong> の小さな道具</span><span>登録不要</span><span>ブラウザ内で処理</span></div>
        </div>
        <div className="pocket-scene"><div className="pocket-label"><span>IN YOUR POCKET</span><span>01 — {tools.length}</span></div>
          <div className="pocket-stack">{['json-formatter', 'character-counter', 'date-calculator'].map((id, index) => {
            const tool = tools.find(item => item.id === id)!
            return <Link to={tool.path} key={id} className={`pocket-ticket pocket-ticket--${index}`}>
              <ToolMark tool={tool} /><div><span>{['整える', '数える', '計算する'][index]}</span><strong>{tool.name}</strong></div><span className="ticket-arrow" aria-hidden="true">↗</span>
            </Link>
          })}</div>
          <div className="pocket-bottom"><span aria-hidden="true">✳</span><p>道具は小さく。<br />できることは、いろいろ。</p></div>
        </div>
      </section>
      <section className="toolbox" aria-labelledby="toolbox-title">
        <div className="section-heading"><div><p className="eyebrow">PICK A TOOL</p><h2 id="toolbox-title">あなたの道具棚</h2></div><span className="section-note">よく使う道具は、星をつけて手元に。</span></div>
        <div className="collection-switcher" role="group" aria-label="道具の表示範囲">
          {(['all', 'favorites', 'recent'] as const).map(value => <button key={value} type="button" className="collection-button"
            aria-pressed={collection === value} onClick={() => setCollection(value)}><span aria-hidden="true">{value === 'all' ? '▦' : value === 'favorites' ? '☆' : '◷'}</span>{collectionLabels[value]}<small>{counts[value]}</small></button>)}
        </div>
        <div className="toolbar-section">
          <div className="search-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
            <label className="search-field" htmlFor="tool-search"><span className="visually-hidden">ツール検索</span><input ref={searchInput} id="tool-search" type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="名前やキーワードで探す…" /></label>
            {searchText && <button type="button" className="search-clear" onClick={clearSearch} aria-label="検索をクリア">×</button>}
          </div>
          <div className="category-filters" role="group" aria-label="カテゴリフィルター">{filterOptions.map(option => <button key={option} type="button" className={`category-filter ${option === selectedCategory ? 'is-selected' : ''}`} aria-pressed={option === selectedCategory} onClick={() => setSelectedCategory(option)}>{option === 'all' ? 'すべて' : categoryLabels[option]}</button>)}</div>
        </div>
        <div className="results-heading"><p role="status" aria-live="polite" aria-atomic="true">{collectionLabels[collection]}{selectedCategory !== 'all' ? ` · ${categoryLabels[selectedCategory]}` : ''} <span>{filteredTools.length}件</span></p>
          {collection === 'recent' && shelf.recent.length > 0 && <button type="button" className="text-button" onClick={clearRecent}>履歴を消去</button>}
          {collection !== 'all' && <span className="collection-order">{collection === 'recent' ? '最後に開いた順 · 最大8件' : '新しく登録した順'}</span>}
        </div>
        {filteredTools.length ? <div className="tool-grid">{filteredTools.map(tool => <ToolCard key={tool.id} tool={tool} index={tools.indexOf(tool)} />)}</div> :
          <div className="empty-state"><span aria-hidden="true">{collection === 'favorites' ? '☆' : '⌕'}</span><h3>{hasFilters ? 'ぴったりの道具が見つかりませんでした' : collection === 'favorites' ? 'いつもの道具に、星をひとつ。' : '使った道具が、ここに並びます。'}</h3>
            <p>{hasFilters ? 'キーワードやカテゴリを変えて探してみてください。' : collection === 'favorites' ? '各道具の星ボタンで、お気に入りに登録できます。' : '道具を開くと、次回はここからすぐに使えます。'}</p>
            <div className="action-row empty-recovery">{searchText && <button type="button" className="secondary-button" onClick={clearSearch}>検索をクリア</button>}{selectedCategory !== 'all' && <button type="button" className="secondary-button" onClick={clearCategory}>カテゴリを解除</button>}<button type="button" className="secondary-button" onClick={showAll}>すべての道具を見る</button></div>
          </div>}
        <div className="shelf-footnote"><span aria-hidden="true">↳</span><p>お気に入りと最近使用は、この端末のブラウザにだけ保存。<br className="mobile-break" /> ツールへの入力内容は保存しません。</p></div>
      </section>
    </div>
  )
}
