<script setup lang="ts">
/* Avisos de confiabilidade da média de horas extras das férias: ponto faltando
   no período de referência, 1º período aquisitivo incompleto, admissão não
   informada etc. Os mesmos textos aparecem na aba Férias, na aba Folha e no
   relatório (a lista vem do motor, em feriasMediaInfo). `so` limita ao nível. */
import { computed } from 'vue'
import { useFolha } from '@/stores/folha'
import type { Ferias } from '@/stores/types'
import { fmtDM } from '@/lib/utils'

const props = defineProps<{ ferias: Ferias; so?: 'warn'; titulo?: boolean }>()
const folha = useFolha()
const itens = computed(() => {
  const l = folha.feriasMediaInfo(props.ferias).avisos
  return props.so ? l.filter((a) => a.nivel === props.so) : l
})
</script>

<template>
  <div v-if="itens.length" class="stack">
    <div v-for="(a, i) in itens" :key="i" class="note-box" :class="a.nivel === 'warn' ? 'warn' : ''">
      <b v-if="titulo && i === 0">Férias de {{ fmtDM(ferias.ini) }} a {{ fmtDM(ferias.fim) }}:</b>
      {{ a.texto }}
    </div>
  </div>
</template>
