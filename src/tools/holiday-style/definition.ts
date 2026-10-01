import type { QuizDefinition } from '../playful-quiz/quiz'
export const holidayDefinition: QuizDefinition = {
  id: 'holiday-style', title: '休日スタイル診断', variant: 'holiday',
  subtitle: '予定のない一日に、ちいさな道しるべを。',
  intro: '今の気分に近いものを5つ選ぶと、今日の過ごし方がひとつ届きます。正解も、理想の休日もありません。',
  questions: [
    { title: '自由な朝。最初にしたいことは？', note: 'いつもの自分より、今日の気分で選んでください。', choices: [
      { id: 'a', label: '飲み物をいれて、窓辺でひと息', detail: '予定を急がず、朝の余白を味わう。', type: 'slow' },
      { id: 'b', label: '近くの気になる道へ出かける', detail: '知らない景色をひとつ見つけに。', type: 'wander' },
      { id: 'c', label: '途中だった小さな作業を開く', detail: '絵、料理、片づけ。手を動かしたい。', type: 'make' },
      { id: 'd', label: '誰かに今日の予定を聞いてみる', detail: '一緒に過ごせる時間があればうれしい。', type: 'connect' },
    ] },
    { title: 'ぽっかり空いた2時間。どこへ向かう？', note: '遠くへ行かなくても、休日は始まります。', choices: [
      { id: 'a', label: '初めて入る店や小さな公園', detail: 'ちょっとした発見を探す。', type: 'wander' },
      { id: 'b', label: '机や台所、好きなものを作る場所', detail: '完成より、作る時間を楽しむ。', type: 'make' },
      { id: 'c', label: '話したい人と会える場所', detail: 'おしゃべりだけでも十分。', type: 'connect' },
      { id: 'd', label: '読みかけの本がある、お気に入りの席', detail: '静かな時間に戻ってくる。', type: 'slow' },
    ] },
    { title: '今日は、どんなペースで過ごしたい？', note: '速い・遅いに優劣はありません。', choices: [
      { id: 'a', label: 'ひとつのことに、じっくり手を動かす', detail: '小さな形ができるまで。', type: 'make' },
      { id: 'b', label: '一緒にいる人に合わせて、ゆるやかに', detail: '誰かと同じ時間を楽しむ。', type: 'connect' },
      { id: 'c', label: '時計をあまり見ず、のんびり', detail: '空白の時間も予定のうち。', type: 'slow' },
      { id: 'd', label: '気になったら、その場で寄り道', detail: '予定よりも好奇心を頼りに。', type: 'wander' },
    ] },
    { title: '外の予定が変わったら、何を楽しむ？', note: '予定変更も、小さな選び直しに。', choices: [
      { id: 'a', label: '友だちと短い電話やお茶', detail: '場所が変わっても、一緒の時間。', type: 'connect' },
      { id: 'b', label: '音楽を流して、ぼんやりする', detail: '何もしない時間をそのまま楽しむ。', type: 'slow' },
      { id: 'c', label: '近場の新しい行き先を探す', detail: 'まだ知らない楽しみがありそう。', type: 'wander' },
      { id: 'd', label: '家にある材料で何か作る', detail: 'あり合わせから、ひとつ生まれる。', type: 'make' },
    ] },
    { title: '一日の終わり、何があったらうれしい？', note: 'ほんの小さな出来事で大丈夫です。', choices: [
      { id: 'a', label: 'ゆっくり過ごした余韻', detail: '予定を詰めなかった一日。', type: 'slow' },
      { id: 'b', label: '知らなかった景色の記憶', detail: '写真にしなくても、心にひとつ。', type: 'wander' },
      { id: 'c', label: '自分で作った小さなもの', detail: 'うまくできたかより、楽しめたか。', type: 'make' },
      { id: 'd', label: '誰かと分け合った笑い話', detail: '何気ない会話のおみやげ。', type: 'connect' },
    ] },
  ],
  outcomes: [
    { id: 'slow', title: '余白をたのしむ日', description: '今日は、予定のすきまが主役。好きな場所で、何もしない時間も休日のひとこまにしてみませんか。', action: '飲み物をひとつ用意して、窓辺で10分だけ過ごしてみる。', icon: 'leaf' },
    { id: 'wander', title: '小さな寄り道の日', description: '今日は、いつもの道の少し先へ。大きな旅より、近くの「知らなかった」が楽しみになりそうです。', action: '気になっていた角をひとつ曲がって、景色を見つけてみる。', icon: 'trail' },
    { id: 'make', title: '手を動かす日', description: '今日は、何かが少しずつ形になる時間を。完成を急がず、途中の手ざわりまで楽しんでみませんか。', action: '紙を1枚出して、思いつくままに小さな絵やメモを描いてみる。', icon: 'spark' },
    { id: 'connect', title: '誰かと分け合う日', description: '今日は、ひとりでは見つからない話を。会う、話す、ひと言を届ける。気軽なつながりから始めてみませんか。', action: '話したい人に「最近、何かおもしろいことあった？」と聞いてみる。', icon: 'cups' },
  ],
}
