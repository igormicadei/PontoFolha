<script setup lang="ts">
/* "Como a média de horas extras foi calculada": cada passo do manual 8.1 com os
   números do período (horas no período, média, valor da hora extra hoje, DSR,
   proporção aos dias de gozo e o terço sobre a média). */
import { computed } from 'vue'
import { useFolha } from '@/stores/folha'
import type { Ferias } from '@/stores/types'
import { brl, fmtDK, min2hm } from '@/lib/utils'

const props = defineProps<{ ferias: Ferias }>()
const folha = useFolha()
const fc = computed(() => folha.feriasCalc(props.ferias, folha.cfgFor(props.ferias.ini.slice(0, 7))))
const m = computed(() => fc.value.mediaRef)
const modoTxt = computed(() =>
  m.value.modo === 'periodo' ? 'período aquisitivo completo' : m.value.modo === 'parcial' ? '1º período, ainda incompleto' : '12 meses antes das férias'
)
</script>

<template>
  <div class="pay">
    <div class="ln">
      <div class="d">Período de referência<small>{{ modoTxt }}</small></div>
      <div class="v">{{ fmtDK(m.ini) }} a {{ fmtDK(m.fim) }}<small>{{ m.meses }} {{ m.meses === 1 ? 'mês' : 'meses' }}</small></div>
    </div>
    <div class="ln">
      <div class="d">Horas extras lançadas no período<small>só as pagas (não conta banco de horas)</small></div>
      <div class="v">{{ min2hm(m.extraMin) }}</div>
    </div>
    <div class="ln">
      <div class="d">Média mensal de horas<small>{{ min2hm(m.extraMin) }} ÷ {{ m.meses }}</small></div>
      <div class="v">{{ min2hm(m.mediaMin) }}</div>
    </div>
    <div class="ln">
      <div class="d">Valor da hora extra hoje<small>{{ brl(m.vh) }} (salário ÷ jornada) × {{ (1 + m.pctExtra / 100).toFixed(2).replace('.', ',') }}</small></div>
      <div class="v">{{ brl(m.vhe) }}</div>
    </div>
    <div class="ln">
      <div class="d">Média mensal em dinheiro<small>{{ min2hm(m.mediaMin) }} × {{ brl(m.vhe) }}</small></div>
      <div class="v">{{ brl(m.mensalHE) }}</div>
    </div>
    <div v-if="m.mediaDsrMin > 0" class="ln">
      <div class="d">DSR sobre a média<small>{{ min2hm(m.mediaDsrMin) }} de repouso × {{ brl(m.vhe) }}</small></div>
      <div class="v">{{ brl(m.mensalDsr) }}</div>
    </div>
    <div class="ln">
      <div class="d">Proporcional aos {{ fc.dias }} dias de gozo<small>média mensal × {{ fc.dias }} ÷ 30</small></div>
      <div class="v">{{ brl(fc.media) }}</div>
    </div>
    <div class="ln">
      <div class="d">1/3 constitucional sobre a média</div>
      <div class="v">{{ brl(fc.media / 3) }}</div>
    </div>
    <div class="tot"><span>Total da média nas férias</span><span>{{ brl(fc.media + fc.media / 3) }}</span></div>
  </div>
</template>
