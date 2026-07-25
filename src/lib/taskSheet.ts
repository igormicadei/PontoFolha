/* ================= diálogo de tarefa ================= */
/* Espelha taskSheet(cur, dk, isRec) do legado (index.html #taskModal 487-498 +
   taskSheet() 731-741): um sheet com Descrição + Data, resolvendo {t,date}
   somente quando AMBOS são verdadeiros — caso contrário null. Segue o mesmo
   padrão de singleton reativo do dialog.ts; o <TaskSheetHost> renderiza. */

import { reactive } from 'vue'
import { todayKey } from './utils'

export interface TaskSheetResult {
  t: string
  date: string
}

interface TaskSheetState {
  open: boolean
  txt: string
  date: string
  isRec: boolean
  resolve: ((v: TaskSheetResult | null) => void) | null
}

export const taskSheet = reactive<TaskSheetState>({
  open: false,
  txt: '',
  date: '',
  isRec: false,
  resolve: null
})

/** openTaskSheet(cur, dk, isRec) → Promise<{t,date}|null> (index.html 731-741).
 *  cur = descrição atual; dk = data atual (default hoje); isRec mostra a dica. */
export function openTaskSheet(
  cur: string,
  dk: string,
  isRec: boolean
): Promise<TaskSheetResult | null> {
  return new Promise((res) => {
    taskSheet.txt = cur || ''
    taskSheet.date = dk || todayKey()
    taskSheet.isRec = isRec
    taskSheet.resolve = res
    taskSheet.open = true
  })
}

/** Resolve com {t,date} apenas se ambos preenchidos, senão null (tkSave 739). */
export function resolveTaskSheet(ok: boolean): void {
  const res = taskSheet.resolve
  const t = taskSheet.txt.trim()
  const date = taskSheet.date
  taskSheet.open = false
  taskSheet.resolve = null
  if (!res) return
  if (ok && t && date) res({ t, date })
  else res(null)
}
