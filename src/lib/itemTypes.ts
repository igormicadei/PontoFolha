/* ================= tipos de item avulso ================= */
/* Lista de tipos que o usuário escolhe ao lançar um item avulso na folha. O
   tipo define sozinho o tratamento: crédito tributável (entra no bruto, no INSS
   e no IRPF), crédito não tributável (só soma ao líquido) ou débito (só
   desconta do líquido, sem mexer nas bases). "Outro crédito" é o único em que o
   usuário decide a tributação. É uma lista inicial: confira com o contador
   antes de depender dela para casos de borda (ex.: ajuda de custo habitual
   integra o salário). */

import type { Pag } from '@/stores/types'

export type ItemKind = 'c' | 'd'

export interface ItemType {
  id: string
  kind: ItemKind
  label: string
  hint?: string
  /** Crédito: tributável? (ignorado quando `choose`). */
  taxable?: boolean
  /** O usuário escolhe a tributação (só "Outro crédito"). */
  choose?: boolean
  group: 'trib' | 'ntrib' | 'livre' | 'deb'
}

export const ITEM_TYPES: ItemType[] = [
  { id: 'premio', kind: 'c', label: 'Prêmio ou bonificação', taxable: true, group: 'trib' },
  { id: 'comissao', kind: 'c', label: 'Comissão', taxable: true, group: 'trib' },
  { id: 'gratificacao', kind: 'c', label: 'Gratificação', taxable: true, group: 'trib' },
  {
    id: 'adicional',
    kind: 'c',
    label: 'Adicional',
    hint: 'Noturno, insalubridade, periculosidade',
    taxable: true,
    group: 'trib'
  },
  {
    id: 'diferenca',
    kind: 'c',
    label: 'Diferença salarial ou retroativo',
    hint: 'Dissídio, correção de meses anteriores',
    taxable: true,
    group: 'trib'
  },
  {
    id: 'reembolso',
    kind: 'c',
    label: 'Reembolso de despesas',
    hint: 'Você pagou, a empresa devolveu',
    taxable: false,
    group: 'ntrib'
  },
  {
    id: 'ajuda_custo',
    kind: 'c',
    label: 'Ajuda de custo',
    hint: 'Eventual e comprovada',
    taxable: false,
    group: 'ntrib'
  },
  {
    id: 'outro_c',
    kind: 'c',
    label: 'Outro crédito',
    hint: 'Você escolhe se é tributável',
    taxable: true,
    choose: true,
    group: 'livre'
  },
  { id: 'adiantamento', kind: 'd', label: 'Adiantamento salarial', group: 'deb' },
  { id: 'plano_saude', kind: 'd', label: 'Plano de saúde ou odontológico', group: 'deb' },
  { id: 'sindical', kind: 'd', label: 'Mensalidade sindical', group: 'deb' },
  { id: 'consignado', kind: 'd', label: 'Empréstimo consignado', group: 'deb' },
  { id: 'outro_d', kind: 'd', label: 'Outro débito', group: 'deb' }
]

export const GROUP_LABEL: Record<ItemType['group'], string> = {
  trib: 'Tributáveis · entram no INSS e no IRPF',
  ntrib: 'Não tributáveis · não entram no INSS nem no IRPF',
  livre: 'Você decide',
  deb: 'Débitos · descontam do líquido, não mudam os impostos'
}

export function typesOf(kind: ItemKind): ItemType[] {
  return ITEM_TYPES.filter((t) => t.kind === kind)
}

export function itemType(id: string | undefined, kind: ItemKind): ItemType {
  return (
    ITEM_TYPES.find((t) => t.id === id && t.kind === kind) ||
    ITEM_TYPES.find((t) => t.id === (kind === 'c' ? 'outro_c' : 'outro_d'))!
  )
}

/** Tributação efetiva de um crédito para um tipo (e, em "Outro", a escolha). */
export function isTaxable(type: ItemType, chosen: boolean): boolean {
  if (type.kind === 'd') return false
  return type.choose ? chosen : !!type.taxable
}

/** Linhas "Como entra na folha" mostradas no formulário. */
export function effectLines(type: ItemType, taxable: boolean): string[] {
  if (type.kind === 'd') return ['Desconta do líquido', 'Não muda a base do INSS nem do IRPF']
  return taxable
    ? ['Soma ao bruto tributável', 'Entra na base do INSS e do IRPF']
    : ['Soma ao líquido', 'Não entra na base do INSS nem do IRPF']
}

export function pagKind(p: Pag): ItemKind {
  return p.k === 'd' ? 'd' : 'c'
}

/** Rótulo curto do tratamento de um item já lançado. */
export function pagTag(p: Pag): string {
  if (pagKind(p) === 'd') return 'Desconto'
  return p.t ? 'Tributável' : 'Não tributável'
}
