<script setup lang="ts">
/* Host do editor de férias: início, fim e dias vendidos. Excluir fica separado
   do Salvar (só na edição). */
import Sheet from './Sheet.vue'
import { feriasSheet, resolveFeriasSheet } from '@/lib/ferias'
</script>

<template>
  <Sheet
    :open="feriasSheet.open"
    :title="feriasSheet.isEdit ? 'Editar férias' : 'Programar férias'"
    @close="resolveFeriasSheet(null)"
  >
    <div class="grid2">
      <div class="field">
        <label for="fe-ini">Início</label>
        <input id="fe-ini" v-model="feriasSheet.ini" type="date" class="input" />
      </div>
      <div class="field">
        <label for="fe-fim">Último dia</label>
        <input id="fe-fim" v-model="feriasSheet.fim" type="date" class="input" />
      </div>
    </div>
    <div class="field">
      <label for="fe-vend">Dias vendidos (abono, máx. 10)</label>
      <input
        id="fe-vend"
        v-model.number="feriasSheet.vend"
        class="input num"
        type="number"
        min="0"
        max="10"
        inputmode="numeric"
      />
    </div>
    <button v-if="feriasSheet.isEdit" class="link bad" style="align-self: flex-start" @click="resolveFeriasSheet('del')">
      Excluir este período
    </button>
    <template #footer>
      <button class="btn ghost" @click="resolveFeriasSheet(null)">Cancelar</button>
      <button class="btn grow" @click="resolveFeriasSheet('save')">
        {{ feriasSheet.isEdit ? 'Salvar' : 'Programar' }}
      </button>
    </template>
  </Sheet>
</template>
