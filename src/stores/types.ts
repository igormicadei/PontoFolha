/* ================= tipos de estado ================= */
/* Espelham a forma do objeto `S` do app legado (index.html). NÃO alterar a
   forma sem preservar a migração em load() — a continuidade dos dados dos
   usuários (chave localStorage `pontofolha_v1`) depende disso. */

export const LSKEY = 'pontofolha_v1'

/** Faixa progressiva de INSS. */
export interface InssFaixa {
  ate: number
  aliq: number
}
/** Faixa progressiva de IRRF. */
export interface IrrfFaixa {
  ate: number
  aliq: number
  ded: number
}

/** Configuração de uma vigência. Campos numéricos podem chegar como string
 *  de formulários; o legado sempre coage via num()/Number(). */
export interface Cfg {
  salario: number
  jornada: number
  escala: Record<number, number>
  batidas: string
  autoAlmoco: number
  almocoMin: number
  modoExtras: string
  pctExtra: number
  dsr: number
  depIR: number
  filhos: number
  sfCota: number
  sfLim: number
  cesta: number
  ferCat: number
  inss: InssFaixa[]
  irrf: IrrfFaixa[]
  dedDep: number
  redIsen: number
  redGrad: number
  redA: number
  redB: number
  [k: string]: unknown
}

export interface Vigencia {
  desde: string
  cfg: Cfg
}

/** Tarefa pontual gravada dentro de um dia. */
export interface PTask {
  t: string
  ok?: boolean
}

export interface Day {
  p?: string[]
  type?: string
  note?: string
  tasks?: PTask[]
}

/** Pagamento avulso do mês. t=true → tributável (entra no bruto). */
export interface Pag {
  d: string
  v: number
  t?: boolean
}

/** Ajuste que existe só no holerite (confX). t: 'd' débito | 'c' crédito. */
export interface ConfX {
  d: string
  v: number
  t: string
}

export interface Month {
  days: Record<string, Day>
  pags: Pag[]
  closed: boolean
  snap: MonthResult | null
  conf: Record<string, string>
  confX: ConfX[]
}

/** Série recorrente. freq: 'w' semanal | 'm' mensal. */
export interface RecSeries {
  id: string
  t: string
  freq: string
  anchor: string
  end?: string | null
  skips?: string[]
  done?: Record<string, boolean>
  over?: Record<string, { t: string }>
}

export interface Ferias {
  ini: string
  fim: string
  vendidos?: number
  conf?: Record<string, string>
}

export interface Filho {
  n: string
}

export interface C13 {
  modo: string
  d1: string
  d2: string
  dU: string
}

export interface Ui {
  theme: string
}

export interface State {
  months: Record<string, Month>
  holidays: Record<string, Record<string, string>>
  ferias: Ferias[]
  rec: RecSeries[]
  c13: C13
  ui: Ui
  adm: string
  nome: string
  filhos: Filho[]
  depExtra: number
  vig: Vigencia[]
  onboarded?: boolean // flag do onboarding (index.html isFresh()/obStart)
  lastExport?: string // data do último backup exportado (index.html doExport)
  snooze?: string // data em que o lembrete de backup foi adiado (renderHome)
  cfg?: Cfg // legado — removido pela migração em load()
}

/** Resultado de computeMonth (usado no snapshot de meses fechados).
 *  Interface explícita para quebrar o ciclo Month.snap → engine → State → Month. */
export interface MonthResult {
  worked: number
  expected: number
  extraMin: number
  faltaMin: number
  pend: number
  diasUteis: number
  repousos: number
  extrasFeriado: number
  diasFerias: number
  vh: number
  vhe: number
  pagar: boolean
  vExtras: number
  vDsr: number
  vFaltas: number
  vFerias: number
  pagsT: number
  pagsN: number
  bruto: number
  inss: number
  baseIR: number
  irpf: number
  irRed: number
  salFam: number
  temFilhos: boolean
  liquido: number
  cesta: number
  sfLim: number
  sfCotaTot: number
  nDep: number
  nF14: number
  salario: number
  pctExtra: number
  jornada: number
  saldoBanco: number
}

export const DEFCFG: Cfg = {
  salario: 1878.14,
  jornada: 220,
  escala: { 0: 0, 1: 540, 2: 540, 3: 540, 4: 540, 5: 480, 6: 0 },
  batidas: '4',
  autoAlmoco: 1,
  almocoMin: 60,
  modoExtras: 'pagar',
  pctExtra: 100,
  dsr: 1,
  depIR: 0,
  filhos: 0,
  sfCota: 67.54,
  sfLim: 1980.38,
  cesta: 240,
  ferCat: 1,
  inss: [
    { ate: 1621.0, aliq: 7.5 },
    { ate: 2902.84, aliq: 9 },
    { ate: 4354.27, aliq: 12 },
    { ate: 8475.55, aliq: 14 }
  ],
  irrf: [
    { ate: 2259.2, aliq: 0, ded: 0 },
    { ate: 2826.65, aliq: 7.5, ded: 169.44 },
    { ate: 3751.05, aliq: 15, ded: 381.44 },
    { ate: 4664.68, aliq: 22.5, ded: 662.77 },
    { ate: 999999999, aliq: 27.5, ded: 896.0 }
  ],
  dedDep: 189.59,
  redIsen: 5000,
  redGrad: 7350,
  redA: 978.62,
  redB: 0.133145
}
