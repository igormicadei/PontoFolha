<script setup lang="ts">
/* Tela Tarefas: a lista vem primeiro (atrasadas fixadas no topo, depois hoje,
   próximas e concluídas); criar é uma ação à parte, num sheet aberto pelo
   botão "Nova tarefa". Filtros: tudo, hoje, semana, recorrentes. */
import { computed, ref } from 'vue'
import { useFolha } from '@/stores/folha'
import { todayKey, dAdd, uid } from '@/lib/utils'
import { toast } from '@/lib/toast'
import Sheet from '@/components/Sheet.vue'
import TaskItem, { type TaskItemData } from '@/components/TaskItem.vue'

const folha = useFolha()

type TaskRow = TaskItemData & { dk: string }
type Filtro = 'tudo' | 'hoje' | 'semana' | 'rec'
const FILTROS: { v: Filtro; lb: string }[] = [
  { v: 'tudo', lb: 'Tudo' },
  { v: 'hoje', lb: 'Hoje' },
  { v: 'semana', lb: 'Semana' },
  { v: 'rec', lb: 'Recorrentes' }
]
const filtro = ref<Filtro>('tudo')

const open = ref(false)
const ntTxt = ref('')
const ntDate = ref(todayKey())
const ntFreq = ref('')

/* Baldes da lista: varre -60..+60 dias e classifica cada ocorrência. */
const buckets = computed(() => {
  const tk = todayKey()
  const overdue: TaskRow[] = []
  const today: TaskRow[] = []
  const upcoming: TaskRow[] = []
  const done: TaskRow[] = []
  for (let i = -60; i <= 60; i++) {
    const dk = dAdd(tk, i)
    for (const t of folha.dayTasks(dk) as TaskItemData[]) {
      if (filtro.value === 'rec' && t.kind !== 'r') continue
      const item: TaskRow = { ...t, dk }
      if (t.ok) {
        if (i <= 0) done.push(item)
        else if (filtro.value !== 'hoje') upcoming.push(item)
      } else if (i < 0) overdue.push(item)
      else if (i === 0) today.push(item)
      else if (filtro.value === 'hoje') continue
      else if (filtro.value === 'semana' && i > 7) continue
      else upcoming.push(item)
    }
  }
  done.sort((a, b) => (a.dk < b.dk ? 1 : -1))
  return { overdue, today, upcoming, done }
})
const total = computed(() => {
  const b = buckets.value
  return b.overdue.length + b.today.length + b.upcoming.length + b.done.length
})
const sub = computed(() => {
  const b = buckets.value
  const parts: string[] = []
  if (b.overdue.length) parts.push(`${b.overdue.length} atrasada${b.overdue.length > 1 ? 's' : ''}`)
  if (b.today.length) parts.push(`${b.today.length} para hoje`)
  return parts.join(' · ') || 'Nada pendente'
})
const mostraProximas = computed(() => filtro.value !== 'hoje')

const ntHint = computed(() =>
  ntFreq.value === 'w'
    ? 'Repete toda semana no mesmo dia da semana da data escolhida.'
    : ntFreq.value === 'm'
      ? 'Repete todo mês no mesmo dia (ajustado em meses mais curtos).'
      : ''
)

function rowKey(it: TaskRow): string {
  return `${it.dk}:${it.kind}:${it.kind === 'p' ? it.idx : it.id}`
}

function abrir(): void {
  ntTxt.value = ''
  ntDate.value = todayKey()
  ntFreq.value = ''
  open.value = true
}

function add(): void {
  const t = ntTxt.value.trim()
  const dk = ntDate.value
  const fq = ntFreq.value
  if (!t || !dk) {
    toast('Preencha descrição e data.')
    return
  }
  if (fq) {
    folha.S.rec.push({ id: uid(), t, freq: fq, anchor: dk, end: null, skips: [], done: {}, over: {} })
  } else {
    const m = folha.getMonth(dk.slice(0, 7))
    if (m.closed) {
      toast('Esse mês está fechado.')
      return
    }
    if (!m.days[dk]) m.days[dk] = { p: [] }
    m.days[dk].tasks = m.days[dk].tasks || []
    m.days[dk].tasks!.push({ t, ok: false })
  }
  open.value = false
  toast('Tarefa criada')
}
</script>

<template>
  <section id="view-tasks">
    <header class="appbar">
      <div>
        <h1 class="title">Tarefas</h1>
        <div class="sub">{{ sub }}</div>
      </div>
    </header>

    <main class="content">
      <div class="chips" role="group" aria-label="Filtro">
        <button v-for="f in FILTROS" :key="f.v" class="pill" :class="{ on: filtro === f.v }" :aria-pressed="filtro === f.v" @click="filtro = f.v">
          {{ f.lb }}
        </button>
      </div>

      <section v-if="total === 0 && filtro === 'tudo'" class="card" style="text-align: center; padding: 28px 20px">
        <h2 style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em">Nenhuma tarefa ainda</h2>
        <p class="muted" style="margin: 6px auto 16px; max-width: 280px">Tarefas únicas e recorrentes aparecem aqui no dia certo, e também em Hoje.</p>
        <button class="btn" @click="abrir">Criar a primeira tarefa</button>
      </section>

      <template v-else>
        <section v-if="buckets.overdue.length" class="card" aria-label="Atrasadas">
          <div class="h2"><span>Atrasadas</span><span class="chip bad">{{ buckets.overdue.length }}</span></div>
          <div class="list"><TaskItem v-for="it in buckets.overdue" :key="rowKey(it)" :dk="it.dk" :task="it" show-date /></div>
        </section>

        <section class="card" aria-label="Hoje">
          <div class="h2"><span>Hoje</span></div>
          <div v-if="buckets.today.length" class="list"><TaskItem v-for="it in buckets.today" :key="rowKey(it)" :dk="it.dk" :task="it" show-date /></div>
          <p v-else class="empty">Nada para hoje.</p>
        </section>

        <section v-if="mostraProximas" class="card" aria-label="Próximas">
          <div class="h2"><span>Próximas</span><span class="muted">{{ filtro === 'semana' ? '7 dias' : '60 dias' }}</span></div>
          <div v-if="buckets.upcoming.length" class="list"><TaskItem v-for="it in buckets.upcoming" :key="rowKey(it)" :dk="it.dk" :task="it" show-date /></div>
          <p v-else class="empty">Nada agendado.</p>
        </section>

        <details v-if="buckets.done.length" class="card" style="padding: 0 18px">
          <summary class="between" style="min-height: 56px; cursor: pointer; list-style: none; font-weight: 700">
            <span>Concluídas recentes</span><span class="chip">{{ buckets.done.length }}</span>
          </summary>
          <div class="list" style="padding-bottom: 8px"><TaskItem v-for="it in buckets.done" :key="rowKey(it)" :dk="it.dk" :task="it" show-date /></div>
        </details>
      </template>
    </main>

    <button v-if="total > 0 || filtro !== 'tudo'" class="fab" @click="abrir">
      <svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Nova tarefa
    </button>

    <Sheet :open="open" title="Nova tarefa" @close="open = false">
      <div class="field">
        <label for="nt-d">Descrição</label>
        <input id="nt-d" v-model="ntTxt" class="input" placeholder="Ex.: faturamento convênio X" @keyup.enter="add" />
      </div>
      <div class="field">
        <label for="nt-dt">Data</label>
        <input id="nt-dt" v-model="ntDate" type="date" class="input" />
      </div>
      <div class="field">
        <span id="nt-f" class="lb">Repetição</span>
        <div class="chips" role="group" aria-labelledby="nt-f">
          <button class="pill" :class="{ on: ntFreq === '' }" @click="ntFreq = ''">Única</button>
          <button class="pill" :class="{ on: ntFreq === 'w' }" @click="ntFreq = 'w'">Semanal</button>
          <button class="pill" :class="{ on: ntFreq === 'm' }" @click="ntFreq = 'm'">Mensal</button>
        </div>
        <span v-if="ntHint" class="hint">{{ ntHint }}</span>
      </div>
      <template #footer>
        <button class="btn ghost" @click="open = false">Cancelar</button>
        <button class="btn grow" @click="add">Criar tarefa</button>
      </template>
    </Sheet>
  </section>
</template>
