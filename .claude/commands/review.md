---
description: "現在の変更差分をQA Engineer→Code Reviewerで確認する（コード変更は行わない）"
---

現在のワーキングツリーの変更（`git status` / `git diff` で確認できる差分）を対象に、以下の順で確認してください。コードの変更は行わず、確認と報告のみを行います。

1. **QA Engineer**: `qa-engineer` サブエージェントに現在の差分を渡し、分かる範囲でのAcceptance Criteria確認・正常系/異常系/境界値・regression・lint/build等の結果を確認させる。
2. **Code Reviewer**: `code-reviewer` サブエージェントに `git diff` を渡し、独立レビューさせる。

## 出力

QA Engineerの結果とCode Reviewerの結果をそれぞれ報告し、対応が必要な指摘があれば一覧化する。重大な問題がなければCode Reviewerの `APPROVED` を含めて報告する。
