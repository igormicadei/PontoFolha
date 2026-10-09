/* ================= toast ================= */
/* Singleton reativo: uma mensagem efêmera acima da barra de abas. Pode levar
   uma ação ("Desfazer"); com ação a mensagem fica mais tempo. O <ToastHost>
   renderiza o estado; qualquer módulo chama toast() para dispará-lo. */

import { ref } from 'vue'

export interface ToastAction {
  label: string
  run: () => void
}

export const toastMsg = ref('')
export const toastShown = ref(false)
export const toastAction = ref<ToastAction | null>(null)
let toastT: ReturnType<typeof setTimeout> | undefined

export function toast(msg: string, action?: ToastAction, ms?: number): void {
  toastMsg.value = msg
  toastAction.value = action || null
  toastShown.value = true
  clearTimeout(toastT)
  toastT = setTimeout(
    () => {
      toastShown.value = false
      toastAction.value = null
    },
    ms ?? (action ? 8000 : 2800)
  )
}

export function runToastAction(): void {
  const a = toastAction.value
  toastShown.value = false
  toastAction.value = null
  clearTimeout(toastT)
  a?.run()
}
