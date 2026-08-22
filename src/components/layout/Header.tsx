import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand-link">
          <span className="brand-title">Web Toolbox</span>
        </Link>
      </div>
    </header>
  )
}
