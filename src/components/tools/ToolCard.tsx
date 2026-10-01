import { Link } from 'react-router-dom'
import { categoryLabels, type Tool } from '../../types/tool'
import ToolMark from './ToolMark'
import { useToolShelf } from '../../state/ToolShelfContext'

export default function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  const { shelf, toggleFavorite } = useToolShelf()
  const favorite = shelf.favorites.includes(tool.id)
  return (
    <article className="tool-card" data-tool-id={tool.id}>
      <div className="tool-card__top">
        <ToolMark tool={tool} />
        <button type="button" className="favorite-button" aria-pressed={favorite}
          aria-label={`${tool.name}をお気に入り${favorite ? 'から削除' : 'に追加'}`}
          title={favorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          onClick={() => toggleFavorite(tool.id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2L3.2 9.6l6-.9Z" /></svg>
        </button>
      </div>
      <Link to={tool.path} className="tool-card__link" aria-label={`${tool.name} を開く`}>
        <div className="tool-card__content"><h3>{tool.name}</h3><p>{tool.description}</p></div>
        <div className="tool-card__bottom"><span className="tool-card__category">{categoryLabels[tool.category]}</span><span className="tool-card__number" aria-hidden="true">{String(index + 1).padStart(2, '0')} <span>↗</span></span></div>
      </Link>
    </article>
  )
}
