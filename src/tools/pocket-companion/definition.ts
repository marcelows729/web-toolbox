import type { QuizDefinition } from '../playful-quiz/quiz'
export const companionDefinition: QuizDefinition = {
  "id": "pocket-companion",
  "title": "行動スタイル診断",
  "variant": "companion",
  "subtitle": "日常の選び方を、5つの質問で振り返る。",
  "intro": "新しいことや困りごとに向き合うとき、どんな進め方を選びますか。日常の場面から今の行動スタイルを振り返ります。",
  "questions": [
    {
      "title": "初めての作業を任されたら？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "手順と締め切りを整理する",
          "detail": "段取りを整えて進める。",
          "type": "compass"
        },
        {
          "id": "b",
          "label": "小さく試してから考える",
          "detail": "実際に試しながら進める。",
          "type": "pencil"
        },
        {
          "id": "c",
          "label": "周りの人に相談する",
          "detail": "人と話しながら進める。",
          "type": "lantern"
        },
        {
          "id": "d",
          "label": "情報を集めて比べる",
          "detail": "確かめてから進める。",
          "type": "bookmark"
        }
      ]
    },
    {
      "title": "予定どおり進まないときは？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "計画を立て直す",
          "detail": "段取りを整えて進める。",
          "type": "compass"
        },
        {
          "id": "b",
          "label": "別の方法を試す",
          "detail": "実際に試しながら進める。",
          "type": "pencil"
        },
        {
          "id": "c",
          "label": "協力できる人を探す",
          "detail": "人と話しながら進める。",
          "type": "lantern"
        },
        {
          "id": "d",
          "label": "原因を確かめる",
          "detail": "確かめてから進める。",
          "type": "bookmark"
        }
      ]
    },
    {
      "title": "新しいアイデアを思いついたら？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "実現までの段取りを考える",
          "detail": "段取りを整えて進める。",
          "type": "compass"
        },
        {
          "id": "b",
          "label": "まず形にしてみる",
          "detail": "実際に試しながら進める。",
          "type": "pencil"
        },
        {
          "id": "c",
          "label": "誰かと話して広げる",
          "detail": "人と話しながら進める。",
          "type": "lantern"
        },
        {
          "id": "d",
          "label": "必要な知識を調べる",
          "detail": "確かめてから進める。",
          "type": "bookmark"
        }
      ]
    },
    {
      "title": "いくつかの方法から選ぶなら？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "順序立てて進めやすい方法",
          "detail": "段取りを整えて進める。",
          "type": "compass"
        },
        {
          "id": "b",
          "label": "すぐに試せる方法",
          "detail": "実際に試しながら進める。",
          "type": "pencil"
        },
        {
          "id": "c",
          "label": "みんなが取り組みやすい方法",
          "detail": "人と話しながら進める。",
          "type": "lantern"
        },
        {
          "id": "d",
          "label": "根拠を確認できる方法",
          "detail": "確かめてから進める。",
          "type": "bookmark"
        }
      ]
    },
    {
      "title": "ひとつの作業が終わったら？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "次の予定を整理する",
          "detail": "段取りを整えて進める。",
          "type": "compass"
        },
        {
          "id": "b",
          "label": "次に試したいことを探す",
          "detail": "実際に試しながら進める。",
          "type": "pencil"
        },
        {
          "id": "c",
          "label": "一緒に取り組んだ人と話す",
          "detail": "人と話しながら進める。",
          "type": "lantern"
        },
        {
          "id": "d",
          "label": "うまくいった理由を振り返る",
          "detail": "確かめてから進める。",
          "type": "bookmark"
        }
      ]
    }
  ],
  "outcomes": [
    {
      "id": "compass",
      "title": "計画型",
      "description": "手順や見通しを整理してから進めるスタイルが、今のあなたに近そうです。予定に余裕を持たせると、変更にも対応しやすくなります。",
      "action": "次にやることを3つ書き出してみる。",
      "icon": "leaf"
    },
    {
      "id": "pencil",
      "title": "実践型",
      "description": "小さく試し、手応えを見ながら進めるスタイルが、今のあなたに近そうです。途中で振り返る時間も取ってみましょう。",
      "action": "すぐ試せる小さな一歩を決める。",
      "icon": "trail"
    },
    {
      "id": "lantern",
      "title": "協力型",
      "description": "相談や協力を通じて進めるスタイルが、今のあなたに近そうです。自分の考えも伝えると、一緒に進めやすくなります。",
      "action": "相談したいことをひとつ言葉にする。",
      "icon": "spark"
    },
    {
      "id": "bookmark",
      "title": "慎重型",
      "description": "情報や理由を確かめてから進めるスタイルが、今のあなたに近そうです。調べる時間を区切ると、次の一歩につながります。",
      "action": "判断に必要な情報をひとつ確かめる。",
      "icon": "cups"
    }
  ]
}
