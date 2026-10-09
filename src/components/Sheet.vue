<script setup lang="ts">
/* Primitivo único de sheet (alça, título, conteúdo, rodapé fixo). Todos os
   formulários modais do app (dia, férias, tarefa, conferência, item avulso)
   renderizam através dele. Fecha no Esc e ao tocar fora. */
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string; subtitle?: string; back?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const id = `sh-${Math.random().toString(36).slice(2, 7)}`

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close')
}
watch(
  () => props.open,
  (o) => {
    if (o) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
  { immediate: true }
)
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="open" class="scrim" @click.self="emit('close')">
    <div class="sheet" role="dialog" aria-modal="true" :aria-labelledby="id">
      <div class="grab"></div>
      <div class="between">
        <div class="grow">
          <h2 :id="id" class="sh-title">{{ title }}</h2>
          <div v-if="subtitle" class="muted" style="margin-top: 2px">{{ subtitle }}</div>
        </div>
        <button class="iconbtn" :aria-label="back ? 'Voltar' : 'Fechar'" @click="emit('close')">
          <svg v-if="back" class="i" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
          <svg v-else class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <slot />
      <div v-if="$slots.footer" class="foot"><slot name="footer" /></div>
      <div v-else style="height: 16px; flex: none"></div>
    </div>
  </div>
</template>
