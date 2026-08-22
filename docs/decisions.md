# Decisions

プロジェクトにおける主要な技術・設計判断を記録する。

## 2026-08-22 Frontend Framework

### Decision

React + TypeScriptを使用する。

### Reason

* Reactの利用経験を活かせる
* 小規模ツールをコンポーネント単位で追加しやすい
* 将来的にSpring BootとのFrontend / Backend分離が容易

## 2026-08-22 Build Tool

### Decision

Viteを使用する。

### Reason

* React + TypeScriptの開発環境を簡潔に構築できる
* 開発サーバーが高速
* 静的ファイルとしてビルド可能
* Cloudflare Pagesとの相性が良い

## 2026-08-22 Initial Hosting

### Decision

Cloudflare Pagesを使用する予定とする。

### Reason

* 静的サイトを低コストで公開できる
* GitHubとの連携が容易
* 将来的にSpring Bootを別Backendとして追加できる
* フロントエンドのホスティングとBackendを分離できる

## 2026-08-22 Backend

### Decision

初期バージョンではBackendを作成しない。

### Reason

初期ツールはブラウザ内で処理可能であり、Spring BootやDatabaseを追加するメリットがないため。

Backendが必要な機能を実装するタイミングでSpring Bootを追加する。

## 2026-08-22 Routing

### Decision

React Routerを使用する。

### Reason

* Reactで広く利用されているルーティングライブラリである
* `/tools/{tool-id}` 形式の個別URLを扱いやすい
* Cloudflare Pages上のSPA構成で利用できる
* Version 0.1の規模に対して十分シンプルである
* 将来的にページ数やツール数が増えても対応しやすい

Version 0.1ではRoutingをTool Registryから自動生成せず、明示的に定義する。

自動生成は必要性が確認された段階で検討する。
