# Character Counter Implementation

## 目的

「ぽけつる / POKETSURU」に、新しいツールとして「文字数カウンター」を追加する。

入力したテキストについて、文字数・行数・単語数・UTF-8バイト数などをリアルタイムで確認できる、シンプルで使いやすいWebツールとする。

一般ユーザーから開発者まで利用できるツールとして設計する。

既存の設計・Tool Registry・Routing・UI・Themeの方針に従い、不要な共通化や大規模な変更は行わない。

---

# 1. Prompt保存

実装前に、この依頼内容を以下へMarkdownとして保存すること。

`docs/prompts/character-counter.md`

既存の `docs/prompts/` の運用方法に合わせること。

保存後、その仕様に基づいて実装を進める。

---

# 2. 実装前確認

実装前に以下を確認すること。

- AGENTS.md
- docs/requirements.md
- docs/architecture.md
- docs/screen-design.md
- docs/tool-development-guide.md
- docs/decisions.md
- 既存ツール実装

特に以下を参考にすること。

- JSON Formatter
- SQL IN Generator
- Timestamp Converter
- Tool Registry
- Routing
- Light / Dark Theme

既存設計と今回の要件に矛盾がある場合は、独断で大きく変更せず報告すること。

---

# 3. Tool

名称:

文字数カウンター

英語名として必要な場合:

Character Counter

URL:

`/tools/character-counter`

カテゴリ:

`text`

既存のToolCategoryに `text` が存在しない場合は、現在のカテゴリ設計を確認したうえで追加すること。

カテゴリ追加によってHomePageのフィルター等に影響がある場合は、必要最小限の対応を行うこと。

説明:

`入力したテキストの文字数・行数・単語数・バイト数をリアルタイムで確認します。`

---

# 4. Tool Registry

Tool Registryへ文字数カウンターを追加する。

想定metadata:

```ts
{
  id: 'character-counter',
  name: '文字数カウンター',
  description: '入力したテキストの文字数・行数・単語数・バイト数をリアルタイムで確認します。',
  category: 'text',
  keywords: [
    '文字数',
    '文字数カウント',
    'カウンター',
    '行数',
    '単語数',
    'バイト数',
    'character',
    'count',
    'text'
  ],
  path: '/tools/character-counter'
}
```

relatedToolsは自然なものが存在する場合のみ設定する。

---

# 5. 基本UI

大きめのtextareaを1つ配置する。

ユーザーが入力・貼り付けすると、各種カウント結果をリアルタイムで更新する。

Generate / Countボタンは設けず、入力に応じて即時反映すること。

入力欄には分かりやすいplaceholderを設定する。

例:

`ここに文字数を数えたいテキストを入力してください。`

---

# 6. 表示するカウント

最低限、以下を表示する。

## 文字数（空白を含む）

入力テキスト全体の文字数。

改行文字についてはJavaScript上の文字列として自然かつ一貫した方法で扱うこと。

## 文字数（空白を除く）

以下を除外した文字数を表示する。

- 半角スペース
- 全角スペース
- タブ
- 改行

その他の一般的なwhitespaceも自然に除外できる実装であれば利用してよい。

## 行数

テキストの行数。

空入力の場合:

`0`

1行入力の場合:

`1`

末尾に改行がある場合も、改行によって新しい空行が発生しているとみなし、その空行を含めて数える。

例:

- `Hello` → `1`
- `Hello\n` → `2`
- `Hello\n\n` → `3`
- `Hello\nWorld\n` → `3`

基本的には、空文字でない場合は「改行数 + 1」として計算する。

CRLF (`\r\n`) と LF (`\n`) の差が出ないよう、内部で正規化して計算する。

## 単語数

主に英語等のスペース区切り文章を対象とした単語数。

連続するwhitespaceは1つの区切りとして扱う。

空入力の場合:

`0`

日本語について、形態素解析等の高度な単語分割は行わない。

UIまたは説明文で必要であれば、

`単語数はスペース等で区切られた語を基準に計算します。`

という趣旨を明示する。

## UTF-8 バイト数

入力テキストをUTF-8として扱った場合のバイト数を表示する。

ブラウザ標準の `TextEncoder` を使用してよい。

外部ライブラリは追加しない。

日本語や絵文字も正しく計算できること。

---

# 7. 文字数のUnicode対応

JavaScriptの単純な `.length` では、一部の絵文字などがユーザーから見た1文字と一致しない場合がある。

今回の「文字数」は、可能な範囲でユーザーが視覚的に認識する文字数に近づけること。

ブラウザ標準の `Intl.Segmenter` が既存の対象ブラウザで利用可能であれば、grapheme単位のカウントを検討する。

ただし、

- 外部ライブラリは追加しない
- 過度なpolyfillは追加しない
- 既存ブラウザサポート方針を壊さない

こと。

`Intl.Segmenter` を利用する場合は、利用できない環境で安全にfallbackできるようにする。

fallbackとして `Array.from(text).length` 等を利用してよい。

---

# 8. リアルタイム更新

textareaの内容が変化するたびに結果を更新する。

今回の計算量では、不要なdebounceや複雑な最適化は行わない。

Reactとして自然でシンプルな実装を優先する。

---

# 9. Clear

Clearボタンを設ける。

押下時:

- textareaを空にする
- すべてのカウントを0に戻す

---

# 10. Copy

入力テキストをコピーできるCopyボタンを設けてもよい。

既存ツールと操作感を揃えられる場合は実装する。

実装する場合は既存のCopy feedback方式を利用する。

ただし、文字数カウンターの主目的ではないため、UIを複雑にしないこと。

---

# 11. カウント表示UI

各結果が一目で確認できるようにする。

例:

文字数
125

空白除外
108

行数
6

単語数
23

UTF-8
284 bytes

PCではカード状またはグリッド表示としてよい。

スマートフォンでは自然に折り返すこと。

既存の「ぽけつる」のデザインから大きく逸脱しない。

---

# 12. Privacy

処理はすべてブラウザ上で行う。

入力テキストをBackendや外部APIへ送信しない。

既存ツールと同様、

`このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。`

という趣旨を表示する。

---

# 13. Tool Description

ツール下部に簡単な説明を表示する。

内容例:

文字数カウンターは、入力した文章の文字数・行数・単語数・UTF-8バイト数をリアルタイムで確認できるツールです。

レポート、SNS投稿、原稿、フォーム入力、開発時のデータ確認などに利用できます。

---

# 14. Usage

簡単な使い方を表示する。

例:

1. テキストを入力または貼り付けます。
2. 文字数などがリアルタイムで表示されます。
3. 必要に応じてClearで入力を削除します。

単語数については、スペース等で区切られた語を基準にすることを説明する。

---

# 15. UI / Theme

既存の「ぽけつる」のUIへ合わせる。

対応:

- Light Mode
- Dark Mode
- PC
- スマートフォン相当の画面幅

新しいUI FrameworkやCSS Libraryは追加しない。

---

# 16. Routing

React Routerへ以下を明示的に追加する。

`/tools/character-counter`

現在の方針どおり、Tool RegistryからRouteを自動生成する仕組みは今回追加しない。

---

# 17. Scope Control

今回実装しないもの:

- 日本語の形態素解析
- 原稿用紙換算
- SNS別文字数制限判定
- Twitter / X投稿判定
- SEO文章分析
- キーワード出現頻度
- 読了時間
- ファイルアップロード
- Backend
- Database
- External API
- 新規Runtime Dependency

将来必要になる可能性だけを理由に追加しないこと。

---

# 18. Documentation

必要に応じて現在の実装状態へ更新する。

- docs/requirements.md
- docs/screen-design.md
- docs/development-log.md

カテゴリ追加など、新しい設計判断として記録すべき事項が発生した場合のみ、適切な設計ドキュメントを更新する。

不要なドキュメント変更は行わない。

---

# 19. Validation Cases

最低限以下を確認する。

## Empty

入力:

空

期待:

- 文字数: 0
- 空白除外: 0
- 行数: 0
- 単語数: 0
- UTF-8: 0 bytes

## Japanese

入力:

こんにちは

期待:

- 文字数: 5
- 空白除外: 5
- 行数: 1
- UTF-8: 15 bytes

## English

入力:

Hello world

期待:

- 文字数: 11
- 空白除外: 10
- 行数: 1
- 単語数: 2
- UTF-8: 11 bytes

## Multiline

入力:

Hello
World

期待:

- 行数: 2

その他のカウントも入力内容に応じて正しいこと。

## Whitespace

半角スペース・全角スペース・タブ・改行が、空白除外カウントで除外されること。

## Emoji

絵文字を含むテキストでアプリがエラーにならないこと。

可能な場合、ユーザーが認識する文字数に近いカウントになること。

## Existing Features

以下が従来通り動作すること。

- Home
- Tool Search
- Category Filter
- JSON Formatter
- SQL IN Generator
- Timestamp Converter
- Theme
- Routing

---

# 20. Build

実装後:

npm run build

を実行し、成功すること。

---

# 21. 完了報告

実装後、以下を報告すること。

1. 変更ファイル
2. Prompt保存先
3. Tool Registryへの追加内容
4. 文字数のカウント方式
5. Unicode / Emojiの扱い
6. 空白除外方式
7. 行数・単語数の計算方式
8. UTF-8バイト数の計算方式
9. 実行した確認ケース
10. npm run build結果
11. ドキュメント更新内容
12. 残課題
13. 人間側でブラウザ確認すべきポイント

今回の範囲を超える機能追加や大規模リファクタリングは行わないこと。
