/* ================= store (Pinia) ================= */
/* Espelha o objeto de estado `S` do app legado (index.html) e expõe o motor de
   cálculo (createEngine) + mutadores. A persistência é dirigida por `watch`
   profundo — os `save()`/`rerender()`/DOM imperativos do legado foram removidos,
   pois a reatividade do Vue cuida disso. A migração em load() é portada
   VERBATIM: a continuidade dos dados dos usuários (chave `pontofolha_v1`)
   depende de manter a mesma chave e a mesma forma de `S`. */

import { defineStore } from 'pinia'
import { reactive, ref, watch } from 'vue'
import { createEngine } from '@/lib/engine'
import { num2, todayKey, curMonthKey, nowHM } from '@/lib/utils'
import { LSKEY, DEFCFG, type State, type Vigencia } from './types'

/** Hidrata `S` do localStorage aplicando a migração de schema do legado
 *  (index.html, load() 524–541), incluindo o upgrade `o.cfg`→`o.vig`. */
function load(): State {
  let o: any = null
  try {
    const r = localStorage.getItem(LSKEY)
    if (r) o = JSON.parse(r)
  } catch (e) {
    /* dados corrompidos → começa do zero */
  }
  if (!o) o = {}
  o.months = o.months || {}
  o.holidays = o.holidays || {}
  o.ferias = o.ferias || []
  o.rec = o.rec || []
  o.c13 = o.c13 || { modo: '2', d1: '30/11', d2: '20/12', dU: '20/12' }
  o.ui = o.ui || { theme: 'sys' }
  o.adm = o.adm || ''
  o.nome = o.nome || ''
  o.filhos = o.filhos || []
  o.depExtra = num2(o.depExtra)
  if (!o.vig || !o.vig.length) {
    const base = Object.assign({}, structuredClone(DEFCFG), o.cfg || {})
    o.vig = [{ desde: '1900-01', cfg: base }]
    delete o.cfg
  }
  o.vig.forEach((v: Vigencia) => {
    v.cfg = Object.assign({}, structuredClone(DEFCFG), v.cfg)
  })
  o.vig.sort((a: Vigencia, b: Vigencia) => (a.desde < b.desde ? -1 : 1))
  return o as State
}

/** Persiste `S` (index.html, save() 542). O toast de falha do legado foi
 *  removido — a falha é silenciosa como no navegador em modo privado. */
function save(S: State): void {
  try {
    localStorage.setItem(LSKEY, JSON.stringify(S))
  } catch (e) {
    /* quota/modo privado → ignora */
  }
}

export const useFolha = defineStore('folha', () => {
  const S = reactive(load())
  const engine = createEngine(S)

  /** Última batida registrada, para permitir desfazer (index.html lastPunch). */
  const lastPunch = ref<{ dk: string; t: string } | null>(null)

  /** Mês em foco na tela do mês (index.html global `curMK` 939). `go('month',k)`
   *  do legado (942) apenas ajustava `curMK`; aqui a store guarda o valor e a
   *  navegação (router.push('/mes')) fica a cargo da UI. */
  const activeMK = ref(curMonthKey())

  /** Registra a batida atual no dia de hoje (index.html punch() 1014–1025).
   *  DOM/vibrate/toast/timeout do legado ficam a cargo da UI. */
  function punch(): void {
    const tk = todayKey()
    const m = engine.getMonth(curMonthKey())
    if (m.closed) return
    if (!m.days[tk]) m.days[tk] = { p: [] }
    const t = nowHM()
    m.days[tk].p!.push(t)
    lastPunch.value = { dk: tk, t }
  }

  /** Desfaz a última batida (index.html undoPunch() 1026–1033). */
  function undoPunch(): void {
    if (!lastPunch.value) return
    const m = engine.getMonth(lastPunch.value.dk.slice(0, 7))
    const arr = m.days[lastPunch.value.dk] && m.days[lastPunch.value.dk].p
    if (arr) {
      const i = arr.lastIndexOf(lastPunch.value.t)
      if (i >= 0) arr.splice(i, 1)
    }
    lastPunch.value = null
  }

  /** Alterna a conclusão de uma tarefa (index.html toggleT() 642–653).
   *  kind 'p' → pontual (ref = índice); kind 'r' → recorrente (ref = id). */
  function toggleT(dk: string, kind: string, ref: string | number): void {
    if (kind === 'p') {
      const m = engine.getMonth(dk.slice(0, 7))
      const tasks = m.days[dk] && m.days[dk].tasks
      const t = tasks && tasks[ref as number]
      if (t) t.ok = !t.ok
    } else {
      const s = S.rec.find((x) => x.id === ref)
      if (!s) return
      s.done = s.done || {}
      if (s.done[dk as string]) delete s.done[dk as string]
      else s.done[dk as string] = true
    }
  }

  /** Adiciona um filho pela data de nascimento e reordena (index.html
   *  addFilho() 1597–1603). Validação/toast ficam a cargo da UI. */
  function addFilho(n: string): void {
    S.filhos.push({ n })
    S.filhos.sort((a, b) => (a.n < b.n ? -1 : 1))
  }

  /** Remove o filho no índice i (index.html delFilho() 1593–1596). */
  function delFilho(i: number): void {
    S.filhos.splice(i, 1)
  }

  /** Busca feriados nacionais do ano corrente e do próximo na BrasilAPI e os
   *  grava em S.holidays (index.html fetchFeriados() 1709–1726). Retorna a
   *  contagem de anos importados/falhos para a UI decidir o feedback. */
  async function fetchFeriados(): Promise<{ ok: number; fail: number }> {
    const yNow = new Date().getFullYear()
    let ok = 0
    let fail = 0
    for (const y of [yNow, yNow + 1]) {
      try {
        const r = await fetch(`https://brasilapi.com.br/api/feriados/v1/${y}`)
        if (!r.ok) throw new Error('http ' + r.status)
        const arr: Array<{ date: string; name: string }> = await r.json()
        S.holidays[y] = {}
        arr.forEach((f) => {
          S.holidays[y]![f.date] = f.name
        })
        ok++
      } catch (e) {
        fail++
      }
    }
    return { ok, fail }
  }

  /** Exporta o estado como arquivo JSON e registra a data (index.html
   *  doExport() 1730–1737). O toast fica a cargo da UI. */
  function exportBackup(): void {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ponto-folha-backup-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    S.lastExport = todayKey()
  }

  /** Substitui todo o estado por um backup importado (index.html fileImport
   *  onchange 1743–1748). Grava no localStorage, reidrata via load() (aplicando
   *  a migração) e reconstrói `S` no lugar — a referência do engine é mantida.
   *  Validação/confirmação/toast ficam a cargo da UI. */
  function importBackup(o: unknown): void {
    localStorage.setItem(LSKEY, JSON.stringify(o))
    const fresh = load()
    for (const k of Object.keys(S)) delete (S as Record<string, unknown>)[k]
    Object.assign(S, fresh)
    S.onboarded = true
  }

  // Persistência reativa: qualquer mutação profunda em `S` grava no localStorage.
  watch(S, () => save(S), { deep: true })

  return {
    S,
    lastPunch,
    activeMK,
    ...engine,
    punch,
    undoPunch,
    toggleT,
    addFilho,
    delFilho,
    exportBackup,
    importBackup,
    fetchFeriados
  }
})
