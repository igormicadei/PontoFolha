<script setup lang="ts">
/* Host do editor de dia (index.html #dayModal 448-475). Espelha o
   FeriasSheetHost/TaskSheetHost: renderiza o singleton daySheet (src/lib/
   daySheet.ts), montado uma única vez no App.vue. Tarefas pontuais usam o
   rascunho local (daySheet.tasks); as ocorrências recorrentes do dia
   (folha.recOccur) reaproveitam o <TaskItem>, que já comita direto na store
   (toggleT/editT/delT), igual ao legado dentro do próprio modal. */
import { computed } from 'vue'
import { useFolha } from '@/stores/folha'
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
import TaskItem from './TaskItem.vue'

const folha = useFolha()

const recurring = computed(() => (daySheet.open ? folha.recOccur(daySheet.dk) : []))
</script>

<template>
  <div v-if="daySheet.open" class="overlay" @click.self="closeDaySheet">
    <div class="sheet">
      <h3>{{ daySheet.title }}</h3>

      <label class="f"
        >Tipo do dia
        <select v-model="daySheet.dayType">
          <option value="auto">Automático (normal / feriado / férias)</option>
          <option value="normal">Dia normal de trabalho</option>
          <option value="feriado">Feriado</option>
          <option value="ferias">Férias</option>
          <option value="abonado">Abonado (atestado, ponte etc.)</option>
          <option value="falta">Falta (descontar)</option>
        </select></label
      >

      <label class="f" style="margin-bottom: 6px">Batidas</label>
      <div>
        <div v-for="(_, i) in daySheet.punches" :key="i" class="prow">
          <input v-model="daySheet.punches[i]" type="time" />
          <button class="del" title="remover" @click="removePunchRow(i)">×</button>
        </div>
      </div>
      <button class="btn ghost small" style="margin: 4px 0 12px" @click="addPunchRow()">
        + batida
      </button>

      <label class="f" style="margin-bottom: 6px">Agenda / atividades do dia</label>
      <div>
        <div
          v-for="(t, i) in daySheet.tasks"
          :key="'p' + i"
          class="task-item"
          :class="{ done: t.ok }"
        >
          <input type="checkbox" :checked="t.ok" @change="toggleDayTask(i)" />
          <span class="t">{{ t.t }}</span>
          <button class="icon del" title="excluir" @click="delDayTask(i)">×</button>
        </div>
        <TaskItem
          v-for="r in recurring"
          :key="r.id"
          :dk="daySheet.dk"
          :task="{ t: r.t, ok: r.ok, kind: 'r', id: r.id, freq: r.freq }"
        />
        <p v-if="!daySheet.tasks.length && !recurring.length" class="muted">Nenhum item.</p>
      </div>
      <div class="row" style="margin: 4px 0 12px">
        <input
          v-model="daySheet.newTaskTxt"
          placeholder="Ex.: faturamento convênio X, malote…"
          @keyup.enter="addDayTask"
        />
        <button class="btn ghost small" style="flex: none" @click="addDayTask">+ item</button>
      </div>

      <label class="f">Observação<input v-model="daySheet.note" placeholder="opcional" /></label>

      <div class="row">
        <button class="btn" @click="saveDay">Salvar</button>
        <button class="btn warn" style="flex: none" @click="clearDay">Limpar dia</button>
        <button class="btn ghost" style="flex: none" @click="closeDaySheet">Cancelar</button>
      </div>
    </div>
  </div>

  <div v-if="addDaySheet.open" class="overlay" @click.self="resolveAddDaySheet(false)">
    <div class="sheet">
      <h3>Adicionar dia</h3>
      <label class="f"
        >Dia do mês (1-{{ addDaySheet.max }})<input
          v-model="addDaySheet.day"
          type="number"
          min="1"
          :max="addDaySheet.max"
          inputmode="numeric"
          @keyup.enter="resolveAddDaySheet(true)"
      /></label>
      <div class="row">
        <button class="btn" @click="resolveAddDaySheet(true)">Abrir dia</button>
        <button class="btn ghost" style="flex: none" @click="resolveAddDaySheet(false)">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>
