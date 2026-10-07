import { getSonarRows } from '../../mock/evaluation'
import { useEventStore } from '../../store/eventStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { correctnessFor } from '../report/evaluator'
import { computeChanges } from '../shared/changes'
import { detectTestState, isTestsWeakened } from '../workspace/testRunner'

export interface EvaluationStepDef {
  label: string
  /** One-line result, computed from live data when the step completes. */
  detail: () => string
}

/** The five steps that run before the AI evaluation; each result comes from the real session. */
export function buildPreSteps(eventCount: number): EvaluationStepDef[] {
  return [
    {
      label: 'Repository snapshot created',
      detail: () => `${useWorkspaceStore.getState().files.length} files captured`,
    },
    {
      label: 'Running visible + hidden tests',
      detail: () => {
        const { visible, hidden } = correctnessFor(detectTestState())
        return `${visible.passed}/${visible.total} visible and ${hidden.passed}/${hidden.total} hidden tests passed`
      },
    },
    {
      label: 'SonarQube static analysis',
      detail: () => {
        const rows = getSonarRows(detectTestState(), isTestsWeakened())
        const value = (metric: string) => rows.find((r) => r.metric === metric)?.candidate
        return `${value('Bugs')} bugs · ${value('Code Smells')} code smells · ${value('Coverage')}% coverage`
      },
    },
    {
      label: 'Generating git diff',
      detail: () => {
        const { files, added, removed } = computeChanges()
        return `${files.length} ${files.length === 1 ? 'file' : 'files'} changed, +${added} −${removed}`
      },
    },
    {
      label: `Building evidence from ${eventCount} events`,
      detail: () => `${useEventStore.getState().events.length} evidence items`,
    },
  ]
}

export const AI_STEP_LABEL = 'AI evaluation'
export const REPORT_STEP_LABEL = 'Generating report'
