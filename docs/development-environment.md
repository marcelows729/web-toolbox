# Development Environment

## Local Environment

* OS: Windows
* Editor: Visual Studio Code
* Git client: Git / Git Bash
* Runtime: Node.js 24（既存テストの実行に必要）
* Package Manager: npm

## Frontend

* React
* TypeScript
* Vite

## Development Server

```bash
npm run dev
```

Default URL:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

Build output:

```text
dist/
```

## Quality Checks

既存依存が利用できる状態で、以下を実行する。

```bash
npm test
npm run lint
npm run build
```

`npm test` はNode標準テストランナーで `tests/additional-tools.test.mjs` の52テストを実行する。既存TypeScriptでTS/TSXをメモリ内変換し、テスト用の生成ファイルや追加依存は不要。

対象はIPv4 CIDR、SHA-256、進数変換、HTMLエスケープ・解除、割合・増減率の正常値・境界値・不正入力、およびHTML出力の静的エスケープ、23ツールの登録と新規5件のルート対応、Light/Darkのカテゴリ選択・hover時の文字コントラスト、道具棚の保存復元・不正データ・順序・消去・保存失敗・リンク構造。追加3件については単位の定義値・往復・数値境界、割り勘の配分保存則・入力境界、抽選の候補検証・rejection sampling・除外・針の対応を確認する。遊びの診断2件は各1024組合せ（計2048）の決定性、全結果到達、同点処理と説明の一致、未回答・不正回答、免責表示を検証する。画像2件は形式ヘッダ・CRC・アニメーション指定、寸法・配分上限、比率と配置、ファイル名、toBlobの実MIME・失敗・容量、中断を確認する。画素・EXIF・ダウンロード・リソース解放は実ブラウザで別途検証する。既存ツール全体やブラウザ上の非同期競合、Clipboard、画面表示、アクセシビリティ、配信環境を網羅するものではない。

テスト時の変換は型チェックを行わないため、`npm run build` も実行する。Light/Dark、PC/スマートフォン相当、実際の操作については別途手動確認する。実行手順は成功記録ではなく、結果は実行ごとに報告する。

## Repository

GitHubを利用する。

## Hosting

Cloudflare Pagesを予定する。

GitHubのmainブランチへの更新を契機として自動デプロイする構成を想定する。

## Future Backend

必要になった場合：

* Java
* Spring Boot
* PostgreSQL

## Future Infrastructure

必要になった場合はAWSを利用する。


## 検索・戻り案内の品質確認

検索はブラウザ内で NFKC、英字の小文字化、カタカナからひらがなへの変換を行い、空白で区切った全語が名前・説明・検索語のいずれかに含まれる道具を表示する。カテゴリと道具棚の範囲を保ち、元の並び順を変えない。用途・日本語別名は Tool Registry に明示的に登録する。検索文は保存・送信しない。

結果ゼロ時は検索のクリア、カテゴリ解除、全道具への復帰を提供する。全道具への復帰はお気に入り・最近使用の範囲も解除する。操作後の検索欄へのフォーカスと、範囲・カテゴリ・件数の polite な通知を確認する。

不明なURLは日本語の案内とホーム・既存道具へのリンクを表示し、見出しへフォーカスする。URLを画面に転載せず、最近使用へ不明IDを追加しない。SPAのフォールバックであり、HTTP 404ステータスの返却はこの変更の対象外。

計算・日付の純粋処理と useToolResult は TS モジュールへ分離し、コンポーネントは TSX に置く。Fast Refresh のルールを無効化せず lint の警告・エラー0件を確認する。検索4テストを含む52テスト、ビルドに加え、Edgeの明暗テーマと幅1280/320pxで全23道具、ゼロ件の復帰、不明URL、キーボード操作を確認する。画面幅の検証は実機Safariの検証を代替しない。


## 画像読み込みと道具URLの回帰テスト

`npm test` は全23道具について通常URL・末尾スラッシュ・大文字・大文字と末尾スラッシュの判定をルーターと比較し、不明なパス・部分一致・外部URLを除外する。画像の読み込み制約と書き出し状態の通知も検証する。

`npm run test:browser` は起動済みの専用Chromium/Edge（CDP: 127.0.0.1:9222）とローカルサイト（127.0.0.1:5173）を使用する。Node.js 24と既存ビルドを使い、追加依存は不要。Windowsでの起動例：

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 5173 --strictPort
# 別のターミナルで専用Edgeを起動してから実行する。
$regressionProfile = Join-Path $env:TEMP 'poketsuru-regression-profile'
Start-Process -FilePath "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" -ArgumentList "--headless=new --disable-gpu --remote-debugging-port=9222 --user-data-dir=`"$regressionProfile`" --no-first-run about:blank" -WindowStyle Hidden
npm run test:browser
```

テストは専用プロファイルの道具棚を消去し、メモリ内で作成したPNGだけを使う。全23道具の通常・末尾スラッシュ・大小文字・不明な下位パス（115ケース）、お気に入り再読み込み、両画像ツールの設定無効化・状態通知・キーボード移動・読み込み中断・再選択・書き出し中の変更を確認する。実900万画素PNGとCPU低速設定で読み込み時の競合を再検証し、Light/Darkの320px幅も確認する。テスト後は起動した専用ブラウザとpreviewを停止する。

画像の設定は読み込み中だけ無効。書き出し中の設定変更は結果を中断する従来の動作を維持し、ファイル再選択・消去は読み込み中も使用できる。道具判定はReact Routerの `matchPath`（完全パス、大小文字を区別しない）を使い、URLを書き換えたり外部へ遷移させたりしない。
