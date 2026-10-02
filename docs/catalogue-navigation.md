# 一覧の表示条件を保持する（2026-10-02）

## 再現と修正

main 8ac01f4のローカルproduction previewと実Edgeで再現した。トップで「画像」を検索→画像の回転・反転→ブラウザBackでqueryが空、29件へ戻った。「最近使った道具」→ツール→Backも「すべての道具」に戻った。「道具一覧に戻る」リンクもqueryが消えた。HomePageのuseStateがルートを離れると破棄されることが原因。

HomePageはReact Routerのlocation stateから一覧条件を読む。検索／カテゴリ／棚の変更では現在の履歴エントリをreplaceし、キー入力ごとにBack先を増やさない。復元effectで履歴を書き戻す方式を使わず、イベントでだけ更新するため、戻る／進むで古い値が別のエントリを上書きしない。「すべての道具を見る」は3条件を1回で更新する。state解析と既存filterのuseMemoを維持。

一覧条件として保存するのはversion:1、query文字列、category、collection（all／favorites／recent）だけ。ツールへの戻り先には元一覧の履歴indexも数値で付ける。カードとトップのよく使うツールのLinkは一覧条件の戻り先snapshotをlocation stateへ渡す。ツールの一覧リンク、ブランドリンク、読込失敗画面の一覧リンクは、元の一覧が直前の履歴にある場合はBackで戻す。これにより一覧を編集した後のForwardでも古いsnapshotを再表示しない。直前に元の一覧がない場合だけ、新しいホームエントリへsnapshotを渡す。戻れるかはReact Routerの履歴indexを確認し、不正／未対応の場合はBackを使わず通常リンクにする。ブラウザBackは元のホームエントリをそのまま復元。ツールへ直接来た場合と新規タブには戻り先stateがなく、ホームは既定。未知URLのホームリンクも既定。

実際のお気に入り／最近使用のID一覧はsnapshotに入れず、既存ToolShelfProviderの最新値から毎回条件を適用する。お気に入り解除やrecent更新・消去の結果を古いカード一覧で上書きしない。ツール本文の入力・ファイル・設定を追加保存する変更はない。

履歴stateにバージョンがない・未知バージョン・不正型は既定。既知バージョンでも削除／未知カテゴリ、未知棚、不正queryは各項目だけ既定に戻す。余分なフィールドは採用しない。カテゴリは現在のcategoryLabelsのown keyだけを受理する。

queryはURL・localStorage・sessionStorageへ追加しない。外部送信処理を追加しない。history stateはブラウザ自身が管理するため、既存エントリの再読込やブラウザのセッション復元で残る場合がある。長期保存用の新しい仕組みは作らない。新しいURLからの直アクセスと新規タブはstateなしで開始する。

スクロールの新しい復元機構は導入しない。既存Layoutのルート移動時scrollToを維持し、一覧条件だけのreplaceはpathname／currentToolが変わらず、入力中にスクロールし直さないことを検証する。

## 検証

104件のNodeテスト。全カテゴリと全棚の往復、不正・旧バージョン・削除カテゴリ、入力不変、余分なフィールド除外を追加。既存29ツールの計算／棚／画像／登録テストは維持。

実Edgeで29ツールそれぞれにqueryとcategoryを組み合わせ、Back／Forward／一覧リンクで戻ることを確認。お気に入りと最近使用の複合条件、ツール内解除、recentの更新／消去、Back→条件編集→Forward→一覧リンク、native History APIで作成した同URLの独立したホーム履歴、読込失敗画面の戻り、履歴件数がキー入力で増えないこと、クリア／カテゴリ解除／全条件解除、ツール本文が再入場で空、直リンク／未知URL／実新規タブ／不正state／再読込を検証する。ライト／ダーク、1280／320px、ネイティブEnterでの移動と戻り、はみ出し、入力時スクロールの維持、画像目視を確認する。検索／本文のテストマーカーがHTTPリクエストURL・本文、web storage、location.searchにないことも検証する。

```powershell
npm test
npm run lint
npm run build
git diff --check
node tests/catalogue-browser.mjs
node tests/page-clarity-browser.mjs
node tests/browser-regressions.mjs
```

production previewの5173番と専用EdgeのCDP9222で順番に実行。同じページを使用するため並行実行しない。TEST_BASE_URLで本番、TEST_SCREENSHOT_DIRで画面保存先を指定できる。実機Safari／実スクリーンリーダーは検証範囲外。
