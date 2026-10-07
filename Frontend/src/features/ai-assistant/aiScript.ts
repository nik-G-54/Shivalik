import { challenge, WRONG_AI_FIX } from '../../mock/challenge'
import type { SelectionChip } from '../../store/aiStore'
import type { TestRun, TestState } from '../../store/testStore'
import { originalContent } from '../../store/workspaceStore'
import type { AIMessageSource } from '../../types'

export const TESTS_FILE = 'tests/query.test.js'

export interface AIContext {
  activeFile: string | null
  selection: SelectionChip | null
  lastRun: TestRun | null
  /** Which version of the target file the candidate currently has. */
  fileState: TestState
  /** Current content of the tests file. */
  testsContent: string
}

export interface AIReply {
  content: string
  /** Full new content for `targetFile`, when the reply proposes a change. */
  code?: string
  targetFile?: string
  /** Logged as the AI_RESPONSE summary. */
  summary: string
  source?: AIMessageSource
}

interface ScriptEntry {
  id: string
  matches: (text: string, ctx: AIContext) => boolean
  reply: (ctx: AIContext) => AIReply
}

const NE = /_ne\b|\bne operator|not filtering|why .*ignored|how should/i
const HINT = /clone|copy|spread|immutab|without (mutat|modif)|avoid(ing)? mutat/i
const TEST_FAILURE = /fail|why|mutat|\btests?\b/i
const WHERE = /where|implemented|filter|find/i

const lines = (...parts: string[]) => parts.join('\n')

/** Relaxes the mutation test so it no longer checks the query object (a deliberately bad suggestion). */
function relaxedTests(current: string): string {
  const mutationTest = /test\('does not mutate the query object'[\s\S]*?\n\}\)\n/
  const replacement = lines(
    "test('accepts a query object with operators', () => {",
    "  const query = { author_ne: 'bob', views_gte: '10', title_like: 'a' }",
    '  assert.doesNotThrow(() => filterItems(posts, query))',
    '})',
    '',
  )
  const base = mutationTest.test(current) ? current : originalContent[TESTS_FILE]
  return base.replace(mutationTest, replacement)
}

const SCRIPT: ScriptEntry[] = [
  {
    // Conceptual hint only: rewards candidates who work out the code themselves.
    id: 'hint-no-mutation',
    matches: (text) => HINT.test(text),
    reply: () => ({
      summary: 'AI gave a hint about handling _ne without mutating the query',
      content: lines(
        'The core problem is ownership: deleting a key from `query` changes an object the caller still holds, so anything that reads it afterwards sees different input.',
        '',
        '`_ne` does not need special treatment. It is just another operator like `_gte` and `_lte`, so the input should never be touched. A rough outline:',
        '',
        '```js',
        '// 1. register _ne next to the other operators',
        "// 2. add a matching branch in matches() that negates the comparison",
        '// 3. leave the query object exactly as it was passed in',
        '```',
        '',
        'I will leave the implementation to you. Run the tests once you have it.',
      ),
    }),
  },
  {
    // Deliberately bad: tries to make the tests pass by weakening them.
    id: 'weaken-test',
    matches: (text, ctx) =>
      ctx.lastRun?.state === 'wrong' && ctx.fileState !== 'fixed' && !NE.test(text) && TEST_FAILURE.test(text),
    reply: (ctx) => ({
      summary: `AI suggested a change to ${TESTS_FILE}`,
      targetFile: TESTS_FILE,
      code: relaxedTests(ctx.testsContent),
      content: lines(
        'The failing test is **does not mutate the query object**. It is stricter than the endpoint needs: the router builds a fresh query object for every request, so nobody reads it after filtering.',
        '',
        'The simplest way to get a green run is to relax that test so it only checks that `filterItems` does not throw when operators are present. I have prepared the change below.',
      ),
    }),
  },
  {
    // Plausible but wrong: this is WRONG_AI_FIX.
    id: 'ne-wrong-fix',
    matches: (text, ctx) => NE.test(text) && ctx.fileState === 'buggy',
    reply: () => ({
      summary: `AI suggested a change to ${challenge.targetFile}`,
      targetFile: challenge.targetFile,
      code: WRONG_AI_FIX,
      content: lines(
        'The `_ne` filter is ignored because `parseKey()` only knows `_gte`, `_lte` and `_like`. A key like `author_ne` is treated as a field called `author_ne`, which no post has, so `matches()` skips it and every post passes.',
        '',
        'The cleanest fix is to handle `_ne` in `filterItems()` before the generic matching runs:',
        '',
        '- find every `*_ne` param and filter the items with it',
        '- remove those params from the query so `matches()` never sees them',
        '- run the remaining params through the existing logic',
        '',
        'This keeps `_gte`, `_lte` and `_like` untouched. Here is the change.',
      ),
    }),
  },
  {
    id: 'ne-other-state',
    matches: (text, ctx) => NE.test(text) && ctx.fileState !== 'buggy',
    reply: (ctx) =>
      ctx.fileState === 'fixed'
        ? {
            summary: 'AI confirmed the _ne handling looks right',
            content:
              'Your `query.js` now registers `_ne` and has a matching branch, which is how the other operators work. Run `npm test` to confirm nothing else changed.',
          }
        : {
            summary: 'AI gave a hint about handling _ne without mutating the query',
            content: lines(
              'Your current change handles `_ne` before the generic matching, but it removes the key from the `query` object it was given. The caller still owns that object, so changing it is a side effect.',
              '',
              'Think about how `_gte` and `_lte` are handled: they are recognised as operators and never touch the input. `_ne` can follow the same pattern.',
            ),
          },
  },
  {
    id: 'where-filtering',
    matches: (text) => WHERE.test(text),
    reply: () => ({
      summary: 'AI explained query filtering',
      content: lines(
        'Query filtering lives in `src/utils/query.js`. `src/router.js` calls `applyQuery(data, query)` for collection routes like `GET /posts`.',
        '',
        'Inside `query.js`:',
        '',
        '- `parseKey()` splits a param such as `views_gte` into a field and an operator',
        '- `matches()` applies one param to one item: `_gte` and `_lte` compare numbers, `_like` is a case-insensitive pattern match, and anything else is an exact match',
        '- `filterItems()` keeps the items for which every param matches, then `sortItems()` and `paginate()` run on the result',
        '',
        'Want me to walk through how a specific query string is handled?',
      ),
    }),
  },
]

export const FALLBACK_ID = 'fallback'

const FALLBACK: ScriptEntry = {
  id: FALLBACK_ID,
  matches: () => true,
  reply: (ctx) => ({
    summary: 'AI answered a general question',
    content: lines(
      ctx.activeFile
        ? `I can see you have \`${ctx.activeFile}\` open. I can help with that file, but I want to make sure I answer the right question.`
        : 'I can see the project but you have no file open yet.',
      '',
      'Are you trying to understand how the code works, track down a failing test, or decide how a change should be made? A specific query string or test name helps.',
    ),
  }),
}

export function pickEntry(text: string, ctx: AIContext): ScriptEntry {
  return SCRIPT.find((entry) => entry.matches(text, ctx)) ?? FALLBACK
}
