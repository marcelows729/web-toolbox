# Base64 Encode / Decode Implementation

## 目的

「ぽけつる / POKETSURU」に、新しいツールとして
「Base64 Encode / Decode」を追加する。

テキストをBase64へEncodeし、Base64を元のテキストへDecodeできる、
シンプルで使いやすいブラウザ完結型ツールとする。

日本語・英数字・記号・絵文字などのUTF-8文字列を正しく扱えることを重視する。

既存の設計・Tool Registry・Routing・UI・Themeの方針に従い、
不要な共通化や大規模な変更は行わない。

---

# 1. Prompt保存

実装前に、この依頼内容を以下へMarkdownとして保存すること。

`docs/prompts/base64-encode-decode.md`

既存の `docs/prompts/` の運用方法に合わせること。

保存後、その仕様に基づいて実装を進める。

---

# 2. Tool

名称:

`Base64 Encode / Decode`

URL:

`/tools/base64-encode-decode`

カテゴリ:

`developer`

説明:

`テキストをBase64へエンコード・デコードします。`

---

# 3. Tool Registry

Tool Registryへ追加する。

想定metadata:

```ts
{
  id: 'base64-encode-decode',
  name: 'Base64 Encode / Decode',
  description: 'テキストをBase64へエンコード・デコードします。',
  category: 'developer',
  keywords: [
    'base64',
    'encode',
    'decode',
    'encoding',
    'Base64エンコード',
    'Base64デコード',
    '変換'
  ],
  path: '/tools/base64-encode-decode'
}
```

relatedToolsには `url-encode-decode` を自然に紐付けてもよい。

---

# 4. 基本UI

以下を配置する。

- Input textarea
- Output textarea
- Encode
- Decode
- Copy
- Clear

OutputはreadOnlyとする。

既存ツールと操作感を揃える。

---

# 5. Encode

Inputへ入力されたテキストをUTF-8として扱い、
Base64へEncodeする。

ASCII文字列だけでなく、日本語・絵文字などを正しく処理すること。

`btoa()` にUnicode文字列を直接渡すのではなく、
`TextEncoder` で UTF-8 bytes に変換してから Base64 化する。

---

# 6. Decode

Base64文字列をDecodeし、
UTF-8テキストとしてOutputへ表示する。

`atob()` で bytes を戻した後、
`TextDecoder` で UTF-8 として正しくデコードする。

---

# 7. Whitespace

Decode対象のBase64文字列について、
改行や前後の空白を除去してからDecodeする。

Encode時は入力テキストの空白・改行をデータとして保持する。

---

# 8. Validation

Decode時、不正なBase64入力を適切にエラーとして扱う。

例: `%%%`

`atob()` で発生する例外をcatchし、
`正しいBase64形式を入力してください。`

のようなメッセージを表示する。

エラー時はOutputを空にする。

---

# 9. UTF-8 Validation

Decodeしたbytesが有効なUTF-8ではない場合について、
可能であれば不正データとして扱う。

`new TextDecoder('utf-8', { fatal: true })` を利用して、
不正なUTF-8をエラーとして扱ってよい。

---

# 10. Empty Input

Inputが空の場合は、不自然な結果を生成しない。

Outputを空にし、入力を促す。

---

# 11. Copy / Clear

- OutputをClipboard APIでコピーできる
- Empty Outputの場合は成功メッセージを出さない
- Clearで Input / Output / Error / Copy feedback を初期化する

---

# 12. Privacy

処理はすべてブラウザ上で実行する。

入力内容をBackendや外部APIへ送信しない。

---

# 13. Tool Description

Base64 Encode / Decodeは、テキストをBase64形式へ変換したり、
Base64から元のテキストへ戻したりするツールです。

日本語や絵文字を含むUTF-8テキストにも対応しています。

---

# 14. Security Note

Base64はデータの表現形式であり、暗号化ではありません。

機密情報の保護目的には使用できません。

---

# 15. Usage

1. テキストまたはBase64を入力します。
2. EncodeまたはDecodeを押します。
3. 結果を確認します。
4. 必要に応じてCopyします。

---

# 16. Validation Cases

最低限以下を確認する。

- ASCII `Hello` → `SGVsbG8=` → `Hello`
- Japanese `こんにちは` → `44GT44KT44Gr44Gh44Gv` → `こんにちは`
- Emoji `😀` → `8J+YgA==` → `😀`
- Multiline text を round trip で戻る
- Base64 with whitespace / newline を decode できる
- Invalid Base64 `%%%` でエラー表示と空Output
- `npm run build` が成功する

---

# 17. Build

実装後に `npm run build` を実行し、成功すること。
