/* ================= diálogos ================= */
/* Espelha ask()/confirmS() do legado (index.html 604-618): um sheet modal com
   título, corpo opcional e uma pilha vertical de botões; sempre acrescenta um
   "Cancelar" que resolve null. Baseado em Promise — o <DialogHost> renderiza o
   estado reativo e resolve a Promise ao clicar. */

import { reactive } from 'vue'

export interface DlgBtn {
  lb: string
  cls?: string
  val: unknown
}

interface DlgState {
  open: boolean
  title: string
  body: string
  btns: DlgBtn[]
  resolve: ((v: unknown) => void) | null
}

export const dlg = reactive<DlgState>({
  open: false,
  title: '',
  body: '',
  btns: [],
  resolve: null
})

/** ask(title, body, btns) → Promise<val|null>. Um "Cancelar" (null) é anexado. */
export function ask(title: string, body: string, btns: DlgBtn[]): Promise<unknown> {
  return new Promise((res) => {
    dlg.title = title
    dlg.body = body
    dlg.btns = btns.concat([{ lb: 'Cancelar', cls: 'ghost', val: null }])
    dlg.resolve = res
    dlg.open = true
  })
}

/** Resolve o diálogo aberto com o valor do botão clicado (ou null ao cancelar). */
export function resolveDlg(val: unknown): void {
  const res = dlg.resolve
  dlg.open = false
  dlg.resolve = null
  if (res) res(val)
}

/** confirmS(title, body) → Promise<boolean> (index.html 618). */
export function confirmS(title: string, body: string): Promise<boolean> {
  return ask(title, body, [{ lb: 'Confirmar', cls: 'warn', val: true }]).then((v) => v === true)
}
