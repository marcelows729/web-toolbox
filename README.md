# ぽけつる

ちょっと便利なツールを、ポケットに。

日常業務や開発作業で利用できる、小規模なWebツールをまとめたWebアプリケーションです。

## Brand

- ブランド名: ぽけつる
- ローマ字表記: POKETSURU
- キャッチコピー: ちょっと便利なツールを、ポケットに。
- ドメイン: https://poketsuru.com
- Theme: Light / Dark
- 初回表示: OSのテーマ設定を参照
- Theme保存: LocalStorage (`poketsuru-theme`)

## 目的

- 日常的な開発・業務作業を効率化する
- 小さなWebツールを継続的に追加できる基盤を作る
- Web開発およびAIコーディングを活用した個人開発の経験を蓄積する
- 将来的に必要に応じてバックエンドやデータベースを追加できる構成とする

## 初期技術構成

- React
- TypeScript
- Vite
- GitHub
- Cloudflare Pages

初期段階では、可能な限り処理をブラウザ内で完結させます。

## 将来的な構成

必要になった場合は以下を追加します。

- Java
- Spring Boot
- PostgreSQL
- AWS

フロントエンドとバックエンドは分離し、ReactからREST API経由でSpring Bootを利用する構成を想定しています。

## 開発方針

- 小さく作る
- 共通化しすぎない
- 同じ実装が増えてから共通化を検討する
- 新しいツールを簡単に追加できる構成を優先する
- ブラウザだけで処理可能なデータはサーバーへ送信しない

## 買い物・料理のツール

- 買い物の単価比較: /tools/unit-price-comparison — 2〜4商品を同じ重さ・体積・個数の価格で比較。
- レシピの分量調整: /tools/recipe-scaler — 人数・倍率に合わせて最大20行の材料を調整。

入力は保存・送信せず、この画面内だけで扱います。詳細な計算範囲は各画面に記載しています。


## テキスト整形

/tools/text-formatter で、行の空白・空行・重複除去と改行の空白置換を必要な操作だけ選んで適用できます。元入力と結果を分け、行数・文字数を比較します。操作はすべて既定OFF、入力は保存・送信しません。

## 公開ツール一覧

レジストリから生成しています。ツール追加時は `node scripts/sync-catalogue.mjs`、確認は `node scripts/sync-catalogue.mjs --check` を実行してください。サイトマップも同時に更新します。

<!-- public-tools:start -->
公開ツール：36件。現在ツールが登録されているカテゴリ：5種類。

### 開発

- [JSON Formatter](https://poketsuru.com/tools/json-formatter)
- [SQL IN Generator](https://poketsuru.com/tools/sql-in-generator)
- [Timestamp Converter](https://poketsuru.com/tools/timestamp-converter)
- [URL Encode / Decode](https://poketsuru.com/tools/url-encode-decode)
- [Base64 Encode / Decode](https://poketsuru.com/tools/base64-encode-decode)
- [UUID Generator](https://poketsuru.com/tools/uuid-generator)
- [SHA-256ハッシュ計算](https://poketsuru.com/tools/sha256)
- [進数変換](https://poketsuru.com/tools/radix-converter)

### テキスト・変換

- [英数字の全角・半角変換](https://poketsuru.com/tools/width-converter)
- [文字列の一括置換](https://poketsuru.com/tools/text-replace)
- [テキスト整形](https://poketsuru.com/tools/text-formatter)
- [文字数カウンター](https://poketsuru.com/tools/character-counter)
- [Text Diff](https://poketsuru.com/tools/text-diff)
- [HTMLエスケープ・解除](https://poketsuru.com/tools/html-escape)

### 日時

- [日付・日数計算](https://poketsuru.com/tools/date-calculator)

### ネットワーク

- [IPv4 CIDR計算](https://poketsuru.com/tools/ipv4-cidr)

### 一般

- [連番作成](https://poketsuru.com/tools/sequence-generator)
- [画像の切り抜き](https://poketsuru.com/tools/image-crop)
- [カウントダウンタイマー](https://poketsuru.com/tools/countdown-timer)
- [ストップウォッチ](https://poketsuru.com/tools/stopwatch)
- [縦横比・サイズ計算](https://poketsuru.com/tools/aspect-ratio)
- [画像の回転・反転](https://poketsuru.com/tools/image-rotate)
- [ランダム組み分け](https://poketsuru.com/tools/random-grouping)
- [時間の足し算・引き算](https://poketsuru.com/tools/duration-calculator)
- [買い物の単価比較](https://poketsuru.com/tools/unit-price-comparison)
- [レシピの分量調整](https://poketsuru.com/tools/recipe-scaler)
- [画像サイズ変更・圧縮](https://poketsuru.com/tools/image-resizer)
- [画像を並べる](https://poketsuru.com/tools/image-joiner)
- [休日スタイル診断](https://poketsuru.com/tools/holiday-style)
- [行動スタイル診断](https://poketsuru.com/tools/pocket-companion)
- [単位変換](https://poketsuru.com/tools/unit-converter)
- [割り勘計算](https://poketsuru.com/tools/bill-splitter)
- [ルーレット抽選](https://poketsuru.com/tools/roulette-picker)
- [西暦・和暦変換](https://poketsuru.com/tools/japanese-era-converter)
- [QRコード生成](https://poketsuru.com/tools/qr-code-generator)
- [割合・増減率計算](https://poketsuru.com/tools/percentage-calculator)
<!-- public-tools:end -->
