import { Link } from 'react-router-dom'
import { categoryLabels, type Tool } from '../../types/tool'

type ToolCardProps = {
  tool: Tool
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link to={tool.path} className="tool-card" aria-label={`${tool.name} を開く`}>
      <div className="tool-card__content">
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
        <span className="tool-card__category">{categoryLabels[tool.category]}</span>
      </div>
    </Link>
  )
}
