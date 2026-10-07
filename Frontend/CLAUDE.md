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
  mock/evaluation.ts      report data (scores, Sonar table, comparison, criteria)
  mock/repo/              the json-server-style project the candidate edits (real files, loaded with ?raw)
  mock/fixes/             reference and wrong versions of src/utils/query.js
  mock/issue.md           the GitHub-style issue text
  store/testStore.ts      last test run result ({ lastRun, runs })
  store/terminalStore.ts  terminal lines, command history, running flag
  features/<feature>/     one component per file
  features/workspace/     IDE screen (TopBar, FileExplorer, EditorPane, TerminalPanel, SidePanel, ...)
  features/ai-assistant/  AIAssistantPanel (placeholder, built next)
```

## Workspace notes

- Terminal commands go through `executeCommand()` in `features/workspace/commands.ts`. It logs `COMMAND_EXECUTED`, and the **Run Tests** button calls it too, so both paths behave identically.
- `testRunner.ts` picks the result from the current content of `challenge.targetFile` (`WRONG_MARKER` → wrong, else `FIX_MARKER` → fixed, else buggy). Names, durations and assertion output are copied from real `node --test` runs of the mock repo, so if you change `src/mock/repo` tests or the fixes, re-measure them.
- Monaco is bundled locally (`monacoSetup.ts`, `monaco-editor` 0.57 uses `monaco-editor/editor/...` paths, not `esm/vs/...`) so the demo works offline.
- Selecting code in the editor writes `selectedFile` / `selectedCode` to `workspaceStore`; the AI panel should read them. `applyEdit()` (accepted AI suggestion) does not log; the caller must log `AI_SUGGESTION_ACCEPTED` and `FILE_MODIFIED`.
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
