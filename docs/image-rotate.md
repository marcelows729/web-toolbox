# 画像の回転・反転

## 仕様

29件目のgeneralツール。既存の画像サイズ変更・圧縮、画像を並べるには同等操作がない。IDとURLはimage-rotate、/tools/image-rotate。既存28件のID・URLは変更しない。Appの明示的React.lazyルートを使用し、トップで画像処理を取得しない。

ユーザーが選んだローカル静止JPG・PNG・WebPを1枚処理する。左右90度、180度、左右／上下反転、元の向きに戻す、画像の消去・中断、PNGダウンロード。選択後と操作後に自動でPNGプレビューを更新。元ファイルは変更せず、元画像に適用する整数の直交変換だけを保持し、毎回元から描く。操作順は現在見えている座標軸を基準とする。画素の辺の四隅から出力範囲と平行移動を求め、端を切らず、90度では縦横を入れ替える。画素数は変わらず、余白や拡大縮小を追加しない。

共通prepareImages／renderImages／useImageWork／ImageToolShell／ImagePreview／useBlobUrlを使用。共有描画に1枚用の任意変換を追加し、旧ツールの既定描画は維持。描画用の型は共通imageMathに置く。自動描画effectに使用するrunはuseCallbackで安定させる。変換・ファイル置換・消去・アンマウントではrevisionで旧完了を拒否し、共有キューで同時メモリ負荷を抑える。画像読み込み中は操作を無効、書き出し中は次の向きへ変更可能。古いダウンロードリンクは変更と同時に消す。

共通の上限は1枚8 MiB・各辺8192px・1200万画素、出力各辺8192px・1200万画素・16 MiB。形式と内容の一致、破損、APNG／WebPアニメーションの検出・拒否も共通検査。EXIFはcreateImageBitmapのfrom-imageで反映した表示方向を基準とし、独自EXIFデコーダは追加しない。透過背景のPNG、整数変換、描画補間無効で回転・反転する。色・画質・メタデータの完全一致や、メタデータの完全除去は保証しない。PNG再保存で容量が増える場合がある。

ファイル、名前、設定、結果はメモリだけ。storage・URL・外部通信へ載せない。お気に入り／履歴は既存のツールIDのみ。オブジェクトURLはeffectのcleanupでrevoke、ImageBitmapはfinallyでclose、Canvasはfinallyで幅高さ0に戻す。新依存・外部API・配信／認証設定変更なし。

## 検証と再実行

```powershell
npm test
npm run lint
npm run build
git diff --check
node tests/rotation-browser.mjs
node tests/browser-regressions.mjs
node tests/page-clarity-browser.mjs
```

ブラウザ試験はproduction preview 5173と専用EdgeのCDP9222を使用。同一ページを使うので順番に実行する。TEST_BASE_URLで本番を指定、TEST_SCREENSHOT_DIRで画面と実ダウンロードの保存先を指定（通常TEMP）。テストは専用の合成画像のみを使用し、ユーザーファイルを読まない。

Nodeの100テストに、独立した画素配列を基準とする19,531操作列、90度4回・180度2回・反転2回の原像復帰、順序の非可換性、8つの向き、極端比率、寸法上限、不正変換、入力不変性を含む。

実Edgeは非対称RGBA、色ブロックとFに相当する非対称図形を生成する。PNG／静止WebPの透過、8192×1／1×8192、JPEGへ埋め込んだEXIF全8方向とその表示に対する回転、連続／同一イベント内操作、元の向き復帰を全画素比較。toBlob／createImageBitmapを一時的に遅らせ、途中操作・画像置換・消去・アンマウントで旧結果が戻らないことを確認。通常と失敗時のbitmap／canvas／object URL解放を確認。ネイティブEnter／Tab／Space操作、Edgeのdownload完了イベント、実際に保存されたPNGの全画素とプレビュー一致を確認。ライト／ダーク、1280px／320px、寸法表示、live status、棚、再入場時の未選択状態、入力がstorageにないことを確認する。

旧resizer／joinerの読み込みガード・設定編集・置換・中断・出力ピクセル・9MP画像の実処理と全29ルートを回帰検証。スクリーンショットを目視する。実機Safariと実スクリーンリーダーの検証は含まない。
