import { useMemo, useState } from 'react'
import ToolCard from '../components/tools/ToolCard'
import { tools } from '../tools/registry'
import { categoryLabels, type ToolCategory } from '../types/tool'

const filterOptions: Array<'all' | ToolCategory> = [
  'all',
  'developer',
  'text',
  'datetime',
  'network',
  'general',
  'other',
]

export default function HomePage() {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolCategory>('all')

  const filteredTools = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase()

    return tools.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory

      const matchesSearch =
        normalizedQuery.length === 0 ||
        [tool.name, tool.description, ...(tool.keywords ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesCategory && matchesSearch
    })
  }, [searchText, selectedCategory])

  return (
    <div className="container home-page">
      <section className="hero-section">
        <h1>ぽけつる</h1>
        <p className="subtitle">ちょっと便利なツールを、ポケットに。</p>
      </section>

      <section className="toolbar-section" aria-label="ツール検索とカテゴリフィルター">
        <label className="search-field" htmlFor="tool-search">
          <span className="visually-hidden">ツール検索</span>
          <input
            id="tool-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="ツールを検索..."
          />
        </label>

        <div className="category-filters" role="tablist" aria-label="カテゴリフィルター">
          {filterOptions.map((option) => {
            const label = option === 'all' ? 'すべて' : categoryLabels[option]
            const isSelected = option === selectedCategory

            return (
              <button
                key={option}
                type="button"
                className={`category-filter ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelectedCategory(option)}
                aria-pressed={isSelected}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="tool-list-section" aria-live="polite">
        {filteredTools.length > 0 ? (
          <div className="tool-grid">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="empty-state">該当するツールは見つかりませんでした。</p>
        )}
      </section>
    </div>
  )
}
