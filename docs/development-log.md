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
