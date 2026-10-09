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

describe('média de horas extras nas férias (manual 8.1)', () => {
  /** 3 dias de 17h por mês com escala de 8h = 27h extras/mês (exemplo do manual). */
  function cenario(opts: { meses?: number; adm?: string; pct?: number; dsr?: number } = {}) {
    const s = state()
    const c = s.vig[0].cfg
    c.salario = 2500
    c.jornada = 220
    c.pctExtra = opts.pct ?? 50
    c.dsr = opts.dsr ?? 0
    c.autoAlmoco = 0
    c.ferCat = 0
    c.escala = { 0: 0, 1: 480, 2: 480, 3: 480, 4: 480, 5: 480, 6: 0 }
    s.adm = opts.adm ?? '2024-01-01'
    const engine = createEngine(s)
    for (let mes = 1; mes <= (opts.meses ?? 12); mes++) {
      const mk = `2024-${String(mes).padStart(2, '0')}`
      const m = engine.getMonth(mk)
      let n = 0
      const nd = new Date(2024, mes, 0).getDate()
      for (let d = 1; d <= nd; d++) {
        const dk = `${mk}-${String(d).padStart(2, '0')}`
        const wd = new Date(2024, mes - 1, d).getDay()
        if (wd === 0 || wd === 6) continue
        const extra = d >= 15 && n < 3
        if (extra) n++
        m.days[dk] = { p: extra ? ['00:00', '17:00'] : ['08:00', '16:00'] }
      }
    }
    s.ferias.push({ ini: '2025-02-03', fim: '2025-03-04' })
    return { s, engine }
  }

  it('reproduz o exemplo do manual: 27h × R$ 17,05 = R$ 460,23 e terço de R$ 153,41', () => {
    const { s, engine } = cenario()
    const fc = engine.feriasCalc(s.ferias[0], s.vig[0].cfg)
    expect(fc.dias).toBe(30)
    expect(fc.mediaRef.mediaMin / 60).toBeCloseTo(27, 6)
    expect(fc.mediaRef.vhe).toBeCloseTo(17.0454545, 6)
    expect(fc.mediaHE).toBeCloseTo(460.23, 2)
    expect(fc.mediaDsr).toBe(0)
    expect(fc.terco).toBeCloseTo((2500 + 460.227) / 3, 2)
    expect(fc.media + fc.terco - (fc.brutoGozo + fc.media) / 3 - fc.media).toBeCloseTo(0, 6)
    // parcela da média + seu reflexo no terço
    expect(fc.media + fc.media / 3).toBeCloseTo(613.64, 2)
  })

  it('o período de referência é o período aquisitivo completo (12 meses ÷ 12)', () => {
    const { s, engine } = cenario()
    const info = engine.feriasMediaInfo(s.ferias[0])
    expect(info.modo).toBe('periodo')
    expect([info.ini, info.fim, info.meses]).toEqual(['2024-01-01', '2024-12-31', 12])
    expect(info.mesesSem).toHaveLength(0)
    expect(info.avisos.some((a) => a.nivel === 'warn')).toBe(false)
  })

  it('proporcional aos dias de gozo e entra na base de INSS e IRRF das férias', () => {
    const { s, engine } = cenario()
    s.ferias[0] = { ini: '2025-02-03', fim: '2025-02-17' } // 15 dias
    const fc = engine.feriasCalc(s.ferias[0], s.vig[0].cfg)
    expect(fc.mediaHE).toBeCloseTo(460.23 / 2, 2)
    expect(fc.baseTrib).toBeCloseTo(fc.brutoGozo + fc.media + fc.terco, 6)
    const sem = cenario({ meses: 0 })
    sem.s.ferias[0] = { ini: '2025-02-03', fim: '2025-02-17' }
    const fc0 = sem.engine.feriasCalc(sem.s.ferias[0], sem.s.vig[0].cfg)
    expect(fc.baseTrib).toBeGreaterThan(fc0.baseTrib)
    expect(fc.inss).toBeGreaterThan(fc0.inss)
  })

  it('DSR sobre a média aparece separado e só quando ligado', () => {
    const on = cenario({ dsr: 1 })
    const off = cenario({ dsr: 0 })
    const a = on.engine.feriasCalc(on.s.ferias[0], on.s.vig[0].cfg)
    const b = off.engine.feriasCalc(off.s.ferias[0], off.s.vig[0].cfg)
    expect(b.mediaDsr).toBe(0)
    expect(a.mediaDsr).toBeGreaterThan(0)
    expect(a.mediaHE).toBeCloseTo(b.mediaHE, 6)
  })

  it('avisa quando faltam meses de ponto no período e o cálculo fica subestimado', () => {
    const { s, engine } = cenario({ meses: 5 })
    const info = engine.feriasMediaInfo(s.ferias[0])
    expect(info.mesesSem).toHaveLength(7)
    const w = info.avisos.filter((a) => a.nivel === 'warn')
    expect(w).toHaveLength(1)
    expect(w[0].texto).toMatch(/em 7 meses do período/)
    const fc = engine.feriasCalc(s.ferias[0], s.vig[0].cfg)
    expect(fc.mediaRef.mediaMin / 60).toBeCloseTo((27 * 5) / 12, 6)
  })

  it('sem nenhum registro no período: média zero e aviso explícito', () => {
    const { s, engine } = cenario({ meses: 0 })
    const info = engine.feriasMediaInfo(s.ferias[0])
    expect(info.avisos[0].nivel).toBe('warn')
    expect(info.avisos[0].texto).toMatch(/nenhum registro de ponto/)
    expect(engine.feriasCalc(s.ferias[0], s.vig[0].cfg).media).toBe(0)
  })

  it('férias antes do 1º aniversário usam só os meses desde a admissão e avisam', () => {
    const { s, engine } = cenario({ adm: '2024-07-01' })
    s.ferias[0] = { ini: '2024-12-02', fim: '2024-12-31' }
    const info = engine.feriasMediaInfo(s.ferias[0])
    expect(info.modo).toBe('parcial')
    expect(info.meses).toBe(5)
    expect(info.avisos.some((a) => a.nivel === 'warn' && /1º período aquisitivo/.test(a.texto))).toBe(true)
  })

  it('sem data de admissão usa os 12 meses anteriores e informa', () => {
    const { s, engine } = cenario()
    s.adm = ''
    const info = engine.feriasMediaInfo(s.ferias[0])
    expect(info.modo).toBe('12m')
    expect(info.avisos.some((a) => /admissão não informada/.test(a.texto))).toBe(true)
  })

  it('banco de horas não entra na média', () => {
    const { s, engine } = cenario()
    s.vig[0].cfg.modoExtras = 'banco'
    const fc = engine.feriasCalc(s.ferias[0], s.vig[0].cfg)
    expect(fc.media).toBe(0)
  })

  it('a base de INSS da competência inclui a média das férias', () => {
    const { s, engine } = cenario()
    s.ferias[0] = { ini: '2025-02-03', fim: '2025-02-14' }
    const c = engine.computeMonth('2025-02')
    expect(c.mediaFerias).toBeGreaterThan(0)
    expect(c.baseInss - c.bruto - c.vFerias).toBeGreaterThan(c.vFerias / 3)
  })
})

