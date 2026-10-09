/* Vigência em edição nos Ajustes (antes um `vigIdx` local do ConfigView).
   Compartilhado entre a lista de Ajustes e as páginas de seção. */
import { ref } from 'vue'
import type { State, Vigencia } from '@/stores/types'
import { MESES } from './utils'

export const vigIdx = ref(-1)

export function clampVig(S: State): number {
  if (vigIdx.value < 0 || vigIdx.value >= S.vig.length) vigIdx.value = S.vig.length - 1
  return vigIdx.value
}

export function vigLabel(v: Vigencia): string {
  return v.desde === '1900-01'
    ? 'Inicial (desde o começo)'
    : 'Desde ' + MESES[Number(v.desde.slice(5, 7)) - 1] + '/' + v.desde.slice(0, 4)
}
