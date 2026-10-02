# トップの用途別導線（2026-10-02）

変更前はヒーロー右側の「よく使うツール」にJSON Formatter、文字数カウンター、日付・日数計算の3カードを固定表示していた。実際の利用数に基づく表示ではなく、画像・タイマーなど一般向けツールが増えたことが入口から分かりにくかった。

同じ位置を、背景カードやアイコンを重ねない3行の「用途から探す」へ置き換える。文字数は既存の文字数カウンターへ直接進む。画像は検索語「画像」、日付・時間は検索語「日付・時間」で一覧へ進む。日付・時間は既存の日時カテゴリだけではタイマー等を含められないため、日付計算・西暦/和暦・Timestamp・時間の足し引き・ストップウォッチ・タイマーの6件に共通キーワードを追加した。カテゴリ、登録順、ツール数35、名前・URL・ID・ツール機能は変更しない。人気順や利用数は作らない。

用途ボタンは現在の検索を置き換え、カテゴリと棚を「すべて」に戻して、検索欄へフォーカスとスクロールを移す。以前のお気に入り棚などが検索結果を隠さないようにする。履歴エントリは既存方式でreplaceし、履歴を増やさない。一覧からツールへ進んだ後のBack/Forward/一覧リンクは、その用途の検索条件を復元する。文字数への直接リンクは、クリック前の検索・カテゴリ・棚を戻り先として保持する。お気に入りと最近使用のID保存形式は変更しない。検索語は従来と同じ履歴stateだけで扱い、URL/Web Storage/通信へ追加しない。

## 検証

```powershell
npm test
npm run lint
npm run build
node scripts/sync-catalogue.mjs --check
git diff --check
node tests/home-discovery-browser.mjs
node tests/catalogue-browser.mjs
node tests/tool-shelf-browser.mjs
node tests/public-catalogue-browser.mjs
```

専用headless Edge（CDP9222）とproduction preview（5173）で、同じページを順番に操作する。用途導線は320/375/768/1280pxのlight/dark、ネイティブTab/Enter、focus、検索への移動、条件解除、履歴件数、Back/Forward/一覧リンク、直接文字数リンクの条件保持、reduced-motion、入力の非保存・非送信を検証する。既存の全35件の検索/カテゴリ/棚/履歴、2タブ同期・破損保存、ページ名と登録・サイトマップの整合も再確認する。旧トップは本番から読み取り専用で撮影し、新トップの8枚を目視確認する。実機Safariは未検証。

## 本番での確認

https://poketsuru.com/ の「画像」で切り抜き・回転・リサイズ・結合が表示され、「日付・時間」で日付計算・タイマー・ストップウォッチ等の6件が表示されることを確認する。検索やお気に入り棚を選んだ状態から「文字数」を開き、戻ると条件が保持されること、用途ボタンを押すと全ツールからその用途を探せることを確認する。キーボードと各幅のlight/darkも確認する。

## 用途導線の状態別コントラスト修正

共通button:hoverの背景だけが用途ボタンへ適用される不具合を修正。3導線共通でhover/focus-visible/activeの背景をsurface-alt、文字をtext、ラベルと境界線をaccentに指定する。機能・検索条件は変更しない。tests/home-use-case-contrast-browser.mjsで通常/hover/focus-visible/active/hover+focusを3導線×2テーマ×4幅の120組合せで測定。文字・説明・矢印の最低値5.28:1、focus枠5.28:1。実ポインターhoverも確認し、320/1280pxの状態別画像を目視した。既存のkeyboard/履歴ブラウザ検証、156件のテスト、lint/build/差分チェックも通過。

追加検証: node tests/home-use-case-contrast-browser.mjs
