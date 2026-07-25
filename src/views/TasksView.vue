<script setup lang="ts">
/* Tela de tarefas (index.html #view-tasks 267-280 + renderTasks 1036-1065,
   ntAdd 1067-1080). Formulário "Nova tarefa" (pontual ou recorrente) e a lista
   agrupada em Atrasadas/Hoje/Próximas/Concluídas numa janela de ±60 dias.
   As mutações puras entram na store; save()/renderTasks() do legado saem: a
   reatividade do Vue recomputa a lista e o watch persiste. */
import { computed, ref } from 'vue'
import { useFolha } from '@/stores/folha'
import { todayKey, dAdd, uid } from '@/lib/utils'
import { toast } from '@/lib/toast'
import TaskItem, { type TaskItemData } from '@/components/TaskItem.vue'

const folha = useFolha()

/** Item da lista = tarefa do engine + o dia (dk) em que ocorre. */
type TaskRow = TaskItemData & { dk: string }

const ntTxt = ref('')
const ntDate = ref(todayKey())
const ntFreq = ref('')

/* Baldes da lista (index.html renderTasks 1040-1051): varre -60..+60 dias e
   classifica cada ocorrência por concluída/atrasada/hoje/futura. */
const buckets = computed(() => {
  const tk = todayKey()
  const overdue: TaskRow[] = []
  const today: TaskRow[] = []
  const upcoming: TaskRow[] = []
  const done: TaskRow[] = []
  for (let i = -60; i <= 60; i++) {
    const dk = dAdd(tk, i)
    for (const t of folha.dayTasks(dk) as TaskItemData[]) {
      const item: TaskRow = { ...t, dk }
      if (t.ok) {
        if (i <= 0) done.push(item)
        else upcoming.push(item)
      } else if (i < 0) overdue.push(item)
      else if (i === 0) today.push(item)
      else upcoming.push(item)
    }
  }
  done.sort((a, b) => (a.dk < b.dk ? 1 : -1))
  return { overdue, today, upcoming, done }
})

/* Dica do campo de frequência (index.html renderTasks 1064). */
const ntHint = computed(() =>
  ntFreq.value === 'w'
    ? 'Repete toda semana no mesmo dia da semana da data escolhida.'
    : ntFreq.value === 'm'
      ? 'Repete todo mês no mesmo dia (ajustado em meses mais curtos).'
      : ''
)

/** Chave estável por ocorrência (dia + tipo + ref) para o v-for. */
function rowKey(it: TaskRow): string {
  return `${it.dk}:${it.kind}:${it.kind === 'p' ? it.idx : it.id}`
}

/* Cria tarefa pontual ou recorrente (index.html ntAdd 1067-1080). */
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
  ntTxt.value = ''
  toast('Tarefa criada')
}
</script>

<template>
  <section id="view-tasks">
    <div class="card">
      <h2>Nova tarefa</h2>
      <input v-model="ntTxt" placeholder="Descrição" style="margin-bottom: 8px" @keyup.enter="add" />
      <div class="row">
        <input v-model="ntDate" type="date" />
        <select v-model="ntFreq">
          <option value="">Única</option>
          <option value="w">Semanal</option>
          <option value="m">Mensal</option>
        </select>
        <button class="btn small" style="flex: none" @click="add">Criar</button>
      </div>
      <p v-if="ntHint" class="muted" style="margin-top: 6px">{{ ntHint }}</p>
    </div>

    <div id="tasksList">
      <template v-if="buckets.overdue.length">
        <div class="tgroup over">Atrasadas ({{ buckets.overdue.length }})</div>
        <div class="card">
          <TaskItem v-for="it in buckets.overdue" :key="rowKey(it)" :dk="it.dk" :task="it" show-date />
        </div>
      </template>

      <div class="tgroup">Hoje</div>
      <div class="card">
        <TaskItem v-for="it in buckets.today" :key="rowKey(it)" :dk="it.dk" :task="it" show-date />
        <p v-if="!buckets.today.length" class="muted">Nada para hoje.</p>
      </div>

      <div class="tgroup">Próximas (60 dias)</div>
      <div class="card">
        <TaskItem v-for="it in buckets.upcoming" :key="rowKey(it)" :dk="it.dk" :task="it" show-date />
        <p v-if="!buckets.upcoming.length" class="muted">Nada agendado.</p>
      </div>

      <details v-if="buckets.done.length" class="done-sec">
        <summary>Concluídas recentes ({{ buckets.done.length }})</summary>
        <div class="card">
          <TaskItem v-for="it in buckets.done" :key="rowKey(it)" :dk="it.dk" :task="it" show-date />
        </div>
      </details>
    </div>
  </section>
</template>
