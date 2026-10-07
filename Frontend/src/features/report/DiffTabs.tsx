import { useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import clsx from 'clsx'
import { challenge, REFERENCE_FIX } from '../../mock/challenge'
import { originalContent, useWorkspaceStore } from '../../store/workspaceStore'
import '../shared/monacoSetup'

type TabId = 'candidate' | 'reference'

const TABS: { id: TabId; label: string }[] = [
  { id: 'candidate', label: 'Candidate vs Base' },
  { id: 'reference', label: 'Reference vs Base' },
]

const TARGET = challenge.targetFile

export default function DiffTabs() {
  const [tab, setTab] = useState<TabId>('candidate')
  const candidateCode = useWorkspaceStore((state) => state.files.find((f) => f.path === TARGET)?.content ?? '')

  const modified = tab === 'candidate' ? candidateCode : REFERENCE_FIX

  return (
    <div className="overflow-hidden rounded border border-line">
      <div className="flex items-center gap-1 border-b border-line bg-sidebar px-2" role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={clsx(
              'border-b-2 px-3 py-2 text-[13px]',
              tab === id ? 'border-sky-500 text-white' : 'border-transparent text-fg-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto pr-2 font-mono text-[11.5px] text-fg-muted">{TARGET}</span>
      </div>
      <DiffEditor
        height={340}
        language="javascript"
        theme="vs-dark"
        original={originalContent[TARGET]}
        modified={modified}
        originalModelPath="diff/base/query.js"
        modifiedModelPath={`diff/${tab}/query.js`}
        keepCurrentOriginalModel
        keepCurrentModifiedModel
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          fontSize: 12.5,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          originalEditable: false,
        }}
      />
    </div>
  )
}
