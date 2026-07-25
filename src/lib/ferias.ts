/* ================= férias (sheet + orquestração) ================= */
/* Porta openFerias(i) do legado (index.html 1658-1687). O `ask()` do Vue
   (dialog.ts) só renderiza título/corpo/botões — sem inputs de formulário —,
   então o editor de férias é um sheet dedicado (feriasSheet), no mesmo padrão
   de singleton reativo do taskSheet.ts; o <FeriasSheetHost> renderiza. A
   orquestração (validações + confirmS + toast) fica aqui; as mutações puras
   caem em S.ferias e o watch da store persiste (save()/rerender() do legado
   foram removidos). i = -1 → novo período; i >= 0 → edição. */

import { reactive } from 'vue'
import { useFolha } from '@/stores/folha'
import { confirmS } from './dialog'
import { toast } from './toast'
import { yAdd, fmtDK } from './utils'

/** Resultado do sheet: botão acionado + valores do formulário (index.html: o
 *  `ask()` devolvia o `val` do botão e os inputs eram lidos depois). */
export interface FeriasSheetResult {
  action: 'save' | 'del'
  ini: string
  fim: string
  vend: number
}

interface FeriasSheetState {
  open: boolean
  isEdit: boolean
  ini: string
  fim: string
  vend: number
  resolve: ((v: FeriasSheetResult | null) => void) | null
}

export const feriasSheet = reactive<FeriasSheetState>({
  open: false,
  isEdit: false,
  ini: '',
  fim: '',
  vend: 0,
  resolve: null
})

/** Abre o sheet preenchido com o período `f` (index.html 1658-1665). */
export function openFeriasSheet(
  f: { ini: string; fim: string; vendidos?: number },
  isEdit: boolean
): Promise<FeriasSheetResult | null> {
  return new Promise((res) => {
    feriasSheet.ini = f.ini || ''
    feriasSheet.fim = f.fim || ''
    feriasSheet.vend = f.vendidos || 0
    feriasSheet.isEdit = isEdit
    feriasSheet.resolve = res
    feriasSheet.open = true
  })
}

/** Fecha o sheet resolvendo com o botão acionado (`save`/`del`) e os valores,
 *  ou null quando dispensado (index.html: `if(v===null)return`). */
export function resolveFeriasSheet(action: 'save' | 'del' | null): void {
  const res = feriasSheet.resolve
  const ini = feriasSheet.ini
  const fim = feriasSheet.fim
  const vend = Number(feriasSheet.vend) || 0
  feriasSheet.open = false
  feriasSheet.resolve = null
  if (!res) return
  if (action === null) res(null)
  else res({ action, ini, fim, vend })
}

/** Programa/edita/exclui um período de férias (index.html openFerias 1658-1687).
 *  i = -1 → novo; i >= 0 → edição do período nesse índice. */
export async function openFerias(i: number): Promise<void> {
  const folha = useFolha()
  const S = folha.S
  const edit = i != null && i >= 0
  const f = edit ? S.ferias[i] : { ini: '', fim: '', vendidos: 0 }
  const v = await openFeriasSheet(f, edit)
  if (v == null) return
  if (v.action === 'del') {
    if (
      await confirmS(
        'Excluir este período de férias?',
        'Os dias voltam a contar como dias normais de trabalho.'
      )
    ) {
      S.ferias.splice(i, 1)
      toast('Período excluído')
    }
    return
  }
  const ini = v.ini
  const fim = v.fim
  const vend = v.vend
  if (!ini || !fim || fim < ini) {
    toast('Preencha início e fim válidos.')
    return
  }
  if (vend < 0 || vend > 10) {
    toast('Abono: no máximo 10 dias.')
    return
  }
  if (S.ferias.some((x, k) => k !== i && ini <= x.fim && fim >= x.ini)) {
    toast('Período cruza com férias já cadastradas.')
    return
  }
  if (S.adm && ini < yAdd(S.adm, 1)) {
    if (
      !(await confirmS(
        'Antes do 1º período aquisitivo',
        'O direito ao gozo de férias só se completa em ' +
          fmtDK(yAdd(S.adm, 1)) +
          '. Programar mesmo assim?'
      ))
    )
      return
  }
  if (edit) S.ferias[i] = { ini, fim, vendidos: vend }
  else S.ferias.push({ ini, fim, vendidos: vend })
  S.ferias.sort((a, b) => (a.ini < b.ini ? -1 : 1))
  toast(edit ? 'Férias atualizadas' : 'Férias programadas')
}
