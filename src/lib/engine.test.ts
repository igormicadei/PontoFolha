import { describe, expect, it } from 'vitest'
import { calcINSS, calcIRRF, createEngine } from './engine'
import { DEFCFG, type State } from '@/stores/types'

function state(): State {
  return {
    months: {},
    holidays: {},
    ferias: [],
    rec: [],
    c13: { modo: '2', d1: '30/11', d2: '20/12', dU: '20/12' },
    ui: { theme: 'light' },
    adm: '',
    nome: '',
    filhos: [],
    depExtra: 0,
    vig: [{ desde: '1900-01', cfg: structuredClone(DEFCFG) }]
  }
}

describe('regras 2026', () => {
  it('aplica o desconto simplificado em substituição às deduções legais', () => {
    const ir = calcIRRF(3_000, 0, DEFCFG)
    expect(ir.base).toBeCloseTo(2_392.8, 2)
    expect(ir.tax).toBe(0)
  })

  it('mantém a redução gradual do IRRF depois da tabela progressiva', () => {
    const ir = calcIRRF(6_000, 0, DEFCFG)
    expect(ir.red).toBeCloseTo(179.75, 2)
    expect(ir.tax).toBeCloseTo(394.54, 2)
  })

  it('atribui férias ao INSS da competência sem cobrar o mesmo INSS duas vezes', () => {
    const s = state()
    s.vig[0].cfg.salario = 6_000
    s.ferias.push({ ini: '2026-06-16', fim: '2026-06-30' })
    const engine = createEngine(s)

    const mensal = engine.computeMonth('2026-06')
    const ferias = engine.feriasCalc(s.ferias[0], s.vig[0].cfg)

    expect(mensal.baseInss).toBeCloseTo(7_000, 2)
    expect(mensal.inssCompetencia).toBeCloseTo(calcINSS(7_000, s.vig[0].cfg.inss), 2)
    expect(mensal.inss + ferias.inss).toBeCloseTo(mensal.inssCompetencia, 2)
    expect(mensal.salFam).toBe(0)
  })

  it('rateia o INSS de um recibo de férias que cruza competências', () => {
    const s = state()
    s.vig[0].cfg.salario = 6_000
    s.ferias.push({ ini: '2026-12-16', fim: '2027-01-14' })
    const engine = createEngine(s)
    const dezembro = engine.computeMonth('2026-12')
    const janeiro = engine.computeMonth('2027-01')
    const recibo = engine.feriasCalc(s.ferias[0], s.vig[0].cfg)

    expect(dezembro.inss + dezembro.inssFerias).toBeCloseTo(dezembro.inssCompetencia, 2)
    expect(janeiro.inss + janeiro.inssFerias).toBeCloseTo(janeiro.inssCompetencia, 2)
    expect(recibo.inss).toBeCloseTo(dezembro.inssFerias + janeiro.inssFerias, 2)
  })
})

describe('itens avulsos', () => {
  const base = () => {
    const s = state()
    const engine = createEngine(s)
    return { s, engine, m: engine.getMonth('2026-03') }
  }

  it('trata o formato antigo (sem k) como crédito', () => {
    const { engine, m } = base()
    const antes = engine.computeMonth('2026-03')
    m.pags.push({ d: 'Prêmio', v: 100, t: true })
    const depois = engine.computeMonth('2026-03')
    expect(depois.pagsT).toBe(100)
    expect(depois.pagsD).toBe(0)
    expect(depois.bruto).toBeCloseTo(antes.bruto + 100, 2)
  })

  it('crédito tributável entra no bruto e no INSS; não tributável só no líquido', () => {
    const { engine, m } = base()
    const zero = engine.computeMonth('2026-03')
    m.pags.push({ d: 'Reembolso', v: 80, t: false, k: 'c', ty: 'reembolso' })
    const nt = engine.computeMonth('2026-03')
    expect(nt.bruto).toBeCloseTo(zero.bruto, 2)
    expect(nt.inss).toBeCloseTo(zero.inss, 2)
    expect(nt.liquido).toBeCloseTo(zero.liquido + 80, 2)
    m.pags.push({ d: 'Comissão', v: 500, t: true, k: 'c', ty: 'comissao' })
    const t = engine.computeMonth('2026-03')
    expect(t.bruto).toBeCloseTo(zero.bruto + 500, 2)
    expect(t.inss).toBeGreaterThan(zero.inss)
  })

  it('débito só desconta do líquido e não mexe em bruto, INSS nem IRPF', () => {
    const { engine, m } = base()
    const zero = engine.computeMonth('2026-03')
    m.pags.push({ d: 'Adiantamento', v: 300, k: 'd', ty: 'adiantamento' })
    const c = engine.computeMonth('2026-03')
    expect(c.pagsD).toBe(300)
    expect(c.bruto).toBeCloseTo(zero.bruto, 2)
    expect(c.inss).toBeCloseTo(zero.inss, 2)
    expect(c.irpf).toBeCloseTo(zero.irpf, 2)
    expect(c.liquido).toBeCloseTo(zero.liquido - 300, 2)
  })

  it('o holerite lista créditos em Adicionais e débitos em Descontos avulsos', () => {
    const { engine, m } = base()
    m.pags.push({ d: 'Comissão', v: 500, t: true, k: 'c' })
    m.pags.push({ d: 'Adiantamento', v: 300, k: 'd' })
    const h = engine.holLines('2026-03')
    expect(h.lines.find((l) => l.k === 'adic')?.cr).toBe(500)
    const d = h.lines.find((l) => l.k === '_descontos')
    expect(d?.db).toBe(300)
    expect(d?.ref).toBe('Adiantamento')
  })
})

