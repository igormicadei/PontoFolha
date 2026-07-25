---
description: Write a handoff file at a task boundary (current task done or being parked)
model: sonnet[1m]
---

Write HANDOFF.md so a fresh session can start the next piece of work without any of this conversation's history. The current task is finished or being parked, so focus on outcomes, not process.

Include:

1. **What was accomplished** — what changed, where, and current verified state (tests passing? deployed? merged?)
2. **Loose ends** — anything intentionally left undone, workarounds that need revisiting, TODOs introduced
3. **Next task** — what the following session should work on, with enough framing to start cold; if unknown, list candidate next steps in priority order
4. **Decisions that constrain the future** — choices made during this task that the next one must respect (interfaces, patterns, naming, approaches rejected and why)
5. **Relevant files** — paths that matter going forward, one line each on their role
6. **Gotchas** — non-obvious things discovered: quirks, env details, failed approaches, "don't touch X because Y"

Rules:
- Write for a reader with zero conversation context but full codebase access
- Be specific: file paths, function names, commands — never "the config file"
- Don't paste file contents; reference paths
- Don't relitigate the finished task's internals — the code and git history cover that. Prioritize items 3, 4, and 6
- Keep it under ~100 lines
- If HANDOFF.md already exists, overwrite it