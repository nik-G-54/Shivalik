import { logEvent } from '../../store/eventStore'
import { useTerminalStore } from '../../store/terminalStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { listDirectory } from './fileTree'
import { runTests } from './testRunner'

export const PROMPT = 'candidate@assessment:~/json-server$'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const HELP = [
  'Available commands:',
  '  help           show this message',
  '  ls [dir]       list files',
  '  cat <file>     print a file (your current, unsaved edits included)',
  '  clear          clear the terminal',
  '  npm start      start the server',
  '  npm test       run the test suite (alias: node --test)',
]

const TEST_COMMANDS = ['npm test', 'npm run test', 'npm t', 'node --test']

function ls(arg: string | undefined) {
  const { append } = useTerminalStore.getState()
  const { files } = useWorkspaceStore.getState()
  const entries = listDirectory(files, arg ?? '')

  if (!entries) {
    append('err', `ls: cannot access '${arg}': No such file or directory`)
    return
  }
  append('out', entries.map((node) => (node.type === 'dir' ? `${node.name}/` : node.name)).join('  '))
}

function cat(arg: string | undefined) {
  const { append } = useTerminalStore.getState()
  const { files } = useWorkspaceStore.getState()

  if (!arg) {
    append('err', 'cat: missing file operand')
    return
  }
  const file = files.find((f) => f.path === arg.replace(/^\.\//, ''))
  if (!file) {
    append('err', `cat: ${arg}: No such file or directory`)
    return
  }
  file.content.replace(/\n$/, '').split('\n').forEach((line) => append('out', line))
}

async function npmStart() {
  const { append } = useTerminalStore.getState()
  append('dim', '> mini-json-server@0.4.2 start')
  append('dim', '> node src/server.js')
  append('out', '')
  await sleep(450)
  append('out', 'mini-json-server running on http://localhost:3000')
  await sleep(150)
  append('dim', 'GET /posts, /comments, /profile')
  append('dim', '(demo only: no real server is started)')
}

/** Runs one terminal command, printing to the terminal and logging COMMAND_EXECUTED. */
export async function executeCommand(raw: string): Promise<void> {
  const command = raw.trim()
  const terminal = useTerminalStore.getState()
  if (!command || terminal.running) return

  terminal.pushHistory(command)
  logEvent('COMMAND_EXECUTED', `Ran "${command}"`, { command })

  const [name, ...args] = command.split(/\s+/)

  if (name === 'clear') {
    terminal.clear()
    return
  }

  terminal.append('cmd', `${PROMPT} ${command}`)

  terminal.setRunning(true)
  try {
    if (name === 'help') {
      HELP.forEach((line) => terminal.append('out', line))
    } else if (name === 'ls') {
      ls(args[0])
    } else if (name === 'cat') {
      cat(args[0])
    } else if (command === 'npm start') {
      await npmStart()
    } else if (TEST_COMMANDS.includes(command)) {
      await runTests()
    } else {
      terminal.append('err', `bash: ${name}: command not found`)
    }
  } finally {
    terminal.setRunning(false)
  }
}
