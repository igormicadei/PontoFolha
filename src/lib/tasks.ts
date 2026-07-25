/* ================= orquestração de tarefas ================= */
/* Porta editT/delT/homeTaskAdd do legado (index.html 654-729 + 1004-1012).
   A store guarda só mutações puras; aqui fica a orquestração de UI — diálogos
   (ask/confirmS/openTaskSheet) e toasts. Os save()/rerender() imperativos do
   legado foram removidos: a reatividade do Vue + o watch da store persistem. */

import { useFolha } from '@/stores/folha'
import { ask, confirmS } from './dialog'
import { toast } from './toast'
import { openTaskSheet } from './taskSheet'
import { dAdd } from './utils'

/** Edita uma tarefa pontual ('p', ref=índice) ou recorrente ('r', ref=id da
 *  série). Espelha editT() (index.html 654-704). */
export async function editT(dk: string, kind: string, ref: string | number): Promise<void> {
  const folha = useFolha()
  const S = folha.S
  const cur =
    kind === 'p'
      ? folha.pontualTasks(dk)[ref as number]
      : folha.recOccur(dk).find((x) => x.id === ref)
  if (!cur) return
  const r = await openTaskSheet(cur.t, dk, kind === 'r')
  if (r == null) return
  const txtCh = r.t !== cur.t
  const dateCh = r.date !== dk
  if (!txtCh && !dateCh) return

  if (kind === 'p') {
    const mOld = folha.getMonth(dk.slice(0, 7))
    if (dateCh) {
      const mNew = folha.getMonth(r.date.slice(0, 7))
      if (mNew.closed) {
        toast('O mês de destino está fechado.')
        return
      }
      mOld.days[dk]!.tasks!.splice(ref as number, 1)
      if (!mNew.days[r.date]) mNew.days[r.date] = { p: [] }
      mNew.days[r.date]!.tasks = mNew.days[r.date]!.tasks || []
      mNew.days[r.date]!.tasks!.push({ t: r.t, ok: cur.ok })
      const dOld = mOld.days[dk]!
      if (!dOld.tasks!.length && !(dOld.p || []).length && !dOld.type && !dOld.note)
        delete mOld.days[dk]
    } else {
      mOld.days[dk]!.tasks![ref as number]!.t = r.t
    }
  } else {
    const sc = await ask('Tarefa recorrente', 'Aplicar a alteração a:', [
      { lb: 'Somente esta ocorrência', val: 'one' },
      { lb: 'Esta e as futuras', cls: 'sec', val: 'fwd' }
    ])
    if (!sc) return
    const s = S.rec.find((x) => x.id === ref)
    if (!s) return
    if (sc === 'one') {
      if (dateCh) {
        s.skips = s.skips || []
        s.skips.push(dk)
        const mNew = folha.getMonth(r.date.slice(0, 7))
        if (!mNew.days[r.date]) mNew.days[r.date] = { p: [] }
        mNew.days[r.date]!.tasks = mNew.days[r.date]!.tasks || []
        mNew.days[r.date]!.tasks!.push({ t: r.t, ok: cur.ok })
      } else {
        s.over = s.over || {}
        s.over[dk] = { t: r.t }
      }
    } else {
      folha.splitSeries(s, dk, { t: r.t }, dateCh ? r.date : dk)
    }
  }
  toast('Tarefa atualizada')
}

/** Exclui uma tarefa pontual ('p') ou recorrente ('r'). Espelha delT()
 *  (index.html 706-729). */
export async function delT(dk: string, kind: string, ref: string | number): Promise<void> {
  const folha = useFolha()
  const S = folha.S
  if (kind === 'p') {
    if (!(await confirmS('Excluir tarefa?', ''))) return
    folha.getMonth(dk.slice(0, 7)).days[dk]!.tasks!.splice(ref as number, 1)
  } else {
    const sc = await ask('Tarefa recorrente', 'Excluir:', [
      { lb: 'Somente esta ocorrência', val: 'one' },
      { lb: 'Esta e as futuras', cls: 'warn', val: 'fwd' }
    ])
    if (!sc) return
    const s = S.rec.find((x) => x.id === ref)
    if (!s) return
    if (sc === 'one') {
      s.skips = s.skips || []
      s.skips.push(dk)
    } else {
      const end = dAdd(dk, -1)
      if (end < s.anchor) S.rec = S.rec.filter((x) => x.id !== s.id)
      else s.end = end
    }
  }
  toast('Excluída')
}
