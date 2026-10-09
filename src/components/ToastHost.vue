<script setup lang="ts">
/* Host do toast: pill escura acima da barra de abas; com ação (Desfazer) vira
   um alvo de toque de 44 px e anuncia a mudança via role=status. */
import { toastMsg, toastShown, toastAction, runToastAction } from '@/lib/toast'
</script>

<template>
  <div class="toast" :class="{ show: toastShown, act: toastAction }" role="status" aria-live="polite">
    <span>{{ toastMsg }}</span>
    <button v-if="toastAction" @click="runToastAction">{{ toastAction.label }}</button>
  </div>
</template>
