/* ================= conferência (sheets + orquestração) ================= */
/* Porta os três `ask()` com input embutido do legado que editam valores de
   conferência — openConf (holerite mensal, index.html 1311-1328), openFerConf
   (recibo de férias, 1329-1344) e openConfX (verba do holerite não prevista,
   1345-1362) — além de gerarConferencia/gerarConferenciaFerias (1281-1310).
   O `ask()` do Vue (dialog.ts) só renderiza título/corpo/botões, então cada
   forma de input ganha um sheet dedicado, no mesmo padrão de singleton
   reativo do ferias.ts: numConfSheet (valor numérico único, reaproveitado por
   openConf/openFerConf, que só diferem no que conferem) e xConfSheet (desc +
   valor + tipo + excluir). A orquestração (guards de mês fechado, toasts,
   mutação de m.conf/f.conf/m.confX) fica aqui, igual ao padrão de ferias.ts —
   a store não ganha mutadores novos. */

import { reactive } from 'vue'
import { useFolha } from '@/stores/folha'
import { confirmS } from './dialog'
import { toast } from './toast'
import { CONF_FIELDS, FER_FIELDS } from './engine'

/* ---- valor numérico único (openConf / openFerConf) ---- */

export interface NumConfResult {
  action: 'save' | 'clear'
  value: number | null
}

interface NumConfSheetState {
  open: boolean
  title: string
  appValue: number
  value: string
  resolve: ((v: NumConfResult | null) => void) | null
}

export const numConfSheet = reactive<NumConfSheetState>({
  open: false,
  title: '',
  appValue: 0,
  value: '',
  resolve: null
})

function openNumConfSheet(title: string, appValue: number, current: string): Promise<NumConfResult | null> {
  return new Promise((res) => {
    numConfSheet.title = title
    numConfSheet.appValue = appValue
    numConfSheet.value = current
    numConfSheet.resolve = res
    numConfSheet.open = true
  })
}

/** Salvar/Limpar valor/Cancelar (index.html botões de openConf/openFerConf). */
export function resolveNumConfSheet(action: 'save' | 'clear' | null): void {
  const res = numConfSheet.resolve
  const raw = numConfSheet.value
  numConfSheet.open = false
  numConfSheet.resolve = null
  if (!res) return
  if (action === null) {
    res(null)
    return
  }
  if (action === 'clear') {
    res({ action: 'clear', value: null })
    return
  }
  const n = parseFloat(raw)
  res({ action: 'save', value: isFinite(n) ? n : null })
}

/** Conferência de uma verba do holerite mensal (index.html openConf 1311-1328). */
export async function openConf(mk: string, k: string): Promise<void> {
  const folha = useFolha()
  const m = folha.getMonth(mk)
  if (m.closed) {
    toast('Mês fechado — reabra para conferir.')
    return
  }
  const f = CONF_FIELDS.find((x) => x.k === k)
  if (!f) return
  const c = folha.computeMonth(mk)
  const cur = m.conf[k] != null ? m.conf[k] : ''
  const v = await openNumConfSheet(`Holerite — ${f.lb}`, f.app(c), cur)
  if (v == null) return
  if (v.action === 'clear' || v.value == null) delete m.conf[k]
  else m.conf[k] = String(v.value)
}

/** Conferência de uma verba do recibo de férias (index.html openFerConf 1329-1344). */
export async function openFerConf(fi: number, k: string, mk: string): Promise<void> {
  const folha = useFolha()
  if (folha.getMonth(mk).closed) {
    toast('Mês fechado — reabra para conferir.')
    return
  }
  const f = folha.S.ferias[fi]
  if (!f) return
  const fc = folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7)))
  const fd = FER_FIELDS.find((x) => x.k === k)
  if (!fd) return
  const cur = f.conf && f.conf[k] != null ? f.conf[k] : ''
  const v = await openNumConfSheet(`Recibo de férias — ${fd.lb}`, fd.app(fc), cur)
  if (v == null) return
  f.conf = f.conf || {}
  if (v.action === 'clear' || v.value == null) delete f.conf[k]
  else f.conf[k] = String(v.value)
}

/** Gera/regenera a conferência do holerite mensal a partir dos valores do app
 *  (index.html gerarConferencia 1281-1294). */
export async function gerarConferencia(mk: string, force?: boolean): Promise<void> {
  const folha = useFolha()
  const m = folha.getMonth(mk)
  if (m.closed) {
    toast('Mês fechado — reabra para conferir.')
    return
  }
  if (force) {
    if (
      !(await confirmS(
        'Regenerar conferência',
        'Isso vai sobrescrever os valores do holerite já informados com os valores atuais do app. Continuar?'
      ))
    )
      return
  }
  const c = folha.computeMonth(mk)
  CONF_FIELDS.forEach((f) => {
    if (force || m.conf[f.k] == null || m.conf[f.k] === '') m.conf[f.k] = String(f.app(c))
  })
  toast(force ? 'Conferência regenerada' : 'Conferência gerada — toque numa verba pra corrigir divergências')
}

/** Gera/regenera a conferência do recibo de férias (index.html
 *  gerarConferenciaFerias 1295-1310). */
export async function gerarConferenciaFerias(fi: number, force?: boolean): Promise<void> {
  const folha = useFolha()
  const f = folha.S.ferias[fi]
  if (!f) return
  const mk = f.ini.slice(0, 7)
  if (folha.getMonth(mk).closed) {
    toast('Mês fechado — reabra para conferir.')
    return
  }
  if (force) {
    if (
      !(await confirmS(
        'Regenerar conferência',
        'Isso vai sobrescrever os valores do recibo já informados com os valores atuais do app. Continuar?'
      ))
    )
      return
  }
  f.conf = f.conf || {}
  const fc = folha.feriasCalc(f, folha.cfgFor(mk))
  FER_FIELDS.forEach((x) => {
    if (force || f.conf![x.k] == null || f.conf![x.k] === '') f.conf![x.k] = String(x.app(fc))
  })
  toast(force ? 'Conferência regenerada' : 'Conferência gerada — toque numa verba pra corrigir divergências')
}

/* ---- verba do holerite não prevista (openConfX) ---- */

export interface XConfResult {
  action: 'save' | 'del'
  d: string
  v: number
  t: 'c' | 'd'
}

interface XConfSheetState {
  open: boolean
  title: string
  isEdit: boolean
  desc: string
  valor: string
  tipo: 'c' | 'd'
  resolve: ((v: XConfResult | null) => void) | null
}

export const xConfSheet = reactive<XConfSheetState>({
  open: false,
  title: '',
  isEdit: false,
  desc: '',
  valor: '',
  tipo: 'c',
  resolve: null
})

function openXConfSheet(
  title: string,
  x: { d: string; v: number; t: string },
  isEdit: boolean
): Promise<XConfResult | null> {
  return new Promise((res) => {
    xConfSheet.title = title
    xConfSheet.isEdit = isEdit
    xConfSheet.desc = x.d
    xConfSheet.valor = isFinite(x.v) ? String(x.v) : ''
    xConfSheet.tipo = x.t === 'd' ? 'd' : 'c'
    xConfSheet.resolve = res
    xConfSheet.open = true
  })
}

/** Salvar/Excluir verba/Cancelar (index.html botões de openConfX). */
export function resolveXConfSheet(action: 'save' | 'del' | null): void {
  const res = xConfSheet.resolve
  const d = xConfSheet.desc.trim()
  const v = parseFloat(xConfSheet.valor)
  const t = xConfSheet.tipo
  xConfSheet.open = false
  xConfSheet.resolve = null
  if (!res) return
  if (action === null) {
    res(null)
    return
  }
  if (action === 'del') {
    res({ action: 'del', d, v, t })
    return
  }
  res({ action: 'save', d, v, t })
}

/** Verba do holerite sem correspondência no app — cria/edita/exclui
 *  (index.html openConfX 1345-1362). idx = -1 → nova. */
export async function openConfX(mk: string, idx: number): Promise<void> {
  const folha = useFolha()
  const m = folha.getMonth(mk)
  if (m.closed) {
    toast('Mês fechado — reabra para conferir.')
    return
  }
  const edit = idx != null && idx >= 0
  const x = edit ? m.confX[idx]! : { d: '', v: NaN, t: 'c' }
  const v = await openXConfSheet(
    edit ? 'Editar verba do holerite' : 'Verba do holerite não prevista',
    x,
    edit
  )
  if (v == null) return
  if (v.action === 'del') {
    m.confX.splice(idx, 1)
    toast('Verba removida')
    return
  }
  if (!v.d || !isFinite(v.v)) {
    toast('Preencha descrição e valor.')
    return
  }
  if (edit) m.confX[idx] = { d: v.d, v: v.v, t: v.t }
  else m.confX.push({ d: v.d, v: v.v, t: v.t })
  toast('Verba do holerite registrada')
}
