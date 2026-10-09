<script setup lang="ts">
/* Tela Início. Responde "como está meu dia e o que vem a seguir": cartão de
   ponto com total do dia, barra do dia, batidas nomeadas e slider; próximo
   evento (férias, 13º); agenda do dia; resumo do mês com o líquido em destaque. */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import { todayKey, curMonthKey, fmtDia, MESES, min2hm, brl, daysDiff, dow, nowHM, num } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { openDay } from '@/lib/daySheet'
import { dayProgress } from '@/lib/dayProgress'
import { proximoEvento } from '@/lib/proximo'
import PunchSlider from '@/components/PunchSlider.vue'
import TaskItem, { type TaskItemData } from '@/components/TaskItem.vue'

const folha = useFolha()
const router = useRouter()

const now = ref(new Date())
let tickTimer: ReturnType<typeof setInterval> | undefined
const taskTxt = ref('')

const tk = computed(() => (now.value, todayKey()))
const mk = computed(() => (now.value, curMonthKey()))
const cfg = computed(() => folha.cfgFor(mk.value))
const hhmm = computed(() => (now.value, nowHM()))
const nowMin = computed(() => now.value.getHours() * 60 + now.value.getMinutes())

const mesFechado = computed(() => folha.getMonth(mk.value).closed)
const punches = computed<string[]>(() => folha.getMonth(mk.value).days[tk.value]?.p || [])
const expected = computed(() => num(cfg.value.escala[dow(tk.value)]))
const prog = computed(() => dayProgress(punches.value, cfg.value, nowMin.value, expected.value))

const statusChip = computed(() => {
  switch (prog.value.status) {
    case 'complete':
      return { text: 'Dia completo', cls: 'ink' }
    case 'working':
      return { text: '● Trabalhando', cls: 'mag' }
    case 'break':
      return { text: 'Em intervalo', cls: '' }
    default:
      return { text: mesFechado.value ? 'Mês fechado' : 'Não iniciado', cls: '' }
  }
})
const sliderLabel = computed(() => {
  const s = prog.value.slots.find((x) => x.next)
  return s ? `Deslize para bater: ${s.label.toLowerCase()}` : 'Deslize para bater o ponto'
})
const completo = computed(() => prog.value.status === 'complete')
const barTotal = computed(() => prog.value.segments.reduce((a, s) => a + s.min, 0) || 1)

const exitStr = computed(() => {
  const e = prog.value.exitMin
  if (e == null) return ''
  return `${String(Math.floor(e / 60) % 24).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`
})

const proximo = computed(() => (now.value, proximoEvento(folha)))

const tasks = computed<TaskItemData[]>(() => folha.dayTasks(tk.value) as TaskItemData[])

const c = computed(() => folha.computeMonth(mk.value))
const saldo = computed(() => c.value.worked - c.value.expected)
const mesNome = computed(() => MESES[Number(mk.value.slice(5, 7)) - 1]!)

const staleBackup = computed(() => {
  const S = folha.S
  const hasData = Object.keys(S.months).some((k) => Object.keys(S.months[k]!.days).length)
  const last = S.lastExport || null
  const sn = S.snooze || null
  const t = tk.value
  return hasData && (!last || daysDiff(last, t) > 30) && (!sn || daysDiff(sn, t) > 30)
})

function onPunch(): void {
  if (mesFechado.value) {
    toast('Este mês está fechado. Reabra na tela do mês.')
    return
  }
  folha.punch()
  const t = folha.lastPunch?.t
  if (!t) return
  navigator.vibrate?.(30)
  now.value = new Date()
  toast(`Ponto registrado às ${t}`, { label: 'Desfazer', run: onUndo }, 10000)
}
function onUndo(): void {
  folha.undoPunch()
  now.value = new Date()
}

function addTask(): void {
  const t = taskTxt.value.trim()
  if (!t) return
  const tkd = todayKey()
  const m = folha.getMonth(tkd.slice(0, 7))
  if (m.closed) {
    toast('Mês fechado: reabra para lançar.')
    return
  }
  if (!m.days[tkd]) m.days[tkd] = { p: [] }
  m.days[tkd].tasks = m.days[tkd].tasks || []
  m.days[tkd].tasks!.push({ t, ok: false })
  taskTxt.value = ''
}

function abrirMes(k: string, aba?: string): void {
  folha.activeMK = k
  router.push({ name: 'month', query: aba ? { aba } : {} })
}
function onExport(): void {
  folha.exportBackup()
  toast('Backup exportado')
}
function onSnooze(): void {
  folha.S.snooze = todayKey()
}

onMounted(() => {
  tickTimer = setInterval(() => (now.value = new Date()), 10000)
})
onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
})
</script>

<template>
  <section>
    <header class="appbar">
      <div>
        <h1 class="title">{{ fmtDia(tk) }}</h1>
        <div class="sub">Ponto&amp;Folha · {{ hhmm }}</div>
      </div>
      <button class="iconbtn" :aria-label="staleBackup ? 'Backup pendente: exportar dados' : 'Exportar backup'" @click="onExport">
        <svg class="i" viewBox="0 0 24 24"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
        <span v-if="staleBackup" class="dot"></span>
      </button>
    </header>

    <div v-if="staleBackup" class="banner">
      <span class="grow">Faz mais de 30 dias do último backup. Exporte para não perder registros.</span>
      <button class="btn sm" @click="onExport">Exportar</button>
      <button class="link" @click="onSnooze">Depois</button>
    </div>

    <main class="content">
      <section class="card cream punch" aria-label="Cartão de ponto de hoje">
        <div class="top">
          <div>
            <div class="eyebrow">Cartão de ponto · {{ tk.slice(8) }}/{{ tk.slice(5, 7) }}</div>
            <div class="worked">{{ min2hm(prog.worked) }}</div>
          </div>
          <span class="chip" :class="statusChip.cls">{{ statusChip.text }}</span>
        </div>

        <div class="rowflex" style="margin-top: 8px; flex-wrap: wrap">
          <template v-if="completo && expected > 0">
            <span class="chip" :class="prog.delta >= 0 ? 'ok' : 'bad'" style="background: rgba(var(--cream-rgb), 0.08)">{{ min2hm(prog.delta, true) }}</span>
            <span class="eyebrow">sobre as {{ min2hm(expected) }} previstas</span>
          </template>
          <span v-else-if="exitStr" class="eyebrow">
            Saída prevista às <b style="color: var(--cream-ink)">{{ exitStr }}</b> para fechar {{ min2hm(expected) }}
          </span>
          <span v-else-if="prog.status === 'idle' && expected > 0" class="eyebrow">Previstas hoje: {{ min2hm(expected) }}</span>
          <span v-else-if="expected === 0" class="eyebrow">Sem jornada prevista hoje</span>
        </div>

        <div class="daybar" aria-hidden="true">
          <i v-for="(s, i) in prog.segments" :key="i" :class="s.kind === 'work' ? '' : s.kind" :style="{ flex: s.min / barTotal }"></i>
        </div>

        <div class="slots" :style="{ gridTemplateColumns: `repeat(${Math.min(prog.slots.length, 4)}, 1fr)` }">
          <div v-for="(s, i) in prog.slots" :key="i" class="slot" :class="{ empty: !s.time, next: s.next }">
            <span>{{ s.label }}</span>
            <b>{{ s.time || (s.next && exitStr ? '~' + exitStr : '--:--') }}</b>
          </div>
        </div>

        <div v-if="mesFechado" class="slide off">Mês fechado</div>
        <div v-else-if="completo" class="slide off">Dia completo · {{ prog.n }} de {{ prog.total }} batidas</div>
        <PunchSlider v-else :label="sliderLabel" @punch="onPunch" />

        <div class="alt">
          <button v-if="mesFechado" @click="abrirMes(mk)">Abrir o mês</button>
          <template v-else-if="completo">
            <button @click="openDay(tk)">Corrigir batidas</button>
            <button @click="onPunch">Bater ponto mesmo assim</button>
          </template>
          <template v-else>
            <button @click="onPunch">Bater ponto sem deslizar</button>
          </template>
        </div>
      </section>

      <section v-if="proximo" class="card lilac" aria-label="Próximo evento">
        <div class="rowflex" style="align-items: flex-start; gap: 14px">
          <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(var(--lilac-rgb), 0.14); display: grid; place-items: center; flex: none">
            <svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
          </div>
          <div class="grow">
            <div class="eyebrow">Próximo</div>
            <h2 style="font-size: 20px; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em">{{ proximo.title }}</h2>
            <p style="margin-top: 4px; font-size: 14px; line-height: 1.4">{{ proximo.line }}</p>
          </div>
        </div>
        <div v-if="proximo.note" class="between" style="margin-top: 14px; padding: 12px 14px; border-radius: 16px; background: rgba(var(--lilac-rgb), 0.12)">
          <div>
            <div style="font-size: 13px; font-weight: 600">{{ proximo.note.label }}</div>
            <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em">{{ proximo.note.amount }}</div>
          </div>
          <button class="btn sm" style="background: var(--lilac-ink); color: var(--lilac)" @click="abrirMes(proximo.mk, proximo.aba)">
            {{ proximo.kind === 'ferias' ? 'Ver férias' : 'Ver mês' }}
          </button>
        </div>
      </section>

      <section class="card" aria-label="Tarefas de hoje">
        <div class="h2"><span>Hoje</span><button class="link" @click="router.push({ name: 'tasks' })">Todas as tarefas</button></div>
        <div v-if="tasks.length" class="list">
          <TaskItem v-for="(t, i) in tasks" :key="i" :dk="tk" :task="t" />
        </div>
        <p v-else class="muted" style="margin-bottom: 12px">Nada agendado para hoje.</p>
        <div class="rowflex" style="margin-top: 8px">
          <input v-model="taskTxt" class="input grow" placeholder="Nova tarefa ou registro do dia" aria-label="Nova tarefa ou registro do dia" @keyup.enter="addTask" />
          <button class="iconbtn solid" aria-label="Adicionar tarefa" @click="addTask">
            <svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </section>

      <section class="card" aria-label="Resumo do mês">
        <div class="eyebrow">{{ mesNome[0]!.toUpperCase() + mesNome.slice(1) }} · líquido estimado</div>
        <div class="big" style="margin-top: 4px">{{ brl(c.liquido) }}</div>
        <p v-if="c.cesta" class="muted" style="margin-top: 6px">
          + {{ brl(c.cesta) }} de vale cesta = <b style="color: var(--ink)">{{ brl(c.totalReceber) }}</b> a receber
        </p>
        <div class="stats" style="margin-top: 14px">
          <div class="stat"><span>Trabalhadas</span><b>{{ min2hm(c.worked) }}</b></div>
          <div class="stat"><span>Saldo</span><b :class="saldo >= 0 ? 'pos' : 'neg'">{{ min2hm(saldo, true) }}</b></div>
          <div class="stat"><span>Extras</span><b>{{ min2hm(c.extraMin) }}</b></div>
        </div>
        <p v-if="c.pend" class="note-box warn" style="margin-top: 10px">{{ c.pend }} dia(s) sem registro neste mês.</p>
        <button class="link" style="margin-top: 6px" @click="abrirMes(mk, 'folha')">
          Ver folha de {{ mesNome }}
          <svg class="i sm" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </section>
    </main>
  </section>
</template>
