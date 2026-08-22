# Timestamp Converter Implementation

## 目的

Web Toolbox「ぽけつる」に、新しいツールとして Timestamp Converter を追加する。

Unix Timestamp と日時を相互変換できる、シンプルで使いやすいWebツールとする。

既存の設計・Tool Registry・Routing・UI・Themeの方針に従い、不要な共通化や大規模な変更は行わない。

---

# 1. 実装前確認

実装前に以下を確認すること。

- AGENTS.md
- docs/requirements.md
- docs/architecture.md
- docs/screen-design.md
- docs/tool-development-guide.md
- docs/decisions.md
- 既存ツール実装

特に以下を既存実装の参考とする。

- JSON Formatter
- SQL IN Generator
- Tool Registry
- Routing
- Light / Dark Theme

既存設計と今回の要件に矛盾がある場合は、独断で大きく変更せず報告すること。

---

# 2. Tool

名称:

Timestamp Converter

想定URL:

/tools/timestamp-converter

カテゴリ:

developer

説明:

Unix Timestampと日時を相互変換します。

---

# 3. Tool Registry

Tool RegistryへTimestamp Converterを追加する。

想定metadata:

```ts
{
  id: 'timestamp-converter',
  name: 'Timestamp Converter',
  description: 'Unix Timestampと日時を相互変換します。',
  category: 'developer',
  keywords: [
    'timestamp',
    'unix',
    'epoch',
    '日時',
    '時刻',
    '変換'
  ],
  path: '/tools/timestamp-converter'
}
```

relatedToolsは既存構造と照らして自然なものだけ設定すること。

無理に関連付けない。

---

# 4. 基本機能

以下の2方向の変換を提供する。

1. Unix Timestamp → 日時
2. 日時 → Unix Timestamp

同一ページ内で分かりやすく利用できるUIとする。

---

# 5. Unix Timestamp → 日時

Timestampを入力して日時へ変換する。

例:

入力:

1704067200

単位:

秒

結果:

UTC:
2024-01-01 00:00:00

Local:
ユーザー環境のタイムゾーンに応じた日時

---

# 6. Timestamp Unit

Timestampの単位として以下をサポートする。

- 秒
- ミリ秒

ユーザーが明示的に選択できること。

初期値:

秒

自動判定は今回実装しない。

曖昧な推測を避け、ユーザーの選択を優先する。

---

# 7. 日時 → Unix Timestamp

日時を入力してUnix Timestampへ変換できること。

日時入力には、ブラウザ標準の `datetime-local` 等、外部ライブラリを必要としない自然なUIを使用してよい。

結果として以下を両方表示する。

秒:

1704067200

ミリ秒:

1704067200000

---

# 8. Timezone

最低限、以下を扱う。

- Local
- UTC

Timestamp → 日時では、同じTimestampについて

- Local datetime
- UTC datetime

を両方確認できるようにする。

日時 → Timestampでは、入力した日時を

- Localとして解釈
- UTCとして解釈

のどちらにするかユーザーが選択できるようにする。

初期値は Local とする。

固定タイムゾーン一覧やIANA timezone選択機能は今回実装しない。

---

# 9. Current Time

現在時刻を簡単に入力できる機能を用意する。

例:

「現在時刻」

ボタンを押すと、現在日時を入力欄へ設定する。

Timestamp入力側でも自然に実装できる場合は、現在Timestampを入力する機能を設けてよい。

ただしUIを複雑にしないこと。

---

# 10. Output Format

日時の表示形式は最低限、

YYYY-MM-DD HH:mm:ss

を基本とする。

必要であればUTCであることが分かるように、

UTC

または

Z

等をUI上で明示する。

ブラウザのlocale依存だけにせず、
基本表示は安定した形式とする。

---

# 11. Validation

以下を適切にValidationする。

## Timestamp

- 空入力
- 数値ではない
- Dateとして扱えない範囲

不正な場合はOutputを生成せず、ユーザーが原因を理解できるエラーを表示する。

## Datetime

- 未入力
- 不正な日時
- JavaScript Dateとして扱えない日時

不正な場合はOutputを生成しない。

---

# 12. Precision

Timestamp変換で秒とミリ秒を混同しないこと。

秒 → Date:

timestamp * 1000

ミリ秒 → Date:

timestamp

日時 → Timestamp:

milliseconds = date.getTime()

seconds = Math.floor(milliseconds / 1000)

とする。

---

# 13. Copy

変換結果はコピー可能とする。

最低限、

- Timestamp
- UTC datetime
- Local datetime

など主要な出力値を簡単にコピーできるようにする。

既存ツールのCopyフィードバック方式を参考にすること。

過剰にCopyボタンを増やしてUIを煩雑にしないこと。

---

# 14. Clear

入力・出力・エラー・Copy feedbackをクリアできること。

単位やTimezone等の設定値は初期値へ戻してよい。

---

# 15. Privacy

処理はすべてブラウザ上で行う。

外部APIやBackendへ日時情報を送信しない。

既存ツールと同様、

「このツールの処理はすべてブラウザ上で実行されます。
入力したデータはサーバーへ送信されません。」

という趣旨を表示する。

---

# 16. Tool Description

ツール下部に簡単な説明を表示する。

内容例:

Timestamp Converterは、Unix Timestampと日時を相互変換するツールです。

Unix Timestampの秒・ミリ秒変換や、
UTCとローカル時刻の確認に利用できます。

---

# 17. Usage

簡単な使い方を表示する。

例:

## Timestamp → 日時

1. Timestampを入力
2. 秒またはミリ秒を選択
3. 変換
4. UTC / Localの結果を確認

## 日時 → Timestamp

1. 日時を入力
2. LocalまたはUTCを選択
3. 変換
4. 秒 / ミリ秒のTimestampを確認

---

# 18. UI / Theme

既存の「ぽけつる」のUIに合わせること。

対応:

- Light Mode
- Dark Mode
- PC
- スマートフォン相当の画面幅

新しいUI FrameworkやCSS Libraryは追加しない。

Timestamp → 日時と
日時 → Timestampの2つの機能が
視覚的に区別できるレイアウトとする。

---

# 19. Routing

React Routerへ以下を明示的に追加する。

/tools/timestamp-converter

現在の方針どおり、
Tool RegistryからRouteを自動生成する仕組みは今回追加しない。

---

# 20. Scope Control

今回実装しないもの:

- IANA timezone一覧
- 世界時計
- Timezone変換専用機能
- 日付差分計算
- 日数計算
- 相対日時
- Date formatting customization
- Backend
- Database
- External API
- 新規Runtime Dependency

将来必要になる可能性だけを理由に追加しないこと。

---

# 21. Documentation

必要に応じて以下を現在の実装状態へ更新する。

- docs/requirements.md
- docs/screen-design.md
- docs/development-log.md

新しいArchitecture Decisionが発生していない場合、

- docs/architecture.md
- docs/decisions.md

は不要に変更しない。

---

# 22. Validation Cases

実装後、最低限以下を確認する。

## Timestamp Seconds

入力:

1704067200

単位:

秒

UTC:

2024-01-01 00:00:00

## Timestamp Milliseconds

入力:

1704067200000

単位:

ミリ秒

UTC:

2024-01-01 00:00:00

## Invalid Timestamp

abc

→ エラーになること。

## Datetime → Timestamp

UTCとして:

2024-01-01 00:00:00

を入力した場合、

秒:

1704067200

ミリ秒:

1704067200000

となること。

## Current Time

現在時刻ボタンが正常に入力へ反映されること。

## Existing Features

以下が従来通り動作すること。

- Home
- Tool Search
- Category Filter
- JSON Formatter
- SQL IN Generator
- Theme
- Routing

---

# 23. Build

実装後:

npm run build

を実行し、成功すること。

---

# 24. 完了報告

実装後、以下を報告すること。

1. 変更ファイル
2. Tool Registryへの追加内容
3. Timestamp Converterの実装内容
4. Timestamp単位の扱い
5. UTC / Localの扱い
6. Validation方式
7. Current Timeの実装方式
8. 実行した確認ケース
9. npm run build結果
10. 残課題
11. 人間側でブラウザ確認すべきポイント

今回の範囲を超える機能追加や大規模リファクタリングは行わないこと。
