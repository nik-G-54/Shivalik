import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import type { CriterionScore } from '../../types'
import CriterionCard from './CriterionCard'
import ReportSection from './ReportSection'

interface EngineeringAssessmentProps {
  criteria: CriterionScore[]
}

const SHORT_NAMES: Record<string, string> = {
  'Root-Cause Understanding': 'Root Cause',
  'Testing Strategy': 'Testing',
  'Engineering Judgment': 'Judgment',
  Debugging: 'Debugging',
  'Scope Discipline': 'Scope',
  'AI Judgment': 'AI Judgment',
}

export default function EngineeringAssessment({ criteria }: EngineeringAssessmentProps) {
  const data = criteria.map((c) => ({
    name: SHORT_NAMES[c.name] ?? c.name,
    score: c.score,
    max: c.maxScore,
  }))

  return (
    <ReportSection title="Engineering Assessment" subtitle="Six criteria, each scored out of 10 with the events that back it.">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#3c3c3c" />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#cccccc', fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
            <Radar dataKey="score" stroke="#4aa3ff" fill="#4aa3ff" fillOpacity={0.3} isAnimationActive={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 space-y-3">
        {criteria.map((criterion) => (
          <CriterionCard key={criterion.name} criterion={criterion} />
        ))}
      </div>
    </ReportSection>
  )
}
