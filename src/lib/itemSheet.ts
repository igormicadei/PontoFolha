/* ================= item avulso (sheet + orquestração) ================= */
/* Cria, edita e remove itens avulsos da folha do mês (créditos e débitos). O
   tipo escolhido define sozinho a tributação (lib/itemTypes). Mesmo padrão dos
   demais sheets: singleton reativo + orquestração aqui, renderizado pelo
   <ItemSheetHost>. A mutação cai direto em getMonth(mk).pags. */

import { reactive } from 'vue'
import { useFolha } from '@/stores/folha'
import { toast } from './toast'
import { ITEM_TYPES, itemType, isTaxable, typesOf, type ItemKind } from './itemTypes'
import { brl } from './utils'
import type { Pag } from '@/stores/types'

interface ItemSheetState {
  open: boolean
  step: 'form' | 'tipo'
  mk: string
  idx: number
  kind: ItemKind
  typeId: string
  taxable: boolean
  valor: string
  desc: string
}

export const itemSheet = reactive<ItemSheetState>({
  open: false,
  step: 'form',
  mk: '',
  idx: -1,
  kind: 'c',
  typeId: 'premio',
  taxable: true,
  valor: '',
  desc: ''
})

/** Aceita "1.234,56", "1234,56" e "1234.56". */
export function parseMoney(s: string): number {
  const t = String(s).trim()
  if (!t) return NaN
  const n = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  return parseFloat(n)
}

export function defaultTypeId(kind: ItemKind): string {
  return kind === 'c' ? 'premio' : 'adiantamento'
}

/** Abre o formulário: idx -1 = novo; idx >= 0 = edita o item. */
export function openItemSheet(mk: string, idx = -1): void {
  const folha = useFolha()
  const m = folha.getMonth(mk)
  if (m.closed) {
    toast('Mês fechado — reabra para lançar.')
    return
  }
  itemSheet.mk = mk
  itemSheet.idx = idx
  itemSheet.step = 'form'
  const p: Pag | undefined = idx >= 0 ? m.pags[idx] : undefined
  if (p) {
    const kind: ItemKind = p.k === 'd' ? 'd' : 'c'
    const tp = itemType(p.ty, kind)
    itemSheet.kind = kind
    itemSheet.typeId = tp.id
    itemSheet.taxable = kind === 'c' ? !!p.t : false
    itemSheet.valor = String(p.v).replace('.', ',')
    itemSheet.desc = p.d === tp.label ? '' : p.d
  } else {
    itemSheet.kind = 'c'
    itemSheet.typeId = defaultTypeId('c')
    itemSheet.taxable = true
    itemSheet.valor = ''
    itemSheet.desc = ''
  }
  itemSheet.open = true
}

export function setKind(kind: ItemKind): void {
  if (itemSheet.kind === kind) return
  itemSheet.kind = kind
  itemSheet.typeId = defaultTypeId(kind)
  itemSheet.taxable = kind === 'c' ? itemType(itemSheet.typeId, 'c').taxable !== false : false
}

export function pickType(id: string): void {
  const t = ITEM_TYPES.find((x) => x.id === id)
  if (!t) return
  itemSheet.typeId = t.id
  if (t.kind === 'c' && !t.choose) itemSheet.taxable = !!t.taxable
}

export function closeItemSheet(): void {
  if (itemSheet.step === 'tipo') {
    itemSheet.step = 'form'
    return
  }
  itemSheet.open = false
}

export function currentType() {
  return itemType(itemSheet.typeId, itemSheet.kind)
}

export function saveItem(): void {
  const folha = useFolha()
  const m = folha.getMonth(itemSheet.mk)
  if (m.closed) {
    toast('Mês fechado — reabra para lançar.')
    return
  }
  const v = parseMoney(itemSheet.valor)
  if (!isFinite(v) || v <= 0) {
    toast('Informe um valor maior que zero.')
    return
  }
  const tp = currentType()
  const p: Pag = {
    d: itemSheet.desc.trim() || tp.label,
    v: Math.round(v * 100) / 100,
    k: tp.kind,
    ty: tp.id,
    t: isTaxable(tp, itemSheet.taxable)
  }
  if (tp.kind === 'd') delete p.t
  if (itemSheet.idx >= 0) m.pags[itemSheet.idx] = p
  else m.pags.push(p)
  itemSheet.open = false
  toast(itemSheet.idx >= 0 ? 'Item atualizado' : `Item adicionado: ${brl(p.v)}`)
}

/** Remove com desfazer pelo toast. */
export function removeItem(mk: string, idx: number): void {
  const folha = useFolha()
  const m = folha.getMonth(mk)
  if (m.closed) {
    toast('Mês fechado — reabra para editar.')
    return
  }
  const [p] = m.pags.splice(idx, 1)
  if (!p) return
  toast('Item removido', {
    label: 'Desfazer',
    run: () => {
      folha.getMonth(mk).pags.splice(idx, 0, p)
    }
  })
}

export { typesOf }
