---
description: Resume work from HANDOFF.md in a fresh session
model: claude-opus-4-8
---

Read HANDOFF.md and resume work.

1. Read HANDOFF.md fully
2. Run `git status` and `git log --oneline -5` to cross-check the described state against reality; read the files listed as relevant/in-play (only those, not the whole codebase)
3. If the handoff and the actual repo state disagree, say so before doing anything — don't silently trust either side
4. State back in 3-4 lines: the goal, where things stand, and what you're about to do next. If the handoff says the task was completed, propose starting the next task it describes
5. Respect the documented decisions and rejected approaches — don't re-propose something the handoff says was ruled out unless you have a concrete new reason, and if so, say it explicitly
6. Then proceed with the next step