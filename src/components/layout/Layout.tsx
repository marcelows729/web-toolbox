import { Outlet } from 'react-router-dom'
import Header from './Header'

type LayoutProps = {
  theme: 'light' | 'dark'
  setTheme: (nextTheme: 'light' | 'dark') => void
}

export default function Layout({ theme, setTheme }: LayoutProps) {
  return (
    <div className="app-shell">
      <Header theme={theme} setTheme={setTheme} />
      <main className="page-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">ぽけつる</div>
      </footer>
    </div>
  )
}
