<script setup lang="ts">
/* Host dos sheets de conferência (index.html openConf/openFerConf 1311-1344 +
   openConfX 1345-1362). Espelha o FeriasSheetHost: dois singletons reativos
   de src/lib/confSheet.ts, montados uma única vez no App.vue. numConfSheet
   cobre o valor único (holerite mensal ou recibo de férias); xConfSheet cobre
   a verba não prevista (desc + valor + tipo + excluir). */
import { numConfSheet, resolveNumConfSheet, xConfSheet, resolveXConfSheet } from '@/lib/confSheet'
import { brl } from '@/lib/utils'
</script>

<template>
  <div v-if="numConfSheet.open" class="overlay" @click.self="resolveNumConfSheet(null)">
    <div class="sheet">
      <h3>{{ numConfSheet.title }}</h3>
      <p class="muted" style="margin-bottom: 4px">
        Valor do app: <b class="mono">{{ brl(numConfSheet.appValue) }}</b>. Digite o valor que
        consta no documento:
      </p>
      <input
        v-model="numConfSheet.value"
        type="number"
        step="0.01"
        inputmode="decimal"
        class="mono"
        style="text-align: right; margin-bottom: 10px"
      />
      <div class="row">
        <button class="btn" @click="resolveNumConfSheet('save')">Salvar</button>
        <button class="btn warn" style="flex: none" @click="resolveNumConfSheet('clear')">
          Limpar valor
        </button>
      </div>
    </div>
  </div>

  <div v-if="xConfSheet.open" class="overlay" @click.self="resolveXConfSheet(null)">
    <div class="sheet">
      <h3>{{ xConfSheet.title }}</h3>
      <label class="f">Descrição (como está no holerite)<input v-model="xConfSheet.desc" /></label>
      <label class="f"
        >Valor (R$)<input
          v-model="xConfSheet.valor"
          type="number"
          step="0.01"
          inputmode="decimal"
          class="mono"
          style="text-align: right"
      /></label>
      <label class="f"
        >Tipo
        <select v-model="xConfSheet.tipo">
          <option value="c">Crédito (provento)</option>
          <option value="d">Débito (desconto)</option>
        </select></label
      >
      <div class="row">
        <button class="btn" @click="resolveXConfSheet('save')">Salvar</button>
        <button
          v-if="xConfSheet.isEdit"
          class="btn warn"
          style="flex: none"
          @click="resolveXConfSheet('del')"
        >
          Excluir verba
        </button>
      </div>
    </div>
  </div>
</template>
