import { Component } from 'react'
import type { ReactNode, MouseEventHandler } from 'react'
import { Link } from 'react-router-dom'

export default class ToolLoadBoundary extends Component<{ children: ReactNode; homeState?: unknown; onHomeClick?: MouseEventHandler<HTMLAnchorElement> }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <section className="container tool-page" aria-labelledby="tool-load-title">
      <div className="error-box" role="alert">
        <h1 id="tool-load-title">ツールを表示できませんでした</h1>
        <p>通信状態を確認して、ページを再読み込みしてください。再読み込みすると入力内容は消えます。</p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-button" onClick={() => window.location.reload()}>再読み込み</button>
        <Link className="secondary-button tool-load-return" to="/" state={this.props.homeState} onClick={this.props.onHomeClick}>道具一覧に戻る</Link>
      </div>
    </section>
  }
}
