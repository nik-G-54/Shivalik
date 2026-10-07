export default function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 border-l-2 border-ai pl-3 text-[13px] text-fg-muted" role="status">
      Thinking
      <span className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: `${delay}ms` }}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-ai"
          />
        ))}
      </span>
    </div>
  )
}
