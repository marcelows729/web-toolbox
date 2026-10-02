import { Suspense, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { catalogueHomeState, canReturnToCatalogue } from '../../state/catalogueState'
import Header from './Header'
import ToolLoadBoundary from './ToolLoadBoundary'
import { pageMetadata } from '../../utils/pageMetadata'
import { findToolByPath } from '../../utils/toolRoute'
import { useToolShelf } from '../../state/ToolShelfContext'

import type { MouseEvent } from 'react'

type LayoutProps = { theme: 'light' | 'dark'; setTheme: (nextTheme: 'light' | 'dark') => void }
export default function Layout({ theme, setTheme }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { pathname } = location
  const { shelf, unavailable, visit, toggleFavorite } = useToolShelf()
  const currentTool = findToolByPath(pathname)
  const homeState = currentTool ? catalogueHomeState(location.state) : undefined
  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (currentTool && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && canReturnToCatalogue(location.state, window.history.state?.idx)) {
      event.preventDefault()
      void navigate(-1)
    }
  }
  useEffect(() => {
    const metadata = pageMetadata(pathname)
    document.title = metadata.title
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = metadata.description
  }, [pathname])
  useEffect(() => {
    if (currentTool) visit(currentTool.id)
    window.scrollTo(0, 0)
  }, [currentTool, visit])
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">メインコンテンツへ</a>
      <Header theme={theme} setTheme={setTheme} homeState={homeState} onHomeClick={goHome} />
      <main className="page-main" id="main-content" tabIndex={-1}>
        {unavailable && <p className="container storage-notice" role="status">このブラウザでは保存できません。お気に入り・履歴は、この画面を開いている間だけ利用できます。</p>}
        {currentTool && <nav className="container tool-navigation" aria-label="ツールナビゲーション">
          <Link to="/" state={homeState} onClick={goHome}>← 道具一覧に戻る</Link>
          <button className="detail-favorite secondary-button" type="button" aria-pressed={shelf.favorites.includes(currentTool.id)}
            onClick={() => toggleFavorite(currentTool.id)}>{shelf.favorites.includes(currentTool.id) ? '★ お気に入り登録済み' : '☆ お気に入りに追加'}</button>
        </nav>}
        <ToolLoadBoundary key={pathname} homeState={homeState} onHomeClick={goHome}>
          <Suspense fallback={<div className="container tool-page tool-loading" role="status" aria-live="polite">ツールを読み込んでいます…</div>}>
            <Outlet />
          </Suspense>
        </ToolLoadBoundary>
      </main>
      <footer className="site-footer"><div className="container footer-inner">
        <div><strong>ぽけつる</strong><span>ちょっと便利なツールを、ポケットに。</span></div>
        <p>入力データは、このブラウザの中で。<br /><span>お気に入り・履歴はこの端末に保存されます。</span></p>
      </div></footer>
    </div>
  )
}
