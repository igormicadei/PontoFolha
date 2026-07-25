---
description: Write a handoff file mid-task so a fresh session can continue exactly where this one stopped
model: sonnet[1m]
---

Write HANDOFF.md so a fresh session can continue the CURRENT task exactly where we are, without any of this conversation's history. Work is in progress — precision about the current position matters more than summary.

Include:

1. **Goal** — what we're building/fixing and the definition of done (1-2 sentences)
2. **Exact current position** — what's done and verified, what's half-done (and in what state: compiles? broken? untested?), what's untouched. Mention uncommitted changes explicitly
3. **Immediate next step** — the very next action, specific enough to execute without thinking: file, function, command
4. **Plan remainder** — remaining steps after that, in order
5. **Decisions and rejected approaches** — what we chose, why, and especially what we tried or considered and ruled out, with reasons — so the next session doesn't retry them
6. **Relevant files** — paths in play right now, one line each; flag which ones have pending/uncommitted edits
7. **Gotchas** — quirks, constraints, weird behaviors, env details discovered along the way

Rules:
- Write for a reader with zero conversation context but full codebase access
- Be specific: file paths, function names, commands — never "the config file"
- Don't paste file contents; reference paths
- Items 3, 5, and 7 are the priority — state is recoverable from git diff, but rejected approaches and gotchas only exist in this conversation
- Keep it under ~150 lines
- If HANDOFF.md already exists, overwrite it