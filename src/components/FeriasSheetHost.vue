<script setup lang="ts">
/* Sheet do editor de férias (index.html openFerias 1658-1687: os inputs que o
   `ask()` do legado montava num <form>). Espelha o TaskSheetHost — renderizado
   uma única vez no App.vue. Botões: Programar/Salvar (save), Excluir período
   (del, só na edição), Cancelar. */
import { feriasSheet, resolveFeriasSheet } from '@/lib/ferias'
</script>

<template>
  <div v-if="feriasSheet.open" class="overlay" @click.self="resolveFeriasSheet(null)">
    <div class="sheet">
      <h3>{{ feriasSheet.isEdit ? 'Editar férias' : 'Programar férias' }}</h3>
      <label class="f">Início<input v-model="feriasSheet.ini" type="date" /></label>
      <label class="f"
        >Fim (último dia de descanso)<input v-model="feriasSheet.fim" type="date"
      /></label>
      <label class="f"
        >Dias vendidos (abono, máx. 10)<input
          v-model.number="feriasSheet.vend"
          type="number"
          min="0"
          max="10"
          inputmode="numeric"
      /></label>
      <div class="row">
        <button class="btn" @click="resolveFeriasSheet('save')">
          {{ feriasSheet.isEdit ? 'Salvar' : 'Programar' }}
        </button>
        <button
          v-if="feriasSheet.isEdit"
          class="btn warn"
          style="flex: none"
          @click="resolveFeriasSheet('del')"
        >
          Excluir período
        </button>
        <button class="btn ghost" style="flex: none" @click="resolveFeriasSheet(null)">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>
