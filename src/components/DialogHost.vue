<script setup lang="ts">
/* Host dos diálogos ask()/confirmS(): cartão centralizado com título, texto e
   uma pilha de botões. Destrutivo ('warn') vira botão de perigo. */
import { dlg, resolveDlg } from '@/lib/dialog'

const cls = (c?: string): string => (c === 'warn' ? 'danger' : c || '')
</script>

<template>
  <div v-if="dlg.open" class="scrim center" @click.self="resolveDlg(null)" @keydown.esc="resolveDlg(null)">
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" :aria-describedby="dlg.body ? 'dlg-d' : undefined">
      <h2 id="dlg-t">{{ dlg.title }}</h2>
      <p v-if="dlg.body" id="dlg-d">{{ dlg.body }}</p>
      <div class="stack" style="margin-top: 12px">
        <button v-for="(b, i) in dlg.btns" :key="i" :class="['btn', 'block', cls(b.cls)]" @click="resolveDlg(b.val)">
          {{ b.lb }}
        </button>
      </div>
    </div>
  </div>
</template>
