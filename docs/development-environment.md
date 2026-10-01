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

`npm test` はNode標準テストランナーで `tests/additional-tools.test.mjs` の既存14テストを実行する。既存TypeScriptでTS/TSXをメモリ内変換し、テスト用の生成ファイルや追加依存は不要。

対象はIPv4 CIDR、SHA-256、進数変換、HTMLエスケープ・解除、割合・増減率の正常値・境界値・不正入力、およびHTML出力の静的エスケープ、16ツールの登録と新規5件のルート対応。既存ツール全体やブラウザ上の非同期競合、Clipboard、画面表示、アクセシビリティ、配信環境を網羅するものではない。

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
