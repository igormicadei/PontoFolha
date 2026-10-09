<script setup lang="ts">
/* Aba Dias: calendário do mês, resumo de horas e a lista de dias lançados.
   Férias/feriados seguidos viram uma linha; fins de semana em branco somem;
   dias lançados com data futura ganham um aviso. */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useFolha } from '@/stores/folha'
import { DSEM, daysInMonth, dow, fmtDM, min2hm, num, pad, todayKey, dsemLongo, MES_ABR } from '@/lib/utils'
import { openDay, openAddDaySheet } from '@/lib/daySheet'
import { monthEntries, calClass, type MonthEntry } from '@/lib/dayRuns'

const props = defineProps<{ mk: string }>()
const folha = useFolha()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 60000)
  if (folha.activeMK === todayKey().slice(0, 7)) {
    setTimeout(() => document.querySelector('.day.today')?.scrollIntoView({ block: 'center' }), 80)
  }
})
onUnmounted(() => timer && clearInterval(timer))

const tk = computed(() => (now.value, todayKey()))
const dias = computed(() => {
  void now.value
  const nd = daysInMonth(props.mk)
  const out: { dk: string; cd: ReturnType<typeof folha.computeDay> }[] = []
  for (let d = 1; d <= nd; d++) {
    const dk = `${props.mk}-${pad(d)}`
    out.push({ dk, cd: folha.computeDay(props.mk, dk) })
  }
  return out
})

const entradas = computed<MonthEntry<ReturnType<typeof folha.computeDay>>[]>(() => monthEntries(dias.value, tk.value))
const futIdx = computed(() => entradas.value.findIndex((e) => e.kind === 'day' && e.fut))
const futCount = computed(() => entradas.value.filter((e) => e.kind === 'day' && e.fut).length)
const futFirst = computed(() => entradas.value.find((e) => e.kind === 'day' && e.fut))
const futLast = computed(() => [...entradas.value].reverse().find((e) => e.kind === 'day' && e.fut))

const cfg = computed(() => folha.cfgFor(props.mk))
function escMin(dk: string): number {
  return num(cfg.value.escala[dow(dk)])
}
const EFF: Record<string, string> = { ferias: 'Férias', feriado: 'Feriado', abonado: 'Abonado', falta: 'Falta' }
const EFFCLS: Record<string, string> = { ferias: 'vac', feriado: 'fer', abonado: 'ok', falta: 'bad' }

/* calendário (segunda a domingo) */
const calCells = computed(() => {
  const first = dow(`${props.mk}-01`)
  const lead = (first + 6) % 7
  const cells: { n: number | null; cls: string }[] = Array.from({ length: lead }, () => ({ n: null, cls: '' }))
  dias.value.forEach(({ dk, cd }, i) => cells.push({ n: i + 1, cls: calClass(cd, dk, tk.value) }))
  return cells
})
const CAL_HD = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const temPend = computed(() => calCells.value.some((c) => c.cls === 'p'))
const temFalta = computed(() => calCells.value.some((c) => c.cls === 'b'))

const c = computed(() => (now.value, folha.computeMonth(props.mk)))
const resumo = computed(() => {
  const cc = c.value
  const l: { label: string; value: string; cls?: string }[] = [
    { label: 'Horas previstas (dias lançados)', value: min2hm(cc.expected) },
    { label: 'Horas extras', value: min2hm(cc.extraMin) }
  ]
  if (cc.extrasFeriado) l.push({ label: '· das quais em feriado', value: min2hm(cc.extrasFeriado) })
  l.push({ label: 'Faltas e atrasos', value: min2hm(cc.faltaMin), cls: cc.faltaMin ? 'neg' : undefined })
  if (cc.saldoBanco) l.push({ label: 'Banco de horas do mês', value: min2hm(cc.saldoBanco, true) })
  if (cc.pend) l.push({ label: 'Dias sem registro', value: String(cc.pend), cls: 'neg' })
  return l
})
function runDesc(e: Extract<MonthEntry, { kind: 'run' }>): string {
  return `${e.days} dias · ${dsemLongo(e.from)} a ${dsemLongo(e.to)}`
}
</script>

<template>
  <section class="card" aria-label="Calendário">
    <div class="cal">
      <div v-for="h in CAL_HD" :key="h" class="hd">{{ h }}</div>
      <template v-for="(cell, i) in calCells" :key="i">
        <div v-if="cell.n === null" class="c" aria-hidden="true"></div>
        <div v-else class="c" :class="cell.cls">{{ cell.n }}</div>
      </template>
    </div>
    <div class="legend">
      <span><i style="background: var(--ink)"></i>Trabalhado</span>
      <span><i style="background: var(--vac-bg); box-shadow: inset 0 0 0 1px var(--vac)"></i>Férias</span>
      <span><i style="background: var(--fer-bg); box-shadow: inset 0 0 0 1px var(--fer)"></i>Feriado</span>
      <span><i style="background: var(--mag)"></i>Hoje</span>
      <span v-if="temPend"><i style="background: var(--warn-bg); box-shadow: inset 0 0 0 1px var(--warn)"></i>Sem registro</span>
      <span v-if="temFalta"><i style="background: var(--bad-bg); box-shadow: inset 0 0 0 1px var(--bad)"></i>Falta</span>
    </div>
  </section>

  <section class="card" aria-label="Resumo de horas">
    <div class="h2"><span>Resumo de horas</span></div>
    <div class="pay">
      <div v-for="l in resumo" :key="l.label" class="ln" style="min-height: 44px; padding: 10px 0">
        <div class="d">{{ l.label }}</div>
        <div class="v" :class="l.cls">{{ l.value }}</div>
      </div>
    </div>
  </section>

  <section class="card" aria-label="Dias lançados">
    <div class="h2"><span>Dias lançados</span><span class="muted">toque para editar</span></div>

    <div v-if="!entradas.length" class="empty">Nenhum dia lançado ainda.</div>

    <div class="list">
      <template v-for="(e, i) in entradas" :key="e.kind === 'day' ? e.dk : e.from">
        <div
          v-if="i === futIdx && futFirst && futLast"
          class="note-box warn"
          style="margin: 6px 0 2px; font-weight: 600"
        >
          Lançados adiantado: {{ futCount }} {{ futCount === 1 ? 'dia' : 'dias' }} ({{ fmtDM(futFirst.kind === 'day' ? futFirst.dk : '') }} a
          {{ fmtDM(futLast.kind === 'day' ? futLast.dk : '') }}) ainda não aconteceram, mas já entram nas {{ min2hm(c.worked) }} e no líquido.
        </div>

        <button v-if="e.kind === 'run'" class="day run" @click="openDay(e.from)">
          <div class="dn">
            <b class="rng">{{ Number(e.from.slice(8)) }}–{{ Number(e.to.slice(8)) }}</b>
            <small>{{ MES_ABR[Number(e.from.slice(5, 7)) - 1] }}</small>
          </div>
          <div>
            <span class="chip" :class="EFFCLS[e.eff]">{{ EFF[e.eff] }}</span>
            <div class="muted" style="margin-top: 4px">{{ e.eff === 'feriado' && e.hol ? e.hol + ' · ' : '' }}{{ runDesc(e) }}</div>
          </div>
          <div class="hrs" style="font-weight: 600; color: var(--ink2)">{{ e.days }} d</div>
        </button>

        <button v-else class="day" :class="{ today: e.dk === tk, fut: e.fut }" @click="openDay(e.dk)">
          <div class="dn">
            <b>{{ e.dk.slice(8) }}</b>
            <small>{{ e.dk === tk ? 'hoje' : DSEM[dow(e.dk)] }}</small>
          </div>
          <div>
            <div v-if="e.cd.rec.p && e.cd.rec.p.length" class="pts">{{ e.cd.rec.p.join(' ') }}<template v-if="e.cd.warn"> ⚠</template></div>
            <template v-if="e.cd.eff !== 'normal'">
              <span class="chip" :class="EFFCLS[e.cd.eff]">{{ EFF[e.cd.eff] || e.cd.eff }}</span>
              <div v-if="e.cd.hol && e.cd.eff === 'feriado'" class="muted" style="margin-top: 4px">{{ e.cd.hol }}</div>
            </template>
            <span v-if="e.cd.pending" class="chip warn">Sem registro</span>
            <span v-if="e.cd.tasks.length" class="chip" style="margin-left: 4px">☑ {{ e.cd.tasks.filter((t) => t.ok).length }}/{{ e.cd.tasks.length }}</span>
            <div v-if="e.cd.rec.note" class="muted">{{ e.cd.rec.note }}</div>
          </div>
          <div class="hrs">
            <template v-if="e.cd.hasData && e.cd.worked">{{ min2hm(e.cd.worked) }}</template>
            <small v-if="e.cd.hasData && e.cd.worked - e.cd.expected !== 0 && e.cd.eff !== 'falta'" :class="e.cd.worked - e.cd.expected > 0 ? 'pos' : 'neg'">
              {{ min2hm(e.cd.worked - e.cd.expected, true) }}
            </small>
            <small v-if="e.cd.eff === 'falta'" class="neg">-{{ min2hm(e.cd.expected || escMin(e.dk)) }}</small>
          </div>
        </button>
      </template>
    </div>

    <button class="btn sec block" style="margin-top: 12px" @click="openAddDaySheet(mk)">
      <svg class="i sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Lançar outro dia
    </button>
  </section>
</template>
