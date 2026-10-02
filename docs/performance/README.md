# 読み込み性能の点検（2026-10-02）

## 変更前の無駄と対応

main 8aabe59・28ツールを調査。Appの静的importで、トップでも全ツール、画像処理、診断データ、qrcodeを単一JSとして取得・評価していた。未表示のツールのReactコンポーネントはマウントされず、画像変換やQR生成自体がトップで実行される状態ではない。

28ツールの明示的ルートを維持し、React.lazyによるimportに変更。トップ・レイアウト・検索用メタデータは初期JSに残す。Vite標準の分割だけを使用し、手動chunk・prefetch・依存追加・配信設定変更は行わない。共通CSSは全体で約44KB（gzip約9KB）なので分割しない。棚・計算・入力処理は変更しない。棚のvisitは安定したcallbackと同一状態の更新回避が既存実装にあり、再計算最適化を追加する根拠は見つからなかった。

読込中はstatus、失敗時はalertと再読み込み／一覧への復帰を表示。React.lazyの拒否Promiseは同じドキュメント内で保持されるため、再試行はページ再読み込みとする。ルート変更で境界をリセットし、一覧への復帰は通信失敗中も可能。入力は元々ルートを離れると消え、今回も入力の保存・送信はしない。

## 同条件での前後測定

Windowsの実Edge 154.0.4258.48、専用プロファイル・headless、1280×1000、ローカルproduction preview（Vite gzip）を使用。CDPでCPU4倍、通信200,000 bytes/s（1.6Mbps）、追加latency150ms。各項目5回、coldは毎回ブラウザキャッシュを消しHTTPキャッシュ無効、SPAではES moduleのメモリキャッシュを保持。初回測定はJIT等の影響も含む。下表は中央値。ResourceTimingのtransferSizeはHTTPヘッダーを含み、JS/CSSだけを合算。Cloudflare実ユーザーの速度やCore Web Vitalsを代表する値ではない。

表示準備はトップのtool-grid／ツールのtool-headerがDOMに現れた時刻を25ms間隔で観測する代理指標。QR直リンクのFCPは読込中の共通枠も含むため、入力可能になった時間とは区別する。厳密なユーザー操作応答時間やLCPの測定ではない。

| 項目 | 変更前 | 変更後 |
|---|---:|---:|
| 初期JS（非圧縮） | 460,531 bytes | 261,381 bytes |
| 初期JS（build gzip） | 約136.40KB | 約83.93KB |
| 共通CSS（非圧縮） | 43,845 bytes | 43,999 bytes |
| トップJS/CSS転送量 | 145,004 bytes | 92,749 bytes |
| トップ表示準備 | 1,146ms | 881ms |
| トップFCP | 1,152ms | 888ms |
| QRへの初回SPA移動 | 16ms・追加転送なし | 326ms・10,588 bytes |
| 一覧へのSPA復帰 | 37ms・追加転送なし | 37ms・追加転送なし |
| QRへのSPA再訪 | 9ms・追加転送なし | 8ms・追加転送なし |
| QR直リンク・入力欄表示 | 1,119ms | 1,167ms |
| QR直リンクFCP（枠を含む） | 1,124ms | 856ms |
| QR直リンクJS/CSS転送量 | 145,004 bytes | 103,337 bytes |

初期JSは約43%減、トップJS/CSS転送は約36%減、今回のトップ表示準備は約23%短縮。反面、初回ツール移動で追加リクエストが必要となり、QRでは約310ms増、直リンクの入力表示は約48ms増。ツール初回利用が一律に速くなる変更ではない。再訪の差は小さく、改善とは主張しない。

全JS合計は470,628 bytes（変更前460,531 bytes）で約2%増。個別ファイルのgzip合計は166,219 bytesとなり、単一ファイルより圧縮効率が落ちる。全ツールを初めて開く場合は総転送とリクエスト数が増える。トップで未使用ツールを取得せず、必要な道具だけ開く利用での軽量化を採用した。CSS差分は通信失敗画面の一覧リンクを44px以上にする専用規則だけ。

生データ: [変更前](before.json)、[変更後](after.json)。測定のばらつきと全5試行を保持。

## 再実行と検証

production buildをpreviewの5173番で提供し、許可済みの専用EdgeをCDP9222で起動して、以下を順番に実行する（同じページを使うため並行実行しない）。

```powershell
npm test
npm run lint
npm run build
node tests/performance-measure.mjs measurements.json
node tests/performance-browser.mjs
node tests/page-clarity-browser.mjs
node tests/browser-regressions.mjs
node tests/grouping-browser.mjs
```

TEST_BASE_URLで本番を指定可能。TEST_SCREENSHOT_DIRで画像保存先を指定可能（通常はTEMP）。性能測定は通信／CPU条件を変えるため、終了後の復元を確認してから他の検証を行う。

性能専用試験は初期トップがJS1本のみ、1秒latency下のstatus、QR生成、再訪とお気に入り、意図的なchunk遮断のalert／一覧復帰／再読み込み回復、画像／診断／文字数直リンク、入力がstorageにないこと、320pxのはみ出しを検証。既存のブラウザhelperは固定150msに加え、読込中の消失を最大10秒待つよう対応し、既存assertは維持。実スクリーンリーダー・実機Safariの検証は含まない。
