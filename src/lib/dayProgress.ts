/* ================= progresso do dia ================= */
/* Função pura que alimenta o cartão de ponto da tela Início: situação do dia,
   horas trabalhadas ao vivo, saída prevista, barra do dia e as batidas nomeadas.
   Usa as mesmas regras do motor (pares entrada/saída; almoço automático só com
   exatamente 2 batidas e intervalo fechado), sem tocar no motor. */

import { hm2min, num } from './utils'
import type { Cfg } from '@/stores/types'

export type DayStatus = 'idle' | 'working' | 'break' | 'complete'

export interface DaySegment {
  kind: 'work' | 'off' | 'live' | 'todo'
  min: number
}
export interface DaySlot {
  label: string
  time: string | null
  next: boolean
}
export interface DayProgress {
  n: number
  total: number
  status: DayStatus
  worked: number
  expected: number
  delta: number
  exitMin: number | null
  segments: DaySegment[]
  slots: DaySlot[]
}

const NOMES4 = ['Entrada', 'Almoço', 'Volta', 'Saída']
const NOMES2 = ['Entrada', 'Saída']

export function dayProgress(punches: string[], cfg: Cfg, nowMin: number, expected: number): DayProgress {
  const raw = punches.filter(Boolean)
  const ps = raw
    .map(hm2min)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  const n = ps.length
  const total = Number(cfg.batidas) || 0

  let worked = 0
  for (let i = 0; i + 1 < n; i += 2) worked += ps[i + 1]! - ps[i]!
  const open = n % 2 === 1
  if (open) worked += Math.max(0, nowMin - ps[n - 1]!)
  if (!open && n === 2 && Number(cfg.autoAlmoco) === 1 && worked > num(cfg.almocoMin)) worked -= num(cfg.almocoMin)
  worked = Math.max(0, worked)

  let status: DayStatus = 'idle'
  if (n > 0) status = open ? 'working' : total > 0 && n >= total ? 'complete' : 'break'

  // saída prevista: só quando dá para prever (sem depender de um almoço futuro)
  let exitMin: number | null = null
  if (status === 'working' && expected > 0) {
    if (total === 2 && n === 1) {
      exitMin = ps[0]! + expected + (Number(cfg.autoAlmoco) === 1 ? num(cfg.almocoMin) : 0)
    } else if (n >= 3) {
      const rest = expected - worked
      exitMin = rest > 0 ? nowMin + rest : null
    }
    if (exitMin !== null && exitMin <= nowMin) exitMin = null
  }

  // barra do dia
  const segments: DaySegment[] = []
  for (let i = 0; i + 1 < n; i += 2) {
    segments.push({ kind: 'work', min: ps[i + 1]! - ps[i]! })
    if (i + 2 < n) segments.push({ kind: 'off', min: ps[i + 2]! - ps[i + 1]! })
  }
  if (open) {
    segments.push({ kind: 'live', min: Math.max(1, nowMin - ps[n - 1]!) })
  }
  const faltam = expected - worked
  if (status !== 'complete' && expected > 0 && faltam > 0) segments.push({ kind: 'todo', min: faltam })

  // batidas nomeadas
  const nomes = total === 4 ? NOMES4 : total === 2 ? NOMES2 : null
  const count = total > 0 ? Math.max(total, n) : n + 1
  const slots: DaySlot[] = []
  for (let i = 0; i < count; i++) {
    slots.push({
      label: nomes && i < nomes.length ? nomes[i]! : `Batida ${i + 1}`,
      time: i < raw.length ? [...raw].sort()[i]! : null,
      next: i === raw.length
    })
  }

  return { n, total, status, worked, expected, delta: worked - expected, exitMin, segments, slots }
}
