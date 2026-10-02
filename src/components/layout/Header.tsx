import type { MouseEventHandler } from 'react'
import { Link } from 'react-router-dom'
import brandIcon from '../../assets/brand/icon.png'

type HeaderProps = { theme: 'light' | 'dark'; homeState?: unknown; onHomeClick?: MouseEventHandler<HTMLAnchorElement>; setTheme: (nextTheme: 'light' | 'dark') => void }
export default function Header({ theme, setTheme, homeState, onHomeClick }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" state={homeState} onClick={onHomeClick} className="brand-link" aria-label="ぽけつるへ戻る">
          <img src={brandIcon} alt="" className="brand-symbol" />
          <span className="brand-wordmark">ぽけつる<small>POKETSURU</small></span>
        </Link>
        <div className="header-note">小さな道具、大きな余裕。</div>
        <div className="theme-switcher" role="group" aria-label="テーマ切替">
          {(['light', 'dark'] as const).map(option => <button key={option} type="button"
            className={`theme-option ${theme === option ? 'is-active' : ''}`} onClick={() => setTheme(option)}
            aria-pressed={theme === option} aria-label={`テーマを${option === 'light' ? 'Light' : 'Dark'}に切り替える`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{option === 'light' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z" />}</svg>
            <span>{option === 'light' ? 'Light' : 'Dark'}</span>
          </button>)}
        </div>
      </div>
    </header>
  )
}
