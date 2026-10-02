# Development Log

## 2026-08-22

### Project Setup

* 新規 `web-toolbox` プロジェクトを作成
* React + TypeScript + Vite環境を作成
* ローカル開発サーバーの起動を確認
* 初期ドキュメント構成を作成
* 初期ホスティングとしてCloudflare Pagesを採用する方針
* Backendは必要になるまで導入しない方針

### Tool Additions

* JSON Formatterを追加し、ブラウザ内でJSON整形・圧縮を実装
* SQL IN Generatorを追加し、改行/カンマ区切り入力からSQLのIN句用リストを生成可能にした
* 文字列モードと数値モードを切り替え、重複除去とコピー動作を実装
* Timestamp Converterを追加し、Unix Timestampと日時の相互変換をブラウザ内で実装
* Character Counterを追加し、リアルタイムの文字数・行数・単語数・UTF-8バイト数計算を実装
* URL Encode / Decodeを追加し、文字列とURLのエンコード・デコードをブラウザ内で実装
* Base64 Encode / Decodeを追加し、UTF-8テキストとBase64の相互変換をブラウザ内で実装
* UUID Generatorを追加し、UUID v4の複数生成・大文字/小文字切替・コピーをブラウザ内で実装
* 既存のルーティング・ツール一覧・検索と整合するようにTool Registryを更新


## 2026-10-02 青ブランドと診断の整理

青と深いネイビーを基調に、チケットの傾き・カード番号・英語装飾見出しを整理。余白・文字組み・フォーカス・reduced-motionを調整。診断は配点、同点説明、候補一覧を表示せず、コピーも選ばれた結果のみ。休日はインドア派／アウトドア派／趣味を楽しむ派／バランス型、旧相棒診断は日常の行動スタイル（計画型／実践型／協力型／慎重型）へ変更。旧ID・URL・棚互換性と計算は維持。公開ツールは23件のまま。

検証: npm test（52件、診断各1024組合せ）、lint、build、git diff --check。既存Edgeで115 URL、画像処理回帰、54 light/dark mobile表示、追加の診断戻る・再回答・コピー・非ネタバレ・320px・keyboard・reduced-motionを確認。スクリーンショットを目視。実機Safariは未検証。追加ブラウザ確認: node tests/quiz-design-browser.mjs（専用Edge CDPとpreviewは既存手順）。


## 2026-10-02 買い物・料理の計算ツール2件

単価比較（/tools/unit-price-comparison）とレシピ分量調整（/tools/recipe-scaler）を追加。青・ネイビーの既存デザイン、検索・お気に入り・最近使用・関連リンクに対応し25ツールへ。詳しい入力範囲と丸め仕様は画面とdecisions.mdに記載。

検証: npm test 64件（既存の診断全2048回答組合せを含む）、lint警告0、build、git diff --check。実Edgeで125 URL確認・画像処理回帰・58 light/dark mobile表示と、新ツールの追加削除上限、0価格、g/kg・mL/L・個、次元混在拒否、人数/倍率、小数・適量・少々、入力更新・リセット、実コピー、キーボードとフォーカス、お気に入り復元・保存IDのみを確認。light/dark・1280/320px画像を目視。実機Safariは未検証。

新ツールのブラウザ確認は既存の専用Edge CDPとpreviewを起動して node tests/everyday-browser.mjs。TEST_BASE_URLで本番にも対応し、TEST_SCREENSHOT_DIRでスクリーンショット出力先を指定できる。


## 2026-10-02 テキスト整形

テキスト整形を追加し、26ツールへ。5操作を選択式・既定OFFとし、元入力と結果を分離。改行・全角空白・タブ・Unicode・末尾改行の仕様と上限は画面とdecisions.mdに記載。既存文字数カウンターの定義を共通関数へ抽出し、見た目の文字数とfallbackを維持。

検証: npm test 75件（整形全32組合せと既存診断全2048回答組合せ）、lint、build、diffcheckと差分レビュー。実Edgeで130 URL・画像回帰・60明暗モバイル表示に加え、ネイティブ貼り付け、CRLF保持、キーボード、実コピー、入力/操作変更時の結果・通知消去、コピー中の変更、上限拒否で元入力保持、HTML文字列、カウンターとの一致、棚のID保存を確認。最大入力は4倍CPU低速化条件で約75ms（当該PCの測定、他端末の保証ではない）。light/dark・1280/320pxの画像を目視。実機Safariは未検証。

ブラウザ確認: 既存の専用Edge CDPとpreviewを起動し node tests/text-formatter-browser.mjs。TEST_BASE_URLで本番、TEST_SCREENSHOT_DIRで画像出力先を指定できる。


## 2026-10-02 変換4ツールの古い結果・コピー通知を修正

main 38b2c7fで再現。JSONは {"a":1} をFormat、SQLは 1,2 をGenerate、URLは a b をEncode、Base64は 日本語 をEncodeし、Copy後に入力末尾へ空白を追加すると、旧出力・有効なCopy・コピーしました通知が残る。SQLは旧件数も残る。

4ツールを既存useToolResultへ接続し、入力編集・Clear・再実行時に出力・エラー・通知を無効化。SQLの文字列/数値と重複設定、URLのモード変更も同様。コピーの遅い成功/失敗は入力変更・再実行・Clear・画面離脱後に反映しない。コピー失敗は共通の手動コピー案内を表示する。計算は同期処理のまま、既存関数をconversion.tsへ内容変更なく分離してテスト。共通フック本体・変換の意味・ID・登録・装飾・依存関係に変更なし。

検証: npm test 79件、lint警告0、build、git diff --check。実Edgeで実コピー、38件の遅延コピー成功/失敗競合、実行直後編集、モード・重複変更、入力エラー、Clear、JSON圧縮、SQLエスケープ/数値表記、URL予約文字、Base64の日本語/絵文字/UTF-8拒否を確認。light/darkと1280/320pxの16画面、ネイティブキー入力、画面画像を確認。既存テキスト整形、単価比較、レシピ調整も回帰確認。実機Safariは未検証。

ブラウザ試験: 既存の専用Edge CDPとpreviewを起動し node tests/conversion-browser.mjs。TEST_BASE_URLで本番、TEST_SCREENSHOT_DIRで画像出力先を指定できる。


## 2026-10-02 残り22ツールの結果・通知競合点検

main 7aabc49を基準に22ツールとBrowserTool/useToolResultを横断点検。文字数、Text Diff、UUID、Timestamp、日付計算、和暦変換、QR生成の実在する古い表示を再現して修正。共通コピーでは後の成功の後に先の失敗が反映される競合を修正し、全16利用先を検証。先に修正済み4ツールのコード、計算仕様、デザイン、登録、依存と配信設定は変更なし。各ツールの具体的な再現と変更なしの理由はresult-state-audit.mdに記録。

検証: npm test 79件、lint警告0、build、diffcheckと差分レビュー。新しい横断ブラウザ試験は42入力設定項目・225完了競合・44 light/dark 320px keyboard画面を確認。既存の変換4ツール、テキスト整形、単価比較・レシピ、全130 URLと画像2ツールの実出力/処理競合・60 mobile画面も回帰確認。専用実Edgeと既存CDPを使用。Safari実機は未検証。

## 2026-10-02: 時間の足し算・引き算

時間量を最大20行で加減算するgeneralツールを1件追加し、27ツールとした。24時間超・負数・ゼロを整数秒で扱い、時間/分/秒・HH:MM:SS・合計分/秒を表示とコピーできる。入力変更・行追加削除・リセットは結果と通知を消す。仕様と再実行可能な検証手順はduration-calculator.mdに記録。

## 2026-10-02: ランダム組み分け

全員を均等な組へ分けるgeneralツールを1件追加し28件とした。crypto.getRandomValuesと棄却法のFisher-Yatesで2〜100候補を分割し、同名は警告と候補番号で保持する。仕様と再実行可能な検証手順はrandom-grouping.mdに記録。19,800分割の不変条件と実Edgeの再抽選・コピー・上限・キーボード・スマホを検証する。

## 2026-10-02: 読み込み性能の点検

全ツールの一括JSをルート単位で遅延読込。初期JS・通信・表示準備を同じEdgeの5試行で前後比較し、初回ツール移動の追加待ち時間も記録。読込中・通信失敗・一覧復帰・再読込を検証。詳細はdocs/performance/README.md。
