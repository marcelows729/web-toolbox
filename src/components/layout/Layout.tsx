import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">Web Toolbox</div>
      </footer>
    </div>
  )
}
