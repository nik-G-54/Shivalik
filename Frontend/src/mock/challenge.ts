import type { Challenge, ChallengeSummary, FileNode } from '../types'

// The mock repo lives as real files under ./repo so it stays runnable with `node --test`.
import packageJson from './repo/package.json?raw'
import readme from './repo/README.md?raw'
import dbJson from './repo/db.json?raw'
import serverJs from './repo/src/server.js?raw'
import routerJs from './repo/src/router.js?raw'
import queryJs from './repo/src/utils/query.js?raw'
import queryTestJs from './repo/tests/query.test.js?raw'
import issueMarkdown from './issue.md?raw'
import referenceFix from './fixes/query.reference.js?raw'
import wrongFix from './fixes/query.wrong.js?raw'

const TARGET_FILE = 'src/utils/query.js'

const files: FileNode[] = [
  { path: 'package.json', content: packageJson, language: 'json' },
  { path: 'README.md', content: readme, language: 'markdown' },
  { path: 'db.json', content: dbJson, language: 'json' },
  { path: 'src/server.js', content: serverJs, language: 'javascript' },
  { path: 'src/router.js', content: routerJs, language: 'javascript' },
  { path: TARGET_FILE, content: queryJs, language: 'javascript' },
  { path: 'tests/query.test.js', content: queryTestJs, language: 'javascript' },
]

export const challenge: Challenge = {
  id: 'json-server-ne-operator',
  title: 'Fix the _ne query operator',
  repo: 'typicode/json-server',
  difficulty: 'Medium',
  timeLimitMin: 45,
  category: 'Bug fix',
  status: 'Not started',
  issueTitle: '_ne filter is ignored: ?author_ne=typicode returns all posts',
  tags: ['Bug fix', 'Node.js', 'Tests'],
  issueMarkdown,
  files,
  targetFile: TARGET_FILE,
}

/** Correct, minimal fix for src/utils/query.js. */
export const REFERENCE_FIX = referenceFix

/** Plausible but wrong: fixes the string case yet mutates the query and breaks numeric _ne. */
export const WRONG_AI_FIX = wrongFix

/** Unique substring present only in REFERENCE_FIX. */
export const FIX_MARKER = "case '_ne':"

/** Unique substring present only in WRONG_AI_FIX. */
export const WRONG_MARKER = 'delete query[key]'

const lockedChallenges: ChallengeSummary[] = [
  {
    id: 'lru-cache-eviction',
    title: 'Fix LRU cache eviction order',
    repo: 'isaacs/node-lru-cache',
    difficulty: 'Hard',
    timeLimitMin: 60,
    category: 'Bug fix',
    status: 'Locked',
    issueTitle: 'Recently read entries are evicted before stale ones',
    tags: ['Bug fix', 'Node.js', 'Data structures'],
  },
  {
    id: 'express-cookie-expiry',
    title: 'Cookie maxAge ignored on session refresh',
    repo: 'expressjs/session',
    difficulty: 'Easy',
    timeLimitMin: 30,
    category: 'Bug fix',
    status: 'Locked',
    issueTitle: 'Session cookie expiry is not extended on rolling sessions',
    tags: ['Bug fix', 'Node.js', 'HTTP'],
  },
]

/** Cards shown on the dashboard. */
export const challenges: ChallengeSummary[] = [challenge, ...lockedChallenges]

export const getChallenge = (id: string): Challenge | undefined =>
  id === challenge.id ? challenge : undefined
