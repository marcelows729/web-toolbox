# UUID Generator Implementation

## 目的

「ぽけつる / POKETSURU」に、新しいツールとして
「UUID Generator」を追加する。

UUID v4をブラウザ上で簡単に生成できる、
シンプルで使いやすい開発者向けツールとする。

1件だけでなく複数件のUUIDをまとめて生成でき、
コピーしやすいUIを提供する。

既存の設計・Tool Registry・Routing・UI・Themeの方針に従い、
不要な共通化や大規模な変更は行わない。

---

# 1. Prompt保存

実装前に、この依頼内容を以下へMarkdownとして保存すること。

`docs/prompts/uuid-generator.md`

既存の `docs/prompts/` の運用方法に合わせること。

保存後、その仕様に基づいて実装を進める。

---

# 2. Tool

名称:

`UUID Generator`

URL:

`/tools/uuid-generator`

カテゴリ:

`developer`

説明:

`UUID v4をブラウザ上で生成します。`

---

# 3. Tool Registry

Tool Registryへ追加する。

想定metadata:

```ts
{
  id: 'uuid-generator',
  name: 'UUID Generator',
  description: 'UUID v4をブラウザ上で生成します。',
  category: 'developer',
  keywords: [
    'uuid',
    'guid',
    'uuid v4',
    'generator',
    'random',
    'UUID生成',
    'GUID生成'
  ],
  path: '/tools/uuid-generator'
}
```

---

# 4. UUID生成方式

UUID v4の生成にはブラウザ標準の

`crypto.randomUUID()`

を使用する。

独自の乱数生成アルゴリズムは実装しない。

`Math.random()` をUUID生成には使用しない。

外部ライブラリは追加しない。

---

# 5. 基本UI

最低限以下を配置する。

- 生成件数
- Generate
- Output
- Copy
- Clear
- 大文字 / 小文字設定

既存ツールと操作感を揃える。

---

# 6. 生成件数

ユーザーが生成するUUIDの件数を指定できるようにする。

初期値:

`1`

入力可能範囲:

`1 ～ 100`

整数のみ許可する。

以下はエラーとして扱う。

- 空
- 0
- 負数
- 101以上
- 小数
- 数値以外

ユーザーが原因を理解できるエラーメッセージを表示する。

---

# 7. Generate

Generateを押したとき、
指定された件数のUUID v4を生成する。

生成したUUIDは改行区切りでOutputへ表示する。

---

# 8. 大文字 / 小文字設定

UUIDの表示形式を大文字または小文字で切り替えられるようにする。

初期値は小文字とする。

---

# 9. Copy

OutputをClipboard APIでコピーできること。

既存ツールと同じCopy feedback方式を利用する。

Outputが空の場合は、不自然な成功表示を行わない。

---

# 10. Clear

Clearで以下を初期状態へ戻す。

- 生成件数
- Output
- Error
- Copy feedback
- 大文字 / 小文字設定

---

# 11. Empty Input

入力が空の場合は、
不自然な結果を生成しない。

Outputを空にし、必要に応じてエラーを表示する。

---

# 12. Privacy

処理はすべてブラウザ上で実行する。

入力内容をBackendや外部APIへ送信しない。

既存ツールと同様、

`このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。`

という趣旨を表示する。

---

# 13. Tool Description

ツール下部に簡単な説明を表示する。

UUID Generatorは、UUID v4をブラウザ上で安全に生成するツールです。

開発時のテストデータ作成や識別子の生成に利用できます。

---

# 14. Usage

簡単な使い方を表示する。

1. 生成件数を入力します。
2. 必要に応じて大文字/小文字を選択します。
3. Generateを押します。
4. 必要に応じてCopyします。

---

# 15. Validation Cases

最低限以下を確認する。

- 1件生成できる
- 3件生成できる
- 1〜100 の範囲で生成できる
- 0 や 101 でエラーになる
- 小数や数値以外でエラーになる
- 大文字設定で出力が大文字になる
- `crypto.randomUUID()` で v4 形式の UUID が生成される
- `npm run build` が成功する

---

# 16. Build

実装後に `npm run build` を実行し、成功すること。
