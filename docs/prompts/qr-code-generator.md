# QR Code Generator

## Purpose

「ぽけつる / POKETSURU」に、新しいツールとして「QRコード生成」を追加する。

URLやテキストを入力すると、ブラウザ上でQRコードを生成できる、シンプルで使いやすい一般向けツールとする。

生成したQRコードは画面上で確認でき、PNG画像として保存できることを目標とする。

既存の設計・Tool Registry・Routing・Theme・共通UIルールに従うこと。

UIについては、docs/tool-development-guide.md に記載されている共通UIルールを優先し、今回のために独自デザインを増やさないこと。

## Scope

- URLまたは任意テキストを入力できる
- GenerateボタンでQRコードを生成する
- PreviewでQRコードを表示する
- PNGとしてDownloadできる
- 空入力時はエラー表示する
- Clearで入力・結果・エラーを初期状態へ戻す
- 処理はブラウザ上で行い、外部APIに送信しない
- Light / Dark Themeに対応する
- 既存UI規約と同じボタン/レイアウト構成を維持する

## Constraints

- 既存のTool Registry・Routing・Theme・共通UIを壊さない
- 新しいカテゴリを作りすぎない
- 既存設計と矛盾する場合は、独断で大きく変更せず報告する
- 今回の範囲外の機能追加や大規模リファクタリングは行わない
- QRコード生成はブラウザ標準APIだけで独自実装しない
- 必要に応じて軽量なQRライブラリを追加する

## Expected behavior

- 「URLやテキストを入力してください。」のようなtextareaを配置する
- Generateボタンを押した時に、現在の入力内容からQRコードを生成する
- Previewは白背景のQR領域で表示する
- PNG保存時のファイル名は固定値にする
- Input変更後に既存Previewの整合が崩れないよう、必要に応じてPreviewをクリアする
- Errorはrole="alert"で表示する
- Privacy Informationの説明文を表示する
- Buildが成功すること
