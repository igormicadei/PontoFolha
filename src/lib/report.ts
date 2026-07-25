/* ================= relatório impresso ================= */
/* Porta $('btnRelatorio').onclick do legado (index.html 1442-1581): monta um
   documento HTML completo (com CSS de impressão @page A4) numa nova aba e
   dispara window.print() ao carregar. Antes, pergunta se inclui a agenda de
   atividades/tarefas via ask() — o mesmo diálogo usado no resto da migração;
   aqui o corpo é só texto, então não precisa de sheet dedicado. Os valores
   são só formatados aqui — o cálculo em si já veio do engine (computeDay/
   holLines/confDiffs/feriasCalc/ferConfDiffs); nada é recalculado ou
   "melhorado" neste port (financeiro é o maior risco da migração). */

import { useFolha } from '@/stores/folha'
import { ask } from './dialog'
import { toast } from './toast'
import { MESES, DSEM, brl, min2hm, fmtDK, pad, daysInMonth, dow, esc } from './utils'

const TIPO: Record<string, string> = {
  normal: 'Normal',
  feriado: 'Feriado',
  ferias: 'Férias',
  abonado: 'Abonado',
  falta: 'Falta'
}

/** Gera o relatório impresso do mês `mk` numa nova aba (index.html
 *  btnRelatorio 1443-1581). */
export async function abrirRelatorio(mk: string): Promise<void> {
  const folha = useFolha()
  const S = folha.S
  const incAtvRaw = await ask(
    'Gerar relatório',
    'Incluir a agenda de atividades/tarefas dos dias no documento?',
    [
      { lb: 'Com atividades', val: true },
      { lb: 'Sem atividades', cls: 'sec', val: false }
    ]
  )
  if (incAtvRaw === null) return
  const incAtv = incAtvRaw === true

  const [y, mm] = mk.split('-')
  const m = folha.getMonth(mk)
  const nd = daysInMonth(mk)
  const H = folha.holLines(mk)
  const c = H.c

  let rows = ''
  for (let d = 1; d <= nd; d++) {
    const dk = `${mk}-${pad(d)}`
    const cd = folha.computeDay(mk, dk)
    if (!cd.hasData && !cd.pending && cd.eff === 'normal' && !(incAtv && cd.tasks.length)) continue
    const delta = cd.hasData ? cd.worked - cd.expected : 0
    const atv =
      incAtv && cd.tasks.length
        ? `<br><span class="atv">Atividades: ${cd.tasks
            .map((t) => (t.ok ? '✓ ' : '○ ') + (t.kind === 'r' ? '↻ ' : '') + esc(t.t))
            .join('; ')}</span>`
        : ''
    rows += `<tr><td>${pad(d)}/${mm} · ${DSEM[dow(dk)]}</td><td>${(cd.rec.p || []).join(' — ') || '—'}</td>
      <td>${TIPO[cd.eff] || cd.eff}${cd.hol ? ' · ' + cd.hol : ''}${cd.pending ? ' · sem registro' : ''}${cd.rec.note ? ' · ' + esc(cd.rec.note) : ''}${atv}</td>
      <td class="r">${cd.hasData ? min2hm(cd.worked) : '—'}</td>
      <td class="r ${delta > 0 ? 'pos' : delta < 0 || cd.eff === 'falta' ? 'neg' : ''}">${cd.hasData && cd.eff !== 'falta' ? min2hm(delta, true) : cd.eff === 'falta' ? '-' + min2hm(cd.expected) : ''}</td></tr>`
  }

  const saldo = c.worked - c.expected
  const resumo = `
    <tr><td>Horas trabalhadas</td><td class="r">${min2hm(c.worked)}</td></tr>
    <tr><td>Horas previstas (dias lançados)</td><td class="r">${min2hm(c.expected)}</td></tr>
    <tr><td>Saldo do mês</td><td class="r ${saldo >= 0 ? 'pos' : 'neg'}">${min2hm(saldo, true)}</td></tr>
    <tr><td>Horas extras</td><td class="r">${min2hm(c.extraMin)}</td></tr>
    ${c.extrasFeriado ? `<tr><td>· das quais em feriado</td><td class="r">${min2hm(c.extrasFeriado)}</td></tr>` : ''}
    <tr><td>Horas de falta / atraso</td><td class="r">${min2hm(c.faltaMin)}</td></tr>
    ${c.diasFerias ? `<tr><td>Dias de férias no mês</td><td class="r">${c.diasFerias}</td></tr>` : ''}
    ${c.saldoBanco ? `<tr><td>Enviado ao banco de horas</td><td class="r">${min2hm(c.saldoBanco, true)}</td></tr>` : ''}
    ${c.pend ? `<tr><td>Dias pendentes (fora do cálculo)</td><td class="r">${c.pend}</td></tr>` : ''}`

  const holRows = H.lines
    .map(
      (l) =>
        `<tr><td>${l.d}</td><td class="ref">${l.ref || ''}</td>
    <td class="r">${l.cr != null ? brl(l.cr) : ''}</td><td class="r neg">${l.db != null ? brl(l.db) : ''}</td></tr>`
    )
    .join('')

  const dv = folha.confDiffs(mk)
  const baseCalcSec = `<h2>3.2 · Bases de cálculo</h2>
  <table class="basecalc" style="max-width:420px">
    <tr><td>Bruto tributável</td><td class="r">${brl(c.bruto)}</td></tr>
    <tr><td>Base IRPF (bruto − INSS − dependentes)</td><td class="r">${brl(c.baseIR)}</td></tr>
    ${c.irRed ? `<tr><td>Redutor IRPF (Lei 15.270/2025)</td><td class="r">− ${brl(c.irRed)}</td></tr>` : ''}
    <tr><td>Valor-hora</td><td class="r">${brl(c.vh)}</td></tr>
    <tr><td>Valor hora extra (+${c.pctExtra}%)</td><td class="r">${brl(c.vhe)}</td></tr>
  </table>`

  const confSec = `<h2>3.3 · Conferência com holerite</h2>
    ${
      dv.length
        ? `<table><tr><th>Verba</th><th class="r">App</th><th class="r">Holerite</th><th class="r">Diferença</th></tr>
    ${dv
      .map(
        (x) =>
          `<tr${x.ok ? '' : ' class="divg"'}><td>${x.lb}</td><td class="r">${brl(x.app)}</td><td class="r">${brl(x.hol)}</td>
      <td class="r">${x.ok ? '✓ confere' : (x.diff > 0 ? '+' : '') + brl(x.diff)}</td></tr>`
      )
      .join('')}</table>
    ${
      dv.some((x) => !x.ok)
        ? `<p class="alert">⚠ ${dv.filter((x) => !x.ok).length} divergência(s) entre o cálculo do app e o holerite informado. Vale conferir com o RH / contabilidade da clínica.</p>`
        : '<p class="okmsg">✓ Todos os valores informados do holerite conferem com o cálculo do app.</p>'
    }`
        : '<p class="note">Conferência com holerite ainda não gerada no app.</p>'
    }`

  const fersRep = S.ferias.filter((f) => f.ini.slice(0, 7) <= mk && f.fim.slice(0, 7) >= mk)
  const fersData = fersRep.map((f) => ({
    f,
    fc: folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7))),
    fdv: folha.ferConfDiffs(f)
  }))
  const feriasSec = fersData
    .map(
      ({ f, fc, fdv }) => `<h2>4 · Férias — ${fmtDK(f.ini)} a ${fmtDK(f.fim)}</h2>
    <h2>4.1 · Férias (pagamento)</h2>
    <table>
      <tr><th>Descrição</th><th>Referência</th><th class="r">Créditos</th><th class="r">Débitos</th></tr>
      <tr><td>Férias</td><td class="ref">${fc.dias} dias × ${brl(fc.vd)}</td><td class="r">${brl(fc.brutoGozo)}</td><td></td></tr>
      <tr><td>1/3 constitucional</td><td class="ref"></td><td class="r">${brl(fc.terco)}</td><td></td></tr>
      ${f.vendidos ? `<tr><td>Abono pecuniário + 1/3</td><td class="ref">${f.vendidos} dias vendidos, isentos</td><td class="r">${brl(fc.abono + fc.abonoTerco)}</td><td></td></tr>` : ''}
      <tr><td>INSS sobre férias</td><td class="ref"></td><td></td><td class="r neg">${brl(fc.inss)}</td></tr>
      <tr><td>IRPF sobre férias</td><td class="ref"></td><td></td><td class="r neg">${brl(fc.irpf)}</td></tr>
      <tr class="liq"><td colspan="3">Líquido de férias (estimado) · pagamento até ${fmtDK(fc.prazo)}</td><td class="r">${brl(fc.liq)}</td></tr>
    </table>
    <h2>4.2 · Bases de cálculo das férias</h2>
    <table class="basecalc" style="max-width:420px">
      <tr><td>Valor do dia de férias (salário ÷ 30)</td><td class="r">${brl(fc.vd)}</td></tr>
      <tr><td>Base de cálculo (gozo + 1/3, usada para INSS/IRPF)</td><td class="r">${brl(fc.baseTrib)}</td></tr>
      <tr><td>Base IRPF (base − INSS − dependentes)</td><td class="r">${brl(fc.baseIR)}</td></tr>
      ${fc.irRed ? `<tr><td>Redutor IRPF (Lei 15.270/2025)</td><td class="r">− ${brl(fc.irRed)}</td></tr>` : ''}
      <tr><td>Dependentes considerados no IRPF</td><td class="r">${fc.nDep}</td></tr>
    </table>
    <h2>4.3 · Conferência com holerite (férias)</h2>
    ${
      fdv.length
        ? `<table><tr><th>Verba</th><th class="r">App</th><th class="r">Recibo</th><th class="r">Diferença</th></tr>
      ${fdv
        .map(
          (x) =>
            `<tr${x.ok ? '' : ' class="divg"'}><td>${x.lb}</td><td class="r">${brl(x.app)}</td><td class="r">${brl(x.hol)}</td><td class="r">${x.ok ? '✓ confere' : (x.diff > 0 ? '+' : '') + brl(x.diff)}</td></tr>`
        )
        .join('')}</table>
      ${
        fdv.some((x) => !x.ok)
          ? `<p class="alert">⚠ ${fdv.filter((x) => !x.ok).length} divergência(s) entre o cálculo do app e o recibo de férias informado.</p>`
          : '<p class="okmsg">✓ Recibo de férias confere com o cálculo do app.</p>'
      }`
        : '<p class="note">Conferência com o recibo de férias ainda não gerada no app.</p>'
    }`
    )
    .join('')

  const resumoGeralSec = fersData.length
    ? (() => {
        const ferCr = fersData.reduce(
          (a, { fc }) => a + fc.brutoGozo + fc.terco + fc.abono + fc.abonoTerco,
          0
        )
        const ferDb = fersData.reduce((a, { fc }) => a + fc.inss + fc.irpf, 0)
        const ferLiq = fersData.reduce((a, { fc }) => a + fc.liq, 0)
        const totDivg =
          dv.filter((x) => !x.ok).length +
          fersData.reduce((a, { fdv }) => a + fdv.filter((x) => !x.ok).length, 0)
        return `<h2>5 · Resumo geral</h2>
    <table style="max-width:420px">
      <tr><td>Total de créditos (folha + férias)</td><td class="r">${brl(H.totCr + ferCr)}</td></tr>
      <tr><td>Total de débitos (folha + férias)</td><td class="r neg">${brl(H.totDb + ferDb)}</td></tr>
      <tr class="liq"><td>Líquido total do mês</td><td class="r">${brl(c.liquido + ferLiq)}</td></tr>
    </table>
    ${totDivg ? `<p class="alert">⚠ ${totDivg} divergência(s) no total entre app e holerite/recibo neste mês.</p>` : '<p class="okmsg">✓ Nenhuma divergência entre app e holerite/recibo neste mês.</p>'}`
      })()
    : ''

  const w = window.open('', '_blank')
  if (!w) {
    toast('Pop-up bloqueado — permita pop-ups para gerar o relatório.')
    return
  }
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Relatório ${MESES[Number(mm) - 1]} ${y}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page{size:A4;margin:13mm}
    :root{--ink:#000000;--red:#c62828;--line:#e6e6e6;--soft:#666666;--liqbg:#f4f4f2}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;font-size:11.5px;color:var(--ink);background:#fff;font-variant-numeric:tabular-nums}
    .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink);padding-bottom:8px;margin-bottom:14px}
    .head h1{font-family:'Inter',sans-serif;font-weight:800;font-size:19px;color:var(--ink);letter-spacing:-.02em;text-transform:uppercase}
    .head .sub{color:var(--soft);font-size:10.5px;text-align:right;line-height:1.5}
    h2{font-family:'Inter',sans-serif;font-weight:700;font-size:12.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink);margin:16px 0 6px}
    table{width:100%;border-collapse:collapse}
    tr{page-break-inside:avoid}
    th{font-family:'Inter',sans-serif;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--soft);text-align:left;border-bottom:1px solid var(--ink);padding:4px 6px}
    td{padding:4px 6px;border-bottom:1px solid var(--line);vertical-align:top}
    .r{text-align:right;white-space:nowrap}
    th.r{text-align:right}
    .pos{color:#1ea64a}.neg{color:var(--red)}
    .ref,.atv{color:var(--soft);font-size:10px}
    tr.tot td{border-top:1px solid var(--ink);border-bottom:none;font-weight:700;font-size:12px;padding-top:6px}
    tr.liq td{border:none;background:var(--liqbg);font-family:'Inter',sans-serif;font-weight:800;font-size:14px;padding:8px 6px;color:var(--ink)}
    tr.divg td{background:#fdecea}
    .alert{background:#fdecea;color:var(--red);padding:6px 8px;font-size:11px;margin-top:6px;font-weight:700;border:1.5px solid var(--red)}
    .okmsg{background:#e9f7ee;color:#1ea64a;padding:6px 8px;font-size:11px;margin-top:6px;font-weight:700}
    .note{color:var(--soft);font-size:9.5px;margin-top:14px;border-top:1px solid var(--line);padding-top:6px;line-height:1.5}
    .basecalc td{border-bottom:1px dashed var(--line)}
  </style></head><body>
  <div class="head">
    <h1>Relatório de ponto e folha<br><span style="font-weight:600;font-size:14px;text-transform:none">${MESES[Number(mm) - 1]} / ${y}</span>${S.nome ? `<br><span style="font-weight:600;font-size:12px;color:#666666;text-transform:none">${esc(S.nome)}${S.adm ? ' · admissão ' + fmtDK(S.adm) : ''}</span>` : ''}</h1>
    <div class="sub">Gerado em ${new Date().toLocaleString('pt-BR')}<br>${m.closed ? '<b>MÊS FECHADO</b> — valores congelados' : 'Mês em aberto — valores estimados'}</div>
  </div>
  <h2>1 · Registro de ponto${incAtv ? ' e atividades' : ''}</h2>
  <table><tr><th>Dia</th><th>Batidas</th><th>Tipo / observações${incAtv ? ' / atividades' : ''}</th><th class="r">Trabalhado</th><th class="r">Saldo</th></tr>${rows || '<tr><td colspan="5">Nenhum dia lançado.</td></tr>'}</table>
  <h2>2 · Resumo de horas</h2>
  <table style="max-width:340px">${resumo}</table>
  <h2>3 · Folha de pagamento do mês</h2>
  <h2>3.1 · Folha de pagamento</h2>
  <table>
    <tr><th>Descrição</th><th>Referência</th><th class="r">Créditos</th><th class="r">Débitos</th></tr>
    ${holRows}
    <tr class="tot"><td colspan="2">Totais</td><td class="r">${brl(H.totCr)}</td><td class="r neg">${brl(H.totDb)}</td></tr>
    <tr class="liq"><td colspan="3">Líquido a receber</td><td class="r">${brl(c.liquido)}</td></tr>
    ${c.cesta ? `<tr><td colspan="3">Vale cesta básica (benefício, pago à parte)</td><td class="r">${brl(c.cesta)}</td></tr>` : ''}
    ${c.cesta ? `<tr class="liq"><td colspan="3">Total a receber</td><td class="r">${brl(c.totalReceber)}</td></tr>` : ''}
  </table>
  ${baseCalcSec}
  ${confSec}
  ${feriasSec}
  ${resumoGeralSec}
  <p class="note">* verba não tributável.${incAtv ? ' ↻ tarefa recorrente.' : ''} Cálculos estimativos gerados pelo app Ponto &amp; Folha — confira sempre com o holerite oficial. Regras conforme a vigência aplicável ao mês${m.closed ? ' (congeladas no fechamento)' : ''}.</p>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
  </body></html>`)
  w.document.close()
}
