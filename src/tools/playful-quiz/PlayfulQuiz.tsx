import { useEffect, useRef, useState } from 'react'
import { useToolResult } from '../../components/tools/BrowserTool'
import { calculateQuiz, PLAY_NOTICE, quizResultText } from './quiz'
import type { QuizDefinition, QuizResult } from './quiz'
import QuizIllustration from './QuizIllustration'

export default function PlayfulQuiz({ definition }: { definition: QuizDefinition }) {
  const [stage, setStage] = useState<'intro' | 'questions' | 'result'>('intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Array<string | null>>(() => definition.questions.map(() => null))
  const [outcome, setOutcome] = useState<QuizResult | null>(null)
  const [error, setError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const result = useToolResult()
  const answered = answers.filter(answer => answer !== null).length
  const question = definition.questions[step]
  const isHoliday = definition.variant === 'holiday'
  const reset = () => { result.reset(); setError(''); setAnswers(definition.questions.map(() => null)); setOutcome(null); setStep(0); setStage('intro') }
  const edit = (index: number) => { result.reset(); setError(''); setOutcome(null); setStep(index); setStage('questions') }
  useEffect(() => { heading.current?.focus() }, [stage, step])
  const next = () => {
    if (answers[step] === null) { setError('気分に近いものを1つ選んでください。'); return }
    setError('')
    if (step < definition.questions.length - 1) { setStep(step + 1); return }
    if (answers.some(answer => answer === null)) { setError('未回答の質問があります。戻って選んでください。'); return }
    try {
      const computed = calculateQuiz(definition, answers as string[])
      setOutcome(computed); setStage('result')
      void result.run(() => quizResultText(definition, computed))
    } catch (cause) { setError((cause as Error).message) }
  }
  return <div className={`container tool-page playful-quiz playful-quiz--${definition.variant}`}>
    <header className="tool-header"><h1>{definition.title}</h1><p>{definition.subtitle}</p></header>
    <section className="tool-panel quiz-panel" aria-label={definition.title}>
      {stage === 'intro' && <div className="quiz-intro"><div className="quiz-intro-art"><QuizIllustration icon={isHoliday ? 'leaf' : 'compass'} /><span>{isHoliday ? 'A DAY WITH A LITTLE SPACE' : 'A LITTLE STORY IN YOUR POCKET'}</span></div><div className="quiz-intro-copy"><p className="quiz-eyebrow">{isHoliday ? '今日の気分を、5つの選択に。' : '5つの場面、ひとつの相棒。'}</p><h2 ref={heading} tabIndex={-1}>{isHoliday ? 'どんな休日にしよう？' : 'ポケットを空けて、出発しよう。'}</h2><p>{definition.intro}</p><p className="quiz-notice">{PLAY_NOTICE}</p><p className="quiz-privacy">回答はこの画面内だけで扱い、保存・送信・URLへの埋め込みはしません。</p><button id="quiz-start" type="button" className="primary-button" onClick={() => setStage('questions')}>{isHoliday ? '今日の気分を選ぶ' : '小さな旅をはじめる'} <span aria-hidden="true">→</span></button></div></div>}
      {stage === 'questions' && <>
        <div className="quiz-progress-heading"><span>{isHoliday ? '今日の気分' : '旅の場面'} {step + 1} / {definition.questions.length}</span><span>{answered}問回答済み</span></div>
        <div className="quiz-progress" aria-hidden="true">{definition.questions.map((_, index) => <span key={index} className={`${answers[index] !== null ? 'is-answered' : ''} ${step === index ? 'is-current' : ''}`} />)}</div>
        <p className="visually-hidden" role="status" aria-live="polite">質問{step + 1}／{definition.questions.length}。{answered}問回答済み。</p>
        <h2 className="quiz-question-title" ref={heading} tabIndex={-1}>{question.title}</h2><p className="quiz-question-note">{question.note}</p>
        <fieldset className="quiz-options" aria-describedby={error ? 'quiz-question-error' : undefined}><legend className="visually-hidden">{question.title}</legend>{question.choices.map((choice, index) => <label key={choice.id} className={`quiz-option ${answers[step] === choice.id ? 'is-selected' : ''}`}><input type="radio" name={`quiz-question-${step}`} value={choice.id} checked={answers[step] === choice.id} onChange={() => { const nextAnswers = [...answers]; nextAnswers[step] = choice.id; setAnswers(nextAnswers); result.reset(); setOutcome(null); setError('') }} /><span className="quiz-option-letter" aria-hidden="true">{isHoliday ? `0${index + 1}` : ['✦', '◇', '○', '⌁'][index]}</span><span className="quiz-option-copy"><strong>{choice.label}</strong><small>{choice.detail}</small></span></label>)}</fieldset>
        {error && <p className="error-box" role="alert" id="quiz-question-error">{error}</p>}
        <div className="quiz-actions"><button id="quiz-back" className="secondary-button" type="button" onClick={() => { setError(''); if (step === 0) setStage('intro'); else setStep(step - 1) }}>← {step === 0 ? 'はじめの画面' : 'ひとつ戻る'}</button><button id="quiz-next" className="primary-button" type="button" onClick={next}>{step === definition.questions.length - 1 ? isHoliday ? '今日の提案を見る' : '相棒に会う' : '次へ'} <span aria-hidden="true">→</span></button></div>
        <button className="text-button quiz-restart" type="button" onClick={reset}>回答を消して最初から</button>
      </>}
      {stage === 'result' && outcome && <>
        <div className="quiz-result-card"><div className="quiz-result-art"><QuizIllustration icon={outcome.outcome.icon} /><span>{isHoliday ? 'YOUR DAY, YOUR PACE' : 'YOUR POCKET COMPANION'}</span></div><div><p className="quiz-eyebrow">{isHoliday ? '今日のひとつの提案' : '今回の旅の相棒'}</p><h2 ref={heading} tabIndex={-1} className="quiz-result-title">{outcome.outcome.title}</h2><p className="quiz-result-description">{outcome.outcome.description}</p><div className="quiz-small-action"><strong>小さな一歩</strong><p>{outcome.outcome.action}</p></div></div></div>
        <p className="quiz-reason">選んだ「{outcome.matched.slice(0, 2).join('」「')}」から、この{isHoliday ? '過ごし方' : '相棒'}を提案しました。</p>
        {outcome.tied && <p className="quiz-tie">同点の結果があったため、下に記載した紹介順で決めています。他の楽しみ方も、きっと似合います。</p>}
        <p className="quiz-notice">{PLAY_NOTICE}</p><p className="visually-hidden" role="status" aria-live="polite">結果は「{outcome.outcome.title}」です。</p>
        <div className="quiz-actions"><button id="quiz-copy" className="primary-button" type="button" disabled={result.output === null || result.busy} onClick={() => void result.copy()}>結果をコピー</button><button id="quiz-edit" className="secondary-button" type="button" onClick={() => edit(0)}>回答を見直す</button><button id="quiz-restart" className="secondary-button" type="button" onClick={reset}>最初から</button></div>
        {result.error && <p className="error-box" role="alert">{result.error}</p>}<p className="quiz-copy-feedback" role="status" aria-live="polite">{result.feedback}</p>
        <details className="quiz-review"><summary>回答を確認・修正する</summary><ol>{definition.questions.map((item, index) => <li key={index}><strong>{item.title}</strong><p>{item.choices.find(choice => choice.id === answers[index])?.label}</p><button className="text-button" type="button" onClick={() => edit(index)}>この回答を変える<span className="visually-hidden">：質問{index + 1}</span></button></li>)}</ol></details>
        <details className="quiz-copy-details"><summary>コピー用のテキストを見る</summary><label className="visually-hidden" htmlFor="quiz-copy-text">診断結果のテキスト</label><textarea id="quiz-copy-text" value={quizResultText(definition, outcome)} readOnly rows={7} /></details>
      </>}
    </section>
    <section className="tool-info quiz-info"><h2>この遊びについて</h2><p>各回答が対応する提案に1点を加え、合計が最も多いものを結果にします。同点は紹介順（{definition.outcomes.map(outcome => outcome.title).join(' → ')}）で決めます。同じ回答なら同じ結果になり、ランダムな判定はしません。</p><p>{PLAY_NOTICE} 気分や物語の選び方を楽しむための提案です。結果に順位や優劣はありません。</p><p>戻る・見直すで回答を変えられます。最初からを押すと回答が消えます。再読込や画面を離れた場合も回答は残りません。コピーは自分で操作したときだけ行い、自動投稿はしません。</p></section>
  </div>
}
