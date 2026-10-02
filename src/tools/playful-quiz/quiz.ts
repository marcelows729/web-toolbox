export type QuizIcon = 'leaf' | 'trail' | 'spark' | 'cups' | 'compass' | 'pencil' | 'lantern' | 'bookmark'
export type QuizChoice = { id: string; label: string; detail: string; type: string }
export type QuizQuestion = { title: string; note: string; choices: QuizChoice[] }
export type QuizOutcome = { id: string; title: string; description: string; action: string; icon: QuizIcon }
export type QuizDefinition = { id: string; title: string; subtitle: string; intro: string; variant: 'holiday' | 'companion'; questions: QuizQuestion[]; outcomes: QuizOutcome[] }
export type QuizResult = { outcome: QuizOutcome; scores: Record<string, number>; matched: string[]; tied: boolean }
export const PLAY_NOTICE = '遊びの診断です。性格や能力を判定するものではありません。'

// One choice gives one point. Ties use the documented outcome order, never randomness.
export function calculateQuiz(definition: QuizDefinition, answers: string[]): QuizResult {
  if (answers.length !== definition.questions.length) throw new Error('すべての質問に回答してください。')
  const scores: Record<string, number> = Object.fromEntries(definition.outcomes.map(outcome => [outcome.id, 0]))
  const choices = definition.questions.map((question, index) => {
    const choice = question.choices.find(choice => choice.id === answers[index])
    if (!choice || !Object.hasOwn(scores, choice.type)) throw new Error('回答を確認してください。')
    scores[choice.type] += 1
    return choice
  })
  const best = Math.max(...Object.values(scores))
  const leaders = definition.outcomes.filter(outcome => scores[outcome.id] === best)
  if (!leaders.length) throw new Error('結果を表示できませんでした。')
  const outcome = leaders[0]
  return { outcome, scores, matched: choices.filter(choice => choice.type === outcome.id).map(choice => choice.label), tied: leaders.length > 1 }
}

export function quizResultText(definition: QuizDefinition, result: QuizResult): string {
  return `${definition.title}\n${result.outcome.title}\n${result.outcome.description}\n小さな一歩：${result.outcome.action}\n${PLAY_NOTICE}`
}
