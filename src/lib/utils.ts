/* ================= util ================= */
/* Funções puras independentes do estado `S`, portadas verbatim do app legado
   (legacy/index.html, 545–566 + 814). Diretamente testáveis via Vitest. */

export const pad = (n: number): string => String(n).padStart(2, '0')

export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
]
export const DSEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function curMonthKey(): string {
  return todayKey().slice(0, 7)
}
export function nowHM(): string {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function hm2min(s: string | null | undefined): number | null {
  if (!s) return null
  const [a, b] = s.split(':').map(Number)
  return a * 60 + b
}
export function min2hm(m: number, signed?: boolean): string {
  const neg = m < 0
  m = Math.abs(Math.round(m))
  const s = `${Math.floor(m / 60)}h${pad(m % 60)}`
  return (signed ? (neg ? '-' : '+') : neg ? '-' : '') + s
}
export function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
export function num(v: any): number {
  return isFinite(v) ? Number(v) : 0
}
export function num2(v: any): number {
  v = Number(v)
  return isFinite(v) ? v : 0
}
export function daysInMonth(mk: string): number {
  const [y, m] = mk.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}
export function dow(dk: string): number {
  const [y, m, d] = dk.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}
export function mAdd(mk: string, delta: number): string {
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
export function dAdd(dk: string, delta: number): string {
  const [y, m, d] = dk.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}
export function yAdd(dk: string, n: number): string {
  const [y, m, d] = dk.split('-').map(Number)
  const dt = new Date(y + n, m - 1, d)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}
export function yAddM(dk: string, n: number): string {
  const [y, m, d] = dk.split('-').map(Number)
  const dt = new Date(y, m - 1 + n, d)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}
export function daysDiff(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}
export function fmtDK(dk: string): string {
  const [y, m, d] = dk.split('-')
  return `${d}/${m}/${y}`
}
export function fmtDKs(dk: string): string {
  const [, m, d] = dk.split('-')
  return `${d}/${m}`
}
/** Idade em anos a partir da data de nascimento (index.html idade() 1586). */
export function idade(n: string): number {
  const t = todayKey()
  let a = Number(t.slice(0, 4)) - Number(n.slice(0, 4))
  if (t.slice(5) < n.slice(5)) a--
  return a
}
export function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
export function parseDM(s: string | null | undefined): { d: number; m: number } | null {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec((s || '').trim())
  return m ? { d: +m[1], m: +m[2] } : null
}
