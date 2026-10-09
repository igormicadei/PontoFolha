<script setup lang="ts">
/* Hosts dos sheets de conferência: valor único (holerite ou recibo) e verba
   que só existe no holerite. */
import Sheet from './Sheet.vue'
import { numConfSheet, resolveNumConfSheet, xConfSheet, resolveXConfSheet } from '@/lib/confSheet'
import { brl } from '@/lib/utils'
</script>

<template>
  <Sheet :open="numConfSheet.open" :title="numConfSheet.title" @close="resolveNumConfSheet(null)">
    <div class="between note-box" style="background: var(--cream); color: var(--cream-ink)">
      <span class="eyebrow" style="color: rgba(var(--cream-rgb), 0.78)">Valor calculado pelo app</span>
      <b style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em">{{ brl(numConfSheet.appValue) }}</b>
    </div>
    <div class="field">
      <label for="nc-v">Valor no documento oficial</label>
      <div class="inwrap">
        <span class="pre">R$</span>
        <input
          id="nc-v"
          v-model="numConfSheet.value"
          class="input num withpre"
          type="number"
          step="0.01"
          inputmode="decimal"
          placeholder="0,00"
          style="font-size: 20px"
        />
      </div>
      <span class="hint">Diferenças acima de R$ 0,05 ficam destacadas e entram no PDF.</span>
    </div>
    <template #footer>
      <button class="btn ghost" @click="resolveNumConfSheet('clear')">Limpar valor</button>
      <button class="btn grow" @click="resolveNumConfSheet('save')">Salvar</button>
    </template>
  </Sheet>

  <Sheet :open="xConfSheet.open" :title="xConfSheet.title" @close="resolveXConfSheet(null)">
    <div class="field">
      <label for="xc-d">Descrição (como está no holerite)</label>
      <input id="xc-d" v-model="xConfSheet.desc" class="input" />
    </div>
    <div class="field">
      <label for="xc-v">Valor</label>
      <div class="inwrap">
        <span class="pre">R$</span>
        <input id="xc-v" v-model="xConfSheet.valor" class="input num withpre" type="number" step="0.01" inputmode="decimal" placeholder="0,00" />
      </div>
    </div>
    <div class="seg" role="group" aria-label="Tipo da verba">
      <button :class="{ on: xConfSheet.tipo === 'c' }" :aria-pressed="xConfSheet.tipo === 'c'" @click="xConfSheet.tipo = 'c'">Crédito</button>
      <button :class="{ on: xConfSheet.tipo === 'd' }" :aria-pressed="xConfSheet.tipo === 'd'" @click="xConfSheet.tipo = 'd'">Débito</button>
    </div>
    <button v-if="xConfSheet.isEdit" class="link bad" style="align-self: flex-start" @click="resolveXConfSheet('del')">
      Excluir esta verba
    </button>
    <template #footer>
      <button class="btn ghost" @click="resolveXConfSheet(null)">Cancelar</button>
      <button class="btn grow" @click="resolveXConfSheet('save')">Salvar</button>
    </template>
  </Sheet>
</template>
