# URL Encode / Decode Implementation

## 目的

「ぽけつる / POKETSURU」に、新しいツールとして「URL Encode / Decode」を追加する。

文字列やURLをURLエンコード・デコードできる、シンプルで使いやすいブラウザ完結型ツールとする。

日本語・スペース・記号・絵文字などを含む文字列にも対応する。

既存の設計・Tool Registry・Routing・UI・Themeの方針に従い、不要な共通化や大規模な変更は行わない。

---

# 1. Prompt保存

実装前に、この依頼内容を以下へMarkdownとして保存すること。

`docs/prompts/url-encode-decode.md`

既存の `docs/prompts/` の運用方法に合わせること。

保存後、その仕様に基づいて実装を進める。

---

# 2. Tool

名称:

`URL Encode / Decode`

URL:

`/tools/url-encode-decode`

カテゴリ:

`developer`

説明:

`文字列やURLをURLエンコード・デコードします。`

---

# 3. Tool Registry

Tool Registryへ追加する。

想定metadata:

```ts
{
  id: 'url-encode-decode',
  name: 'URL Encode / Decode',
  description: '文字列やURLをURLエンコード・デコードします。',
  category: 'developer',
  keywords: [
    'url',
    'encode',
    'decode',
    'percent',
    'encoding',
    'URLエンコード',
    'URLデコード',
    'パーセントエンコード'
  ],
  path: '/tools/url-encode-decode'
}
```

---

# 4. 基本UI

以下を配置する。

- Input textarea
- Output textarea
- Encode
- Decode
- Copy
- Clear
- Encode Mode

Outputは原則readOnlyとする。

既存ツールと操作感を合わせること。

---

# 5. Encode Mode

Encode時の処理方法として以下の2種類を選択できるようにする。

## Component

表示名の例:

`文字列 / パラメータ`

内部処理:

`encodeURIComponent()`

初期値はこちらとする。

主な用途:

- Query parameterの値
- 任意の文字列
- URLの一部分

---

## Full URL

表示名の例:

`URL全体`

内部処理:

`encodeURI()`

主な用途:

URL全体をエンコードする場合。

---

# 6. Decode

DecodeではPercent-Encodingされた文字列をデコードする。

基本処理として、

`decodeURIComponent()`

を使用する。

ただし、Full URLモードでURL全体を扱う場合は、

`decodeURI()`

を利用する。

---

# 7. Decodeのエラーハンドリング

不正なPercent-Encodingが入力された場合、アプリをクラッシュさせない。

`URIError` をcatchし、ユーザーが理解できるエラーを表示する。

例:

`正しくないURLエンコード形式が含まれています。`

Outputは空にする。

---

# 8. Empty Input

入力が空の場合は、不自然な結果を生成しない。

Outputを空にし、必要に応じて簡単な案内またはエラーを表示する。

---

# 9. 日本語 / Unicode / Emoji

- 日本語やスペースを正しくEncode / Decodeできること
- `+` は自動変換しない
- 絵文字も正しく処理できること

---

# 10. Copy / Clear

- OutputをClipboard APIでコピーできる
- Outputが空の場合は成功表示をしない
- Clearで Input / Output / Error / Copy feedback を初期化する
- Encode Modeを初期値のComponentへ戻してよい

---

# 11. Privacy

処理はすべてブラウザ上で実行する。

入力内容をBackendや外部APIへ送信しない。

既存ツールと同様、

`このツールの処理はすべてブラウザ上で実行されます。入力したデータはサーバーへ送信されません。`

という趣旨を表示する。

---

# 12. Tool Description

ツール下部に簡単な説明を表示する。

URL Encode / Decodeは、日本語・スペース・記号などをURLで安全に扱える形式へ変換したり、元の文字列へ戻したりするツールです。

URLパラメータやWeb開発時のデータ確認などに利用できます。

---

# 13. Usage

簡単な使い方を表示する。

1. 変換したい文字列またはURLを入力します。
2. 変換モードを選択します。
3. EncodeまたはDecodeを押します。
4. 必要に応じてCopyします。

---

# 14. Validation Cases

最低限以下を確認する。

- `こんにちは` をComponent Encodeし、Decode後に戻る
- `こんにちは world` をComponent Encodeできる
- `😀` をEncodeしてDecodeできる
- `hello+world` をDecodeして `hello+world` のままである
- Full URL EncodeでURL構造が維持される
- Invalid decode (`%E3%81`) でエラー表示と空Outputになる
- `npm run build` が成功する

---

# 15. Build

実装後に `npm run build` を実行し、成功すること。
