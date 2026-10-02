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
