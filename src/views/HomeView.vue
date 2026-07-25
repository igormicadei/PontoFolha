<script setup lang="ts">
/* Tela inicial (index.html #view-home 228-265 + renderHome 976-1002,
   homeTaskAdd 1004-1012, punch 1014-1025, undoPunch 1026-1033,
   workedNowMin 957-967). Cartão de ponto com alavanca, agenda do dia,
   resumo do mês e lembrete de backup. As mutações puras ficam na store;
   aqui fica a orquestração de UI (toast, vibrate, timeout do desfazer) e o
   tique de 1s que mantém o "trabalhado hoje" vivo. */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import { todayKey, curMonthKey, fmtDKs, min2hm, brl, hm2min, num, daysDiff } from '@/lib/utils'
import { toast } from '@/lib/toast'
import PunchLever from '@/components/PunchLever.vue'
import TaskItem, { type TaskItemData } from '@/components/TaskItem.vue'

const folha = useFolha()
const router = useRouter()

/* Relógio interno: um tique de 1s reavalia os computeds dependentes do tempo
   (trabalhado ao vivo + virada de dia). As mutações de estado já reagem pelo
   Pinia; `now` cobre só o que muda com o relógio. */
const now = ref(new Date())
let tickTimer: ReturnType<typeof setInterval> | undefined

const stampTime = ref<string | null>(null)
const taskTxt = ref('')
let undoT: ReturnType<typeof setTimeout> | undefined

const tk = computed(() => {
  now.value
  return todayKey()
})
const mk = computed(() => {
  now.value
  return curMonthKey()
})

const cfg = computed(() => folha.cfgFor(mk.value))
const dstr = computed(() => fmtDKs(tk.value))
const kicker = computed(() => `Cartão de ponto · ${dstr.value}`)

const punches = computed<string[]>(() => {
  const rec = folha.getMonth(mk.value).days[tk.value]
  return (rec && rec.p) || []
})

/** Slots do cartão: batidas preenchidas + vazias até `batidas`; se nada, o
 *  aviso "nenhuma batida hoje" (index.html renderHome 979-984). */
const slots = computed<Array<{ text: string; empty: boolean }>>(() => {
  const out: Array<{ text: string; empty: boolean }> = []
  const ps = punches.value
  const d = dstr.value
  ps.forEach((p) => out.push({ text: `${d} · ${p}`, empty: false }))
  const total = Number(cfg.value.batidas) || 0
  for (let i = ps.length; i < total; i++) {
    out.push({ text: '– – / – – · – – : – –', empty: true })
  }
  if (!out.length) out.push({ text: 'nenhuma batida hoje', empty: true })
  return out
})

const tasks = computed<TaskItemData[]>(() => folha.dayTasks(tk.value) as TaskItemData[])

/* Trabalhado hoje ao vivo (index.html workedNowMin 957-967). */
const workedStr = computed(() => {
  now.value
  const rec = folha.getMonth(curMonthKey()).days[todayKey()]
  const cf = folha.cfgFor(curMonthKey())
  const ps = ((rec && rec.p) || [])
    .map(hm2min)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  let w = 0
  for (let i = 0; i + 1 < ps.length; i += 2) w += ps[i + 1] - ps[i]
  let open = false
  if (ps.length % 2 === 1) {
    const d = new Date()
    w += d.getHours() * 60 + d.getMinutes() - ps[ps.length - 1]
    open = true
  }
  if (!open && ps.length === 2 && Number(cf.autoAlmoco) === 1 && w > num(cf.almocoMin)) {
    w -= num(cf.almocoMin)
  }
  const ww = Math.max(0, w)
  const n = ps.length
  return n ? `hoje: ${min2hm(ww)}${open ? ' ⏱' : ''} · ${n} batida${n > 1 ? 's' : ''}` : ''
})

/* Resumo do mês (index.html renderHome 987-993). */
const c = computed(() => folha.computeMonth(mk.value))
const saldo = computed(() => c.value.worked - c.value.expected)

/* Lembrete de backup (index.html renderHome 995-1001). */
const staleBackup = computed(() => {
  const S = folha.S
  const hasData = Object.keys(S.months).some((k) => Object.keys(S.months[k].days).length)
  const last = S.lastExport || null
  const sn = S.snooze || null
  const t = tk.value
  return hasData && (!last || daysDiff(last, t) > 30) && (!sn || daysDiff(sn, t) > 30)
})

/* Bate o ponto (index.html punch 1014-1025). Mês fechado → avisa; senão grava
   na store, vibra, mostra o carimbo e agenda a limpeza do desfazer em 10s. */
function onPunch(): void {
  const m = folha.getMonth(curMonthKey())
  if (m.closed) {
    toast('Este mês está fechado. Reabra na tela do mês.')
    return
  }
  folha.punch()
  const t = folha.lastPunch?.t
  if (!t) return
  navigator.vibrate?.(30)
  stampTime.value = t
  if (undoT) clearTimeout(undoT)
  undoT = setTimeout(() => {
    stampTime.value = null
    folha.lastPunch = null
  }, 10000)
}

/* Desfaz a última batida (index.html undoPunch 1026-1033). */
function onUndo(): void {
  folha.undoPunch()
  stampTime.value = null
  if (undoT) clearTimeout(undoT)
  toast('Batida desfeita')
}

/* Adiciona tarefa/registro do dia (index.html homeTaskAdd 1004-1012). */
function addTask(): void {
  const t = taskTxt.value.trim()
  if (!t) return
  const tkd = todayKey()
  const m = folha.getMonth(tkd.slice(0, 7))
  if (m.closed) {
    toast('Mês fechado — reabra para lançar.')
    return
  }
  if (!m.days[tkd]) m.days[tkd] = { p: [] }
  m.days[tkd].tasks = m.days[tkd].tasks || []
  m.days[tkd].tasks!.push({ t, ok: false })
  taskTxt.value = ''
}

function goMonth(): void {
  router.push('/mes')
}

function onExport(): void {
  folha.exportBackup()
  toast('Backup exportado')
}

function onSnooze(): void {
  folha.S.snooze = todayKey()
}

onMounted(() => {
  tickTimer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
  if (undoT) clearTimeout(undoT)
})
</script>

<template>
  <section>
    <div v-if="staleBackup" id="homeBackup">
      <div
        class="promo-banner"
        style="display: flex; gap: 8px; align-items: center; margin-top: 4px"
      >
        <span style="flex: 1"
          >Faz tempo que você não exporta um backup. Se o navegador limpar os dados, os registros se
          perdem.</span
        >
        <button class="btn sec small" @click="onExport">Exportar</button>
        <button class="btn ghost small" @click="onSnooze">Depois</button>
      </div>
    </div>

    <div class="card tcard">
      <div class="pf-punchcard-head">
        <span class="tcard-kicker" style="margin-bottom: 0">{{ kicker }}</span>
      </div>
      <div class="punchcard2">
        <div class="punch-slots">
          <div v-for="(s, i) in slots" :key="i" class="pf-slot-row">
            <span :class="s.empty ? 'pf-slot-empty' : 'pf-slot-time'">{{ s.text }}</span>
          </div>
        </div>
        <PunchLever @punch="onPunch" />
      </div>
      <div class="pf-punchcard-worked">{{ workedStr }}</div>
      <div v-if="stampTime" class="stamp">
        ✓ registrado às {{ stampTime }} <button @click="onUndo">desfazer</button>
      </div>
    </div>

    <div class="card">
      <h2>Hoje — agenda &amp; atividades</h2>
      <div>
        <TaskItem v-for="(t, i) in tasks" :key="i" :dk="tk" :task="t" />
        <p v-if="!tasks.length" class="muted">Nada agendado para hoje.</p>
      </div>
      <div class="row" style="margin-top: 8px">
        <input
          v-model="taskTxt"
          placeholder="Nova tarefa ou registro do dia"
          @keyup.enter="addTask"
        />
        <button class="btn small" style="flex: none" @click="addTask">Add</button>
      </div>
    </div>

    <div class="card">
      <h2>Este mês</h2>
      <div class="hol">
        <div class="l"><span>Horas trabalhadas</span><b>{{ min2hm(c.worked) }}</b></div>
        <div class="l">
          <span>Saldo</span
          ><b :class="saldo >= 0 ? 'pos' : 'neg'">{{ min2hm(saldo, true) }}</b>
        </div>
        <div v-if="c.extraMin" class="l">
          <span>Horas extras</span><b>{{ min2hm(c.extraMin) }}</b>
        </div>
        <div v-if="c.pend" class="l">
          <span>Dias sem registro</span><b class="chip pend">{{ c.pend }}</b>
        </div>
        <div class="sep"></div>
        <div class="l tot"><span>Líquido estimado</span><b>{{ brl(c.liquido) }}</b></div>
      </div>
      <button class="btn sec small" style="margin-top: 10px" @click="goMonth">
        Ver mês em detalhe →
      </button>
    </div>
  </section>
</template>
