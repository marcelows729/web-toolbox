import { Link } from 'react-router-dom'
import logoDark from '../../assets/brand/logo-dark.png'
import logoLight from '../../assets/brand/logo-light.png'

type HeaderProps = {
  theme: 'light' | 'dark'
  setTheme: (nextTheme: 'light' | 'dark') => void
}

export default function Header({ theme, setTheme }: HeaderProps) {
  const logoSrc = theme === 'dark' ? logoDark : logoLight
  const themeOptions: Array<{ value: 'light' | 'dark'; label: string }> = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ]

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand-link" aria-label="ぽけつるへ戻る">
          <img
            src={logoSrc}
            alt="ぽけつる POKETSURU"
            className="brand-logo"
            loading="eager"
          />
        </Link>

        <div className="theme-switcher" role="radiogroup" aria-label="テーマ切替">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`theme-option ${theme === option.value ? 'is-active' : ''}`}
              onClick={() => setTheme(option.value)}
              aria-pressed={theme === option.value}
              aria-label={`テーマを${option.label}に切り替える`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
