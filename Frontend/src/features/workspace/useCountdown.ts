import { useEffect, useState } from 'react'

/** Seconds remaining from `startedAt` for a limit in minutes; ticks every second. */
export function useCountdown(limitMin: number, startedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const total = limitMin * 60
  if (startedAt === null) return total
  return Math.max(0, total - Math.floor((now - startedAt) / 1000))
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
