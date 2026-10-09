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
