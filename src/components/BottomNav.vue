<script setup lang="ts">
/* Navegação inferior fixa (index.html <nav> 500-505). Reusa as classes CSS
   legadas (nav / nav button / .on). Jornada fica ativo tanto em /jornada
   quanto em /mes — como no legado, onde navJornada ganha .on para ambas. */
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const jornadaOn = computed(() => route.name === 'jornada' || route.name === 'month')
</script>

<template>
  <nav>
    <RouterLink to="/" custom v-slot="{ isActive, navigate }">
      <button :class="{ on: isActive }" @click="navigate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>Início
      </button>
    </RouterLink>
    <RouterLink to="/tarefas" custom v-slot="{ isActive, navigate }">
      <button :class="{ on: isActive }" @click="navigate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>Tarefas
      </button>
    </RouterLink>
    <RouterLink to="/jornada" custom v-slot="{ navigate }">
      <button :class="{ on: jornadaOn }" @click="navigate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>Jornada
      </button>
    </RouterLink>
    <RouterLink to="/config" custom v-slot="{ isActive, navigate }">
      <button :class="{ on: isActive }" @click="navigate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.51 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"
          />
        </svg>Config
      </button>
    </RouterLink>
  </nav>
</template>
