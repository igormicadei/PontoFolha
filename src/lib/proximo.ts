/* ================= próximo evento ================= */
/* Escolhe o que merece destaque na tela Início: férias que estão para começar
   (ou em curso) com o prazo do recibo, ou, se não houver, a próxima parcela do
   13º nos próximos 45 dias. Só lê dados; os valores vêm do motor. */

import { brl, daysDiff, dow, fmtDM, fmtDKs, parseDM, todayKey, pad, DSEM } from './utils'
import type { useFolha } from '@/stores/folha'

export interface Proximo {
  kind: 'ferias' | '13'
  title: string
  line: string
  note?: { label: string; amount: string }
  mk: string
  aba?: 'ferias'
}

type Folha = ReturnType<typeof useFolha>

export function proximoEvento(folha: Folha): Proximo | null {
  const tk = todayKey()
  const S = folha.S

  const f = [...S.ferias].sort((a, b) => (a.ini < b.ini ? -1 : 1)).find((x) => x.fim >= tk)
  if (f) {
    const days = daysDiff(tk, f.ini)
    if (f.ini <= tk || days <= 60) {
      const fc = folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7)))
      const title =
        f.ini <= tk
          ? 'Férias em curso'
          : days === 0
            ? 'Férias começam hoje'
            : days === 1
              ? 'Férias começam amanhã'
              : `Férias começam em ${days} dias`
      const line =
        f.ini <= tk
          ? `Até ${fmtDM(f.fim)} · ${fc.dias} dias de gozo`
          : `${fmtDM(f.ini)} → ${fmtDM(f.fim)} · ${fc.dias} dias de gozo`
      const note =
        fc.prazo >= tk
          ? {
              label: `Recibo de férias até ${DSEM[dow(fc.prazo)]}., ${fmtDKs(fc.prazo)}`,
              amount: brl(fc.liq)
            }
          : undefined
      return { kind: 'ferias', title, line, note, mk: f.ini.slice(0, 7), aba: 'ferias' }
    }
  }

  const y = Number(tk.slice(0, 4))
  const t13 = folha.calc13(String(y))
  const cand: { dk: string; label: string; amount: number }[] = []
  const add = (s: string, label: string, amount: number): void => {
    const dm = parseDM(s)
    if (dm) cand.push({ dk: `${y}-${pad(dm.m)}-${pad(dm.d)}`, label, amount })
  }
  if (S.c13.modo === '2') {
    add(S.c13.d1, '13º salário · 1ª parcela', t13.p1)
    add(S.c13.d2, '13º salário · 2ª parcela', t13.p2)
  } else add(S.c13.dU, '13º salário · parcela única', t13.liq)
  const next = cand.filter((c) => c.dk >= tk).sort((a, b) => (a.dk < b.dk ? -1 : 1))[0]
  if (next && daysDiff(tk, next.dk) <= 45) {
    return {
      kind: '13',
      title: next.label,
      line: `Até ${fmtDM(next.dk)}`,
      note: { label: 'Valor estimado', amount: brl(next.amount) },
      mk: next.dk.slice(0, 7)
    }
  }
  return null
}
