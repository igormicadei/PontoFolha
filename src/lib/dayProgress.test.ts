import { describe, expect, it } from 'vitest'
import { dayProgress } from './dayProgress'
import { DEFCFG } from '@/stores/types'

const h = (hh: number, mm = 0) => hh * 60 + mm

describe('dayProgress', () => {
  it('dia completo: soma os pares e mostra o saldo sobre o previsto', () => {
    const p = dayProgress(['07:00', '13:00', '14:00', '17:00'], DEFCFG, h(15, 31), 480)
    expect(p.status).toBe('complete')
    expect(p.worked).toBe(540)
    expect(p.delta).toBe(60)
    expect(p.exitMin).toBeNull()
    expect(p.slots.map((s) => s.label)).toEqual(['Entrada', 'Almoço', 'Volta', 'Saída'])
  })

  it('em andamento depois do almoço: horas ao vivo e saída prevista', () => {
    const p = dayProgress(['07:00', '13:00', '14:00'], DEFCFG, h(14, 20), 540)
    expect(p.status).toBe('working')
    expect(p.worked).toBe(380)
    expect(p.exitMin).toBe(h(17))
    expect(p.slots[3]).toMatchObject({ label: 'Saída', time: null, next: true })
    expect(p.segments.map((s) => s.kind)).toEqual(['work', 'off', 'live', 'todo'])
  })

  it('antes do almoço com 4 batidas não promete horário de saída', () => {
    const p = dayProgress(['07:00'], DEFCFG, h(9), 540)
    expect(p.status).toBe('working')
    expect(p.exitMin).toBeNull()
  })

  it('config de 2 batidas considera o almoço automático na saída prevista', () => {
    const cfg = { ...DEFCFG, batidas: '2' }
    const p = dayProgress(['07:00'], cfg, h(9), 480)
    expect(p.exitMin).toBe(h(7) + 480 + 60)
  })

  it('sem batidas: ocioso, com o previsto em aberto na barra', () => {
    const p = dayProgress([], DEFCFG, h(8), 480)
    expect(p.status).toBe('idle')
    expect(p.segments).toEqual([{ kind: 'todo', min: 480 }])
  })

  it('config livre cresce uma batida por vez', () => {
    const cfg = { ...DEFCFG, batidas: '0' }
    const p = dayProgress(['07:00', '12:00'], cfg, h(13), 480)
    expect(p.status).toBe('break')
    expect(p.slots.map((s) => s.label)).toEqual(['Batida 1', 'Batida 2', 'Batida 3'])
  })
})
