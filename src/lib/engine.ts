/* ================= engine ================= */
/* Camada de cálculo portada verbatim do app legado (legacy/index.html).
   Funções puras independentes de `S` ficam no nível do módulo (calcINSS,
   calcIRRF, occursOn) e são diretamente testáveis. As demais dependem do
   estado e são criadas por createEngine(S), fechando sobre o `S` reativo. */

import {
  pad,
  num,
  dow,
  yAdd,
  yAddM,
  dAdd,
  daysInMonth,
  daysDiff,
  todayKey,
  hm2min,
  min2hm,
  brl,
  uid,
  MESES,
  fmtDK
} from './utils'
import type {
  State,
  Cfg,
  Month,
  InssFaixa,
  RecSeries,
  Ferias,
  MonthResult
} from '../stores/types'

/* ---- puras (independentes de S) ---- */

export function calcINSS(base: number, tb: InssFaixa[]): number {
  let t = 0,
    prev = 0
  for (const f of tb) {
    const top = Math.min(base, f.ate)
    if (top > prev) t += ((top - prev) * f.aliq) / 100
    prev = f.ate
    if (base <= f.ate) break
  }
  return Math.max(0, t)
}

export function calcIRRF(
  rendTrib: number,
  deducoesLegais: number,
  cfg: Cfg
): { tax: number; red: number; base: number } {
  // O desconto simplificado substitui, não se soma, às deduções legais.
  const deducao = Math.max(0, deducoesLegais, Math.min(rendTrib, num(cfg.descSimplificado)))
  const baseCalc = Math.max(0, rendTrib - deducao)
  let tax = 0
  for (const f of cfg.irrf) {
    if (baseCalc <= f.ate) {
      tax = Math.max(0, (baseCalc * f.aliq) / 100 - f.ded)
      break
    }
  }
  let red = 0
  if (rendTrib <= cfg.redIsen) red = tax
  else if (rendTrib <= cfg.redGrad)
    red = Math.max(0, Math.min(tax, cfg.redA - cfg.redB * rendTrib))
  return { tax: Math.max(0, tax - red), red, base: baseCalc }
}

export function occursOn(s: RecSeries, dk: string): boolean {
  if (dk < s.anchor) return false
  if (s.end && dk > s.end) return false
  if ((s.skips || []).includes(dk)) return false
  if (s.freq === 'w') return dow(dk) === dow(s.anchor)
  const ad = Number(s.anchor.slice(8, 10))
  const dim = daysInMonth(dk.slice(0, 7))
  return Number(dk.slice(8, 10)) === Math.min(ad, dim)
}

/** Alerta de risco/perda do salário-família (index.html salFamAlert 1137-1149).
 *  Retorna dados estruturados em vez de HTML — a view decide como exibir. */
export interface SalFamAlert {
  level: 'warn' | 'err'
  title: string
  text: string
}

export function salFamAlert(c: MonthResult): SalFamAlert | null {
  if (!c.temFilhos) return null
  if (c.salFam > 0) {
    const folga = c.sfLim - c.baseInss
    if (folga <= 150) {
      const hExtra = c.vhe > 0 ? folga / c.vhe : 0
      return {
        level: 'warn',
        title: 'Atenção ao salário-família:',
        text: `a remuneração previdenciária deste mês (${brl(c.baseInss)}) está a ${brl(folga)} do limite de ${brl(c.sfLim)}. O limite é avaliado mês a mês sobre a remuneração total — inclusive férias gozadas e 1/3; se horas extras ou adicionais ultrapassarem (≈ mais ${hExtra.toFixed(1)}h extras), a cota inteira do mês (${brl(c.sfCotaTot)}) é perdida.`
      }
    }
  } else if (c.baseInss > c.sfLim) {
    return {
      level: 'err',
      title: 'Salário-família não devido neste mês:',
        text: `a remuneração previdenciária (${brl(c.baseInss)}) ultrapassou o limite de ${brl(c.sfLim)}. Não é erro do holerite — o direito é avaliado mês a mês; em meses com muitas extras ou férias a cota (${brl(c.sfCotaTot)}) deixa de ser paga e volta quando a remuneração ficar dentro do limite.`
    }
  }
  return null
}

/* ---- fábrica (dependem de S reativo) ---- */

export function createEngine(S: State) {
  function getMonth(mk: string): Month {
    if (!S.months[mk])
      S.months[mk] = { days: {}, pags: [], closed: false, snap: null, conf: {}, confX: [] }
    const m = S.months[mk]
    m.conf = m.conf || {}
    m.confX = m.confX || []
    return m
  }

  function cfgFor(mk: string): Cfg {
    let sel = S.vig[0]
    for (const v of S.vig) if (v.desde <= mk) sel = v
    return sel.cfg
  }

  function holidayName(dk: string, cfg: Cfg | null): string | null {
    const y = dk.slice(0, 4)
    const nat = (S.holidays[y] || {})[dk]
    if (nat) return nat
    if (cfg && Number(cfg.ferCat) === 1 && dk.slice(5) === '05-12')
      return 'Feriado da categoria (CCT SinSaúde)'
    return null
  }

  function feriasFor(dk: string): Ferias | null {
    return S.ferias.find((f) => dk >= f.ini && dk <= f.fim) || null
  }

  function childCount14(mk: string, cfg: Cfg): number {
    if (S.filhos.length)
      return S.filhos.filter((f) => yAdd(f.n, 14) > `${mk}-01`).length
    return num(cfg.filhos)
  }

  function depIRCount(mk: string, cfg: Cfg): number {
    const extra = num(S.depExtra)
    if (S.filhos.length)
      return S.filhos.filter((f) => yAdd(f.n, 21) > `${mk}-01`).length + extra
    return num(cfg.depIR) + extra
  }

  function recOccur(dk: string) {
    return S.rec
      .filter((s) => occursOn(s, dk))
      .map((s) => ({
        t: (s.over && s.over[dk] && s.over[dk].t) || s.t,
        ok: !!(s.done && s.done[dk]),
        kind: 'r' as const,
        id: s.id,
        freq: s.freq
      }))
  }

  function pontualTasks(dk: string) {
    const mk = dk.slice(0, 7)
    const d = S.months[mk] && S.months[mk].days[dk]
    return ((d && d.tasks) || []).map((t, i) => ({
      t: t.t,
      ok: !!t.ok,
      kind: 'p' as const,
      idx: i
    }))
  }

  function dayTasks(dk: string) {
    return pontualTasks(dk).concat(recOccur(dk) as any)
  }

  function splitSeries(
    s: RecSeries,
    dk: string,
    patch: { t?: string },
    newAnchor?: string
  ): void {
    const anchor = newAnchor || dk
    const nova: RecSeries = {
      id: uid(),
      t: patch.t != null ? patch.t : s.t,
      freq: s.freq,
      anchor,
      end: s.end || null,
      skips: [],
      done: {},
      over: {}
    }
    if (anchor === dk) {
      for (const k of Object.keys(s.done || {}))
        if (k >= dk) {
          nova.done![k] = true
          delete s.done![k]
        }
      for (const k of Object.keys(s.over || {}))
        if (k >= dk) {
          nova.over![k] = s.over![k]
          delete s.over![k]
        }
    } else {
      for (const k of Object.keys(s.done || {})) if (k >= dk) delete s.done![k]
      for (const k of Object.keys(s.over || {})) if (k >= dk) delete s.over![k]
    }
    s.skips = (s.skips || []).filter((k) => k < dk)
    const end = dAdd(dk, -1)
    if (end < s.anchor) S.rec = S.rec.filter((x) => x.id !== s.id)
    else s.end = end
    S.rec.push(nova)
  }

  function computeDay(mk: string, dk: string) {
    const m = getMonth(mk),
      rec = m.days[dk] || { p: [] },
      cfg = cfgFor(mk)
    const wd = dow(dk),
      hol = holidayName(dk, cfg),
      fer = feriasFor(dk)
    const type = rec.type || 'auto'
    const eff = type === 'auto' ? (fer ? 'ferias' : hol ? 'feriado' : 'normal') : type
    const escMin = num(cfg.escala[wd] || 0)
    const expected = eff === 'normal' ? escMin : 0
    let worked = 0,
      warn = ''
    const ps = (rec.p || [])
      .slice()
      .map((h) => hm2min(h))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b)
    for (let i = 0; i + 1 < ps.length; i += 2) worked += ps[i + 1] - ps[i]
    if (ps.length % 2 === 1) warn = 'batida ímpar'
    if (ps.length === 2 && Number(cfg.autoAlmoco) === 1 && worked > num(cfg.almocoMin))
      worked -= num(cfg.almocoMin)
    const ptasks = rec.tasks || []
    const hasData = ps.length > 0 || type !== 'auto' || !!rec.note || ptasks.length > 0
    const pending = !hasData && expected > 0 && dk < todayKey() && !fer
    let delta = 0,
      extraMin = 0,
      faltaMin = 0
    if (eff === 'falta') {
      faltaMin = escMin
    } else if (ps.length > 0 || hasData) {
      delta = worked - expected
      if (delta > 0) extraMin = delta
      if (delta < 0 && eff === 'normal' && ps.length > 0) faltaMin = -delta
    }
    return {
      rec,
      type,
      eff,
      hol,
      fer,
      expected,
      worked,
      extraMin,
      faltaMin,
      pending,
      warn,
      tasks: dayTasks(dk),
      hasData: hasData && !pending
    }
  }

  function avos13(y: string | number, uptoM?: number): number {
    uptoM = uptoM || 12
    if (!S.adm) return uptoM
    const [ay, am, ad] = S.adm.split('-').map(Number)
    if (Number(y) < ay) return 0
    if (Number(y) > ay) return uptoM
    let n = 0
    for (let m = 1; m <= uptoM; m++) {
      if (m > am) n++
      else if (m === am) {
        const dim = daysInMonth(`${y}-${pad(m)}`)
        if (dim - ad + 1 >= 15) n++
      }
    }
    return n
  }

  function aquisitivo() {
    if (!S.adm) return null
    const t = todayKey()
    if (t < S.adm) return null
    let k = 0
    while (yAdd(S.adm, k + 1) <= t) k++
    const ini = yAdd(S.adm, k),
      fim = dAdd(yAdd(S.adm, k + 1), -1)
    let meses = 0
    while (meses < 12 && yAddM(ini, meses + 1) <= t) meses++
    return { ini, fim, meses, primeiro: k === 0, direitoApos: yAdd(S.adm, 1) }
  }

  /* ---- média de horas extras nas férias (CLT art. 142 §5º, Súmula 347 TST;
     manual 8.1) ---- */

  /** Período de referência da média: o período aquisitivo completo que deu
   *  origem às férias (12 meses); se as férias começam antes do 1º aniversário,
   *  os meses desde a admissão; sem data de admissão, os 12 meses anteriores. */
  function feriasRef(f: Ferias) {
    let modo: 'periodo' | 'parcial' | '12m' = '12m'
    let ini = yAdd(f.ini, -1)
    let fim = dAdd(f.ini, -1)
    let meses = 12
    if (S.adm) {
      let k = 0
      while (yAdd(S.adm, k + 1) <= f.ini) k++
      if (k >= 1) {
        modo = 'periodo'
        ini = yAdd(S.adm, k - 1)
        fim = dAdd(yAdd(S.adm, k), -1)
      } else {
        modo = 'parcial'
        ini = S.adm
        fim = dAdd(f.ini, -1)
        meses = fim >= ini ? Math.max(1, Math.round((daysDiff(ini, fim) + 1) / 30.4375)) : 1
      }
    }
    return { modo, ini, fim, meses }
  }

  /** Relação repousos/dias úteis do mês (mesma regra do DSR da folha). */
  function dsrRatio(mk: string): number {
    let uteis = 0
    let repousos = 0
    const cfg = cfgFor(mk)
    const nd = daysInMonth(mk)
    for (let d = 1; d <= nd; d++) {
      const dk = `${mk}-${pad(d)}`
      const c = computeDay(mk, dk)
      const wd = dow(dk)
      if (wd === 0 || c.eff === 'feriado') repousos++
      else if (num(cfg.escala[wd]) > 0) uteis++
    }
    return uteis > 0 ? repousos / uteis : 0
  }

  function mesesDoPeriodo(ini: string, fim: string): string[] {
    const out: string[] = []
    if (fim < ini) return out
    let mk = ini.slice(0, 7)
    const last = fim.slice(0, 7)
    while (mk <= last) {
      out.push(mk)
      mk = yAddM(mk + '-01', 1).slice(0, 7)
    }
    return out
  }

  /** Média mensal de horas extras (e DSR) do período de referência, em valor da
   *  hora extra da data da concessão. Percorre só os dias lançados. */
  function feriasMediaCore(f: Ferias) {
    const ref = feriasRef(f)
    let extraMin = 0
    let dsrMin = 0
    let bancoMeses = 0
    for (const mk of mesesDoPeriodo(ref.ini, ref.fim)) {
      const m = S.months[mk]
      if (!m) continue
      const cfg = cfgFor(mk)
      if (cfg.modoExtras !== 'pagar') {
        bancoMeses++
        continue
      }
      let ex = 0
      for (const dk of Object.keys(m.days)) {
        if (dk < ref.ini || dk > ref.fim) continue
        ex += computeDay(mk, dk).extraMin
      }
      if (ex > 0) {
        extraMin += ex
        if (Number(cfg.dsr) === 1) dsrMin += ex * dsrRatio(mk)
      }
    }
    const cfgC = cfgFor(f.ini.slice(0, 7))
    const vh = num(cfgC.salario) / Math.max(1, num(cfgC.jornada))
    const vhe = vh * (1 + num(cfgC.pctExtra) / 100)
    const mediaMin = extraMin / ref.meses
    const mediaDsrMin = dsrMin / ref.meses
    const mensalHE = (mediaMin / 60) * vhe
    const mensalDsr = (mediaDsrMin / 60) * vhe
    return {
      ...ref,
      extraMin,
      mediaMin,
      mediaDsrMin,
      bancoMeses,
      vh,
      vhe,
      pctExtra: num(cfgC.pctExtra),
      mensalHE,
      mensalDsr,
      mensal: mensalHE + mensalDsr
    }
  }

  function mesCurto(mk: string): string {
    return `${MESES[Number(mk.slice(5, 7)) - 1]!.slice(0, 3)}/${mk.slice(0, 4)}`
  }

  /** Detalhe da média + avisos de confiabilidade (para a tela e o relatório). */
  function feriasMediaInfo(f: Ferias) {
    const med = feriasMediaCore(f)
    const hoje = todayKey()
    const meses = mesesDoPeriodo(med.ini, med.fim)
    const sem: string[] = []
    const incompletos: string[] = []
    for (const mk of meses) {
      const m = S.months[mk]
      let dados = false
      let pend = 0
      if (m) {
        const nd = daysInMonth(mk)
        for (let d = 1; d <= nd; d++) {
          const dk = `${mk}-${pad(d)}`
          if (dk < med.ini || dk > med.fim) continue
          const rec = m.days[dk]
          if (rec && ((rec.p && rec.p.length) || rec.type)) dados = true
          if (dk < hoje && computeDay(mk, dk).pending) pend++
        }
      }
      if (!dados) sem.push(mk)
      else if (pend > 0) incompletos.push(mk)
    }
    const lista = (l: string[]): string => (l.length > 6 ? `${mesCurto(l[0]!)} a ${mesCurto(l[l.length - 1]!)}` : l.map(mesCurto).join(', '))
    const avisos: { nivel: 'warn' | 'info'; texto: string }[] = []
    if (med.modo === '12m')
      avisos.push({
        nivel: 'info',
        texto: `Data de admissão não informada: usei os 12 meses antes do início das férias (${fmtDK(med.ini)} a ${fmtDK(med.fim)}). Informe a data nos Ajustes para usar o período aquisitivo exato.`
      })
    if (med.modo === 'parcial')
      avisos.push({
        nivel: 'warn',
        texto: `As férias começam antes de completar o 1º período aquisitivo (1 ano de casa em ${fmtDK(yAdd(S.adm, 1))}). A média usa os ${med.meses} ${med.meses === 1 ? 'mês' : 'meses'} desde a admissão (${fmtDK(med.ini)} a ${fmtDK(med.fim)}).`
      })
    if (sem.length && sem.length === meses.length)
      avisos.push({
        nivel: 'warn',
        texto: `Não há nenhum registro de ponto no período de referência (${fmtDK(med.ini)} a ${fmtDK(med.fim)}). A média de horas extras ficou em zero porque falta lançamento, não necessariamente porque não houve horas extras. Lance os meses anteriores ou confira a média com a empresa.`
      })
    else if (sem.length)
      avisos.push({
        nivel: 'warn',
        texto: `Sem registro de ponto em ${sem.length} ${sem.length === 1 ? 'mês' : 'meses'} do período (${lista(sem)}). A média considera só o que está lançado e pode ficar abaixo do real. Complete os lançamentos ou confira a média com a empresa.`
      })
    if (incompletos.length)
      avisos.push({
        nivel: 'warn',
        texto: `Há dias úteis sem registro em ${incompletos.length} ${incompletos.length === 1 ? 'mês' : 'meses'} do período (${lista(incompletos)}). As horas extras desses dias não entram na média.`
      })
    if (med.bancoMeses)
      avisos.push({
        nivel: 'info',
        texto: `Em ${med.bancoMeses} ${med.bancoMeses === 1 ? 'mês' : 'meses'} do período o saldo foi para o banco de horas e não entra na média.`
      })
    avisos.push({
      nivel: 'info',
      texto: `O app usa um único adicional de hora extra (${med.pctExtra}%). Se houve horas com adicionais diferentes (ex.: 50% e 100%), calcule por categoria com a empresa.`
    })
    return { ...med, mesesSem: sem, mesesIncompletos: incompletos, totalMeses: meses.length, avisos }
  }

  function feriasCalc(f: Ferias, cfg: Cfg) {
    const dias = daysDiff(f.ini, f.fim) + 1
    const vd = num(cfg.salario) / 30
    const brutoGozo = vd * dias
    // Média de horas extras do período de referência, proporcional aos dias de gozo.
    const med = feriasMediaCore(f)
    const mediaHE = (med.mensalHE * dias) / 30
    const mediaDsr = (med.mensalDsr * dias) / 30
    const media = mediaHE + mediaDsr
    const terco = (brutoGozo + media) / 3
    // O abono pecuniário é a remuneração dos dias vendidos, também com a média.
    const abono = ((num(cfg.salario) + med.mensal) / 30) * num(f.vendidos || 0)
    const abonoTerco = abono / 3
    const baseTrib = brutoGozo + media + terco
    // O INSS é apurado por competência. A parcela exibida no recibo é a parte
    // daquela apuração atribuída às férias, e não uma segunda competência.
    const inss = feriasInssTotal(f)
    const nDep = depIRCount(f.ini.slice(0, 7), cfg)
    const ir = calcIRRF(baseTrib, inss + nDep * num(cfg.dedDep), cfg)
    const liq = baseTrib - inss - ir.tax + abono + abonoTerco
    return {
      dias,
      vd,
      brutoGozo,
      mediaHE,
      mediaDsr,
      media,
      mediaRef: med,
      terco,
      abono,
      abonoTerco,
      baseTrib,
      inss,
      irpf: ir.tax,
      irRed: ir.red,
      liq,
      prazo: dAdd(f.ini, -2),
      nDep,
      baseIR: ir.base
    }
  }

  function extrasMediaAno(y: string | number): number {
    const avos = avos13(y, 12)
    if (!avos) return 0
    let tot = 0
    // Meses sem hora extra também entram na média como zero; ignorá-los
    // superestimava o reflexo de uma única competência com extra.
    for (let mes = 1; mes <= 12; mes++) {
      const mk = `${y}-${pad(mes)}`
      if (!S.months[mk]) continue
      const c = computeMonth(mk)
      tot += c.vExtras + c.vDsr
    }
    return tot / avos
  }

  function calc13(y: string | number) {
    const cfg = cfgFor(`${y}-12`)
    const avos = avos13(y, 12)
    const base = ((num(cfg.salario) + extrasMediaAno(y)) * avos) / 12
    const inss = calcINSS(base, cfg.inss)
    const ir = calcIRRF(base, inss + depIRCount(`${y}-12`, cfg) * num(cfg.dedDep), cfg)
    const p1 = base / 2,
      p2 = base - inss - ir.tax - p1
    return { base, avos, inss, irpf: ir.tax, p1, p2, liq: base - inss - ir.tax }
  }

  /** Componentes financeiros da competência antes de INSS e IRRF. */
  function monthCore(mk: string) {
    const m = getMonth(mk),
      cfg = cfgFor(mk)
    const nd = daysInMonth(mk)
    let worked = 0,
      expected = 0,
      extraMin = 0,
      faltaMin = 0,
      pend = 0,
      diasUteis = 0,
      repousos = 0,
      extrasFeriado = 0,
      diasFerias = 0
    for (let d = 1; d <= nd; d++) {
      const dk = `${mk}-${pad(d)}`,
        c = computeDay(mk, dk),
        wd = dow(dk)
      worked += c.hasData ? c.worked : 0
      expected += c.hasData || c.eff === 'falta' ? c.expected : 0
      extraMin += c.extraMin
      faltaMin += c.faltaMin
      if (c.pending) pend++
      if (c.eff === 'ferias') diasFerias++
      const isFer = c.eff === 'feriado'
      if (wd === 0 || isFer) repousos++
      else if (num(cfg.escala[wd]) > 0) diasUteis++
      if (isFer) extrasFeriado += c.extraMin
    }
    const vh = num(cfg.salario) / Math.max(1, num(cfg.jornada))
    const vhe = vh * (1 + num(cfg.pctExtra) / 100)
    const pagar = cfg.modoExtras === 'pagar'
    const vExtras = pagar ? (extraMin / 60) * vhe : 0
    const vDsr =
      pagar && Number(cfg.dsr) === 1 && diasUteis > 0
        ? (vExtras / diasUteis) * repousos
        : 0
    const vFaltas = (faltaMin / 60) * vh
    const feriasParts = S.ferias
      .filter((f) => f.ini.slice(0, 7) <= mk && f.fim.slice(0, 7) >= mk)
      .map((f) => {
        const ini = f.ini > `${mk}-01` ? f.ini : `${mk}-01`
        const fim = f.fim < `${mk}-${pad(nd)}` ? f.fim : `${mk}-${pad(nd)}`
        const cfgFerias = cfgFor(f.ini.slice(0, 7))
        const diasMes = daysDiff(ini, fim) + 1
        const gozo = (num(cfgFerias.salario) / 30) * diasMes
        // média de horas extras do período de referência, rateada pelos dias de gozo da competência
        const media = (feriasMediaCore(f).mensal * diasMes) / 30
        return { f, gozo, media, terco: (gozo + media) / 3 }
      })
    const vFerias = feriasParts.reduce((a, p) => a + p.gozo, 0)
    const mediaFerias = feriasParts.reduce((a, p) => a + p.media, 0)
    const tercoFerias = feriasParts.reduce((a, p) => a + p.terco, 0)
    const creditos = (m.pags || []).filter((p) => p.k !== 'd')
    const pagsT = creditos.filter((p) => p.t).reduce((a, p) => a + num(p.v), 0)
    const pagsN = creditos.filter((p) => !p.t).reduce((a, p) => a + num(p.v), 0)
    const pagsD = (m.pags || []).filter((p) => p.k === 'd').reduce((a, p) => a + num(p.v), 0)
    const bruto = Math.max(
      0,
      num(cfg.salario) + vExtras + vDsr + pagsT - vFaltas - vFerias
    )
    return {
      m,
      cfg,
      worked,
      expected,
      extraMin,
      faltaMin,
      pend,
      diasUteis,
      repousos,
      extrasFeriado,
      diasFerias,
      vh,
      vhe,
      pagar,
      vExtras,
      vDsr,
      vFaltas,
      vFerias,
      mediaFerias,
      tercoFerias,
      feriasParts,
      pagsT,
      pagsN,
      pagsD,
      bruto
    }
  }

  /** Distribui o INSS progressivo entre as férias da competência, em ordem de início. */
  function inssFeriasPorCompetencia(mk: string, core = monthCore(mk)) {
    let baseAnterior = core.bruto
    return core.feriasParts
      .slice()
      .sort((a, b) => (a.f.ini < b.f.ini ? -1 : a.f.ini > b.f.ini ? 1 : 0))
      .map((p) => {
        const baseComFerias = baseAnterior + p.gozo + p.media + p.terco
        const inss = calcINSS(baseComFerias, core.cfg.inss) - calcINSS(baseAnterior, core.cfg.inss)
        baseAnterior = baseComFerias
        return { ...p, inss }
      })
  }

  function feriasInssTotal(f: Ferias): number {
    let mk = f.ini.slice(0, 7)
    const last = f.fim.slice(0, 7)
    let total = 0
    while (mk <= last) {
      total += inssFeriasPorCompetencia(mk).find((p) => p.f.ini === f.ini && p.f.fim === f.fim)?.inss || 0
      mk = yAddM(mk + '-01', 1).slice(0, 7)
    }
    return total
  }

  function computeMonth(mk: string): MonthResult {
    const m = getMonth(mk)
    if (m.closed && m.snap) {
      // Snapshots gravados antes desta revisão não têm as novas bases. Mantemos
      // seus valores congelados e os completamos para não quebrar a consulta.
      if (m.snap.baseInss == null) {
        return {
          ...m.snap,
          baseInss: m.snap.bruto,
          inssCompetencia: m.snap.inss,
          inssFerias: 0,
          totalReceber: m.snap.totalReceber ?? m.snap.liquido + m.snap.cesta
        }
      }
      return m.snap
    }
    const core = monthCore(mk)
    const {
      cfg,
      worked,
      expected,
      extraMin,
      faltaMin,
      pend,
      diasUteis,
      repousos,
      extrasFeriado,
      diasFerias,
      vh,
      vhe,
      pagar,
      vExtras,
      vDsr,
      vFaltas,
      vFerias,
      mediaFerias,
      tercoFerias,
      pagsT,
      pagsN,
      pagsD,
      bruto
    } = core
    const baseInss = bruto + vFerias + mediaFerias + tercoFerias
    const inssCompetencia = calcINSS(baseInss, cfg.inss)
    const inssFerias = inssFeriasPorCompetencia(mk, core).reduce((a, p) => a + p.inss, 0)
    const inss = Math.max(0, inssCompetencia - inssFerias)
    const nDep = depIRCount(mk, cfg),
      nF14 = childCount14(mk, cfg)
    const ir = calcIRRF(bruto, inss + nDep * num(cfg.dedDep), cfg)
    const temFilhos = nF14 > 0
    const salFam = temFilhos && baseInss <= num(cfg.sfLim) ? nF14 * num(cfg.sfCota) : 0
    const liquido = bruto - inss - ir.tax + salFam + pagsN - pagsD
    return {
      worked,
      expected,
      extraMin,
      faltaMin,
      pend,
      diasUteis,
      repousos,
      extrasFeriado,
      diasFerias,
      vh,
      vhe,
      pagar,
      vExtras,
      vDsr,
      vFaltas,
      vFerias,
      mediaFerias,
      pagsT,
      pagsN,
      pagsD,
      bruto,
      baseInss,
      inssCompetencia,
      inssFerias,
      inss,
      baseIR: ir.base,
      irpf: ir.tax,
      irRed: ir.red,
      salFam,
      temFilhos,
      liquido,
      cesta: num(cfg.cesta),
      totalReceber: liquido + num(cfg.cesta),
      sfLim: num(cfg.sfLim),
      sfCotaTot: childCount14(mk, cfg) * num(cfg.sfCota),
      nDep,
      nF14,
      salario: num(cfg.salario),
      pctExtra: num(cfg.pctExtra),
      jornada: num(cfg.jornada),
      saldoBanco: cfg.modoExtras === 'banco' ? extraMin : 0
    }
  }

  /* ---- reconciliação (holerite) ---- */

  function holLines(mk: string) {
    const c = computeMonth(mk),
      m = getMonth(mk)
    const pagDesc = (m.pags || [])
      .filter((p) => p.k !== 'd')
      .map((p) => p.d)
      .join(', ')
    const descDesc = (m.pags || [])
      .filter((p) => p.k === 'd')
      .map((p) => p.d)
      .join(', ')
    const l: Array<{ k: string; d: string; ref: string; cr?: number; db?: number }> = [
      { k: 'base', d: 'Salário base', ref: `${c.jornada}h`, cr: c.salario },
      {
        k: 'extras',
        d: `Horas extras ${c.pctExtra}% + DSR`,
        ref: c.extraMin ? min2hm(c.extraMin) : '',
        cr: c.vExtras + c.vDsr
      },
      { k: 'adic', d: 'Adicionais', ref: pagDesc, cr: c.pagsT + c.pagsN },
      {
        k: 'salfam',
        d: 'Salário-família',
        ref: c.nF14 ? `${c.nF14} filho(s)` : '',
        cr: c.salFam
      }
    ]
    if (c.vFerias > 0)
      l.push({
        k: '_ferias',
        d: 'Dias de férias (pagos antecipadamente)',
        ref: `${c.diasFerias} dias`,
        db: c.vFerias
      })
    l.push({
      k: 'faltas',
      d: 'Faltas / atrasos',
      ref: c.faltaMin ? min2hm(c.faltaMin) : '',
      db: c.vFaltas
    })
    if (num(c.pagsD) > 0)
      l.push({ k: '_descontos', d: 'Descontos avulsos', ref: descDesc, db: num(c.pagsD) })
    l.push({
      k: 'inss',
      d: c.inssFerias ? 'INSS (saldo da folha)' : 'INSS',
      ref: c.inssFerias ? `competência ${brl(c.inssCompetencia)}; férias ${brl(c.inssFerias)}` : 'tab. progressiva',
      db: c.inss
    })
    l.push({
      k: 'irpf',
      d: 'IRPF',
      ref: c.irRed ? `redutor ${brl(c.irRed)}` : '',
      db: c.irpf
    })
    if (!c.pagar && c.extraMin)
      l.push({
        k: '_banco',
        d: 'Extras → banco de horas',
        ref: min2hm(c.extraMin, true),
        cr: 0
      })
    return {
      c,
      lines: l,
      totCr: l.reduce((a, x) => a + (x.cr || 0), 0),
      totDb: l.reduce((a, x) => a + (x.db || 0), 0)
    }
  }

  function ferConfDiffs(f: Ferias) {
    const fc = feriasCalc(f, cfgFor(f.ini.slice(0, 7))),
      conf = f.conf || {}
    return FER_FIELDS.filter((x) => conf[x.k] != null && conf[x.k] !== '').map((x) => {
      const a = x.app(fc),
        hh = num(parseFloat(conf[x.k]))
      return { lb: x.lb, app: a, hol: hh, diff: hh - a, ok: Math.abs(hh - a) <= 0.05 }
    })
  }

  function confDiffs(mk: string) {
    const m = getMonth(mk),
      c = computeMonth(mk),
      conf = m.conf || {}
    const out: Array<{
      lb: string
      app: number
      hol: number
      diff: number
      ok: boolean
      extra?: boolean
    }> = CONF_FIELDS.filter((f) => conf[f.k] != null && conf[f.k] !== '').map((f) => {
      const a = f.app(c),
        h = num(parseFloat(conf[f.k]))
      return { lb: f.lb, app: a, hol: h, diff: h - a, ok: Math.abs(h - a) <= 0.05 }
    })
    ;(m.confX || []).forEach((x) =>
      out.push({
        lb: `${x.d} (${x.t === 'd' ? 'débito' : 'crédito'} só no holerite)`,
        app: 0,
        hol: num(x.v),
        diff: num(x.v) * (x.t === 'd' ? -1 : 1),
        ok: false,
        extra: true
      })
    )
    return out
  }

  return {
    getMonth,
    cfgFor,
    holidayName,
    feriasFor,
    childCount14,
    depIRCount,
    recOccur,
    pontualTasks,
    dayTasks,
    splitSeries,
    computeDay,
    avos13,
    aquisitivo,
    feriasCalc,
    feriasMediaInfo,
    extrasMediaAno,
    calc13,
    computeMonth,
    holLines,
    ferConfDiffs,
    confDiffs
  }
}

type FeriasCalc = ReturnType<ReturnType<typeof createEngine>['feriasCalc']>

export type Engine = ReturnType<typeof createEngine>

/* ---- descritores de campos de conferência (index.html FER_FIELDS/CONF_FIELDS,
   antes privados a createEngine — exportados para os sheets de conferência
   (ConfSheet) montarem os formulários e iterarem os mesmos campos usados por
   ferConfDiffs/confDiffs/gerarConferencia*). */

export interface FieldDescriptor<T> {
  k: string
  lb: string
  app: (v: T) => number
}

export const FER_FIELDS: FieldDescriptor<FeriasCalc>[] = [
  { k: 'gozo', lb: 'Férias (dias de gozo)', app: (fc) => fc.brutoGozo },
  { k: 'media', lb: 'Média de horas extras + DSR', app: (fc) => fc.mediaHE + fc.mediaDsr },
  { k: 'terco', lb: '1/3 constitucional', app: (fc) => fc.terco },
  { k: 'abono', lb: 'Abono + 1/3', app: (fc) => fc.abono + fc.abonoTerco },
  { k: 'inss', lb: 'INSS de férias', app: (fc) => fc.inss },
  { k: 'irpf', lb: 'IRPF de férias', app: (fc) => fc.irpf },
  { k: 'liq', lb: 'Líquido de férias', app: (fc) => fc.liq }
]

export const CONF_FIELDS: FieldDescriptor<MonthResult>[] = [
  { k: 'base', lb: 'Salário base', app: (c) => c.salario },
  { k: 'extras', lb: 'Extras + DSR', app: (c) => c.vExtras + c.vDsr },
  { k: 'adic', lb: 'Adicionais', app: (c) => c.pagsT + c.pagsN },
  { k: 'salfam', lb: 'Salário-família', app: (c) => c.salFam },
  { k: 'faltas', lb: 'Faltas (desc.)', app: (c) => c.vFaltas },
  { k: 'inss', lb: 'INSS', app: (c) => c.inss },
  { k: 'irpf', lb: 'IRPF', app: (c) => c.irpf },
  { k: 'liquido', lb: 'LÍQUIDO', app: (c) => c.liquido }
]
