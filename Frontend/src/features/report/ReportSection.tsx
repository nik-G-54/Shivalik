import type { ReactNode } from 'react'

interface ReportSectionProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function ReportSection({ title, subtitle, children }: ReportSectionProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <h2 className="text-[15px] font-semibold text-white">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[12.5px] text-fg-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
