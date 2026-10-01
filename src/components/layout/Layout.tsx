import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import { tools } from '../../tools/registry'
import { useToolShelf } from '../../state/ToolShelfContext'

type LayoutProps = { theme: 'light' | 'dark'; setTheme: (nextTheme: 'light' | 'dark') => void }
export default function Layout({ theme, setTheme }: LayoutProps) {
  const { pathname } = useLocation()
  const { shelf, unavailable, visit, toggleFavorite } = useToolShelf()
  const currentTool = tools.find(tool => tool.path === pathname)
  useEffect(() => {
    if (currentTool) visit(currentTool.id)
    window.scrollTo(0, 0)
  }, [currentTool, visit])
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">メインコンテンツへ</a>
      <Header theme={theme} setTheme={setTheme} />
      <main className="page-main" id="main-content" tabIndex={-1}>
        {unavailable && <p className="container storage-notice" role="status">このブラウザでは保存できません。お気に入り・履歴は、この画面を開いている間だけ利用できます。</p>}
        {currentTool && <nav className="container tool-navigation" aria-label="ツールナビゲーション">
          <Link to="/">← 道具一覧に戻る</Link>
          <button className="detail-favorite secondary-button" type="button" aria-pressed={shelf.favorites.includes(currentTool.id)}
            onClick={() => toggleFavorite(currentTool.id)}>{shelf.favorites.includes(currentTool.id) ? '★ お気に入り登録済み' : '☆ お気に入りに追加'}</button>
        </nav>}
        <Outlet />
      </main>
      <footer className="site-footer"><div className="container footer-inner">
        <div><strong>ぽけつる</strong><span>ちょっと便利なツールを、ポケットに。</span></div>
        <p>入力データは、このブラウザの中で。<br /><span>お気に入り・履歴はこの端末に保存されます。</span></p>
      </div></footer>
    </div>
  )
}
