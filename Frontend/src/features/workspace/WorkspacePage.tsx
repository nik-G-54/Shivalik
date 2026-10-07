import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Group, Panel } from 'react-resizable-panels'
import { getChallenge } from '../../mock/challenge'
import { logEvent } from '../../store/eventStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import EditorPane from './EditorPane'
import FileExplorer from './FileExplorer'
import ResizeHandle from './ResizeHandle'
import SidePanel from './SidePanel'
import SubmitModal from './SubmitModal'
import TerminalPanel from './TerminalPanel'
import TopBar from './TopBar'

const FIRST_FILE = 'README.md'

export default function WorkspacePage() {
  const { id = '' } = useParams()
  const challenge = getChallenge(id)
  const [submitOpen, setSubmitOpen] = useState(false)

  // Start the clock and open the README on first entry, so the editor is never empty.
  useEffect(() => {
    const store = useWorkspaceStore.getState()
    store.startSession()
    if (store.openTabs.length === 0) {
      store.openFile(FIRST_FILE)
      logEvent('FILE_OPENED', `Opened ${FIRST_FILE}`, { path: FIRST_FILE, via: 'auto' })
    }
  }, [])

  if (!challenge) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p>Challenge "{id}" was not found.</p>
        <Link to="/" className="text-sky-400 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-editor text-fg">
      <TopBar challenge={challenge} onSubmit={() => setSubmitOpen(true)} />

      <div className="min-h-0 flex-1">
        <Group orientation="horizontal">
          <Panel defaultSize="18%" minSize="12%" maxSize="35%">
            <FileExplorer />
          </Panel>
          <ResizeHandle direction="vertical" />

          <Panel defaultSize="52%" minSize="25%">
            <Group orientation="vertical">
              <Panel defaultSize="65%" minSize="20%">
                <EditorPane />
              </Panel>
              <ResizeHandle direction="horizontal" />
              <Panel defaultSize="35%" minSize="10%">
                <TerminalPanel />
              </Panel>
            </Group>
          </Panel>
          <ResizeHandle direction="vertical" />

          <Panel defaultSize="30%" minSize="18%">
            <SidePanel />
          </Panel>
        </Group>
      </div>

      {submitOpen && <SubmitModal challengeId={challenge.id} onClose={() => setSubmitOpen(false)} />}
    </div>
  )
}
