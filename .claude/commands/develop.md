---
description: "PM→Engineer→QA→Code Reviewerの標準ワークフローで機能開発・改善・バグ修正を進める（commit/push/deployは行わない）"
argument-hint: "[開発したい内容]"
---

以下の要求について、ぽけつる (POKETSURU) の標準開発ワークフローを実行してください。

要求: $ARGUMENTS

## 手順

1. **Product Manager**: `product-manager` サブエージェントに要求を渡し、`AGENTS.md` / `docs/` との整合確認、スコープ、Acceptance Criteriaを整理させる。
2. **Engineer**: `engineer` サブエージェントに、Product Managerの整理結果を渡して実装させる。実装後、`package.json` に存在するlint/build等を実行させる。
3. **QA Engineer**: `qa-engineer` サブエージェントに、Acceptance Criteriaと実装内容を渡して品質確認させる。
4. **Code Reviewer**: `code-reviewer` サブエージェントに `git diff` を中心に独立レビューさせる。

## 差し戻しルール

QAまたはCode Reviewerから実害のある問題（目安: Severity High以上）が報告された場合、以下を再実行する。

```
Engineer（修正） → QA Engineer（再確認） → Code Reviewer（再レビュー）
```

この修正サイクルは**最大2回まで**とする。2回修正しても解決しない場合、独断で大規模な設計変更を行わず、未解決の問題を整理してユーザーに報告し、指示を仰ぐこと。

## 制約

- `git commit` / `git push` / `git merge` などの操作は行わない。
- 要求が単純な作業（typo修正、1ファイルの軽微な変更、質問への回答など）と判断できる場合は、この4エージェントフローを使わず直接対応してよい（`CLAUDE.md` のMulti-agent利用の抑制を参照）。

## 最終報告

`CLAUDE.md` の「完了条件」に定めたフォーマット（実装内容・変更ファイル・QA結果・Code Review結果・lint結果・build結果・未解決事項・ユーザー確認事項）で報告する。テスト自動化基盤が存在しない場合は「自動テスト基盤なし」と明示する。
