import { DIMENSIONS } from '../../mock/evaluation'

export default function EvaluationStrip() {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">How you'll be evaluated</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {DIMENSIONS.map((dimension) => {
          const isAI = dimension.name === 'AI Judgment'
          return (
            <div
              key={dimension.name}
              className={`rounded-lg border p-3 ${isAI ? 'border-ai/40 bg-ai/10' : 'border-line bg-panel'}`}
            >
              <div className={`text-xl font-semibold ${isAI ? 'text-ai' : 'text-white'}`}>{dimension.weight}%</div>
              <div className="text-[13px] font-medium text-white">{dimension.name}</div>
              <div className="mt-0.5 text-[11.5px] leading-snug text-fg-muted">{dimension.blurb}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
