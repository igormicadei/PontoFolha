<script setup lang="ts">
/* Host dos diálogos ask()/confirmS() (index.html #askModal 478-484 + ask() 604).
   Renderiza o sheet quando dlg.open; cada botão resolve a Promise. */
import { dlg, resolveDlg } from '@/lib/dialog'
</script>

<template>
  <div v-if="dlg.open" class="overlay" @click.self="resolveDlg(null)">
    <div class="sheet">
      <h3>{{ dlg.title }}</h3>
      <div v-if="dlg.body">
        <p class="muted" style="margin-bottom: 4px">{{ dlg.body }}</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px">
        <button
          v-for="(b, i) in dlg.btns"
          :key="i"
          :class="`btn ${b.cls || ''}`"
          @click="resolveDlg(b.val)"
        >
          {{ b.lb }}
        </button>
      </div>
    </div>
  </div>
</template>
