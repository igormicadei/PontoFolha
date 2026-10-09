<script setup lang="ts">
/* Relatório do mês, em páginas A4: (1) demonstrativo estimado, (2) registro de
   ponto, (3+) um recibo por período de férias iniciado no mês. É uma tela do
   app com CSS de impressão (sem window.open): abre o diálogo de impressão ao
   entrar e dá para salvar como PDF. Só formata: todos os valores vêm do motor.
   Linhas sem valor ficam de fora, salvo as já conferidas com o holerite. */
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import { monthEntries, type MonthEntry } from '@/lib/dayRuns'
import { itemType, pagKind, pagTag } from '@/lib/itemTypes'
import { MESES, DSEM, brl, min2hm, fmtDK, fmtDKs, pad, daysInMonth, dow, todayKey, num, cap, dsemLongo } from '@/lib/utils'

const folha = useFolha()
const route = useRoute()
const router = useRouter()
const S = folha.S

const mk = computed(() => String(route.params.mk))
const incAtv = computed(() => route.query.atv === '1')
const [y, mm] = [mk.value.slice(0, 4), mk.value.slice(5, 7)]
const mesNome = MESES[Number(mm) - 1]!
const m = computed(() => folha.getMonth(mk.value))
const H = computed(() => folha.holLines(mk.value))
const c = computed(() => H.value.c)
const saldo = computed(() => c.value.worked - c.value.expected)
const tk = todayKey()
const gerado = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/* ---- avisos ---- */
const parcial = computed(() => !m.value.closed && tk <= `${mk.value}-${pad(daysInMonth(mk.value))}`)
const feriasAnteriores = computed(() =>
  S.ferias.filter((f) => f.ini.slice(0, 7) < mk.value && f.fim.slice(0, 7) >= mk.value)
)

/* avisos de confiabilidade da média de horas extras das férias que tocam o mês */
const avisosFerias = computed(() =>
  S.ferias
    .filter((f) => f.ini.slice(0, 7) <= mk.value && f.fim.slice(0, 7) >= mk.value)
    .map((f) => ({ f, warns: folha.feriasMediaInfo(f).avisos.filter((a) => a.nivel === 'warn') }))
    .filter((x) => x.warns.length)
)

/* ---- dias ---- */
const dias = computed(() => {
  const nd = daysInMonth(mk.value)
  const out: { dk: string; cd: ReturnType<typeof folha.computeDay> }[] = []
  for (let d = 1; d <= nd; d++) {
    const dk = `${mk.value}-${pad(d)}`
    out.push({ dk, cd: folha.computeDay(mk.value, dk) })
  }
  return out
})
const entradas = computed<MonthEntry<ReturnType<typeof folha.computeDay>>[]>(() => {
  const e = monthEntries(dias.value, tk)
  // com atividades, dias sem batida mas com tarefas continuam listados
  return e
})
const futuros = computed(() => entradas.value.filter((e) => e.kind === 'day' && e.fut))
const futIdx = computed(() => entradas.value.findIndex((e) => e.kind === 'day' && e.fut))
const futTxt = computed(() => {
  const f = futuros.value
  if (!f.length) return ''
  const a = f[0] as Extract<MonthEntry, { kind: 'day' }>
  const b = f[f.length - 1] as Extract<MonthEntry, { kind: 'day' }>
  return `${f.length} ${f.length === 1 ? 'dia lançado' : 'dias lançados'} com data futura (${fmtDKs(a.dk)}${f.length > 1 ? ' a ' + fmtDKs(b.dk) : ''})`
})
const TIPO: Record<string, string> = { normal: 'Normal', feriado: 'Feriado', ferias: 'Férias', abonado: 'Abonado', falta: 'Falta' }
const contagem = computed(() => {
  let trab = 0, fer = 0, feriado = 0, fds = 0, outros = 0
  for (const { dk, cd } of dias.value) {
    if (cd.rec.p && cd.rec.p.length) trab++
    else if (cd.eff === 'ferias') fer++
    else if (cd.eff === 'feriado') feriado++
    else if ([0, 6].includes(dow(dk))) fds++
    else outros++
  }
  return { trab, fer, feriado, fds, outros }
})

/* ---- demonstrativo ---- */
interface Row {
  d: string
  ref?: string
  cr?: number
  db?: number
}
const conf = computed(() => m.value.conf || {})
const rows = computed<Row[]>(() => {
  const out: Row[] = []
  const itens = m.value.pags.map((p) => ({ p, k: pagKind(p) }))
  for (const l of H.value.lines) {
    const conferida = conf.value[l.k] != null && conf.value[l.k] !== ''
    const val = l.db != null ? l.db : l.cr || 0
    if (l.k === 'adic') {
      const cr = itens.filter((x) => x.k === 'c')
      if (cr.length) {
        for (const { p } of cr) {
          const tp = itemType(p.ty, 'c').label
          out.push({ d: p.d, ref: p.d === tp ? pagTag(p) : `${tp} · ${pagTag(p)}`, cr: num(p.v) })
        }
        continue
      }
    }
    if (l.k === '_descontos') {
      for (const { p } of itens.filter((x) => x.k === 'd')) {
        const tp = itemType(p.ty, 'd').label
        out.push({ d: p.d, ref: p.d === tp ? 'Desconto' : tp, db: num(p.v) })
      }
      continue
    }
    if (val === 0 && !conferida && l.k !== '_banco') continue
    out.push({ d: l.d, ref: l.ref, cr: l.cr, db: l.db })
  }
  return out
})
const omitidas = computed(() => {
  const nomes: string[] = []
  for (const l of H.value.lines) {
    const val = l.db != null ? l.db : l.cr || 0
    const conferida = conf.value[l.k] != null && conf.value[l.k] !== ''
    if (val === 0 && !conferida && l.k !== '_banco' && !(l.k === 'adic' && m.value.pags.length)) nomes.push(l.d.toLowerCase())
  }
  return nomes
})

const dv = computed(() => folha.confDiffs(mk.value))

/* ---- férias do mês (recibo emitido no mês de início) ---- */
const recibos = computed(() =>
  S.ferias
    .filter((f) => f.ini.slice(0, 7) === mk.value)
    .map((f) => {
      const fc = folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7)))
      const fconf = f.conf || {}
      const linhas = [
        { k: 'gozo', d: 'Férias', ref: `${fc.dias} dias × ${brl(fc.vd)}`, cr: fc.brutoGozo },
        { k: 'media', d: 'Média de horas extras', ref: `${min2hm(fc.mediaRef.mediaMin)}/mês × ${brl(fc.mediaRef.vhe)}`, cr: fc.mediaHE },
        { k: 'dsr', d: 'DSR sobre a média', ref: `${min2hm(fc.mediaRef.mediaDsrMin)}/mês de repouso`, cr: fc.mediaDsr },
        { k: 'terco', d: '1/3 constitucional', ref: 'sobre férias + média', cr: fc.terco },
        ...(f.vendidos ? [{ k: 'abono', d: 'Abono pecuniário + 1/3', ref: `${f.vendidos} dias vendidos, isentos`, cr: fc.abono + fc.abonoTerco }] : []),
        { k: 'inss', d: 'INSS sobre férias', ref: '', db: fc.inss },
        { k: 'irpf', d: 'IRPF sobre férias', ref: '', db: fc.irpf }
      ] as { k: string; d: string; ref: string; cr?: number; db?: number }[]
      const vis = linhas.filter((l) => (l.cr ?? l.db ?? 0) !== 0 || (fconf[l.k] != null && fconf[l.k] !== ''))
      const omit = linhas.filter((l) => !vis.includes(l)).map((l) => l.d.toLowerCase())
      return {
        f,
        fc,
        vis,
        omit,
        totCr: vis.reduce((a, l) => a + (l.cr || 0), 0),
        totDb: vis.reduce((a, l) => a + (l.db || 0), 0),
        fdv: folha.ferConfDiffs(f),
        info: folha.feriasMediaInfo(f),
        prazo: `${dsemLongo(fc.prazo)}, ${fmtDKs(fc.prazo)}`
      }
    })
)

/* Páginas físicas de cada folha do relatório (uma folha pode passar de 1 página
   quando há muitos itens ou dias). Medido depois de montar, para o rodapé dizer
   "Página x de N" com a contagem real. */
const alturas = ref<number[]>([])
const root = ref<HTMLElement | null>(null)
const paginas = computed(() => {
  const n = 2 + recibos.value.length
  return Array.from({ length: n }, (_, i) => Math.max(1, Math.ceil(((alturas.value[i] || 1123) - 3) / 1123)))
})
const fim = computed(() => {
  let acc = 0
  return paginas.value.map((p) => (acc += p))
})
const totalPaginas = computed(() => fim.value[fim.value.length - 1] || 0)
async function medir(): Promise<void> {
  await nextTick()
  // O zoom de tela (para caber no celular) arredonda linhas de outro jeito;
  // mede-se em escala 1, como na impressão.
  const el = root.value
  if (el) el.style.zoom = '1'
  // altura natural do conteúdo (sem o min-height que já reserva páginas)
  alturas.value = [...(el?.querySelectorAll<HTMLElement>('.rp') || [])].map((e) => {
    const pb = parseFloat(getComputedStyle(e).paddingBottom) || 0
    let fundo = 0
    for (const k of Array.from(e.children) as HTMLElement[]) {
      if (k.classList.contains('rp-foot')) continue
      fundo = Math.max(fundo, k.offsetTop + k.offsetHeight)
    }
    return fundo + pb
  })
  if (el) el.style.zoom = ''
}

const isRec = (t: unknown): boolean => (t as { kind?: string }).kind === 'r'

/* ---- tela ---- */
function imprimir(): void {
  window.print()
}
const escala = ref(1)
function ajustar(): void {
  escala.value = Math.min(1, (window.innerWidth - 16) / 794)
}
onMounted(async () => {
  ajustar()
  window.addEventListener('resize', ajustar)
  await medir()
  document.title = `Relatório ${mesNome} ${y}`
  try {
    await document.fonts?.ready
  } catch {
    /* ignore */
  }
  await medir()
  window.addEventListener('beforeprint', medir)
  if (route.query.auto !== '0') setTimeout(() => window.print(), 400)
})
</script>

<template>
  <div class="rp-root">
    <div class="rp-bar">
      <button class="btn ghost sm" @click="router.back()">
        <svg class="i sm" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>Voltar
      </button>
      <span class="grow" style="font-weight: 700">Relatório · {{ cap(mesNome) }} {{ y }}</span>
      <button class="btn sm" @click="imprimir">Imprimir ou salvar PDF</button>
    </div>

    <div ref="root" class="rp-zoom" :style="{ '--z': escala }">
      <!-- página 1: demonstrativo -->
      <article class="rp" :style="{ '--pg': paginas[0] }">
        <header class="rp-head">
          <div>
            <div class="rp-kicker">Demonstrativo estimado de folha</div>
            <h1 class="rp-title">{{ cap(mesNome) }} de {{ y }}</h1>
            <div class="rp-who">{{ S.nome || 'Sem nome' }}{{ S.adm ? ` · admissão em ${fmtDK(S.adm)}` : '' }}</div>
          </div>
          <div class="rp-r">
            <span class="rp-badge" :class="{ open: !m.closed }">{{ m.closed ? 'Mês fechado' : 'Mês em aberto' }}</span><br />
            Gerado em {{ gerado }}<br />
            {{ m.closed ? 'Valores congelados no fechamento' : 'Valores estimados pelo app' }}
          </div>
        </header>

        <section class="rp-hero" aria-label="Resumo">
          <div class="main"><span class="lb">Líquido da folha</span><span class="v big">{{ brl(c.liquido) }}</span><span v-if="c.cesta" class="sm">{{ brl(c.totalReceber) }} com vale cesta</span></div>
          <div><span class="lb">Horas trabalhadas</span><span class="v">{{ min2hm(c.worked) }}</span><span class="sm">previstas {{ min2hm(c.expected) }}</span></div>
          <div><span class="lb">Saldo do mês</span><span class="v" :class="saldo >= 0 ? 'pos' : 'neg'">{{ min2hm(saldo, true) }}</span><span class="sm">{{ c.pagar ? `${min2hm(c.extraMin)} pagas como extra` : `${min2hm(c.saldoBanco, true)} no banco de horas` }}</span></div>
          <div><span class="lb">Férias no mês</span><span class="v">{{ c.diasFerias }} {{ c.diasFerias === 1 ? 'dia' : 'dias' }}</span><span class="sm">{{ c.diasFerias ? 'ver recibo' : 'sem férias' }}</span></div>
        </section>

        <div v-if="parcial" class="rp-alert">
          <b>Valores parciais.</b> Estimativa calculada só com os registros disponíveis até a emissão.<template v-if="futTxt"> Inclui {{ futTxt }}.</template>
          Horas, descontos e o líquido mudam com os dias restantes e com o fechamento do mês.
        </div>
        <div v-for="f in feriasAnteriores" :key="f.ini" class="rp-alert info">
          <b>Recibo de férias emitido no mês anterior.</b> O pagamento das férias de {{ fmtDK(f.ini) }} a {{ fmtDK(f.fim) }} consta no demonstrativo de
          {{ MESES[Number(f.ini.slice(5, 7)) - 1] }}/{{ f.ini.slice(0, 4) }}. Este demonstrativo mantém só os reflexos da competência atual.
        </div>

        <div v-for="x in avisosFerias" :key="x.f.ini" class="rp-alert">
          <b>Férias de {{ fmtDKs(x.f.ini) }} a {{ fmtDKs(x.f.fim) }}: confira a média de horas extras.</b>{{ ' ' }}
          <template v-for="(a, i) in x.warns" :key="i"> {{ a.texto }}</template>
        </div>

        <section>
          <h2>Demonstrativo mensal</h2>
          <table class="dense">
            <thead><tr><th>Descrição</th><th>Referência</th><th class="r">Créditos</th><th class="r">Débitos</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in rows" :key="i">
                <td>{{ r.d }}</td>
                <td class="ref">{{ r.ref }}</td>
                <td class="r">{{ r.cr != null ? brl(r.cr) : '' }}</td>
                <td class="r neg">{{ r.db != null ? '− ' + brl(r.db) : '' }}</td>
              </tr>
              <tr class="sum"><td colspan="2">Totais</td><td class="r">{{ brl(H.totCr) }}</td><td class="r neg">− {{ brl(H.totDb) }}</td></tr>
              <tr class="liq"><td colspan="3">Líquido da folha</td><td class="r">{{ brl(c.liquido) }}</td></tr>
              <template v-if="c.cesta">
                <tr class="cesta"><td colspan="3">Vale cesta básica <span class="ref">(benefício, pago à parte)</span></td><td class="r">+ {{ brl(c.cesta) }}</td></tr>
                <tr class="fin"><td colspan="3">Total a receber em {{ mesNome }}</td><td class="r">{{ brl(c.totalReceber) }}</td></tr>
              </template>
            </tbody>
          </table>
          <p v-if="omitidas.length" class="note" style="margin-top: 8px">Linhas sem valor foram omitidas: {{ omitidas.join(', ') }} (todos R$ 0,00 neste mês).</p>
        </section>

        <section>
          <h2>Como foi calculado</h2>
          <div class="two">
            <table class="dense">
              <tr><td>Bruto tributável</td><td class="r">{{ brl(c.bruto) }}</td></tr>
              <tr><td>Base do INSS da competência</td><td class="r">{{ brl(c.baseInss) }}</td></tr>
              <template v-if="c.inssFerias">
                <tr><td>INSS total da competência</td><td class="r">{{ brl(c.inssCompetencia) }}</td></tr>
                <tr><td>INSS retido no recibo de férias</td><td class="r">− {{ brl(c.inssFerias) }}</td></tr>
              </template>
            </table>
            <table class="dense">
              <tr><td>Base do IRPF</td><td class="r">{{ brl(c.baseIR) }}</td></tr>
              <tr><td>Dependentes considerados</td><td class="r">{{ c.nDep }}</td></tr>
              <tr v-if="c.irRed"><td>Redutor do IRPF (Lei 15.270/2025)</td><td class="r">− {{ brl(c.irRed) }}</td></tr>
              <tr><td>Valor-hora</td><td class="r">{{ brl(c.vh) }}</td></tr>
              <tr><td>Hora extra (+{{ c.pctExtra }}%)</td><td class="r">{{ brl(c.vhe) }}</td></tr>
            </table>
          </div>
        </section>

        <section v-if="dv.length">
          <h2>Conferência com o holerite oficial</h2>
          <table>
            <thead><tr><th>Verba</th><th class="r">App</th><th class="r">Holerite</th><th class="r">Diferença</th></tr></thead>
            <tbody>
              <tr v-for="(x, i) in dv" :key="i" :class="{ divg: !x.ok }">
                <td>{{ x.lb }}</td><td class="r">{{ brl(x.app) }}</td><td class="r">{{ brl(x.hol) }}</td>
                <td class="r">{{ x.ok ? '✓ confere' : (x.diff > 0 ? '+' : '−') + ' ' + brl(Math.abs(x.diff)) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="dv.some((x) => !x.ok)" class="rp-alert" style="margin-top: 8px">
            <b>{{ dv.filter((x) => !x.ok).length }} divergência(s)</b> entre o cálculo do app e o holerite informado. Vale conferir com o RH ou a contabilidade.
          </p>
          <p v-else class="note" style="margin-top: 8px">✓ Todos os valores informados do holerite conferem com o cálculo do app.</p>
        </section>
        <p v-else class="note">Conferência com o holerite oficial: não realizada.</p>

        <footer class="rp-foot">
          <span><b>Ponto&amp;Folha</b> · {{ S.nome || 'Sem nome' }} · {{ mm }}/{{ y }}</span>
          <span>Estimativa. Não substitui o holerite oficial.</span>
          <span>Página {{ fim[0] }} de {{ totalPaginas }}</span>
        </footer>
      </article>

      <!-- página 2: registro de ponto -->
      <article class="rp" :style="{ '--pg': paginas[1] }">
        <header class="rp-head">
          <div>
            <div class="rp-kicker">Anexo · {{ mesNome }} de {{ y }}</div>
            <h1 class="rp-title" style="font-size: 28px">Registro de ponto{{ incAtv ? ' e atividades' : '' }}</h1>
          </div>
          <div class="rp-r">{{ S.nome }}<br />Escala: {{ [1, 2, 3, 4, 5, 6, 0].filter((d) => num(folha.cfgFor(mk).escala[d]) > 0).map((d) => DSEM[d] + ' ' + min2hm(num(folha.cfgFor(mk).escala[d]))).join(', ') }}</div>
        </header>

        <section class="rp-hero" style="grid-template-columns: 1.4fr 1fr 1fr 1fr" aria-label="Resumo de horas">
          <div class="main"><span class="lb">Horas trabalhadas</span><span class="v">{{ min2hm(c.worked) }}</span></div>
          <div><span class="lb">Previstas</span><span class="v">{{ min2hm(c.expected) }}</span></div>
          <div><span class="lb">Saldo do mês</span><span class="v" :class="saldo >= 0 ? 'pos' : 'neg'">{{ min2hm(saldo, true) }}</span></div>
          <div><span class="lb">Faltas e atrasos</span><span class="v">{{ min2hm(c.faltaMin) }}</span></div>
        </section>

        <section>
          <table class="dense">
            <thead><tr><th>Dia</th><th>Batidas</th><th>Tipo e observações</th><th class="r">Horas</th><th class="r">Saldo</th></tr></thead>
            <tbody>
              <template v-for="(e, i) in entradas" :key="e.kind === 'day' ? e.dk : e.from">
                <tr v-if="i === futIdx && futIdx >= 0" class="sec"><td colspan="5">Lançados com data futura †</td></tr>
                <tr v-if="e.kind === 'run'" :class="e.eff === 'feriado' ? 'hol' : 'run'">
                  <td class="nw">{{ fmtDKs(e.from) }} a {{ fmtDKs(e.to) }}</td><td>—</td>
                  <td>{{ TIPO[e.eff] }} · {{ e.days }} dias<template v-if="e.hol"> · {{ e.hol }}</template></td><td class="r">—</td><td class="r">—</td>
                </tr>
                <template v-else>
                  <tr :class="{ fut: e.fut, hol: e.cd.eff === 'feriado' }">
                    <td class="nw">{{ DSEM[dow(e.dk)] }} {{ fmtDKs(e.dk) }}</td>
                    <td class="nw">{{ (e.cd.rec.p || []).join(' · ') || '—' }}</td>
                    <td>
                      <span class="ref">{{ TIPO[e.cd.eff] || e.cd.eff }}</span><template v-if="e.cd.hol"> · {{ e.cd.hol }}</template
                      ><template v-if="e.cd.pending"> · sem registro</template
                      ><template v-if="e.cd.rec.note"> · {{ e.cd.rec.note }}</template>
                      <div v-if="incAtv && e.cd.tasks.length" class="ref">
                        Atividades: <template v-for="(t, j) in e.cd.tasks" :key="j">{{ j ? '; ' : '' }}{{ t.ok ? '✓ ' : '○ ' }}{{ isRec(t) ? '↻ ' : '' }}{{ t.t }}</template>
                      </div>
                    </td>
                    <td class="r">{{ e.cd.hasData ? min2hm(e.cd.worked) : '—' }}</td>
                    <td class="r" :class="e.cd.worked - e.cd.expected > 0 ? 'pos' : 'neg'">
                      <template v-if="e.cd.eff === 'falta'">−{{ min2hm(e.cd.expected) }}</template>
                      <template v-else-if="e.cd.hasData">{{ min2hm(e.cd.worked - e.cd.expected, true) }}</template>
                    </td>
                  </tr>
                </template>
              </template>
              <tr v-if="!entradas.length"><td colspan="5">Nenhum dia lançado.</td></tr>
            </tbody>
          </table>
        </section>

        <section class="note">
          <p>Dias do mês: {{ contagem.trab }} {{ contagem.trab === 1 ? 'trabalhado' : 'trabalhados' }}, {{ contagem.feriado }} {{ contagem.feriado === 1 ? 'feriado' : 'feriados' }}, {{ contagem.fer }} de férias e {{ contagem.fds }} {{ contagem.fds === 1 ? 'fim de semana' : 'fins de semana' }} sem registro (omitidos), total de {{ dias.length }}.</p>
          <p v-if="futuros.length" style="margin-top: 4px">† Estes dias estão marcados depois da data de emissão ({{ fmtDK(tk) }}), mas já entram nas horas e no líquido do demonstrativo.</p>
          <p style="margin-top: 4px">Saldo do dia = trabalhado − horas previstas na escala daquele dia da semana.<template v-if="incAtv"> ↻ tarefa recorrente.</template></p>
        </section>

        <footer class="rp-foot">
          <span><b>Ponto&amp;Folha</b> · {{ S.nome || 'Sem nome' }} · {{ mm }}/{{ y }}</span>
          <span>Estimativa. Não substitui o holerite oficial.</span>
          <span>Página {{ fim[1] }} de {{ totalPaginas }}</span>
        </footer>
      </article>

      <!-- páginas 3+: recibos de férias -->
      <article v-for="(r, i) in recibos" :key="r.f.ini" class="rp" :style="{ '--pg': paginas[2 + i] }">
        <header class="rp-head">
          <div>
            <div class="rp-kicker">Demonstrativo estimado · emitido em {{ mesNome }} de {{ y }}</div>
            <h1 class="rp-title" style="font-size: 30px">Recibo de férias</h1>
            <div class="rp-who">{{ S.nome || 'Sem nome' }} · gozo de {{ fmtDK(r.f.ini) }} a {{ fmtDK(r.f.fim) }}</div>
          </div>
          <div class="rp-r">
            <span class="rp-badge" :class="{ open: r.f.fim >= tk }">{{ r.f.fim < tk ? 'Concluídas' : r.f.ini <= tk ? 'Em curso' : 'Agendadas' }}</span><br />
            {{ r.fc.dias }} dias de gozo<br />Pagamento até {{ fmtDK(r.fc.prazo) }}
          </div>
        </header>

        <section class="rp-hero" style="grid-template-columns: 1.5fr 1fr 1fr" aria-label="Resumo">
          <div class="main"><span class="lb">Líquido de férias</span><span class="v big">{{ brl(r.fc.liq) }}</span><span class="sm">pagar até {{ r.prazo }}</span></div>
          <div><span class="lb">Valor do dia</span><span class="v">{{ brl(r.fc.vd) }}</span><span class="sm">salário ÷ 30</span></div>
          <div><span class="lb">Dias vendidos</span><span class="v">{{ r.f.vendidos || 0 }}</span><span class="sm">{{ r.f.vendidos ? 'abono pecuniário' : 'sem abono pecuniário' }}</span></div>
        </section>

        <section>
          <h2>Pagamento</h2>
          <table class="dense">
            <thead><tr><th>Descrição</th><th>Referência</th><th class="r">Créditos</th><th class="r">Débitos</th></tr></thead>
            <tbody>
              <tr v-for="l in r.vis" :key="l.k">
                <td>{{ l.d }}</td><td class="ref">{{ l.ref }}</td>
                <td class="r">{{ l.cr != null ? brl(l.cr) : '' }}</td>
                <td class="r neg">{{ l.db != null ? '− ' + brl(l.db) : '' }}</td>
              </tr>
              <tr class="sum"><td colspan="2">Totais</td><td class="r">{{ brl(r.totCr) }}</td><td class="r neg">− {{ brl(r.totDb) }}</td></tr>
              <tr class="fin"><td colspan="3">Líquido de férias</td><td class="r">{{ brl(r.fc.liq) }}</td></tr>
            </tbody>
          </table>
          <p v-if="r.omit.length" class="note" style="margin-top: 8px">Omitido por não ter valor: {{ r.omit.join(', ') }} (R$ 0,00).</p>
        </section>

        <section>
          <h2>Como a média de horas extras foi calculada</h2>
          <table class="dense">
            <tbody>
              <tr><td>Período de referência</td><td class="r">{{ fmtDK(r.info.ini) }} a {{ fmtDK(r.info.fim) }} · {{ r.info.meses }} {{ r.info.meses === 1 ? 'mês' : 'meses' }}</td></tr>
              <tr><td>Média mensal de horas ({{ min2hm(r.info.extraMin) }} lançadas ÷ {{ r.info.meses }})</td><td class="r">{{ min2hm(r.info.mediaMin) }}</td></tr>
              <tr><td>Valor da hora extra hoje ({{ brl(r.info.vh) }} × {{ (1 + r.info.pctExtra / 100).toFixed(2).replace('.', ',') }})</td><td class="r">{{ brl(r.info.vhe) }}</td></tr>
              <tr><td>Média mensal em dinheiro ({{ min2hm(r.info.mediaMin) }} × {{ brl(r.info.vhe) }})</td><td class="r">{{ brl(r.info.mensalHE) }}</td></tr>
              <tr v-if="r.info.mediaDsrMin > 0"><td>DSR sobre a média ({{ min2hm(r.info.mediaDsrMin) }} de repouso)</td><td class="r">{{ brl(r.info.mensalDsr) }}</td></tr>
              <tr><td>Proporcional aos {{ r.fc.dias }} dias de gozo (× {{ r.fc.dias }} ÷ 30)</td><td class="r">{{ brl(r.fc.media) }}</td></tr>
              <tr><td>1/3 constitucional sobre a média</td><td class="r">{{ brl(r.fc.media / 3) }}</td></tr>
            </tbody>
          </table>
          <div v-for="(a, i) in r.info.avisos" :key="i" class="rp-alert" :class="{ info: a.nivel === 'info' }" style="margin-top: 6px; font-size: 12px">
            {{ a.texto }}
          </div>
        </section>

        <p class="note">
          Bases: INSS e IRPF {{ brl(r.fc.baseTrib) }} (gozo + média + 1/3) · base do IRPF {{ brl(r.fc.baseIR) }} (menos INSS e {{ r.fc.nDep }} dependente(s))<template v-if="r.fc.irRed"> · redutor do IRPF − {{ brl(r.fc.irRed) }}</template>.
        </p>

        <section v-if="r.fdv.length">
          <h2>Conferência com o recibo oficial</h2>
          <table>
            <thead><tr><th>Verba</th><th class="r">App</th><th class="r">Recibo</th><th class="r">Diferença</th></tr></thead>
            <tbody>
              <tr v-for="(x, j) in r.fdv" :key="j" :class="{ divg: !x.ok }">
                <td>{{ x.lb }}</td><td class="r">{{ brl(x.app) }}</td><td class="r">{{ brl(x.hol) }}</td>
                <td class="r">{{ x.ok ? '✓ confere' : (x.diff > 0 ? '+' : '−') + ' ' + brl(Math.abs(x.diff)) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Efeito na folha de {{ mesNome }}</h2>
          <p class="rp-text">
            Os {{ r.fc.dias }} dias de férias ({{ brl(r.fc.brutoGozo) }}) são pagos adiantados neste recibo e saem da folha mensal. Folha de {{ mesNome }}: {{ brl(c.liquido) }}; somando este recibo, o mês rende <b>{{ brl(c.liquido + r.fc.liq) }}</b> (sem o vale cesta).
          </p>
          <p v-if="!r.fdv.length" class="note" style="margin-top: 10px">Conferência com o recibo oficial de férias: não realizada.</p>
        </section>

        <footer class="rp-foot">
          <span><b>Ponto&amp;Folha</b> · {{ S.nome || 'Sem nome' }} · {{ mm }}/{{ y }}</span>
          <span>Estimativa. Não substitui o recibo oficial.</span>
          <span>Página {{ fim[2 + i] }} de {{ totalPaginas }}</span>
        </footer>
      </article>
    </div>
  </div>
</template>

<style>
.rp-root { background: #e9e7e1; min-height: 100vh; padding-bottom: 24px; }
.rp-bar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 8px; padding: calc(8px + env(safe-area-inset-top)) 12px 8px; background: var(--card); border-bottom: 1px solid var(--line); }
.rp-zoom { zoom: var(--z, 1); display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 12px 0; }

.rp { position: relative; width: 794px; min-height: calc(var(--pg, 1) * 1123px); background: #fff; color: #0e0e10; padding: 44px 56px 72px; font-family: 'Inter Variable', Inter, system-ui, sans-serif; font-size: 13px; line-height: 1.45; font-variant-numeric: tabular-nums; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12); }
.rp *, .rp *::before, .rp *::after { box-sizing: border-box; }
.rp, .rp * { color-scheme: light; }
.rp h1, .rp h2, .rp p { margin: 0; }
.rp > * { flex: none; }
.rp-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; padding-bottom: 16px; border-bottom: 2px solid #0e0e10; }
.rp-kicker { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #55534f; }
.rp-title { margin-top: 4px; font-size: 34px; line-height: 1.05; font-weight: 800; letter-spacing: -0.035em; }
.rp-who { margin-top: 6px; font-size: 14px; font-weight: 600; color: #3a3935; }
.rp-r { text-align: right; font-size: 12px; line-height: 1.5; color: #55534f; }
.rp-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; border: 1.5px solid #0e0e10; font-size: 12px; font-weight: 800; color: #0e0e10; margin-bottom: 4px; }
.rp-badge.open { background: #fbebc8; border-color: #6b4300; color: #6b4300; }
.rp-hero { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; border: 1.5px solid #0e0e10; border-radius: 14px; overflow: hidden; }
.rp-hero > div { padding: 10px 16px; border-right: 1px solid #dad7ce; display: flex; flex-direction: column; gap: 2px; }
.rp-hero > div:last-child { border-right: 0; }
.rp-hero > div.main { background: #f4ecd6; }
.rp-hero .lb { font-size: 12px; font-weight: 600; color: #55534f; }
.rp-hero .v { font-size: 22px; line-height: 1.1; font-weight: 800; letter-spacing: -0.025em; }
.rp-hero .v.big { font-size: 30px; }
.rp-hero .sm { font-size: 12px; color: #55534f; }
.rp-alert { padding: 8px 12px; border: 1.5px solid #6b4300; background: #fbebc8; color: #4a2f00; border-radius: 10px; font-size: 12px; line-height: 1.4; }
.rp-alert.info { border-color: #1d4ed8; background: #eff6ff; color: #1e3a8a; }
.rp h2 { font-size: 15px; line-height: 1.2; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 8px; }
.rp table { width: 100%; border-collapse: collapse; }
.rp th { text-align: left; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #55534f; padding: 6px 8px; border-bottom: 2px solid #0e0e10; }
.rp td { padding: 5px 8px; border-bottom: 1px solid #dad7ce; vertical-align: top; }
.rp table.dense td { padding: 4px 8px; }
.rp .r { text-align: right; white-space: nowrap; }
.rp .nw { white-space: nowrap; }
.rp .ref { color: #55534f; font-size: 12px; }
.rp .neg { color: #a3211a; }
.rp .pos { color: #12662f; font-weight: 700; }
.rp tr.sum td { font-weight: 800; border-top: 2px solid #0e0e10; border-bottom: 0; padding-top: 9px; }
.rp tr.liq td { background: #f4ecd6; border: 0; font-size: 16px; font-weight: 800; padding: 11px 8px; }
.rp tr.fin td { background: #0e0e10; color: #fff; border: 0; font-size: 16px; font-weight: 800; padding: 11px 8px; }
.rp tr.sec td { background: #f5f4f0; font-size: 12px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: #3a3935; padding: 5px 8px; }
.rp tr.fut td { background: #fff8e3; } .rp tr.run td { background: #efe8fb; } .rp tr.hol td { background: #fbedea; } .rp tr.divg td { background: #fbe9e7; }
.rp .note { font-size: 12px; color: #55534f; line-height: 1.5; }
.rp .rp-text { max-width: 640px; line-height: 1.55; }
.rp .two { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.rp-foot { position: absolute; left: 56px; right: 56px; bottom: 30px; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-top: 10px; border-top: 1px solid #0e0e10; font-size: 12px; color: #55534f; }
.rp-foot b { color: #0e0e10; }

@media print {
  @page { size: A4; margin: 0; }
  html, body { background: #fff !important; }
  .rp-root { background: #fff; padding: 0; }
  .rp-bar { display: none !important; }
  .rp-zoom { zoom: 1 !important; display: block; padding: 0; }
  .rp { width: 210mm; min-height: calc(var(--pg, 1) * 297mm); box-shadow: none; break-after: page; page-break-after: always; margin: 0; }
  .rp:last-child { break-after: auto; page-break-after: auto; }
  .rp tr { break-inside: avoid; }
}
</style>
