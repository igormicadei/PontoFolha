<script setup lang="ts">
/* Editor de dia: tipo do dia em chips, batidas com rótulo, resultado ao vivo,
   agenda do dia e observação. "Limpar este dia" fica separado do Salvar. */
import { computed } from 'vue'
import Sheet from './Sheet.vue'
import TaskItem from './TaskItem.vue'
import { useFolha } from '@/stores/folha'
import { dow, hm2min, min2hm, num } from '@/lib/utils'
import {
  daySheet,
  addPunchRow,
  removePunchRow,
  addDayTask,
  toggleDayTask,
  delDayTask,
  closeDaySheet,
  clearDay,
  saveDay,
  addDaySheet,
  resolveAddDaySheet
} from '@/lib/daySheet'

const folha = useFolha()

const TIPOS = [
  { v: 'auto', lb: 'Automático' },
  { v: 'normal', lb: 'Normal' },
  { v: 'feriado', lb: 'Feriado' },
  { v: 'ferias', lb: 'Férias' },
  { v: 'abonado', lb: 'Abonado' },
  { v: 'falta', lb: 'Falta' }
]

const recurring = computed(() => (daySheet.open ? folha.recOccur(daySheet.dk) : []))

function rotulo(i: number): string {
  if (!daySheet.open) return ''
  const b = folha.cfgFor(daySheet.dk.slice(0, 7)).batidas
  if (b === '4' && i < 4) return ['Entrada', 'Almoço', 'Volta', 'Saída'][i]!
  if (b === '2' && i < 2) return ['Entrada', 'Saída'][i]!
  return `Batida ${i + 1}`
}

/** Resultado ao vivo do rascunho (mesma regra do almoço automático do motor). */
const resultado = computed(() => {
  if (!daySheet.open) return null
  const cfg = folha.cfgFor(daySheet.dk.slice(0, 7))
  const ps = daySheet.punches
    .map(hm2min)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  if (ps.length < 2 || ps.length % 2) return null
  let w = 0
  for (let i = 0; i + 1 < ps.length; i += 2) w += ps[i + 1]! - ps[i]!
  if (ps.length === 2 && Number(cfg.autoAlmoco) === 1 && w > num(cfg.almocoMin)) w -= num(cfg.almocoMin)
  const prev = num(cfg.escala[dow(daySheet.dk)])
  return { w, d: w - prev, prev }
})
</script>

<template>
  <Sheet :open="daySheet.open" :title="daySheet.title" :subtitle="daySheet.subtitle" @close="closeDaySheet">
    <div class="field">
      <span id="ds-tipo" class="lb">Tipo do dia</span>
      <div class="chips" role="group" aria-labelledby="ds-tipo">
        <button
          v-for="t in TIPOS"
          :key="t.v"
          class="pill"
          :class="{ on: daySheet.dayType === t.v }"
          :aria-pressed="daySheet.dayType === t.v"
          @click="daySheet.dayType = t.v"
        >
          {{ t.lb }}
        </button>
      </div>
      <span class="hint">Automático segue o calendário: normal, feriado ou férias.</span>
    </div>

    <div class="field">
      <span id="ds-bat" class="lb">Batidas</span>
      <div class="stack" role="group" aria-labelledby="ds-bat">
        <div v-for="(_, i) in daySheet.punches" :key="i" class="rowflex">
          <span class="muted" style="width: 60px">{{ rotulo(i) }}</span>
          <input v-model="daySheet.punches[i]" type="time" class="input mono grow" :aria-label="rotulo(i)" />
          <button class="iconbtn" :aria-label="`Remover ${rotulo(i)}`" @click="removePunchRow(i)">
            <svg class="i sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>
      <div class="between" style="margin-top: 2px">
        <button class="link" @click="addPunchRow()">
          <svg class="i sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Adicionar batida
        </button>
        <span v-if="resultado" class="rowflex">
          <b>{{ min2hm(resultado.w) }}</b>
          <span v-if="resultado.d !== 0" class="chip" :class="resultado.d > 0 ? 'ok' : 'bad'">{{ min2hm(resultado.d, true) }}</span>
        </span>
      </div>
    </div>

    <div class="field">
      <span id="ds-atv" class="lb">Agenda e atividades do dia</span>
      <div role="group" aria-labelledby="ds-atv">
        <div v-for="(t, i) in daySheet.tasks" :key="'p' + i" class="li" :class="{ done: t.ok }" style="min-height: 52px">
          <button class="check" :aria-label="t.ok ? 'Reabrir' : 'Concluir'" @click="toggleDayTask(i)">
            <i><svg v-if="t.ok" class="i sm" viewBox="0 0 24 24" style="width: 14px; height: 14px; stroke-width: 3"><path d="M5 12l5 5 9-10" /></svg></i>
          </button>
          <span class="grow t">{{ t.t }}</span>
          <button class="iconplain bad" aria-label="Excluir item" @click="delDayTask(i)">
            <svg class="i sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <TaskItem
          v-for="r in recurring"
          :key="r.id"
          :dk="daySheet.dk"
          :task="{ t: r.t, ok: r.ok, kind: 'r', id: r.id, freq: r.freq }"
        />
      </div>
      <div class="rowflex">
        <input
          v-model="daySheet.newTaskTxt"
          class="input grow"
          placeholder="Ex.: faturamento convênio X, malote…"
          aria-label="Novo item da agenda"
          @keyup.enter="addDayTask"
        />
        <button class="iconbtn solid" aria-label="Adicionar item" @click="addDayTask">
          <svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
    </div>

    <div class="field">
      <label for="ds-obs">Observação</label>
      <input id="ds-obs" v-model="daySheet.note" class="input" placeholder="Opcional" />
    </div>

    <button class="link bad" style="align-self: flex-start" @click="clearDay">Limpar este dia</button>

    <template #footer>
      <button class="btn ghost" @click="closeDaySheet">Cancelar</button>
      <button class="btn grow" @click="saveDay">Salvar dia</button>
    </template>
  </Sheet>

  <Sheet :open="addDaySheet.open" title="Lançar outro dia" @close="resolveAddDaySheet(false)">
    <div class="field">
      <label for="ad-d">Dia do mês (1 a {{ addDaySheet.max }})</label>
      <input
        id="ad-d"
        v-model="addDaySheet.day"
        class="input num"
        type="number"
        min="1"
        :max="addDaySheet.max"
        inputmode="numeric"
        @keyup.enter="resolveAddDaySheet(true)"
      />
    </div>
    <template #footer>
      <button class="btn ghost" @click="resolveAddDaySheet(false)">Cancelar</button>
      <button class="btn grow" @click="resolveAddDaySheet(true)">Abrir dia</button>
    </template>
  </Sheet>
</template>
