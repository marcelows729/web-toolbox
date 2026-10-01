import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { tools } from '../tools/registry'
export default function NotFoundPage() {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const suggestions = ['character-counter', 'image-resizer', 'date-calculator'].flatMap(id => tools.filter(tool => tool.id === id))
  return <div className="container tool-page"><section className="tool-panel not-found-panel"><p className="eyebrow">PAGE NOT FOUND</p><h1 ref={heading} tabIndex={-1}>このページは見つかりませんでした</h1><p>アドレスが変わったか、入力したURLに誤りがあるかもしれません。道具一覧から、使いたい道具を探してみてください。</p><Link to="/" className="hero-cta">道具一覧へ戻る <span aria-hidden="true">→</span></Link><h2>こんな道具もあります</h2><ul className="not-found-links">{suggestions.map(tool => <li key={tool.id}><Link to={tool.path}>{tool.name}</Link><p>{tool.description}</p></li>)}</ul></section></div>
}
