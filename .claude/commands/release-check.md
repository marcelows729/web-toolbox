---
description: "リリース前の最終確認（READY/NOT READYを判定。commit/push/merge/deployは行わない）"
---

リリース前確認を行ってください。**commit / push / merge / deploy は絶対に実行しないでください。**

## 確認項目

1. `git status` — 未コミットの変更・未追跡ファイルの有無
2. `git diff` — 変更内容の確認
3. `npm run lint`（`package.json` に存在する場合）
4. `npm run build`（`package.json` に存在する場合）
5. テストコマンドが `package.json` に存在する場合は実行する。存在しない場合は「自動テスト基盤なし」と明示する。
6. 直近のQA結果に未解決のCritical/High問題がないか
7. 直近のCode Reviewに未解決の指摘がないか

## 判定

上記の結果に基づき、最後に以下のいずれかを理由とともに報告してください。

```
READY
```
または
```
NOT READY
```

NOT READYの場合は、READYにするために必要な対応を明示すること。
