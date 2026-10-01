import type { QuizIcon } from './quiz'

export default function QuizIllustration({ icon }: { icon: QuizIcon }) {
  const drawings = {
    leaf: <><path d="M35 79C24 48 46 26 87 26c-1 40-17 60-52 53Z" /><path d="m30 90 41-43M46 72l-2-20m14 9 20 1" /></>,
    trail: <><path d="M25 88c49 8 68-8 37-24S29 43 70 29" /><circle cx="72" cy="27" r="6" /><path d="m21 47 13-18 14 18M77 85l9-14 9 14" /></>,
    spark: <><path d="m29 86 8-22 41-41 17 17-41 41-25 5Zm8-22 17 17M74 27l17 17M20 35l8 1m11-18 1 8m48 57 8 1" /><path d="m59 90 3 7" /></>,
    cups: <><path d="M23 47h29v21c0 20-29 20-29 0V47Zm29 3h6c13 0 13 17 0 17h-6M67 47h29v21c0 20-29 20-29 0V47ZM29 93h66M33 33c-5-5 5-8 0-13m11 13c-5-5 5-8 0-13m34 13c-5-5 5-8 0-13" /></>,
    compass: <><circle cx="60" cy="64" r="33" /><path d="m46 78 10-20 18-8-10 20-18 8ZM55 31v-8h10v8M60 39v5m0 40v5M35 64h5m40 0h5" /><circle cx="60" cy="64" r="2" /></>,
    pencil: <><path d="m26 93 9-27 43-43 18 18-43 43-27 9Zm9-27 18 18M75 26l18 18M31 79l9 9M44 74l39-39" /><path d="M17 103h58" /></>,
    lantern: <><path d="M37 40h46l8 49H29l8-49ZM43 40V25a17 17 0 0 1 34 0v15M31 89h58v9H31zM47 40l-7 49m33-49 7 49" /><path d="M60 79c-16-7-9-16 0-29 8 13 15 22 0 29Z" /></>,
    bookmark: <><path d="M36 22h48v78L60 83l-24 17V22Z" /><path d="m60 38 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1 4-9ZM20 43h7m66 31h7" /></>,
  }
  return <svg className="quiz-illustration" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="60" cy="60" r="55" className="quiz-illustration-disc" stroke="none" />{drawings[icon]}</svg>
}
