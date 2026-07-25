<script setup lang="ts">
/* Host do diálogo de tarefa (index.html #taskModal 486-498 + taskSheet 731-741).
   Espelha o padrão do DialogHost: singleton reativo (taskSheet) + resolveTaskSheet
   de src/lib/taskSheet.ts, renderizado uma única vez no App.vue. */
import { taskSheet, resolveTaskSheet } from '@/lib/taskSheet'
</script>

<template>
  <div v-if="taskSheet.open" class="overlay" @click.self="resolveTaskSheet(false)">
    <div class="sheet">
      <h3>Editar tarefa</h3>
      <label class="f">Descrição<input v-model="taskSheet.txt" /></label>
      <label class="f">Data<input v-model="taskSheet.date" type="date" /></label>
      <p v-if="taskSheet.isRec" class="muted" style="margin-bottom: 10px">
        Tarefa recorrente: ao mudar a data e escolher "esta e as futuras", as próximas ocorrências
        passam a ser calculadas a partir da nova data.
      </p>
      <div class="row">
        <button class="btn" @click="resolveTaskSheet(true)">Salvar</button>
        <button class="btn ghost" style="flex: none" @click="resolveTaskSheet(false)">Cancelar</button>
      </div>
    </div>
  </div>
</template>
