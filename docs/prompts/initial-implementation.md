# Initial Implementation

## 目的

Web Toolbox Version 0.1の初期実装を行う。

今回はWeb Toolboxの共通基盤と最初のツールであるJSON Formatterのみを実装する。

将来の機能を先回りして実装せず、現在の要件を満たすシンプルな構成とする。

---

# 1. 実装前に確認するドキュメント

実装を開始する前に、必ず以下を確認すること。

* `AGENTS.md`
* `docs/requirements.md`
* `docs/architecture.md`
* `docs/screen-design.md`
* `docs/tool-development-guide.md`
* `docs/decisions.md`
* `docs/development-environment.md`

ドキュメント間に矛盾がある場合や、実装上重要な判断が必要な場合は、独断で大きな設計変更を行わず報告すること。

---

# 2. 今回の実装範囲

以下を実装する。

## 共通基盤

* React + TypeScript + Viteの既存プロジェクトを使用
* React Routerの導入
* 共通Layout
* Header
* トップページ
* Tool Registry
* Tool Metadata型
* ツールカード
* ツール検索
* カテゴリフィルター
* レスポンシブ対応

## Tool

以下の1ツールのみ実装する。

* JSON Formatter

今回、その他のツールは実装しない。

---

# 3. Routing

React Routerを使用する。

最低限以下のRouteを作成する。

```text
/
→ HomePage

/tools/json-formatter
→ JsonFormatter
```

個別URLへ直接アクセスしても対象ページが表示されるFrontend構成とする。

RoutingはVersion 0.1では明示的に定義する。

Tool RegistryからRouteを自動生成する仕組みは実装しない。

---

# 4. Tool Registry

`src/tools/registry.ts` を作成する。

JSON Formatterを登録する。

Metadataは以下を基本とする。

```ts
{
  id: "json-formatter",
  name: "JSON Formatter",
  description: "JSONを整形・圧縮します。",
  category: "developer",
  keywords: [
    "json",
    "format",
    "formatter",
    "整形",
    "圧縮"
  ],
  path: "/tools/json-formatter"
}
```

型は `src/types/tool.ts` で定義する。

---

# 5. HomePage

トップページには以下を実装する。

## Header Area

以下を表示する。

```text
Web Toolbox

開発・業務で使える便利なWebツール集
```

## Search

検索入力欄を配置する。

以下を検索対象とする。

* name
* description
* keywords

大文字・小文字は可能な限り区別せず検索する。

## Category Filter

以下を用意する。

* すべて
* 開発
* テキスト・変換
* 日時
* ネットワーク
* その他

選択したカテゴリに所属するツールのみ表示する。

## Tool List

Tool Registryから一覧を生成する。

Tool Cardには以下を表示する。

* name
* description
* category

カード全体をクリック可能にし、対象ツールへ遷移する。

一覧へJSON Formatterをハードコードしない。

必ずTool Registryを利用する。

---

# 6. JSON Formatter

以下を実装する。

## Input

複数行入力可能なtextareaを使用する。

## Format

InputのJSONを解析し、インデント付きJSONとしてOutputへ表示する。

基本インデントは2スペースとする。

## Minify

InputのJSONを解析し、不要な空白・改行を除去したJSONとしてOutputへ表示する。

## Clear

以下をクリアする。

* Input
* Output
* Error
* Copy feedback

## Copy

OutputをClipboard APIでクリップボードへコピーする。

Outputが空の場合は不自然な動作をしないようにする。

コピー成功時はユーザーが認識できる簡単なフィードバックを表示する。

## Error

不正なJSONが入力された場合は、ツール画面内にエラーを表示する。

アプリケーション全体を停止させない。

可能であればJavaScriptの解析エラーを補助情報として表示する。

正常に処理できた場合は以前のエラーをクリアする。

---

# 7. JSON Formatter Page Content

ツール操作領域の下に以下を表示する。

## JSON Formatterとは

JSON Formatterの用途が簡潔に分かる説明。

## 使い方

以下の操作方法が分かる説明。

1. JSONを入力
2. Formatで整形
3. Minifyで圧縮
4. Copyで結果をコピー
5. Clearで内容を初期化

## Privacy Information

以下の趣旨を明示する。

```text
このツールの処理はすべてブラウザ上で実行されます。
入力したデータはサーバーへ送信されません。
```

## Related Tools

Version 0.1では他ツールを実装しないため、関連ツールが存在しない場合はセクションを表示しなくてよい。

---

# 8. Styling

`docs/screen-design.md` に従う。

以下を重視する。

* シンプル
* 見やすい
* ツール操作を邪魔しない
* PCで使いやすい
* スマートフォンでも最低限利用可能
* 各ツールへ展開しやすい

過度な装飾は行わない。

UIフレームワークは追加しない。

既存CSSまたは通常のCSSで実装する。

Vite初期画面のデザイン・ロゴ・サンプルコードは削除する。

---

# 9. Dependencies

React Router以外の新しいRuntime Dependencyは原則追加しない。

標準JavaScript / TypeScript、Browser API、Reactで実装可能なものはそれらを使用する。

追加Dependencyが必要だと判断した場合は、追加前に理由を報告すること。

---

# 10. Scope

今回実装しないもの：

* JSON Formatter以外のツール
* Backend
* Database
* Authentication
* User Account
* Analytics
* Advertisement
* Affiliate
* AWS
* Cloudflare固有コード
* Tool RegistryからのRoute自動生成
* 過度な共通コンポーネント化
* 不要な状態管理ライブラリ
* UI Framework

将来必要になるかもしれないという理由だけで実装しないこと。

---

# 11. Validation

実装後、最低限以下を確認する。

## Build

```bash
npm run build
```

が成功すること。

## HomePage

* トップページが表示される
* JSON Formatterが一覧に表示される
* 検索が機能する
* カテゴリフィルターが機能する
* JSON Formatterカードから詳細画面へ遷移できる

## JSON Formatter

* 正常なJSONをFormatできる
* 正常なJSONをMinifyできる
* 不正JSONでエラー表示される
* 正常処理後にエラーが消える
* Clearが機能する
* Copyが機能する
* ブラウザ内だけで処理される

## Routing

以下へ直接アクセスできるFrontend実装になっていること。

```text
/
/tools/json-formatter
```

## Responsive

PC幅とスマートフォン相当の幅で、致命的なレイアウト崩れがないこと。

---

# 12. Documentation

実装によって新しい重要な設計判断が発生した場合のみ `docs/decisions.md` を更新する。

単なる実装内容を理由に不要なドキュメント変更を行わない。

---

# 13. 完了報告

実装完了後、以下を報告すること。

1. 変更したファイル
2. 追加したDependency
3. 実装した内容
4. 実行した確認・テスト
5. 残っている課題
6. 判断が必要な事項

コード変更だけを行って終了せず、必ず実装結果を簡潔にまとめること。
