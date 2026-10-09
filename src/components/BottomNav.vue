<script setup lang="ts">
/* Barra de abas: Hoje · Tarefas · Folha · Ajustes. Folha fica ativa também no
   detalhe do mês; Ajustes também nas páginas de seção. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const name = computed(() => String(route.name))
const tabs = computed(() => [
  { to: '/', label: 'Hoje', on: name.value === 'home' },
  { to: '/tarefas', label: 'Tarefas', on: name.value === 'tasks' },
  { to: '/folha', label: 'Folha', on: name.value === 'folha' || name.value === 'month' },
  { to: '/ajustes', label: 'Ajustes', on: name.value === 'ajustes' || name.value === 'ajustes-secao' }
])
</script>

<template>
  <nav class="tabbar" aria-label="Principal">
    <RouterLink v-for="(t, i) in tabs" :key="t.to" :to="t.to" custom v-slot="{ navigate }">
      <button class="tab" :class="{ on: t.on }" :aria-current="t.on ? 'page' : undefined" @click="navigate">
        <span class="ico">
          <svg v-if="i === 0" class="i" viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
          <svg v-else-if="i === 1" class="i" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          <svg v-else-if="i === 2" class="i" viewBox="0 0 24 24"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" /><path d="M9 7h6M9 11h6M9 15h4" /></svg>
          <svg v-else class="i" viewBox="0 0 24 24"><path d="M4 7h8M16 7h4M4 17h4M12 17h8" /><circle cx="14" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
        </span>
        {{ t.label }}
      </button>
    </RouterLink>
  </nav>
</template>
