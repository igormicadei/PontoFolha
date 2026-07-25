/* ================= toast ================= */
/* Singleton reativo que espelha toast() do legado (index.html 589-590): uma
   mensagem efêmera em pill no rodapé, escondida após 2,8s. O <ToastHost>
   renderiza o estado; qualquer módulo chama toast() para dispará-lo. */

import { ref } from 'vue'

export const toastMsg = ref('')
export const toastShown = ref(false)
let toastT: ReturnType<typeof setTimeout> | undefined

export function toast(msg: string): void {
  toastMsg.value = msg
  toastShown.value = true
  clearTimeout(toastT)
  toastT = setTimeout(() => {
    toastShown.value = false
  }, 2800)
}
