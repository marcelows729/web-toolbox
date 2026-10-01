import type { QuizDefinition } from '../playful-quiz/quiz'
export const companionDefinition: QuizDefinition = {
  id: 'pocket-companion', title: 'ポケット相棒診断', variant: 'companion',
  subtitle: '小さな空想の旅から、相棒をひとつ。',
  intro: 'これは、ポケットに入る道具が相棒になる物語。5つの場面で選んだことから、今回の旅に連れていく道具が決まります。',
  questions: [
    { title: '小さな旅の入口。最初に手に取るのは？', note: 'ここから先は、空想の世界です。', choices: [
      { id: 'a', label: 'まだ道の描かれていない地図', detail: '向かう先をひとつ決めてみる。', type: 'compass' },
      { id: 'b', label: '落書きのできる白い紙', detail: '旅の途中で何か描いてみる。', type: 'pencil' },
      { id: 'c', label: '夜道を照らす小さな灯り', detail: '足もとの景色も見ておきたい。', type: 'lantern' },
      { id: 'd', label: '途中のページが開いた物語', detail: '気になる続きを携えていく。', type: 'bookmark' },
    ] },
    { title: '森に、不思議な扉がありました。どうする？', note: 'どの扉にも、違うおもしろさがあります。', choices: [
      { id: 'a', label: '扉の模様を紙に描き留める', detail: '自分だけの模様にしてみたい。', type: 'pencil' },
      { id: 'b', label: 'すきまの向こうを灯りで照らす', detail: '小さなものまで見てみたい。', type: 'lantern' },
      { id: 'c', label: '扉に書かれた古い言葉を読む', detail: 'ここにある物語を味わいたい。', type: 'bookmark' },
      { id: 'd', label: '扉の先がどこにつながるか考える', detail: '次の行き先に心が向く。', type: 'compass' },
    ] },
    { title: '道が四つに分かれました。どんな道を選ぶ？', note: '危険や正解はありません。好きな景色を選びます。', choices: [
      { id: 'a', label: '小さな光がぽつぽつ続く道', detail: '足もとのひとつひとつを眺めたい。', type: 'lantern' },
      { id: 'b', label: '古い看板に物語が書かれた道', detail: 'ゆっくり読む寄り道がしたい。', type: 'bookmark' },
      { id: 'c', label: '遠くに知らない丘が見える道', detail: 'その先の景色へ向かいたい。', type: 'compass' },
      { id: 'd', label: '色とりどりの石が並んだ道', detail: '見つけた色で何か描きたい。', type: 'pencil' },
    ] },
    { title: '旅の途中で、空白の1ページをもらいました。', note: 'そのページは、好きに使ってかまいません。', choices: [
      { id: 'a', label: 'お気に入りの場面にはさんでおく', detail: 'あとで、この場所に戻れるように。', type: 'bookmark' },
      { id: 'b', label: '次に行きたい場所を書いてみる', detail: '次の一歩が少し楽しみになるように。', type: 'compass' },
      { id: 'c', label: 'まだ見たことのない生き物を描く', detail: '空想を、ひとつ形にしてみる。', type: 'pencil' },
      { id: 'd', label: '今日見つけた小さな光を書き留める', detail: 'ささやかな景色も忘れないように。', type: 'lantern' },
    ] },
    { title: '旅のおみやげ。ポケットに残したいのは？', note: '今回の旅を思い出す、ひとつを選びます。', choices: [
      { id: 'a', label: '次の旅への小さな矢印', detail: 'いつか、もう少し先へ。', type: 'compass' },
      { id: 'b', label: '自分だけのへんてこな絵', detail: '見るたびに、少し笑えるもの。', type: 'pencil' },
      { id: 'c', label: '手のひらにおさまる灯り', detail: '思い出の景色を、やわらかく照らすもの。', type: 'lantern' },
      { id: 'd', label: 'また読みたい場面の目印', detail: 'お気に入りの時間に戻れるもの。', type: 'bookmark' },
    ] },
  ],
  outcomes: [
    { id: 'compass', title: 'よりみちコンパス', description: '針が指すのは、目的地より「ちょっと気になる方」。今回の物語で選んだ次の景色へ、この相棒と一歩ずつ。', action: '今日のメモに「いつか行ってみたい場所」をひとつ書いてみる。', icon: 'compass' },
    { id: 'pencil', title: 'らくがきえんぴつ', description: 'きれいな線より、おもしろい線が好きな相棒。今回の物語で選んだ空想や色を、紙の上にも連れてきてみませんか。', action: '丸をひとつ描いて、目や耳を足して不思議な顔にしてみる。', icon: 'pencil' },
    { id: 'lantern', title: 'こもれびランタン', description: '大きな光ではなく、近くの小さな景色を照らす相棒。今回の物語で見つけた灯りが、ポケットの中でもやわらかく揺れます。', action: '身のまわりで、ちょっと好きな色をひとつ見つけてみる。', icon: 'lantern' },
    { id: 'bookmark', title: 'つづきのしおり', description: 'お気に入りの場面を忘れずにはさんでおく相棒。今回の物語で選んだ言葉や景色の続きを、急がず楽しんでみませんか。', action: '今日のよかった場面を、ひと言だけ書き留めてみる。', icon: 'bookmark' },
  ],
}
