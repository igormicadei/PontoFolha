<script setup lang="ts">
/* Casca da aplicação: <RouterView> + barra de abas (oculta no onboarding, nas
   páginas de ajuste com barra de salvar e no relatório) + hosts globais de
   sheets, diálogos e toast. Cada tela desenha a própria barra superior. Efeitos
   de partida: aplica o tema, busca feriados na primeira vez e pede persistência
   de armazenamento. O Service Worker fica a cargo do vite-plugin-pwa. */
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFolha } from '@/stores/folha'
import BottomNav from '@/components/BottomNav.vue'
import ToastHost from '@/components/ToastHost.vue'
import DialogHost from '@/components/DialogHost.vue'
import TaskSheetHost from '@/components/TaskSheetHost.vue'
import FeriasSheetHost from '@/components/FeriasSheetHost.vue'
import DaySheetHost from '@/components/DaySheetHost.vue'
import ConfSheetHost from '@/components/ConfSheetHost.vue'
import ItemSheetHost from '@/components/ItemSheetHost.vue'

const folha = useFolha()
const { S } = storeToRefs(folha)
const route = useRoute()

const showNav = computed(() => !['onboarding', 'ajustes-secao', 'relatorio'].includes(String(route.name)))

function applyTheme(): void {
  document.documentElement.dataset.theme = S.value.ui.theme
}
watch(() => S.value.ui.theme, applyTheme)

onMounted(() => {
  applyTheme()
  if (!Object.keys(S.value.holidays).length && navigator.onLine) {
    folha.fetchFeriados().catch(() => {})
  }
  navigator.storage?.persist?.().catch(() => {})
})
</script>

<template>
  <div class="app" :class="{ nonav: !showNav, wide: route.name === 'relatorio' }">
    <RouterView />
    <BottomNav v-if="showNav" />
  </div>

  <ToastHost />
  <DialogHost />
  <TaskSheetHost />
  <FeriasSheetHost />
  <DaySheetHost />
  <ConfSheetHost />
  <ItemSheetHost />
</template>
