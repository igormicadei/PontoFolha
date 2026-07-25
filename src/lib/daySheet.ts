/* ================= dia (sheet + orquestração) ================= */
/* Porta o modal de edição de dia do legado (index.html #dayModal 448-475 +
   openDay/renderDmTasks/addPunchRow/dmSave etc. 1384-1439). O `ask()` do Vue
   (dialog.ts) só renderiza título/corpo/botões — sem inputs de formulário —,
   então o editor de dia é um sheet dedicado (daySheet), no mesmo padrão de
   singleton reativo do ferias.ts/taskSheet.ts; o <DaySheetHost> renderiza.
   Batidas/tipo/nota/tarefas pontuais ficam num rascunho local (editDK/
   editTasks do legado) só persistido em m.days[dk] ao Salvar; as ocorrências
   recorrentes já comitam direto na store (toggleT/editT/delT de tasks.ts),
   pois o legado também as grava imediatamente dentro do próprio modal. */

import { reactive } from 'vue'
import { useFolha } from '@/stores/folha'
import { confirmS } from './dialog'
import { toast } from './toast'
import { DSEM, dow, nowHM, pad, daysInMonth } from './utils'
import type { PTask } from '@/stores/types'

interface DaySheetState {
  open: boolean
  dk: string
  title: string
  dayType: string
  note: string
  punches: string[]
  tasks: PTask[]
  newTaskTxt: string
}

export const daySheet = reactive<DaySheetState>({
  open: false,
  dk: '',
  title: '',
  dayType: 'auto',
  note: '',
  punches: [],
  tasks: [],
  newTaskTxt: ''
})

/** Abre o editor do dia `dk` (index.html openDay 1386-1400). Recusa com toast
 *  se o mês estiver fechado (mesmo guard do legado). */
export function openDay(dk: string): void {
  const folha = useFolha()
  const m = folha.getMonth(dk.slice(0, 7))
  if (m.closed) {
    toast('Mês fechado — reabra para editar.')
    return
  }
  const rec = m.days[dk] || {}
  const [y, mm, d] = dk.split('-')
  const cfg = folha.cfgFor(dk.slice(0, 7))
  const hol = folha.holidayName(dk, cfg)
  daySheet.dk = dk
  daySheet.title =
    `${d}/${mm}/${y} · ${DSEM[dow(dk)]}` +
    (hol ? ` · ${hol}` : '') +
    (folha.feriasFor(dk) ? ' · período de férias' : '')
  daySheet.dayType = rec.type || 'auto'
  daySheet.note = rec.note || ''
  daySheet.punches = [...(rec.p || [])]
  daySheet.tasks = (rec.tasks || []).map((t) => ({ t: t.t, ok: t.ok }))
  daySheet.newTaskTxt = ''
  daySheet.open = true
}

/** + batida (index.html $('dmAdd').onclick / addPunchRow 1414-1420). */
export function addPunchRow(v?: string): void {
  daySheet.punches.push(v || nowHM())
}

export function removePunchRow(i: number): void {
  daySheet.punches.splice(i, 1)
}

/** + item da agenda pontual (index.html dmTaskAdd 1421-1424). */
export function addDayTask(): void {
  const t = daySheet.newTaskTxt.trim()
  if (!t) return
  daySheet.tasks.push({ t, ok: false })
  daySheet.newTaskTxt = ''
}

export function toggleDayTask(i: number): void {
  const t = daySheet.tasks[i]
  if (t) t.ok = !t.ok
}

export function delDayTask(i: number): void {
  daySheet.tasks.splice(i, 1)
}

/** Cancelar (index.html dmCancel 1425) — descarta o rascunho. */
export function closeDaySheet(): void {
  daySheet.open = false
}

/** Limpar dia (index.html dmClear 1426-1430): remove batidas, tipo, nota e
 *  tarefas pontuais do dia inteiro (as ocorrências recorrentes não são
 *  afetadas, como no legado). */
export async function clearDay(): Promise<void> {
  if (
    !(await confirmS(
      'Limpar o dia?',
      'Remove batidas, tipo, observação e tarefas pontuais deste dia.'
    ))
  )
    return
  const folha = useFolha()
  delete folha.getMonth(daySheet.dk.slice(0, 7)).days[daySheet.dk]
  daySheet.open = false
  toast('Dia limpo')
}

/** Salvar (index.html dmSave 1431-1439): grava o rascunho em m.days[dk], ou
 *  remove a entrada se tudo ficou vazio/padrão. */
export function saveDay(): void {
  const folha = useFolha()
  const ps = [...daySheet.punches].filter(Boolean).sort()
  const type = daySheet.dayType
  const note = daySheet.note.trim()
  const m = folha.getMonth(daySheet.dk.slice(0, 7))
  if (ps.length || type !== 'auto' || note || daySheet.tasks.length) {
    m.days[daySheet.dk] = {
      p: ps,
      type: type === 'auto' ? undefined : type,
      note: note || undefined,
      tasks: daySheet.tasks.length ? daySheet.tasks : undefined
    }
  } else {
    delete m.days[daySheet.dk]
  }
  daySheet.open = false
}

/* ---- adicionar dia por número (substitui o prompt() do legado) ---- */
/* index.html $('btnAddDay').onclick 1378-1382: prompt() nativo pedindo o dia
   do mês e abrindo openDay. prompt() é rejeitado no port (ver decisões da
   migração), então isto é um mini-sheet dedicado que só pede o número do dia
   e, se válido, delega para openDay(). */

interface AddDaySheetState {
  open: boolean
  max: number
  day: string
}

export const addDaySheet = reactive<AddDaySheetState>({
  open: false,
  max: 31,
  day: ''
})

let addDayMK = ''

/** Abre o mini-sheet "Dia do mês (1-N)" para o mês `mk`. */
export function openAddDaySheet(mk: string): void {
  addDayMK = mk
  addDaySheet.max = daysInMonth(mk)
  addDaySheet.day = ''
  addDaySheet.open = true
}

/** Confirmar/Cancelar do mini-sheet — se válido, abre o editor do dia. */
export function resolveAddDaySheet(ok: boolean): void {
  const n = parseInt(addDaySheet.day, 10)
  const mk = addDayMK
  addDaySheet.open = false
  if (!ok || !n || n < 1 || n > addDaySheet.max) return
  openDay(`${mk}-${pad(n)}`)
}
