# SQL IN Generator Implementation

## 目的

Web Toolbox「ぽけつる」に、新しいツールとして SQL IN Generator を追加する。

SQLの `IN` 句で利用する値一覧を、改行またはカンマ区切りの入力から簡単に生成できるようにする。

既存の設計・UI・Tool Registryの仕組みに従い、不要な共通化や大規模な変更は行わない。

---

# 1. 実装前に確認するドキュメント

実装前に以下を確認すること。

* `AGENTS.md`
* `docs/requirements.md`
* `docs/architecture.md`
* `docs/screen-design.md`
* `docs/tool-development-guide.md`
* `docs/decisions.md`

既存実装との矛盾がある場合は、独断で大きく変更せず報告すること。

---

# 2. Tool

新規ツール：

`SQL IN Generator`

想定URL：

```text
/tools/sql-in-generator
```

カテゴリ：

```text
developer
```

---

# 3. Tool Metadata

Tool Registryへ以下を追加する。

```ts
{
  id: "sql-in-generator",
  name: "SQL IN Generator",
  description: "値の一覧からSQLのIN句を生成します。",
  category: "developer",
  keywords: [
    "sql",
    "in",
    "generator",
    "in句",
    "sql生成",
    "リスト"
  ],
  path: "/tools/sql-in-generator"
}
```

必要に応じて既存ツールとの `relatedTools` も設定すること。

JSON Formatterとの関連付けが不自然でなければ相互に設定してよい。

---

# 4. Input

複数行入力可能なtextareaを使用する。

以下の形式を受け付ける。

## 改行区切り

```text
apple
banana
orange
```

## カンマ区切り

```text
apple,banana,orange
```

改行とカンマが混在していても処理可能とする。

例：

```text
apple,banana
orange
```

---

# 5. Input Normalization

入力値は以下のルールで正規化する。

* 改行またはカンマで分割
* 各値の前後空白を除去
* 空文字は除外
* 空行は除外

例：

入力：

```text
 apple

 banana ,
 orange
```

内部的には以下として扱う。

```text
apple
banana
orange
```

---

# 6. Quote Mode

文字列用と数値用を切り替えられるようにする。

UI上はシンプルな選択式とする。

例：

* 文字列
* 数値

## 文字列

入力：

```text
apple
banana
orange
```

出力：

```sql
('apple', 'banana', 'orange')
```

## 数値

入力：

```text
1
2
3
```

出力：

```sql
(1, 2, 3)
```

初期値は「文字列」とする。

---

# 7. SQL String Escape

文字列モードでは、SQL文字列リテラルとして最低限必要なエスケープを行う。

シングルクォート `'` が含まれる場合は SQL 標準的な形式として `''` に変換する。

例：

入力：

```text
O'Reilly
```

出力：

```sql
('O''Reilly')
```

---

# 8. Duplicate Removal

重複値を除外するオプションを用意する。

例：

入力：

```text
apple
banana
apple
```

重複除去ON：

```sql
('apple', 'banana')
```

初期値はONとしてよい。

元の出現順序は維持すること。

---

# 9. Output

生成結果をOutput領域に表示する。

例：

```sql
('apple', 'banana', 'orange')
```

出力をそのままSQLの以下へ貼り付けられる形式とする。

```sql
WHERE column_name IN ('apple', 'banana', 'orange')
```

ただし `WHERE column_name IN` 自体は出力しない。

出力対象は括弧を含む値リストのみとする。

---

# 10. Actions

最低限以下を実装する。

## Generate

現在のInputと設定から出力を生成する。

## Copy

OutputをClipboard APIでコピーする。

コピー成功時は既存JSON Formatterと同様のフィードバック方式を利用する。

## Clear

以下を初期化する。

* Input
* Output
* Error
* Copy feedback

Quote Modeや重複除去設定は初期値へ戻してもよい。

---

# 11. Validation

数値モードでは、値が数値として不正な場合にエラーを表示する。

例：

入力：

```text
1
abc
3
```

出力は生成せず、ユーザーが原因を理解できるエラーを表示する。

例：

```text
数値として扱えない値があります: abc
```

複数存在する場合は、必要に応じてまとめて表示してよい。

文字列モードでは通常の文字列として扱うため、数値チェックは行わない。

---

# 12. Empty Input

入力が空、または正規化後に値が0件の場合は、不自然な `()` を生成しない。

Outputを空のままとし、必要に応じて簡単なエラーまたは案内を表示する。

---

# 13. Privacy

処理はすべてブラウザ上で実行する。

入力値をBackendや外部APIへ送信しない。

ページ内に以下の趣旨を表示する。

```text
このツールの処理はすべてブラウザ上で実行されます。
入力したデータはサーバーへ送信されません。
```

---

# 14. Tool Description

ツール操作領域の下に簡単な説明を表示する。

内容の例：

SQL IN Generatorは、複数の値からSQLのIN句で利用できる値リストを生成するツールです。

Excelやログなどからコピーした値を、改行またはカンマ区切りのまま貼り付けて利用できます。

---

# 15. Usage

簡単な使い方を表示する。

例：

1. 値の一覧を入力します。
2. 文字列または数値を選択します。
3. 必要に応じて重複除去を設定します。
4. Generateを押します。
5. CopyでSQLへ貼り付けられる形式をコピーします。

---

# 16. UI / Theme

既存のJSON Formatterおよび「ぽけつる」のUIに合わせること。

以下に対応する。

* Light Mode
* Dark Mode
* PC
* スマートフォン相当の画面幅

新しいUIフレームワークやCSSライブラリは追加しない。

---

# 17. Routing

React Routerへ以下を追加する。

```text
/tools/sql-in-generator
```

Version 0.1の既存方針どおり、Routeは明示的に定義する。

Tool RegistryからのRoute自動生成は今回も実装しない。

---

# 18. Scope Control

今回実装しないもの：

* SQL Formatter
* INSERT文生成
* UPDATE文生成
* WHERE句全体の生成
* Database接続
* SQL実行
* SQL方言別の高度なエスケープ
* ファイルアップロード
* CSV解析ライブラリ
* Backend
* 新規Runtime Dependency

将来必要になる可能性だけを理由に追加しないこと。

---

# 19. Documentation

必要に応じて以下を更新する。

* `docs/requirements.md`
* `docs/screen-design.md`
* `docs/development-log.md`

既存アーキテクチャを変更しない場合、`docs/architecture.md` や `docs/decisions.md` を不要に更新しないこと。

---

# 20. Validation

実装後に以下を確認すること。

## Build

```bash
npm run build
```

成功すること。

## String Mode

入力：

```text
apple
banana
orange
```

出力：

```sql
('apple', 'banana', 'orange')
```

## Comma Input

入力：

```text
apple,banana,orange
```

同じ出力になること。

## SQL Escape

入力：

```text
O'Reilly
```

出力：

```sql
('O''Reilly')
```

## Number Mode

入力：

```text
1
2
3
```

出力：

```sql
(1, 2, 3)
```

## Invalid Number

入力：

```text
1
abc
3
```

エラーになること。

## Duplicate

入力：

```text
apple
banana
apple
```

重複除去ONの場合：

```sql
('apple', 'banana')
```

## Existing Features

以下が従来通り動作すること。

* Home
* Tool Search
* Category Filter
* JSON Formatter
* Theme切替
* Routing

---

# 21. 完了報告

実装後、以下を報告すること。

1. 変更したファイル
2. Tool Registryへの追加内容
3. SQL IN Generatorの実装内容
4. 入力正規化方式
5. 数値Validation方式
6. SQL文字列Escape方式
7. 実行した確認内容
8. `npm run build` 結果
9. 残課題
10. 人間側でブラウザ確認すべきポイント
