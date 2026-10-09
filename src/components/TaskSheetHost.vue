<script setup lang="ts">
/* Host do diálogo de edição de tarefa (descrição + data). */
import Sheet from './Sheet.vue'
import { taskSheet, resolveTaskSheet } from '@/lib/taskSheet'
</script>

<template>
  <Sheet :open="taskSheet.open" title="Editar tarefa" @close="resolveTaskSheet(false)">
    <div class="field">
      <label for="tk-txt">Descrição</label>
      <input id="tk-txt" v-model="taskSheet.txt" class="input" />
    </div>
    <div class="field">
      <label for="tk-date">Data</label>
      <input id="tk-date" v-model="taskSheet.date" type="date" class="input" />
    </div>
    <p v-if="taskSheet.isRec" class="note-box">
      Tarefa recorrente: ao mudar a data e escolher "esta e as futuras", as próximas ocorrências passam a ser
      calculadas a partir da nova data.
    </p>
    <template #footer>
      <button class="btn ghost" @click="resolveTaskSheet(false)">Cancelar</button>
      <button class="btn grow" @click="resolveTaskSheet(true)">Salvar</button>
    </template>
  </Sheet>
</template>
