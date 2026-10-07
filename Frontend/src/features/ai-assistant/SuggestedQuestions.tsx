interface SuggestedQuestionsProps {
  onPick: (question: string) => void
}

const SUGGESTED_QUESTIONS = [
  'Where is query filtering implemented?',
  'Why is ?author_ne=typicode not filtering anything?',
  'How should _ne be handled?',
]

export default function SuggestedQuestions({ onPick }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-col items-start gap-1.5 px-4 pb-2">
      <span className="text-[11px] uppercase tracking-wide text-fg-muted">Try asking</span>
      {SUGGESTED_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onPick(question)}
          className="rounded-full border border-ai/40 bg-ai/10 px-3 py-1 text-left text-[12.5px] text-ai hover:bg-ai/20"
        >
          {question}
        </button>
      ))}
    </div>
  )
}
