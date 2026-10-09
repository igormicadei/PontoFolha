/* ================= linhas do mês ================= */
/* Transforma os dias calculados do mês na lista que a tela mostra: dias em
   branco ficam de fora (fim de semana sem registro etc.), dias seguidos do mesmo
   tipo sem batidas viram uma linha só (férias de 13 a 23 vira "13–23") e dias
   lançados com data futura são marcados. Só apresentação: nada aqui altera
   valores ou o motor. */

import { dAdd } from './utils'

/** Subconjunto de computeDay que este helper precisa. */
export interface DayLike {
  eff: string
  hasData: boolean
  pending: boolean
  hol?: string | null
  rec: { p?: string[]; note?: string }
  tasks: unknown[]
}

export interface DayItem<T extends DayLike = DayLike> {
  kind: 'day'
  dk: string
  cd: T
  fut: boolean
}
export interface RunItem {
  kind: 'run'
  from: string
  to: string
  days: number
  eff: string
  hol: string
}
export type MonthEntry<T extends DayLike = DayLike> = DayItem<T> | RunItem

const RUNNABLE = new Set(['ferias', 'feriado', 'abonado', 'falta'])

function plain(cd: DayLike): boolean {
  return RUNNABLE.has(cd.eff) && !(cd.rec.p && cd.rec.p.length) && !cd.rec.note && !cd.tasks.length && !cd.pending
}

export function monthEntries<T extends DayLike>(
  days: { dk: string; cd: T }[],
  today: string
): MonthEntry<T>[] {
  const out: MonthEntry<T>[] = []
  let i = 0
  while (i < days.length) {
    const { dk, cd } = days[i]!
    const blank = cd.eff === 'normal' && !cd.hasData && !cd.pending && !cd.tasks.length && !cd.rec.note
    if (blank) {
      i++
      continue
    }
    if (plain(cd)) {
      let j = i
      while (
        j + 1 < days.length &&
        days[j + 1]!.dk === dAdd(days[j]!.dk, 1) &&
        plain(days[j + 1]!.cd) &&
        days[j + 1]!.cd.eff === cd.eff &&
        (cd.eff !== 'feriado' || (days[j + 1]!.cd.hol || '') === (cd.hol || ''))
      )
        j++
      if (j > i) {
        out.push({ kind: 'run', from: dk, to: days[j]!.dk, days: j - i + 1, eff: cd.eff, hol: cd.hol || '' })
        i = j + 1
        continue
      }
    }
    out.push({ kind: 'day', dk, cd, fut: dk > today && cd.hasData })
    i++
  }
  return out
}

/** Classe da célula do calendário. */
export function calClass(cd: DayLike, dk: string, today: string): string {
  if (dk === today) return 't'
  if (cd.eff === 'ferias') return 'v'
  if (cd.eff === 'feriado') return 'f'
  if (cd.eff === 'falta') return 'b'
  if (cd.rec.p && cd.rec.p.length) return 'w'
  if (cd.pending) return 'p'
  return ''
}
