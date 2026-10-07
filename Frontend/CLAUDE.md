# AI-Powered Software Engineering Assessment Platform

Hackathon demo (5 hours, single developer). Candidates solve a real-world bug inside a browser IDE with an AI assistant, then receive an evidence-based evaluation report.

There is **no backend**. Everything runs on mock data in the frontend.

## Stack

React 19 + TypeScript + Vite 8 + **Tailwind CSS v4** (no `tailwind.config`; tokens live in `@theme` in `src/index.css`, loaded via `@tailwindcss/vite`). Also: react-router-dom 7, zustand 5, `@monaco-editor/react`, `react-resizable-panels` **v4** (`Group` / `Panel` / `Separator` with `orientation`, not the older `PanelGroup` / `PanelResizeHandle` / `direction`), recharts 3, lucide-react, clsx.

TypeScript is strict about erasable syntax and module syntax: no `enum` or namespaces (use string unions), and use `import type` for type-only imports.

## Routes

| Route               | Page                                  |
| ------------------- | ------------------------------------- |
| `/`                 | Dashboard (challenge cards)           |
| `/workspace/:id`    | Browser IDE + AI assistant            |
| `/evaluating/:id`   | Evaluation progress screen            |
| `/report/:id`       | Evidence-based evaluation report      |

## Theme

VS Code-like dark. Use the Tailwind tokens from `src/index.css` instead of hex values.

| Token                  | Value     | Use                       |
| ---------------------- | --------- | ------------------------- |
| `bg-editor`            | `#1e1e1e` | App / editor background   |
| `bg-panel`             | `#252526` | Panels                    |
| `bg-sidebar`           | `#181818` | Sidebar                   |
| `border-line`          | `#3c3c3c` | Borders                   |
| `text-fg`              | `#cccccc` | Text                      |

Semantic colors: **green** (`pass`) = pass / match, **red** (`fail`) = fail, **amber** (`warn`) = different / warning, **violet** (`ai`) = anything AI-related.

Code uses `font-mono` (applied globally to `code`, `pre`, `kbd`, `samp`). Monaco needs its own `fontFamily` option, so pass the same stack there.

## Rules

- **Every user action in the workspace must call `logEvent()`** from `src/store/eventStore.ts`. Opening a file, editing, searching, running a command or tests, AI requests/responses and accepting/rejecting suggestions, and submitting all produce an `ActivityEvent`. The report's evidence links depend on these.
- **One component per file**, under `src/features/<feature>/`. Components shared across features go in `src/features/shared/`.
- **All data comes from `src/mock`.** No fetches, no hard-coded data in components.
- Keep components small and typed. Shared types live in `src/types/index.ts`.

## Layout

```
src/
  types/index.ts          shared types
  store/eventStore.ts     activity log (E01, E02, ...) + logEvent()
  store/workspaceStore.ts files, open tabs, active file, edits
  mock/challenge.ts       main challenge, REFERENCE_FIX, WRONG_AI_FIX, markers, locked cards
  mock/evaluation.ts      DIMENSIONS (names + weights) and getSonarRows(state, testsWeakened)
  mock/candidate.ts       demo candidate + company
  mock/repo/              the json-server-style project the candidate edits (real files, loaded with ?raw)
  mock/fixes/             reference and wrong versions of src/utils/query.js
  mock/issue.md           the GitHub-style issue text
  store/testStore.ts      last test run result ({ lastRun, runs })
  store/terminalStore.ts  terminal lines, command history, running flag
  features/<feature>/     one component per file
  features/workspace/     IDE screen (TopBar, FileExplorer, EditorPane, TerminalPanel, SidePanel, ...)
  store/aiStore.ts        chat messages, status, attached selection chip
  features/ai-assistant/  scripted assistant: aiScript.ts (rules), aiService.ts (respond, streaming, apply/reject/revert + logging), UI components
  features/shared/        MarkdownView, markdown parser, lineDiff, monacoSetup, changes (real diff vs originals), submission info, AppHeader, badges
```

## Workspace notes

- Terminal commands go through `executeCommand()` in `features/workspace/commands.ts`. It logs `COMMAND_EXECUTED`, and the **Run Tests** button calls it too, so both paths behave identically.
- `testRunner.ts` picks the result from the current content of `challenge.targetFile` (`WRONG_MARKER` → wrong, else `FIX_MARKER` → fixed, else buggy). Names, durations and assertion output are copied from real `node --test` runs of the mock repo, so if you change `src/mock/repo` tests or the fixes, re-measure them.
- Monaco is bundled locally (`monacoSetup.ts`, `monaco-editor` 0.57 uses `monaco-editor/editor/...` paths, not `esm/vs/...`) so the demo works offline.
- Selecting code in the editor writes `selectedFile` / `selectedCode` to `workspaceStore`. "Ask AI" copies it into `aiStore.chip` as removable context for the next message.
- `applyEdit()` does not log and does not trigger the editor's `FILE_MODIFIED` debounce, so AI changes are logged only by `features/ai-assistant/aiService.ts` (`AI_SUGGESTION_ACCEPTED`, `AI_CHANGE_REVERTED`).
- `react-resizable-panels` v4: numbers are pixels, strings are percentages (`defaultSize="18%"`). Style separators with `data-[separator=hover]` / `data-[separator=active]`.

## The mock challenge

Bug: in `src/utils/query.js` the `_ne` operator is missing from `OPERATORS`, so `GET /posts?author_ne=typicode` is silently ignored and returns all posts.

- `REFERENCE_FIX` adds `'_ne'` to `OPERATORS` and a `case '_ne':`. Detect it with `FIX_MARKER`.
- `WRONG_AI_FIX` handles `_ne` in a pre-pass that does `delete query[key]` and compares with `!==`. It fixes the string case, but mutates the query and breaks numeric `_ne`. Detect it with `WRONG_MARKER`.
- Check which version is in the editor with `content.includes(FIX_MARKER)` / `content.includes(WRONG_MARKER)`.
- The mock repo runs standalone: `cd src/mock/repo && npm test` (Node 20+). The buggy version fails exactly one test (`supports _ne`).

## Commands

```bash
npm run dev     # Vite dev server
npm run build   # tsc -b && vite build (type-check)
npm run lint
```

## AI assistant (scripted)

`respond(userText, context)` in `aiService.ts` picks the first matching rule in `aiScript.ts`. Order matters:

1. hint (clone / copy / spread / immutable / without mutating): explanation only, no code
2. weaken-test (last run state `wrong`, file not fixed, failure-ish wording, no `_ne` mention): suggests relaxing `tests/query.test.js`. This is deliberately bad; a strong candidate rejects it
3. ne-wrong-fix (`_ne` wording and file still buggy): suggests `WRONG_AI_FIX`
4. ne-other-state (`_ne` wording, file already wrong or fixed): hint or confirmation
5. where-filtering: explains `src/utils/query.js`
6. fallback: clarifying question

State comes from `detectTestState()` (marker check on the target file) and `testStore.lastRun`. Events: `AI_REQUEST` and `AI_RESPONSE` in `sendMessage`; apply, reject and revert are `applySuggestion`, `rejectSuggestion` and `revertSuggestion`. A suggestion's status is `pending` / `accepted` (shown as "Applied") / `rejected` / `reverted`.

## Evaluation and report

- `features/report/evaluator.ts`: `evaluate()` tries `evaluateWithLLM()` (Gemini, `evaluatorLLM.ts`) and falls back to `evaluateWithRules()`, which reads the **live** event, AI, test and workspace stores and always works offline (`source: 'rules'`). The report only reads the `Evaluation` shape.
- Visible correctness is the real last test run. Hidden and regression come from the final state of `query.js`: fixed 6/6 and 3/3, wrong 4/6 and 1/3, buggy 3/6 and 0/3.
- Criteria `evidenceIds` are real event ids found by walking the log (first accepted AI suggestion, the `TEST_FAILED` after it, rejections, reverts, last `TEST_PASSED`). Reasons are templated from which events exist.
- Weights come from `DIMENSIONS`: Correctness 35, Code Quality 25, Engineering Process 20, AI Judgment 10, Reference Alignment 10.
- Accepting the AI's test-weakening suggestion makes the terminal suite pass (see `isTestsWeakened()` in `testRunner.ts`) but the report shows hidden/regression failures and drops AI and Engineering Judgment sharply.
- `resetDemo()` clears every store. The dashboard's Start button and the report's Restart button both call it.
- Evidence chips call `evidenceStore.focusEvidence(id)`: the timeline scrolls to the event and highlights it for 2s.

## Gemini (hybrid mode)

- Config: `VITE_GEMINI_API_KEY` and `VITE_GEMINI_MODEL` in `Frontend/.env` (git-ignored; see `.env.example`). VITE_ vars ship in the browser bundle, so this is demo-only. Restart the dev server after changing `.env`.
- `src/lib/gemini.ts` `generateJson()` returns `null` (with a `console.warn`) on a missing key, network error, timeout (25s), non-200 or bad JSON. `geminiDebug.lastRaw` / `lastError` hold the last raw response or failure.
- Assistant: scripted rules always win. Only the generic fallback rule asks Gemini (`geminiAssistant.ts`), and if it returns null the fallback script text is used. `message.source` is `'script' | 'gemini'`; Ctrl+Shift+D (with the AI tab open) shows a badge.
- Evaluator: deterministic facts (correctness numbers, SonarQube rows, change analysis, weights, Correctness and Code Quality scores) always come from the rules. Gemini supplies the six criteria, reference comparison, AI usage, summary and the Engineering Process / AI Judgment / Reference Alignment scores. `mergeLLMResult()` clamps scores, drops unknown evidence ids (`llmDebug.droppedEvidenceIds`), and takes any criterion with no valid ids from the rules (`llmDebug.criteriaTakenFromRules`). Overall is recomputed from the weights.
- Rules calibration: accepting a flawed AI fix and then recovering lands around 85-88 (Hire); the bad path (accepting the weakened test) lands around 50-55. Verdict thresholds: 90 Strong Hire, 75 Hire, 60 Lean Hire.
- Dev-tip: after editing a store file Vite serves it under `?t=` and a dynamic `import('/src/store/x.ts')` in the console becomes a separate instance. Restart the dev server before console-driven tests.
