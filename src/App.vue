<script setup lang="ts">
/* Casca da aplicação (index.html <div class="app"> 200-505 + startup 1819-1837).
   Header com relógio vivo + <RouterView> + navegação inferior (oculta no
   onboarding). Efeitos de partida: aplica tema, busca feriados e pede
   persistência de armazenamento. O registro do Service Worker fica no
   vite-plugin-pwa (Pacote #7), não aqui. */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFolha } from '@/stores/folha'
import { pad } from '@/lib/utils'
import BottomNav from '@/components/BottomNav.vue'
import ToastHost from '@/components/ToastHost.vue'
import DialogHost from '@/components/DialogHost.vue'
import TaskSheetHost from '@/components/TaskSheetHost.vue'
import FeriasSheetHost from '@/components/FeriasSheetHost.vue'
import DaySheetHost from '@/components/DaySheetHost.vue'
import ConfSheetHost from '@/components/ConfSheetHost.vue'

const folha = useFolha()
const { S } = storeToRefs(folha)
const route = useRoute()

const showNav = computed(() => route.name !== 'onboarding')

/* Relógio (index.html tick() 1752-1760): dd/mm HH:MM:SS, a cada segundo. */
const clock = ref('')
function tick(): void {
  const d = new Date()
  clock.value = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
let clockTimer: ReturnType<typeof setInterval> | undefined

/* applyTheme() (index.html 1706): reflete S.ui.theme em <html data-theme>. */
function applyTheme(): void {
  document.documentElement.dataset.theme = S.value.ui.theme
}
watch(() => S.value.ui.theme, applyTheme)

onMounted(() => {
  applyTheme()
  tick()
  clockTimer = setInterval(tick, 1000)
  // Feriados: só na primeira vez e se online (index.html 1821).
  if (!Object.keys(S.value.holidays).length && navigator.onLine) {
    folha.fetchFeriados().catch(() => {})
  }
  // Pede armazenamento persistente (index.html 1826).
  navigator.storage?.persist?.().catch(() => {})
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <div class="app">
    <header class="top">
      <h1 id="hTitle">Ponto<span class="amp">&amp;</span>Folha</h1>
      <div class="row" style="flex: none; width: auto; gap: 10px">
        <div class="clock">{{ clock }}</div>
      </div>
    </header>

    <RouterView />

    <BottomNav v-if="showNav" />
  </div>

  <ToastHost />
  <DialogHost />
  <TaskSheetHost />
  <FeriasSheetHost />
  <DaySheetHost />
  <ConfSheetHost />
</template>
