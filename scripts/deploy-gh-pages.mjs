#!/usr/bin/env node
// Local GitHub Pages deploy — builds the Vue app and force-pushes the compiled
// dist/ to an orphan `gh-pages` branch. Used because GitHub Actions is billing-
// locked; git push itself is never billing-locked, so this always works.
//
// Usage:  npm run deploy
//
// It creates a throwaway git repo INSIDE dist/ and force-pushes it, so:
//   - gh-pages is always a clean single-commit orphan (artifacts only)
//   - your main working tree / index is never touched
//   - auth reuses your existing git credentials for github.com (not `gh`)

import { execSync } from 'node:child_process'
import { existsSync, copyFileSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const BRANCH = 'gh-pages'

const run = (cmd, cwd = root) => execSync(cmd, { stdio: 'inherit', cwd })
const capture = (cmd, cwd = root) => execSync(cmd, { encoding: 'utf8', cwd }).trim()

// 1. Build
console.log('\n▶ Building production bundle…')
run('npm run build')

if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('✖ dist/index.html not found after build. Aborting.')
  process.exit(1)
}

// 2. SPA fallback (vue-router uses history mode → deep links must serve index.html)
copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
// 3. Disable Jekyll so Vite's assets/ and any _-prefixed files are served as-is
writeFileSync(resolve(dist, '.nojekyll'), '')

// 4. Resolve the push target from the repo's origin remote
let remote
try {
  remote = capture('git config --get remote.origin.url')
} catch {
  console.error('✖ Could not read remote.origin.url. Run inside the git repo.')
  process.exit(1)
}
console.log(`\n▶ Publishing dist/ → ${BRANCH} on ${remote}`)

// 5. Fresh throwaway repo inside dist/ → guaranteed single-commit orphan branch
rmSync(resolve(dist, '.git'), { recursive: true, force: true })
run('git init -q', dist)
run(`git checkout -q -b ${BRANCH}`, dist)
run('git add -A', dist)
run(
  `git -c user.name=deploy -c user.email=deploy@local ` +
    `commit -q -m "Deploy ${new Date().toISOString()}"`,
  dist,
)
run(`git push -q --force ${remote} ${BRANCH}`, dist)

// 6. Tidy up so the throwaway repo never lingers
rmSync(resolve(dist, '.git'), { recursive: true, force: true })

console.log(`\n✔ Deployed to '${BRANCH}'.`)
console.log('  If this is the first deploy, set GitHub → Settings → Pages →')
console.log(`  Source = "Deploy from a branch" → Branch = ${BRANCH} / (root).`)
console.log('  Live at: https://igormicadei.github.io/PontoFolha/\n')
