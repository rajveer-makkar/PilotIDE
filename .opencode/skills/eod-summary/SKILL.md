---
name: eod-summary
description: Generate a structured end-of-day summary from the current session's work. Reads git diff, recent commits, and file changes to produce a markdown EOD report.
license: MIT
compatibility: opencode
metadata:
  workflow: reporting
  audience: developer
---

## What I do

Generate a concise, structured end-of-day (EOD) summary in markdown from the current session. The summary captures what was done, what's still open, and what's next.

## When to use

Use this at the end of a coding session before wrapping up, committing, or sharing progress with a team.

## Output format

```markdown
# EOD — YYYY-MM-DD

## What was done

### 1. [Short title for each logical change]
**Files changed:** `path/to/file.tsx`, `path/to/file.ts`

[1-3 sentence description of what changed and why]

### 2. [Next change title]
...

## Open issues
- [Any known bugs, regressions, or follow-up work]

## Files touched today
\`\`\`
path/to/file.tsx   — what changed
path/to/file.ts    — what changed
\`\`\`

## Next session
- [What to pick up next]
```

## How to generate

1. Run `git diff --stat` and `git diff` to see what changed in the working tree.
2. Run `git log --oneline -5` to check recent commits.
3. For each logical change (grouped by file/feature):
   - State what was changed and **why** (the problem it solved).
   - List the files involved.
   - Note any trade-offs or shortcuts taken (use `ponytail:` comments as signal).
4. Review the session conversation history for open issues, bugs, or unfinished work.
5. Write the summary to `EOD.md` in the project root.
