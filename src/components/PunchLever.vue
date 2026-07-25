<script setup lang="ts">
/* Alavanca de ponto (index.html markup 240-247 + leverDown/Move/Up 1761-1795).
   Arraste por ponteiro que empurra --p de 0→1 em .punch-outer; ao chegar em 1
   emite 'punch' e reseta o anel após ~260ms. O label é sempre 'Carimbar'
   (punchState() do legado retorna 'Carimbar'). Reutiliza as classes do
   style.css; a posição imperativa via --p fica em CSS, não em utilitários. */
import { ref } from 'vue'

const emit = defineEmits<{ punch: [] }>()

const LEVER_TRAVEL = 122

const outer = ref<HTMLElement | null>(null)
let dragging = false
let fired = false
let startY = 0

/** setRing(p): reflete a posição da alavanca em --p (clamp 0..1). */
function setRing(p: number): void {
  outer.value?.style.setProperty('--p', String(Math.min(1, Math.max(0, p))))
}

function down(e: PointerEvent): void {
  if (e.button != null && e.button !== 0) return
  e.preventDefault()
  const t = e.target as Element & { setPointerCapture?: (id: number) => void }
  try {
    t.setPointerCapture?.(e.pointerId)
  } catch {
    /* ignore */
  }
  dragging = true
  fired = false
  startY = e.clientY
}

function move(e: PointerEvent): void {
  if (!dragging || fired) return
  const p = (e.clientY - startY) / LEVER_TRAVEL
  setRing(p)
  if (p >= 1) {
    fired = true
    dragging = false
    emit('punch')
    setTimeout(() => setRing(0), 260)
  }
}

function up(): void {
  if (!dragging) return
  dragging = false
  if (!fired) setRing(0)
}
</script>

<template>
  <div ref="outer" class="punch-outer">
    <span class="lever-label">Carimbar</span>
    <button
      id="btnPunch"
      aria-label="Puxe a alavanca para bater o ponto"
      @touchstart.prevent
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @contextmenu.prevent
    >
      <span class="lever-ticks"><span>▾</span><span>▾</span><span>▾</span><span>▾</span></span>
      <span class="lever-grip"></span>
    </button>
    <span class="lever-caption">puxe</span>
  </div>
</template>
