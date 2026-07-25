<script setup lang="ts">
/* Tela do mês (index.html #view-month 299-335 + renderMonth 1150-1382 + modal
   de dia 1384-1440). Ledger diário, pagamentos avulsos, férias/13º do mês,
   conferência com o holerite e fechamento do mês. Segue o padrão já
   estabelecido nas outras telas: `folha.activeMK` guarda o mês em foco (não
   estado local); mutações de pags/conf/confX/closed caem direto em
   folha.S/folha.getMonth() (a store não ganha mutadores novos); os inputs que
   o legado cobria com prompt()/ask() com <input> embutido agora são sheets
   dedicados (daySheet.ts, confSheet.ts). O relatório impresso fica em
   src/lib/report.ts (abrirRelatorio). */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import { salFamAlert, CONF_FIELDS, FER_FIELDS } from '@/lib/engine'
import { MESES, DSEM, brl, num, min2hm, fmtDK, mAdd, pad, daysInMonth, dow, todayKey, curMonthKey, parseDM } from '@/lib/utils'
import { confirmS } from '@/lib/dialog'
import { toast } from '@/lib/toast'
import { openDay, openAddDaySheet } from '@/lib/daySheet'
import { openConf, openFerConf, openConfX, gerarConferencia, gerarConferenciaFerias } from '@/lib/confSheet'
import { abrirRelatorio } from '@/lib/report'

const folha = useFolha()
const router = useRouter()
const S = folha.S

/* Recomputa às viradas de dia/hora (padrão now-tick do JornadaView). */
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 60000)
  // Rola até o dia de hoje uma vez, só quando o mês em foco é o corrente
  // (index.html renderMonth._scrolled 1192-1193 — aqui basta 1x por montagem).
  if (folha.activeMK === curMonthKey()) {
    setTimeout(() => {
      document.querySelector('.day.today')?.scrollIntoView({ block: 'center' })
    }, 60)
  }
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const mk = computed(() => folha.activeMK)
function mPrev(): void {
  folha.activeMK = mAdd(folha.activeMK, -1)
}
function mNext(): void {
  folha.activeMK = mAdd(folha.activeMK, 1)
}
function voltar(): void {
  router.push({ name: 'jornada' })
}

const m = computed(() => {
  void now.value
  return folha.getMonth(mk.value)
})
const H = computed(() => {
  void now.value
  return folha.holLines(mk.value)
})
const c = computed(() => H.value.c)

const title = computed(() => {
  const [y, mmS] = mk.value.split('-')
  return `${MESES[Number(mmS) - 1]} ${y}`
})

/* ---- alertas (index.html renderMonth 1154-1157) ---- */
interface Alert {
  cls: string
  title?: string
  text: string
}
const alerts = computed<Alert[]>(() => {
  void now.value
  const list: Alert[] = []
  if (m.value.closed)
    list.push({ cls: 'msg', text: 'Mês fechado — valores congelados. Reabra para editar.' })
  const sf = salFamAlert(c.value)
  if (sf) list.push({ cls: `msg ${sf.level}`, title: sf.title, text: sf.text })
  const mmNum = mk.value.slice(5, 7)
  if (mmNum === '05' && Number(folha.cfgFor(mk.value).ferCat) !== 1) {
    list.push({
      cls: 'msg',
      text:
        'Lembrete: a CCT do SinSaúde costuma prever feriado da categoria em maio (12/05). ' +
        'Confira a convenção vigente e marque o dia se aplicável.'
    })
  }
  return list
})

/* ---- resumo de horas (index.html 1158-1168) ---- */
interface ResumoLine {
  label: string
  value: string
  cls?: string
  chipPend?: boolean
}
const resumoLines = computed<ResumoLine[]>(() => {
  void now.value
  const cc = c.value
  const saldo = cc.worked - cc.expected
  const lines: ResumoLine[] = [
    { label: 'Horas trabalhadas', value: min2hm(cc.worked) },
    { label: 'Horas previstas (dias lançados)', value: min2hm(cc.expected) },
    { label: 'Saldo', value: min2hm(saldo, true), cls: saldo >= 0 ? 'pos' : 'neg' },
    { label: 'Horas extras', value: min2hm(cc.extraMin) }
  ]
  if (cc.extrasFeriado)
    lines.push({ label: '· das quais em feriado', value: min2hm(cc.extrasFeriado) })
  lines.push({
    label: 'Horas de falta/atraso',
    value: min2hm(cc.faltaMin),
    cls: cc.faltaMin ? 'neg' : undefined
  })
  if (cc.diasFerias) lines.push({ label: 'Dias de férias no mês', value: String(cc.diasFerias) })
  if (cc.saldoBanco)
    lines.push({ label: 'Banco de horas do mês', value: min2hm(cc.saldoBanco, true) })
  if (cc.pend)
    lines.push({ label: 'Dias pendentes (sem registro)', value: String(cc.pend), chipPend: true })
  return lines
})

/* ---- dias do mês (index.html 1169-1193) ---- */
const EFF_LABEL: Record<string, string> = {
  feriado: 'feriado',
  ferias: 'férias',
  abonado: 'abonado',
  falta: 'falta'
}
interface DayRow {
  dk: string
  d: number
  wd: number
  isToday: boolean
  cd: ReturnType<typeof folha.computeDay>
  delta: number
  escMin: number
}
const dayRows = computed<DayRow[]>(() => {
  void now.value
  const mkv = mk.value
  const nd = daysInMonth(mkv)
  const tk = todayKey()
  const cfg = folha.cfgFor(mkv)
  const rows: DayRow[] = []
  for (let d = 1; d <= nd; d++) {
    const dk = `${mkv}-${pad(d)}`
    const cd = folha.computeDay(mkv, dk)
    const wd = dow(dk)
    const future = dk > tk
    if (future && !cd.hasData && cd.eff === 'normal' && !cd.tasks.length) continue
    rows.push({
      dk,
      d,
      wd,
      isToday: dk === tk,
      cd,
      delta: cd.hasData ? cd.worked - cd.expected : 0,
      escMin: num(cfg.escala[wd])
    })
  }
  return rows
})

/* ---- pagamentos avulsos (index.html 1194-1195, 1365-1371) ---- */
const pagDesc = ref('')
const pagVal = ref('')
const pagTrib = ref('1')
const pagRows = computed(() => {
  void now.value
  return (m.value.pags || []).map((p, i) => ({
    i,
    d: p.d,
    trib: !!p.t,
    val: brl(num(p.v))
  }))
})
function addPag(): void {
  const d = pagDesc.value.trim()
  const v = parseFloat(pagVal.value)
  if (!d || !isFinite(v)) {
    toast('Preencha descrição e valor.')
    return
  }
  folha.getMonth(mk.value).pags.push({ d, v, t: pagTrib.value === '1' })
  pagDesc.value = ''
  pagVal.value = ''
}
function delPag(i: number): void {
  folha.getMonth(mk.value).pags.splice(i, 1)
  toast('Removido')
}

/* ---- férias no mês (index.html 1196-1233) ---- */
interface FerLine {
  k: string
  lb: string
  ref: string
  val: number
  isDb: boolean
  tot?: boolean
  sub?: { holerite: string; diff: string; ok: boolean }
}
interface FerCard {
  fi: number
  ini: string
  fim: string
  dias: number
  vendidos?: number
  lines: FerLine[]
  prazo: string
  liq: number
  fAnyFilled: boolean
  fAllFilled: boolean
  fdvLength: number
  fbadText: string
}
const ferCards = computed<FerCard[]>(() => {
  void now.value
  const mkv = mk.value
  return S.ferias
    .filter((f) => f.ini.slice(0, 7) <= mkv && f.fim.slice(0, 7) >= mkv)
    .map((f) => {
      const fi = S.ferias.indexOf(f)
      const fc = folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7)))
      const fconf = f.conf || {}
      const fl = (
        k: string,
        lb: string,
        refTxt: string,
        val: number,
        isDb: boolean,
        tot?: boolean
      ): FerLine => {
        let sub: FerLine['sub']
        if (fconf[k] != null && fconf[k] !== '') {
          const fd = FER_FIELDS.find((x) => x.k === k)!
          const hv = num(parseFloat(fconf[k]))
          const dd = hv - fd.app(fc)
          const ok = Math.abs(dd) <= 0.05
          sub = { holerite: brl(hv), diff: ok ? '' : `${dd > 0 ? '+' : ''}${brl(dd)}`, ok }
        }
        return { k, lb, ref: refTxt, val, isDb, tot, sub }
      }
      const lines: FerLine[] = [
        fl('gozo', `Férias (${fc.dias} × ${brl(fc.vd)})`, '', fc.brutoGozo, false)
      ]
      lines.push(fl('terco', '1/3 constitucional', '', fc.terco, false))
      if (f.vendidos)
        lines.push(fl('abono', 'Abono + 1/3', 'isentos', fc.abono + fc.abonoTerco, false))
      lines.push(fl('inss', 'INSS sobre férias', '', fc.inss, true))
      lines.push(fl('irpf', 'IRPF sobre férias', '', fc.irpf, true))
      lines.push(fl('liq', 'Líquido de férias (estimado)', '', fc.liq, false, true))
      const fdv = folha.ferConfDiffs(f)
      const fbad = fdv.filter((x) => !x.ok)
      const fAnyFilled = FER_FIELDS.some((x) => fconf[x.k] != null && fconf[x.k] !== '')
      const fAllFilled = FER_FIELDS.every((x) => fconf[x.k] != null && fconf[x.k] !== '')
      const fbadText = fbad
        .map((x) => `${x.lb} (${x.diff > 0 ? '+' : ''}${brl(x.diff)})`)
        .join(' · ')
      return {
        fi,
        ini: f.ini,
        fim: f.fim,
        dias: fc.dias,
        vendidos: f.vendidos,
        lines,
        prazo: fc.prazo,
        liq: fc.liq,
        fAnyFilled,
        fAllFilled,
        fdvLength: fdv.length,
        fbadText
      }
    })
})

/* ---- 13º previsto no mês (index.html 1234-1247) ---- */
interface C13Row {
  label: string
  value: string
  neg?: boolean
}
interface C13Card {
  avos: number
  base: string
  rows: C13Row[]
}
const c13Card = computed<C13Card | null>(() => {
  void now.value
  const mkv = mk.value
  const [y, mmS] = mkv.split('-')
  const mmNum = Number(mmS)
  const dm1 = parseDM(S.c13.d1)
  const dm2 = parseDM(S.c13.d2)
  const dmU = parseDM(S.c13.dU)
  const t13 = folha.calc13(y)
  const rows: C13Row[] = []
  if (S.c13.modo === '2') {
    if (dm1 && mmNum === dm1.m)
      rows.push({
        label: `1ª parcela (adiantamento, sem descontos) até ${pad(dm1.d)}/${pad(dm1.m)}`,
        value: brl(t13.p1)
      })
    if (dm2 && mmNum === dm2.m) {
      rows.push({ label: `2ª parcela até ${pad(dm2.d)}/${pad(dm2.m)}`, value: brl(t13.p2) })
      rows.push({
        label: 'INSS + IRPF do 13º (na 2ª parcela)',
        value: brl(t13.inss + t13.irpf),
        neg: true
      })
    }
  } else if (dmU && mmNum === dmU.m) {
    rows.push({
      label: `Parcela única até ${pad(dmU.d)}/${pad(dmU.m)}`,
      value: brl(t13.liq)
    })
    rows.push({ label: 'INSS + IRPF do 13º', value: brl(t13.inss + t13.irpf), neg: true })
  }
  if (!rows.length) return null
  return { avos: t13.avos, base: brl(t13.base), rows }
})

/* ---- folha / conferência do holerite (index.html 1248-1277) ---- */
interface FolhaLine {
  k: string
  d: string
  ref?: string
  val: string
  isDb: boolean
  confable: boolean
  sub?: { holerite: string; diff: string; ok: boolean }
}
const folhaLines = computed<FolhaLine[]>(() => {
  void now.value
  const conf = m.value.conf || {}
  return H.value.lines.map((l) => {
    const confable = !l.k.startsWith('_')
    let sub: FolhaLine['sub']
    if (confable && conf[l.k] != null && conf[l.k] !== '') {
      const appV = l.db != null ? l.db : l.cr || 0
      const hv = num(parseFloat(conf[l.k]))
      const dd = hv - appV
      const ok = Math.abs(dd) <= 0.05
      sub = { holerite: brl(hv), diff: ok ? '' : `${dd > 0 ? '+' : ''}${brl(dd)}`, ok }
    }
    return {
      k: l.k,
      d: l.d,
      ref: l.ref,
      val: l.db != null ? brl(l.db) : brl(l.cr || 0),
      isDb: l.db != null,
      confable,
      sub
    }
  })
})

interface ConfSummary {
  badText: string
  dvLength: number
  xRows: { i: number; d: string; isDb: boolean; val: string }[]
  cfAnyFilled: boolean
  cfAllFilled: boolean
  liqConfLabel: string
}
const confSummary = computed<ConfSummary>(() => {
  void now.value
  const mkv = mk.value
  const conf = m.value.conf || {}
  const dv = folha.confDiffs(mkv)
  const bad = dv.filter((x) => !x.ok)
  const xRows = (m.value.confX || []).map((x, i) => ({
    i,
    d: x.d,
    isDb: x.t === 'd',
    val: brl(num(x.v))
  }))
  const cfAnyFilled = CONF_FIELDS.some((f) => conf[f.k] != null && conf[f.k] !== '')
  const cfAllFilled = CONF_FIELDS.every((f) => conf[f.k] != null && conf[f.k] !== '')
  const liqConfLabel = conf.liquido ? ` (${brl(num(parseFloat(conf.liquido)))})` : ''
  const badText = bad.map((x) => `${x.lb} (${x.diff > 0 ? '+' : ''}${brl(x.diff)})`).join(' · ')
  return { badText, dvLength: dv.length, xRows, cfAnyFilled, cfAllFilled, liqConfLabel }
})

/* ---- fechar/reabrir mês (index.html btnFechar 1372-1377) ---- */
async function toggleFechar(): Promise<void> {
  const mkv = mk.value
  const mm = folha.getMonth(mkv)
  if (mm.closed) {
    if (
      await confirmS(
        'Reabrir o mês?',
        'Os valores voltarão a ser recalculados com as regras vigentes.'
      )
    ) {
      mm.closed = false
      mm.snap = null
      toast('Mês reaberto')
    }
  } else {
    mm.snap = folha.computeMonth(mkv)
    mm.closed = true
    toast('Mês fechado')
  }
}

function addDayManual(): void {
  openAddDaySheet(mk.value)
}

async function relatorio(): Promise<void> {
  await abrirRelatorio(mk.value)
}
</script>

<template>
  <section id="view-month">
    <div class="row" style="margin-bottom: 10px">
      <button class="btn ghost small" style="flex: none" @click="voltar">← Voltar</button>
      <button class="btn ghost small" style="flex: none" @click="mPrev">‹</button>
      <div
        style="
          flex: 1;
          text-align: center;
          font-family: var(--disp);
          font-weight: 800;
          font-size: 16px;
          text-transform: capitalize;
        "
      >
        {{ title }}
      </div>
      <button class="btn ghost small" style="flex: none" @click="mNext">›</button>
    </div>

    <div v-for="(a, i) in alerts" :key="i" :class="a.cls">
      <b v-if="a.title">{{ a.title }}</b> {{ a.text }}
    </div>

    <div class="card">
      <h2>Resumo de horas</h2>
      <div class="hol">
        <div v-for="(l, i) in resumoLines" :key="i" class="l">
          <span>{{ l.label }}</span>
          <b v-if="l.chipPend" class="chip pend">{{ l.value }}</b>
          <b v-else :class="l.cls">{{ l.value }}</b>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Dias</h2>
      <div>
        <button
          v-for="row in dayRows"
          :key="row.dk"
          class="day"
          :class="{ today: row.isToday }"
          @click="openDay(row.dk)"
        >
          <div class="dn">
            {{ pad(row.d) }}<small>{{ DSEM[row.wd] }}</small>
          </div>
          <div class="mid">
            <div v-if="row.cd.rec.p && row.cd.rec.p.length" class="pts">
              {{ row.cd.rec.p.join(' · ') }}<template v-if="row.cd.warn"> ⚠</template>
            </div>
            <template v-if="row.cd.eff !== 'normal'">
              <span class="chip" :class="row.cd.eff">{{
                EFF_LABEL[row.cd.eff] || row.cd.eff
              }}</span>
              <span v-if="row.cd.hol && row.cd.eff === 'feriado'" class="muted">{{
                row.cd.hol
              }}</span>
            </template>
            <span v-if="row.cd.pending" class="chip pend">sem registro</span>
            <span v-if="row.cd.tasks.length" class="chip task"
              >☑ {{ row.cd.tasks.filter((t) => t.ok).length }}/{{ row.cd.tasks.length }}</span
            >
            <div v-if="row.cd.rec.note" class="muted">{{ row.cd.rec.note }}</div>
            <span
              v-if="
                !(row.cd.rec.p && row.cd.rec.p.length) &&
                row.cd.eff === 'normal' &&
                !row.cd.pending &&
                !row.cd.tasks.length &&
                !row.cd.rec.note
              "
              class="muted"
              >—</span
            >
          </div>
          <div class="hrs">
            {{ row.cd.hasData && row.cd.worked ? min2hm(row.cd.worked) : '' }}
            <span
              v-if="row.cd.hasData && row.delta !== 0 && row.cd.eff !== 'falta'"
              class="d"
              :class="row.delta > 0 ? 'pos' : 'neg'"
              >{{ min2hm(row.delta, true) }}</span
            >
            <span v-if="row.cd.eff === 'falta'" class="d neg"
              >-{{ min2hm(row.cd.expected || row.escMin) }}</span
            >
          </div>
        </button>
        <p v-if="!dayRows.length" class="muted">Nenhum dia lançado ainda.</p>
      </div>
      <button class="btn sec small" style="margin-top: 10px" @click="addDayManual">
        + Lançar dia manualmente
      </button>
    </div>

    <div class="card">
      <h2>Pagamentos adicionais</h2>
      <div>
        <div v-for="p in pagRows" :key="p.i" class="pagitem">
          <span
            >{{ p.d }} <span class="chip" :class="p.trib ? 'abonado' : 'ferias'">{{
              p.trib ? 'tributável' : 'não trib.'
            }}</span></span
          >
          <span class="mono"
            >{{ p.val }}
            <button class="btn warn small" :disabled="m.closed" @click="delPag(p.i)">×</button>
          </span>
        </div>
        <p v-if="!pagRows.length" class="muted">Nenhum lançamento.</p>
      </div>
      <div class="row" style="margin-top: 8px">
        <input v-model="pagDesc" placeholder="Descrição" style="flex: 2" :disabled="m.closed" />
      </div>
      <div class="row" style="margin-top: 6px">
        <input
          v-model="pagVal"
          type="number"
          step="0.01"
          inputmode="decimal"
          placeholder="Valor R$"
          :disabled="m.closed"
        />
        <select v-model="pagTrib" :disabled="m.closed">
          <option value="1">Tributável</option>
          <option value="0">Não tributável</option>
        </select>
        <button class="btn small" style="flex: none" :disabled="m.closed" @click="addPag">
          Add
        </button>
      </div>
    </div>

    <div v-for="fcard in ferCards" :key="fcard.fi" class="card">
      <h2>Férias · {{ fmtDK(fcard.ini) }} a {{ fmtDK(fcard.fim) }}</h2>
      <p class="muted" style="margin-bottom: 6px">
        Toque numa verba para registrar o valor do recibo de férias.
      </p>
      <div class="row" style="margin-bottom: 8px">
        <button
          v-if="!fcard.fAllFilled"
          class="btn ghost small"
          @click="gerarConferenciaFerias(fcard.fi)"
        >
          Gerar conferência com recibo
        </button>
        <button
          v-if="fcard.fAnyFilled"
          class="btn ghost small"
          @click="gerarConferenciaFerias(fcard.fi, true)"
        >
          Regenerar
        </button>
      </div>
      <div class="hol">
        <div class="l">
          <span>Dias de gozo</span><b>{{ fcard.dias }}</b>
        </div>
        <div v-if="fcard.vendidos" class="l">
          <span>Dias vendidos (abono)</span><b>{{ fcard.vendidos }}</b>
        </div>
        <template v-for="line in fcard.lines" :key="line.k">
          <div v-if="line.tot" class="sep"></div>
          <button class="hline" @click="openFerConf(fcard.fi, line.k, mk)">
            <div class="l" :class="{ tot: line.tot }">
              <span
                >{{ line.lb }}<span v-if="line.ref" style="font-size: 11px">
                  · {{ line.ref }}</span
                ></span
              >
              <b :class="{ neg2: line.isDb }">{{ line.isDb ? '− ' : '' }}{{ brl(line.val) }}</b>
            </div>
            <div v-if="line.sub" class="hv">
              <b>Holerite: {{ line.sub.holerite }}</b>
              <span v-if="line.sub.ok" class="conf-diff pos">✓ confere</span>
              <span v-else class="conf-diff neg">{{ line.sub.diff }}</span>
            </div>
          </button>
        </template>
        <div class="l">
          <span>Pagamento até</span><b>{{ fmtDK(fcard.prazo) }}</b>
        </div>
      </div>
      <div v-if="fcard.fdvLength" class="msg" :class="{ err: fcard.fbadText }" style="margin-top: 8px">
        <template v-if="fcard.fbadText"
          ><b>divergência(s) no recibo de férias:</b> {{ fcard.fbadText }}</template
        >
        <template v-else>✓ Recibo de férias confere com o app.</template>
      </div>
      <p class="muted" style="margin-top: 8px">
        Como as férias são pagas antes do descanso, os dias de férias deste mês são descontados
        da folha mensal — por isso o salário do pagamento seguinte vem menor. O valor não some:
        veio adiantado no recibo de férias.
      </p>
    </div>

    <div v-if="c13Card" class="card">
      <h2>13º salário previsto neste mês</h2>
      <div class="hol">
        <div class="l">
          <span>Base ({{ c13Card.avos }}/12 avos × salário + média de extras)</span
          ><b>{{ c13Card.base }}</b>
        </div>
        <div v-for="(r, i) in c13Card.rows" :key="i" class="l">
          <span>{{ r.label }}</span><b :class="{ neg2: r.neg }">{{ r.neg ? '− ' : '' }}{{ r.value }}</b>
        </div>
      </div>
      <p class="muted" style="margin-top: 8px">
        O 13º é pago à parte da folha mensal, com tributação exclusiva — não entra no líquido do
        mês acima.
      </p>
    </div>

    <div class="card">
      <h2>Folha de pagamento</h2>
      <p class="muted" style="margin-bottom: 8px">
        Toque numa verba para registrar o valor do holerite oficial — divergências acima de
        R$ 0,05 ficam destacadas e entram no relatório.
      </p>
      <div class="hol">
        <template v-for="line in folhaLines" :key="line.k">
          <button v-if="line.confable" class="hline" @click="openConf(mk, line.k)">
            <div class="l">
              <span
                >{{ line.d }}<span v-if="line.ref" style="font-size: 11px">
                  · {{ line.ref }}</span
                ></span
              >
              <b :class="{ neg2: line.isDb }">{{ line.isDb ? '− ' : '' }}{{ line.val }}</b>
            </div>
            <div v-if="line.sub" class="hv">
              <b>Holerite: {{ line.sub.holerite }}</b>
              <span v-if="line.sub.ok" class="conf-diff pos">✓ confere</span>
              <span v-else class="conf-diff neg">{{ line.sub.diff }}</span>
            </div>
          </button>
          <div v-else class="hline">
            <div class="l">
              <span
                >{{ line.d }}<span v-if="line.ref" style="font-size: 11px">
                  · {{ line.ref }}</span
                ></span
              >
              <b :class="{ neg2: line.isDb }">{{ line.isDb ? '− ' : '' }}{{ line.val }}</b>
            </div>
          </div>
        </template>
        <div class="sep"></div>
        <div class="l">
          <span>Total de créditos</span><b>{{ brl(H.totCr) }}</b>
        </div>
        <div class="l">
          <span>Total de débitos</span><b class="neg2">− {{ brl(H.totDb) }}</b>
        </div>
        <div class="l tot">
          <span>Líquido</span><b>{{ brl(c.liquido) }}</b>
        </div>
        <div v-if="c.cesta" class="l">
          <span>+ Vale cesta (benefício)</span><b>{{ brl(c.cesta) }}</b>
        </div>
        <div v-if="c.cesta" class="l tot">
          <span>Total a receber</span><b>{{ brl(c.totalReceber) }}</b>
        </div>
        <div class="l muted" style="font-size: 11.5px">
          <span
            >Bruto tributável {{ brl(c.bruto) }} · base IRPF {{ brl(c.baseIR) }} · valor-hora
            {{ brl(c.vh) }}</span
          >
        </div>
      </div>
      <div style="margin-top: 8px">
        <div
          v-for="x in confSummary.xRows"
          :key="x.i"
          class="hline"
          role="button"
          tabindex="0"
          @click="openConfX(mk, x.i)"
        >
          <div class="l">
            <span>{{ x.d }} <span class="chip pend">só no holerite</span></span>
            <b :class="{ neg2: x.isDb }">{{ x.isDb ? '− ' : '' }}{{ x.val }}</b>
          </div>
        </div>
        <div class="row" style="margin-top: 8px">
          <button
            v-if="!confSummary.cfAllFilled"
            class="btn ghost small"
            :disabled="m.closed"
            @click="gerarConferencia(mk)"
          >
            Gerar conferência com holerite
          </button>
          <button
            v-if="confSummary.cfAnyFilled"
            class="btn ghost small"
            :disabled="m.closed"
            @click="gerarConferencia(mk, true)"
          >
            Regenerar
          </button>
          <button class="btn ghost small" @click="openConf(mk, 'liquido')">
            Conferir líquido{{ confSummary.liqConfLabel }}
          </button>
          <button
            class="btn ghost small"
            :disabled="m.closed"
            @click="openConfX(mk, -1)"
          >
            + Verba do holerite
          </button>
        </div>
        <div v-if="confSummary.dvLength" class="msg" :class="{ err: confSummary.badText }" style="margin-top: 8px">
          <template v-if="confSummary.badText"><b>divergência(s):</b> {{ confSummary.badText }}</template>
          <template v-else>✓ Holerite confere com o app em todas as verbas preenchidas.</template>
        </div>
      </div>
    </div>

    <div class="row" style="margin-bottom: 8px">
      <button class="btn" @click="toggleFechar">{{ m.closed ? 'Reabrir mês' : 'Fechar mês' }}</button>
      <button class="btn sec" @click="relatorio">Gerar relatório</button>
    </div>
    <p class="muted" style="margin-bottom: 16px">
      Fechar o mês congela os cálculos com as regras vigentes — mudanças futuras não afetam meses
      fechados.
    </p>
  </section>
</template>
