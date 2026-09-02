# CLAUDE.md

## このファイルの役割

このファイルは「ぽけつるの何を作るか」ではなく、「Claude Codeがこのリポジトリでどう働くか」を定義する運用メタルールです。

プロダクト固有の要件・設計・UI規約・意思決定は `AGENTS.md` および `docs/` 配下が Single Source of Truth です。内容が重複・矛盾しないよう、このファイルにはそれらの内容をコピーしません。

## チーム構成

開発作業は以下4つのサブエージェント（`.claude/agents/`）で分担します。

| エージェント | 定義ファイル | 責務 |
|---|---|---|
| Product Manager | `.claude/agents/product-manager.md` | 要求整理・requirements/decisionsとの整合確認・スコープ定義・Acceptance Criteria定義 |
| Engineer | `.claude/agents/engineer.md` | 既存コード調査・実装・lint/build実行・指摘修正 |
| QA Engineer | `.claude/agents/qa-engineer.md` | 品質確認・問題報告（コード変更なし） |
| Code Reviewer | `.claude/agents/code-reviewer.md` | `git diff` を中心とした独立レビュー（コード変更なし） |

## 標準ワークフロー

通常の機能開発・バグ修正・改善は、原則として以下の順で進めます。

```
User Request
  → Product Manager
  → Engineer
  → QA Engineer
  → Code Reviewer
  → (問題あり)
      → Engineer
      → QA Engineer
      → Code Reviewer
  → Final Report
```

このフローの実行手順は `.claude/commands/develop.md`（`/develop`）に定義しています。差分だけを確認したい場合は `.claude/commands/review.md`（`/review`）、リリース前の最終確認は `.claude/commands/release-check.md`（`/release-check`）を使用します。

### Multi-agent利用の抑制

以下のような単純な調査・質問・軽微な作業では、上記フルフロー（複数エージェントの起動）を使わないでください。

- ドキュメントや既存コードの内容を聞かれただけの質問
- 1行程度のtypo修正や軽微な文言修正
- 動作原理の説明を求められただけのケース

このような場合はサブエージェントを介さず直接回答・作業してください。過剰なmulti-agent起動は禁止します。フルフローを使うべきか迷う場合は、要求の規模を自分で評価し、新規ツール追加・複数ファイルにまたがる実装・要件解釈が分かれる変更など、役割分担の効果が明らかな場合のみ使用してください。

## Source of Truth

ぽけつる固有のルールは以下を参照してください。このファイルへ内容をコピーしないでください。

- `AGENTS.md` — プロジェクト全体の方針・スコープ制御・セキュリティ/プライバシー方針
- `docs/requirements.md` — 要件定義
- `docs/architecture.md` — アーキテクチャ・ディレクトリ構成
- `docs/screen-design.md` — 画面構成・UI規約
- `docs/tool-development-guide.md` — 新規ツール追加ルール（**新規ツール追加時はこれを最優先で確認する**）
- `docs/decisions.md` — 技術・設計上の意思決定ログ
- `docs/development-environment.md` — ローカル開発環境・デプロイ想定

`docs/prompts/*.md` は、過去にツールを追加した際のPM成果物（発注仕様）の実例です。新しいツール追加の要件整理を行う際はこれらの形式（Purpose / Scope / Constraints / Expected behavior）を参考にしてください。ただし、毎回新しいファイルをここに作成する必要はありません。

## 品質確認コマンド

実際に利用可能なコマンドは `package.json` の `scripts` を Single Source of Truth とします。エージェント定義やコマンド定義にコマンド名を固定的に書かず、都度 `package.json` を確認してください。

現時点（2026-09）で確認済みの利用可能コマンドは `npm run lint` と `npm run build` です。`test` / `typecheck` の単独コマンドや、Prettier等のformatコマンドは現状存在しません。存在しないコマンドは「存在しない」「自動テスト基盤なし」と明示し、実行・成功したかのように報告しないでください。

## 安全ルール

ユーザーから対象操作について明示的な承認がない限り、以下を実行しないでください。

- `git commit`
- `git push`（force pushを含む）
- `git merge`
- `git rebase`
- `git reset`
- `git clean`
- ローカル/リモートブランチの削除
- デプロイ操作
- GitHub上の変更（Issue/PR作成・編集、リポジトリ設定変更など）
- Cloudflare上の変更

このうち一部（git commit / push / merge / rebase / reset / clean / ブランチ削除）は `.claude/settings.json` の `permissions.deny` でも技術的に遮断しています。ただし設定で遮断しきれない操作（GitHub/Cloudflareの管理画面・API経由の変更など）についても、このルールに従い実行しないでください。

ファイルの実装・編集、`npm run lint` / `npm run build` などのローカル確認作業は許可されています。

## 完了条件（開発タスク完了時の報告フォーマット）

開発タスク完了時は、以下を報告してください。

- 実装内容
- 変更ファイル一覧
- QA結果
- Code Review結果
- lint結果
- build結果
- 未解決事項
- ユーザー確認事項

テスト自動化基盤が存在しない現状では、「test PASS」のような虚偽の報告をせず、「自動テスト基盤なし」と明示してください。
