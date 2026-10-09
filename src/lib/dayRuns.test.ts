import { describe, expect, it } from 'vitest'
import { monthEntries, calClass, type DayLike } from './dayRuns'

const d = (over: Partial<DayLike> = {}): DayLike => ({
  eff: 'normal',
  hasData: false,
  pending: false,
  hol: null,
  rec: {},
  tasks: [],
  ...over
})
const work = () => d({ hasData: true, rec: { p: ['07:00', '13:00'] } })
const fer = () => d({ eff: 'ferias' })

describe('monthEntries', () => {
  it('omite dias em branco e agrupa férias consecutivas', () => {
    const days = [
      { dk: '2026-10-08', cd: work() },
      { dk: '2026-10-09', cd: work() },
      { dk: '2026-10-10', cd: d() },
      { dk: '2026-10-13', cd: fer() },
      { dk: '2026-10-14', cd: fer() },
      { dk: '2026-10-15', cd: fer() },
      { dk: '2026-10-16', cd: work() }
    ]
    const r = monthEntries(days, '2026-10-09')
    expect(r.map((e) => e.kind)).toEqual(['day', 'day', 'run', 'day'])
    const run = r.find((e) => e.kind === 'run')
    expect(run).toMatchObject({ from: '2026-10-13', to: '2026-10-15', days: 3 })
  })

  it('não agrupa dias não consecutivos nem o dia isolado', () => {
    const days = [
      { dk: '2026-10-12', cd: d({ eff: 'feriado', hol: 'N. Sra. Aparecida' }) },
      { dk: '2026-10-14', cd: fer() }
    ]
    expect(monthEntries(days, '2026-10-09').map((e) => e.kind)).toEqual(['day', 'day'])
  })

  it('marca dias lançados depois de hoje', () => {
    const days = [
      { dk: '2026-10-09', cd: work() },
      { dk: '2026-10-26', cd: work() }
    ]
    const r = monthEntries(days, '2026-10-09')
    expect(r.map((e) => (e.kind === 'day' ? e.fut : null))).toEqual([false, true])
  })

  it('dia útil passado sem registro continua visível como pendente', () => {
    const days = [{ dk: '2026-10-07', cd: d({ pending: true }) }]
    expect(monthEntries(days, '2026-10-09')).toHaveLength(1)
  })

  it('classe do calendário', () => {
    expect(calClass(work(), '2026-10-08', '2026-10-09')).toBe('w')
    expect(calClass(work(), '2026-10-09', '2026-10-09')).toBe('t')
    expect(calClass(fer(), '2026-10-13', '2026-10-09')).toBe('v')
    expect(calClass(d(), '2026-10-10', '2026-10-09')).toBe('')
  })
})
