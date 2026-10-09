<script setup lang="ts">
/* Slider de ponto: arraste o botão rosa até o fim para bater o ponto. Substitui
   a alavanca vertical, com o mesmo gesto de arrastar e área bem maior para uma
   mão só. O toque simples NÃO bate o ponto (evita batida acidental); quem não
   pode ou não quer arrastar usa o botão "Bater ponto sem deslizar" da tela. */
import { onMounted, onBeforeUnmount, ref } from 'vue'

defineProps<{ label: string }>()
const emit = defineEmits<{ punch: [] }>()

const track = ref<HTMLElement | null>(null)
let dragging = false
let fired = false
let startX = 0
let travel = 200

function setP(p: number): void {
  track.value?.style.setProperty('--p', String(Math.min(1, Math.max(0, p))))
}
function measure(): void {
  if (!track.value) return
  travel = Math.max(80, track.value.clientWidth - 64)
  track.value.style.setProperty('--travel', `${travel}px`)
}
function down(e: PointerEvent): void {
  if (e.button != null && e.button !== 0) return
  e.preventDefault()
  ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  dragging = true
  fired = false
  startX = e.clientX
  track.value?.classList.add('drag')
}
function move(e: PointerEvent): void {
  if (!dragging || fired) return
  const p = (e.clientX - startX) / travel
  setP(p)
  if (p >= 0.92) {
    fired = true
    dragging = false
    track.value?.classList.remove('drag')
    setP(1)
    emit('punch')
    setTimeout(() => setP(0), 400)
  }
}
function up(): void {
  if (!dragging) return
  dragging = false
  track.value?.classList.remove('drag')
  if (!fired) setP(0)
}
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <div ref="track" class="slide">
    <span class="label">{{ label }}</span>
    <button
      class="knob"
      aria-label="Arraste para a direita para bater o ponto"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @contextmenu.prevent
    >
      <svg class="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  </div>
</template>
