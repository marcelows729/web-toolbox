# ランダム組み分け

公開URL: /tools/random-grouping。イベントやゲームの候補全員を均等な複数組へ分ける。既存ルーレットは1件だけ選ぶため重複しない。

## 仕様

- 2〜100候補を1行に1人・1件ずつ。CRLF/CR/LFで分けて行trimと空行除去だけを行う。1候補100コードポイント、全体30,000 UTF-16単位まで。全体超過は切り捨てず、元の入力を保持する。
- 同名は警告し、勝手に削除・統合・Unicode正規化・大小文字変更をしない。候補番号は空行除去後の入力順で、各行を別候補として表示・コピーする。
- 組数は2〜候補数の整数。全角数字も受け付ける。組1・組2など中立のラベルを使い、属性・能力・性別などは判断しない。
- crypto.getRandomValuesの32bit値を棄却法で偏りのない添字に変え、Fisher-Yatesで全員をシャッフルする。均等な人数で区切り、余りは組番号順に1候補ずつ増やす。人数差は最大1、全候補番号が1回ずつ現れる。乱数失敗・非対応はエラーとし、他方式へフォールバックしない。
- 再抽選は毎回新しいシャッフルを行う。同じ結果になる可能性もある。再抽選・入力/設定変更・リセットは古い結果やコピー通知を消し、useToolResultが遅いClipboard完了の競合を防ぐ。
- 完了はpoliteなstatusに回数と人数・組数を表示する。再抽選で同じ並びでも通知文が更新される。入力と操作はネイティブフォームで、追加アニメーションはない。
- 入力・結果・組数はReactメモリのみ。URL・storage・外部送信なし。棚には既存仕様でツールIDだけ保存する。新依存・外部サービス・配信設定の変更なし。

## 検証

1. npm test / npm run lint / npm run build / git diff --check。
2. 95自動テスト。19,800分割の候補番号保存則と人数差、2名2組・100名3組・全員別組、全24通りのFisher-Yates、棄却・上限・乱数失敗、同名・Unicode・コピー表記を含む。
3. 専用EdgeのCDP9222・preview5173で node tests/grouping-browser.mjs。実crypto/Clipboard、100候補と100組、候補・組数編集、再抽選・リセット、同名/HTML/emojiの安全表示、30,001文字の実貼り付け拒否、Tab/Enter/Space、コピー競合、light/dark1280px/320px、長い候補名、reduced-motion、棚・検索・非保存とルーレット回帰を確認する。
4. tests/page-clarity-browser.mjs と tests/browser-regressions.mjs で全28ルートのタイトル・ラベル・リンク・明暗スマホと画像処理を確認する。
5. 本番はTEST_BASE_URL=https://poketsuru.comを設定して同じgrouping-browser試験を実行する。画像保存先はTEST_SCREENSHOT_DIR（既定はTEMP）。

Edgeのstatus属性と実キーボードは確認するが、スクリーンリーダー実機・実機Safariは未検証。
