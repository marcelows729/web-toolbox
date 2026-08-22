# Tool Development Guide

## 目的

Web Toolboxに新しいツールを追加する際の基本ルールを定義する。

本プロジェクトでは、ツール数が増えても保守しやすく、新しいツールを少ない変更で追加できる構造を重視する。

---

# 1. 基本方針

各ツールは可能な限り独立して実装する。

新しいツールを追加するために、既存ツールのコードを多数変更する必要がある構造は避ける。

ただし、将来を予測した過度な抽象化は行わない。

同じ実装やUIパターンが複数のツールで必要になった段階で共通化を検討する。

---

# 2. Tool Registry

Web Toolboxでは、各ツールの基本情報をTool Registryで一元管理する。

Tool Registryは以下で利用する。

* トップページのツール一覧
* ツール検索
* カテゴリフィルター
* 関連ツール
* ツールへのリンク

---

## 2.1 Tool Metadata

各ツールは最低限以下の情報を持つ。

```ts id="1b4jyz"
type Tool = {
  id: string
  name: string
  description: string
  category: ToolCategory
  keywords: string[]
  path: string
  relatedTools?: string[]
}
```

実装上必要になった場合は変更可能とする。

ただし、不要な項目を将来利用する可能性だけを理由に追加しない。

---

## 2.2 id

ツールを一意に識別するID。

例：

```text id="iwp95h"
json-formatter
```

以下の用途で利用する。

* Tool Registry
* relatedTools
* 内部的なツール識別

原則としてURLで扱いやすいkebab-caseを使用する。

---

## 2.3 name

ユーザーに表示するツール名。

例：

```text id="2zkjbf"
JSON Formatter
```

---

## 2.4 description

ツール一覧やツールページで表示する短い説明。

例：

```text id="bt6x3i"
JSONを整形・圧縮します。
```

長い説明はTool Metadataには持たせず、各ツールページ側で管理する。

---

## 2.5 category

ツールが所属するカテゴリ。

初期カテゴリ：

```text id="47a9o8"
developer
text
datetime
network
other
```

表示名：

```text id="u11rrv"
developer → 開発
text      → テキスト・変換
datetime  → 日時
network   → ネットワーク
other     → その他
```

カテゴリの追加は、既存カテゴリでは不自然なツールが複数増えた場合に検討する。

ツール1個のためだけに新しいカテゴリを作ることは原則避ける。

---

## 2.6 keywords

検索用キーワード。

例：

```ts id="kjvpr8"
[
  "json",
  "format",
  "formatter",
  "整形",
  "圧縮"
]
```

日本語・英語の両方を必要に応じて登録する。

---

## 2.7 path

ツールのURL。

原則：

```text id="5ft9of"
/tools/{id}
```

例：

```text id="ev86oh"
/tools/json-formatter
```

---

## 2.8 relatedTools

関連ツールのIDを指定する。

例：

```ts id="0av1qk"
relatedTools: [
  "base64-converter",
  "url-encoder",
  "text-diff"
]
```

Tool Registryから対象ツールを取得して表示する。

存在しないIDが指定されてもアプリケーション全体が停止しないようにする。

関連ツールがない場合は省略可能とする。

---

# 3. Date Input Rules

日付・日時の入力欄では、ネイティブの `input type="date"` / `input type="datetime-local"` だけで年を4桁に制限しない。

- 5桁目以降は入力段階で拒否する
- 年は最大4桁、月と日は2桁までを基本とする
- Pasteや直接キーボード入力も同じ制御を適用する
- 既存のValidation checksは維持する
- 日付のユーザー入力は年・月・日を分割し、Calendar Pickerは補助操作として利用する
- 通常の画面上に「今日」ボタンを置かない
- Calendar Trigger は SVG アイコンボタンを使用する
- 表示用入力は text input と補助 date input の組み合わせを基本とし、年4桁制限を保証する
- 画面上で `-`, `/`, `T` を直接入力させない

今後追加する日付系ツールでも、同じ方式を採用する。

native date input だけで年4桁を保証しようとしない。

## 3.1 Date Input Standard

日付入力の標準は、以下の構成を基本とする。

- 年 / 月 / 日の分割入力
- Calendar Picker はアイコンボタンで起動
- Calendar Icon は SVG を使用
- button は Secondary Action として扱う
- `aria-label` を必須とする
- 通常の「今日」ボタンは置かない
- 今日の日付は Calendar Picker 側のブラウザUIから選択する
- 日時入力で「現在時刻」が必要な場合だけ、個別の補助機能として提供する
- 内部で必要な場合のみ `YYYY-MM-DD` に組み立てる

## 3.2 Datetime UI Rules

ユーザーに ISO 8601 の `T` を直接入力させない。

- 日付と時刻は UI 上で分離する
- 西暦日付は年・月・日を分割した入力を基本とする
- 年は4桁まで、月と日は2桁までを基本とする
- 日付は共通の DatePartsInput を利用する
- 時刻は `input type="time"` など自然な UI を使用する
- 必要な ISO 形式への結合は内部で行う
- ユーザーは `-`, `T`, `:` といったISO記号を意識しなくても入力できる

今後追加する日付系ツールでも、ユーザーには `YYYY-MM-DD` を1つの入力欄として見せず、年・月・日を分割して入力させる。

---

# 4. Tool Registry Example

概念的には以下のような構造とする。

```ts id="k4kq0d"
export const tools: Tool[] = [
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
]
```

実際のファイル名・配置場所はArchitectureで定義する。

---

# 4. ツール実装

各ツールの実装は可能な限り独立させる。

想定例：

```text id="5mtrc9"
src/
└─ tools/
   ├─ registry.ts
   │
   └─ json-formatter/
      └─ JsonFormatter.tsx
```

ツール固有のロジックやUIは、そのツールのディレクトリ内に配置する。

ツールが複雑になった場合は、そのディレクトリ内でファイルを分割してよい。

例：

```text id="8aw2ql"
json-formatter/
├─ JsonFormatter.tsx
├─ jsonFormatter.ts
└─ JsonFormatter.test.ts
```

単純なツールを最初から複数ファイルへ分割する必要はない。

---

# 5. UI

ツールページは `docs/screen-design.md` の共通構成に従う。

以下は、ぽけつるで共通に使う基本UIルールとする。

## 5.1 Button

### Primary Action

主要操作はブランドブルーの背景と白文字で統一する。

例:

* Format
* Generate
* Encode
* Decode
* 変換
* 計算

基本ルール:

* 背景: `var(--accent)`
* 文字: `#FFFFFF`
* hover: 少し濃い青へ変化
* focus-visible: 明確なoutline / ringを表示
* disabled時: 操作不可と分かる低い不透明度を維持

### Secondary Action

補助操作は控えめなデザインを維持する。

例:

* Clear
* Copy
* 今日

基本ルール:

* 背景: `var(--surface)`
* 文字: `var(--text)`
* border: `var(--border-strong)`
* Primaryより目立たない

### Selected State

toggle / segmented control の選択中状態はブランドブルー + 白文字で表現する。

例:

* Local / UTC
* 小文字 / 大文字
* ○日後 / ○日前
* 文字列 / 数値

selected state の基本ルール:

* 背景: `var(--accent)`
* 文字: `var(--primary-contrast)`
* border: `var(--accent)`
* unselected state は Theme に馴染む中立色にする

## 5.2 Date Input Rules

日付入力では、西暦年は原則として 4 桁の `YYYY` を使用する。

* `type="date"` / `type="datetime-local"` のブラウザUIだけに依存せず、実際の `value` を確認する
* 年が 4 桁でない値は、入力を受け付けずエラー表示する
* 不正な年を自動で切り捨てない
* 日付妥当性チェック（例: 2026-02-30）も併用する
* 日付系ツールを追加する場合は、同じルールを守る

## 5.3 Form

入力フォームは共通の見た目に揃える。

* border-radius: 12px
* border color: `var(--border-strong)`
* background: `var(--surface)`
* text color: `var(--text)`
* padding: 12px 14px
* focus-visible: 明確なoutline

label は以下を統一する。

* font-weight: 600
* 下余白を確保
* 文字サイズは大きく変えない

## 5.3 Layout

ツール内の基本レイアウトは以下を守る。

* 見出し → 説明
* 説明 → form
* form → actions
* actions → results
* パネル間: 32px前後の余白

カードやコンテンツのまとまりは、既存の `tool-panel` / `converter-card` と同じ感覚で扱う。

## 5.4 Theme

Colorの基準は CSS variable を利用する。

例:

* `--accent`
* `--accent-hover`
* `--surface`
* `--border`
* `--text`

Light / Dark の両方でコントラストが十分に取れるようにする。

## 5.5 Accessibility

新しいツールでは以下を必ず守る。

* label を用意する
* `aria-pressed` などの選択状態を保つ
* `role="alert"` と `role="status"` を必要に応じて付与する
* `:focus-visible` を利用してキーボード操作を明確にする

## 5.6 Shared Class

共通UIとして次のCSS classを利用できる。

* `.primary-button`
* `.secondary-button`
* `.toggle-group`
* `.toggle-option`
* `.tool-panel`
* `.action-row`
* `.field-label`

ツールごとに完全に同じレイアウトにする必要はないが、
同じ意味の操作は同じ見た目に揃える。

---

# 6. 完成後の確認

新しいツールの実装後は、Light / Dark / PC / Smartphone で
Primary / Secondary / Selected State の見え方と contrast を確認する。

必要な調整を最小限に留め、過度な共通化や大規模なUIリニューアルは行わない。
* description
* Input
* Action
* Output
* Copy
* Clear
* Error
* Tool Description
* Usage
* Related Tools
* Privacy Information

ただし、ツールの用途によって不要なものは省略可能とする。

---

# 6. Processing

## 6.1 Browser Processing

ブラウザだけで実現できる処理は、原則としてブラウザ上で実行する。

例：

* JSON整形
* Base64 Encode / Decode
* URL Encode / Decode
* Timestamp変換
* UUID生成
* テキスト加工
* Diff

これらの処理のためだけにBackend APIを追加しない。

---

## 6.2 Backend Processing

以下のような理由がある場合にBackendを検討する。

* Databaseが必要
* ユーザー認証が必要
* サーバー側で保持するデータが必要
* ブラウザから直接利用すべきではない外部APIが必要
* SecretやAPI Keyを保護する必要がある
* サーバー側で実行する必要がある処理

Backend追加はアプリケーション全体に影響するため、必要性を確認してから実施する。

将来的なBackendはJava + Spring Bootを想定する。

---

# 7. Privacy

ユーザーが入力するデータは潜在的に機密情報を含むものとして扱う。

ブラウザ内で処理可能な場合は外部へ送信しない。

ブラウザ内完結ツールでは、ツールページに以下の趣旨を表示する。

```text id="82nmga"
このツールの処理はすべてブラウザ上で実行されます。
入力したデータはサーバーへ送信されません。
```

Backendや外部APIへデータを送信するツールでは、この表示を使用しない。

必要に応じて送信されるデータについて明示する。

---

# 8. Dependencies

新しいツールを追加するためだけに外部ライブラリを安易に追加しない。

以下の順番で検討する。

1. JavaScript / TypeScript標準機能
2. Browser API
3. プロジェクトに既に存在するライブラリ
4. 新しいライブラリ

新しいライブラリを追加する場合は、その必要性を確認する。

---

# 9. Error Handling

ユーザー入力によってエラーが発生しても、アプリケーション全体が停止しないようにする。

入力エラーは可能な限りツール画面内で表示する。

ユーザーが修正可能な内容であれば、理解しやすいエラーメッセージを表示する。

---

# 10. Copy

出力を持つツールでは、必要に応じてクリップボードへのコピー機能を提供する。

Browser Clipboard APIの利用を基本とする。

コピー成功時は簡単なフィードバックを表示する。

---

# 11. Responsive Design

PCでの利用を主対象とする。

ただし、スマートフォンでも最低限ツールを利用できるようにする。

ツール固有UIを追加する際も不要な固定幅を避ける。

---

# 12. New Tool Workflow

新しいツールを追加する際は以下の順番を基本とする。

1. ツールの目的を定義する
2. Input / Outputを定義する
3. ブラウザだけで実現可能か確認する
4. Tool Metadataを定義する
5. ツールを実装する
6. Tool Registryへ登録する
7. 一覧に表示されることを確認する
8. 検索できることを確認する
9. カテゴリフィルターが機能することを確認する
10. 個別URLから直接アクセスできることを確認する
11. 関連ツールがある場合は設定する
12. PCで動作確認する
13. スマートフォン相当の画面幅で最低限の動作確認をする
14. 必要に応じてテストを追加する
15. 新しい設計判断が発生した場合は `docs/decisions.md` を更新する

---

# 13. Scope Control

新しいツールの実装時に、依頼されていない別ツールや大規模な共通機能を同時に追加しない。

共通化が必要に見える場合でも、現在の実装に必要でなければ追加しない。

既存設計を大きく変更する必要がある場合は、実装前に影響を確認する。
