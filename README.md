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
公開ツール：41件。現在ツールが登録されているカテゴリ：6種類。

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

- [世界時計](https://poketsuru.com/tools/world-clock)
- [経過年月・年齢計算](https://poketsuru.com/tools/age-calculator)
- [日付・日数計算](https://poketsuru.com/tools/date-calculator)

### ネットワーク

- [IPv4 CIDR計算](https://poketsuru.com/tools/ipv4-cidr)

### 一般

- [分数計算](https://poketsuru.com/tools/fraction-calculator)
- [カラーコード変換](https://poketsuru.com/tools/color-converter)
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

### AION2

- [AION2 日課・週課チェック](https://poketsuru.com/tools/aion2-checklist)
<!-- public-tools:end -->

### AION2チェックの使い方・仕様更新

`/tools/aion2-checklist` の「コンテンツ別の回数管理」で、管理用のアカウント・サーバー・キャラクター識別名とレベルを指定します。ゲームのIDやパスワードは不要です。固定回数は完了数、蓄積型・資源はゲーム内の保有残数を入力します。未入力の残数を満タンとは仮定しません。

自動計算は初期状態で無効です。ゲーム内のリセット時刻・週次曜日・補充仕様を確認して設定し、確認チェックを有効にしてください。数値は非公式資料の候補値で、16時・水曜のタイムゾーンも未確認です。検索・区分・任意項目・非表示設定と進捗はブラウザ内に保存され、非表示項目は再表示できます。スマホではカードが1列、PCでは2列になります。

自由入力チェック表とその既存データは引き続き利用できます。コンテンツ管理と自由入力は保存キー・JSONが別です。各領域のJSONを書き出してバックアップし、復元時は表示された置換範囲を確認してください。同時編集は1タブに限定します。保存失敗時は画面内の変更をJSONへ退避してください。端末間同期・ゲーム連携・外部送信はありません。

仕様を更新する場合は `src/tools/aion2-checklist/master.ts` の安定したIDを維持して名称・上限・補充・共有範囲を修正し、[照合記録と未確認事項](docs/aion2-checklist.md) に対象地域、ゲーム版、確認日、出典と画面上の表記を追記します。未確認の値を公式確認済みとしないでください。計算の変更は `logic.ts`、境界テストは `tests/aion2-content.test.mjs` へ追加します。共有範囲やID変更には保存キー移行の検討が必要です。

検証：`npm run build`、`npm run lint`、`npm test`。AION2のブラウザー検証は `npm run test:aion2:browser`。専用Edgeを起動したブラウザー検証の手順は [開発環境](docs/development-environment.md) を参照してください。
