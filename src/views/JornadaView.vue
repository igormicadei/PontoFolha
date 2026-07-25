<script setup lang="ts">
/* Tela de jornada (index.html #view-jornada 283-296 + renderJornada 1092-1134).
   Três blocos: Provisões (13º acumulado/integral + férias+1/3 conforme período
   aquisitivo), cartões de Férias programadas (cada um abre o editor openFerias)
   e a lista de Meses (união das chaves de S.months + mês corrente). A navegação
   de mês do legado `go('month',k)` vira folha.activeMK=k + router.push('/mes').
   Os computeds tocam `now` para recomputar ao virar o dia (padrão do HomeView). */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import { openFerias } from '@/lib/ferias'
import { MESES, brl, num, min2hm, fmtDK, yAdd, todayKey, curMonthKey } from '@/lib/utils'

const folha = useFolha()
const router = useRouter()
const S = folha.S

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 60000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

interface ProvLine {
  label: string
  value?: string
  muted?: boolean
}

const provLines = computed<ProvLine[]>(() => {
  void now.value
  const tk = todayKey()
  const y = tk.slice(0, 4)
  const mNum = Number(tk.slice(5, 7))
  const t13 = folha.calc13(y)
  const avosNow = folha.avos13(y, mNum)
  const cfgDez = folha.cfgFor(`${y}-12`)
  const baseMensal = num(cfgDez.salario) + folha.extrasMediaAno(y)
  const lines: ProvLine[] = [
    { label: `13º acumulado (${avosNow}/12 avos)`, value: brl((baseMensal * avosNow) / 12) },
    { label: `13º integral previsto (${t13.avos}/12 avos)`, value: brl(t13.base) }
  ]
  const aq = folha.aquisitivo()
  if (aq) {
    lines.push({
      label: `Férias + 1/3 acumuladas (${aq.meses}/12)`,
      value: brl(((baseMensal * 4) / 3) * aq.meses / 12)
    })
    lines.push({ label: `Período aquisitivo: ${fmtDK(aq.ini)} a ${fmtDK(aq.fim)}`, muted: true })
    if (aq.primeiro && todayKey() < aq.direitoApos) {
      lines.push({
        label: `Direito ao gozo a partir de ${fmtDK(aq.direitoApos)} (fim do 1º período aquisitivo)`,
        muted: true
      })
    }
  } else {
    lines.push({
      label: `Férias + 1/3 (${mNum}/12 do ano)`,
      value: brl(((baseMensal * 4) / 3) * mNum / 12)
    })
    lines.push({
      label: 'Defina a data de admissão em Config → Contrato para avos e período aquisitivo exatos',
      muted: true
    })
  }
  lines.push({
    label: `Base: salário vigente + média de extras do ano (${brl(baseMensal)})`,
    muted: true
  })
  return lines
})

interface FeriasCard {
  i: number
  title: string
  chipCls: string
  chipLabel: string
  warn: boolean
  sub: string
  liq: string
}

const feriasCards = computed<FeriasCard[]>(() => {
  void now.value
  const tkNow = todayKey()
  return S.ferias.map((f, i) => {
    const fc = folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7)))
    const st =
      f.fim < tkNow
        ? ['fechado', 'concluídas']
        : f.ini <= tkNow
          ? ['abonado', 'em curso']
          : ['ferias', 'agendadas']
    return {
      i,
      title: `${fmtDK(f.ini)} → ${fmtDK(f.fim)}`,
      chipCls: st[0],
      chipLabel: st[1],
      warn: !!(S.adm && f.ini < yAdd(S.adm, 1)),
      sub: `${fc.dias} dias de gozo${f.vendidos ? ` + ${f.vendidos} vendidos` : ''} · pagto até ${fmtDK(fc.prazo)}`,
      liq: brl(fc.liq)
    }
  })
})

interface MonthCard {
  k: string
  title: string
  closed: boolean
  worked: string
  saldo: string
  pend: number
  liq: string
}

const monthCards = computed<MonthCard[]>(() => {
  void now.value
  const keys = new Set(Object.keys(S.months))
  keys.add(curMonthKey())
  return [...keys]
    .sort()
    .reverse()
    .map((k) => {
      const c = folha.computeMonth(k)
      const [yy, mm] = k.split('-')
      const closed = folha.getMonth(k).closed
      const ferLiq = S.ferias
        .filter((f) => f.ini.slice(0, 7) <= k && f.fim.slice(0, 7) >= k)
        .reduce((a, f) => a + folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7))).liq, 0)
      return {
        k,
        title: `${MESES[Number(mm) - 1]} ${yy}`,
        closed: !!closed,
        worked: min2hm(c.worked),
        saldo: min2hm(c.worked - c.expected, true),
        pend: c.pend,
        liq: brl(c.liquido + ferLiq)
      }
    })
})

function openMonth(k: string): void {
  folha.activeMK = k
  router.push('/mes')
}
</script>

<template>
  <section id="view-jornada">
    <div class="card">
      <h2>Provisões</h2>
      <div class="hol">
        <div v-for="(l, i) in provLines" :key="i" class="l" :class="{ muted: l.muted }">
          <span>{{ l.label }}</span>
          <b v-if="l.value">{{ l.value }}</b>
        </div>
      </div>
    </div>

    <div class="card block-lilac">
      <h2>Férias</h2>
      <div>
        <button
          v-for="c in feriasCards"
          :key="c.i"
          class="mcard"
          style="margin-bottom: 8px"
          @click="openFerias(c.i)"
        >
          <div>
            <div class="t" style="text-transform: none">
              {{ c.title }} <span class="chip" :class="c.chipCls">{{ c.chipLabel }}</span>
              <span v-if="c.warn" class="chip pend">antes do 1º aquisitivo</span>
            </div>
            <div class="v">{{ c.sub }}</div>
          </div>
          <div class="liq">{{ c.liq }}</div>
        </button>
        <p v-if="!feriasCards.length" class="muted">
          Nenhum período programado. Toque no botão para agendar.
        </p>
      </div>
      <button class="btn sec small" style="margin-top: 10px" @click="openFerias(-1)">
        + Programar férias
      </button>
      <p class="muted" style="margin-top: 8px">
        As férias podem ser divididas em até 3 períodos no ano, sendo um deles de pelo menos 14
        dias. O app marca os dias, calcula o valor (pagamento até 2 dias antes do início) e o
        impacto na folha do mês.
      </p>
    </div>

    <h2>Meses</h2>
    <div>
      <button v-for="c in monthCards" :key="c.k" class="mcard" @click="openMonth(c.k)">
        <div>
          <div class="t">
            {{ c.title }} <span v-if="c.closed" class="chip fechado">fechado</span>
          </div>
          <div class="v">
            {{ c.worked }} trab · saldo {{ c.saldo }}
            <template v-if="c.pend"
              > · <span style="color: var(--amber-deep)">{{ c.pend }} pendente(s)</span></template
            >
          </div>
        </div>
        <div class="liq">{{ c.liq }}</div>
      </button>
    </div>
  </section>
</template>
