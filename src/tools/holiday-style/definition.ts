import type { QuizDefinition } from '../playful-quiz/quiz'
export const holidayDefinition: QuizDefinition = {
  "id": "holiday-style",
  "title": "休日スタイル診断",
  "variant": "holiday",
  "subtitle": "休日の過ごし方を、5つの質問で振り返る。",
  "intro": "家でのんびりする日も、外へ出かける日も。今の好みから、休日の過ごし方を見つけます。",
  "questions": [
    {
      "title": "予定のない休日、何をしたい？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "家で本や動画を楽しむ",
          "detail": "慣れた場所で落ち着く時間。",
          "type": "slow"
        },
        {
          "id": "b",
          "label": "散歩や遠出をする",
          "detail": "外へ出て気分を変える時間。",
          "type": "wander"
        },
        {
          "id": "c",
          "label": "家で料理や趣味に取り組む",
          "detail": "好きなことに取り組む時間。",
          "type": "make"
        },
        {
          "id": "d",
          "label": "家の時間も外出も楽しむ",
          "detail": "家と外のどちらも大切に。",
          "type": "connect"
        }
      ]
    },
    {
      "title": "午後に2時間空いたら？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "家でゆっくり休む",
          "detail": "慣れた場所で落ち着く時間。",
          "type": "slow"
        },
        {
          "id": "b",
          "label": "気になる店や公園へ行く",
          "detail": "外へ出て気分を変える時間。",
          "type": "wander"
        },
        {
          "id": "c",
          "label": "趣味の続きを進める",
          "detail": "好きなことに取り組む時間。",
          "type": "make"
        },
        {
          "id": "d",
          "label": "少し散歩してから家で休む",
          "detail": "家と外のどちらも大切に。",
          "type": "connect"
        }
      ]
    },
    {
      "title": "気分転換に選ぶなら？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "家で音楽を聴く",
          "detail": "慣れた場所で落ち着く時間。",
          "type": "slow"
        },
        {
          "id": "b",
          "label": "外の空気を吸いに行く",
          "detail": "外へ出て気分を変える時間。",
          "type": "wander"
        },
        {
          "id": "c",
          "label": "何かを作ったり練習したりする",
          "detail": "好きなことに取り組む時間。",
          "type": "make"
        },
        {
          "id": "d",
          "label": "その日の気分で家と外を選ぶ",
          "detail": "家と外のどちらも大切に。",
          "type": "connect"
        }
      ]
    },
    {
      "title": "休日の予定を立てるときは？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "家で過ごす時間を確保する",
          "detail": "慣れた場所で落ち着く時間。",
          "type": "slow"
        },
        {
          "id": "b",
          "label": "行きたい場所から決める",
          "detail": "外へ出て気分を変える時間。",
          "type": "wander"
        },
        {
          "id": "c",
          "label": "やってみたい趣味を決める",
          "detail": "好きなことに取り組む時間。",
          "type": "make"
        },
        {
          "id": "d",
          "label": "外出と休憩をほどよく入れる",
          "detail": "家と外のどちらも大切に。",
          "type": "connect"
        }
      ]
    },
    {
      "title": "今日がよい休日だったと思うのは？",
      "note": "今の自分に近いものをひとつ選んでください。",
      "choices": [
        {
          "id": "a",
          "label": "家でくつろげたとき",
          "detail": "慣れた場所で落ち着く時間。",
          "type": "slow"
        },
        {
          "id": "b",
          "label": "外で新しい景色に出会えたとき",
          "detail": "外へ出て気分を変える時間。",
          "type": "wander"
        },
        {
          "id": "c",
          "label": "好きなことに集中できたとき",
          "detail": "好きなことに取り組む時間。",
          "type": "make"
        },
        {
          "id": "d",
          "label": "出かける時間も休む時間も取れたとき",
          "detail": "家と外のどちらも大切に。",
          "type": "connect"
        }
      ]
    }
  ],
  "outcomes": [
    {
      "id": "slow",
      "title": "インドア派",
      "description": "家など落ち着ける場所で過ごす休日が、今の気分に合いそうです。予定を詰めず、好きな本や動画を楽しんでみましょう。",
      "action": "くつろぐ時間を30分確保してみる。",
      "icon": "leaf"
    },
    {
      "id": "wander",
      "title": "アウトドア派",
      "description": "外へ出て景色や場所を変える休日が、今の気分に合いそうです。遠出をしなくても、近所の散歩で楽しめます。",
      "action": "気になる公園や店をひとつ訪ねてみる。",
      "icon": "trail"
    },
    {
      "id": "make",
      "title": "趣味を楽しむ派",
      "description": "好きなことに手を動かす休日が、今の気分に合いそうです。完成や上達を急がず、取り組む時間を楽しんでみましょう。",
      "action": "趣味に使う道具をひとつ出してみる。",
      "icon": "spark"
    },
    {
      "id": "connect",
      "title": "バランス型",
      "description": "家で休む時間と外へ出る時間を組み合わせる休日が、今の気分に合いそうです。無理のない予定にしてみましょう。",
      "action": "短い外出の後に、ゆっくり休む時間を作る。",
      "icon": "cups"
    }
  ]
}
