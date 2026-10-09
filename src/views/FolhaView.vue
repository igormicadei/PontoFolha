<script setup lang="ts">
/* Tela Folha (antes "Jornada"): o mês corrente em destaque, próximos
   pagamentos (recibo de férias, 13º), lista de meses, férias programadas e o
   que já foi acumulado (13º e férias) em palavras simples. */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import { openFerias } from '@/lib/ferias'
import { MESES, MES_ABR, brl, num, min2hm, fmtDK, fmtDM, dow, cap, yAdd, todayKey, curMonthKey, parseDM, pad } from '@/lib/utils'

const folha = useFolha()
const router = useRouter()
const S = folha.S

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => (timer = setInterval(() => (now.value = new Date()), 60000)))
onUnmounted(() => timer && clearInterval(timer))

const mkNow = computed(() => (now.value, curMonthKey()))
const nomeMes = (k: string): string => `${cap(MESES[Number(k.slice(5, 7)) - 1]!)} ${k.slice(0, 4)}`

function ferLiqDoMes(k: string): number {
  return S.ferias
    .filter((f) => f.ini.slice(0, 7) <= k && f.fim.slice(0, 7) >= k)
    .reduce((a, f) => a + folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7))).liq, 0)
}

const hero = computed(() => {
  const k = mkNow.value
  const c = folha.computeMonth(k)
  const fer = ferLiqDoMes(k)
  return {
    k,
    title: nomeMes(k),
    closed: !!folha.getMonth(k).closed,
    total: brl(c.liquido + fer),
    sub: fer ? `Folha ${brl(c.liquido)} + férias ${brl(fer)}, sem o vale cesta` : `Folha líquida estimada${c.cesta ? ', sem o vale cesta' : ''}`
  }
})

interface Evento {
  dk: string
  mes: string
  dia: string
  titulo: string
  sub: string
  valor: string
}
const eventos = computed<Evento[]>(() => {
  void now.value
  const tk = todayKey()
  const out: Evento[] = []
  for (const f of S.ferias) {
    const fc = folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7)))
    if (fc.prazo < tk) continue
    out.push({
      dk: fc.prazo,
      dia: String(Number(fc.prazo.slice(8))),
      mes: MES_ABR[Number(fc.prazo.slice(5, 7)) - 1]!,
      titulo: 'Recibo de férias',
      sub: `${cap(['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][dow(fc.prazo)]!)} · até 2 dias antes das férias (${fmtDM(f.ini)} → ${fmtDM(f.fim)})`,
      valor: brl(fc.liq)
    })
  }
  const y = tk.slice(0, 4)
  const t13 = folha.calc13(y)
  const add = (s: string, titulo: string, sub: string, valor: number): void => {
    const dm = parseDM(s)
    if (!dm) return
    const dk = `${y}-${pad(dm.m)}-${pad(dm.d)}`
    if (dk < tk) return
    out.push({ dk, dia: String(dm.d), mes: MES_ABR[dm.m - 1]!, titulo, sub, valor: brl(valor) })
  }
  if (S.c13.modo === '2') {
    add(S.c13.d1, '13º salário · 1ª parcela', 'Adiantamento, sem descontos', t13.p1)
    add(S.c13.d2, '13º salário · 2ª parcela', `Já com INSS de ${brl(t13.inss)}${t13.irpf ? ` e IRPF de ${brl(t13.irpf)}` : ' · IRPF zero'}`, t13.p2)
  } else add(S.c13.dU, '13º salário · parcela única', 'Com INSS e IRPF', t13.liq)
  return out.sort((a, b) => (a.dk < b.dk ? -1 : 1))
})

interface Acum {
  label: string
  sub?: string
  value?: string
}
const acumulado = computed<Acum[]>(() => {
  void now.value
  const tk = todayKey()
  const y = tk.slice(0, 4)
  const mNum = Number(tk.slice(5, 7))
  const t13 = folha.calc13(y)
  const avosNow = folha.avos13(y, mNum)
  const cfgDez = folha.cfgFor(`${y}-12`)
  const baseMensal = num(cfgDez.salario) + folha.extrasMediaAno(y)
  const lines: Acum[] = [
    { label: '13º salário até agora', sub: `${avosNow} de 12 avos`, value: brl((baseMensal * avosNow) / 12) },
    { label: '13º previsto no ano', sub: `${t13.avos} de 12 avos`, value: brl(t13.base) }
  ]
  const aq = folha.aquisitivo()
  if (aq) {
    lines.push({
      label: 'Férias + 1/3',
      sub: `${aq.meses} de 12 · período ${fmtDK(aq.ini)} → ${fmtDK(aq.fim)}`,
      value: brl(((baseMensal * 4) / 3) * aq.meses / 12)
    })
    if (aq.primeiro && todayKey() < aq.direitoApos)
      lines.push({ label: `Direito ao gozo a partir de ${fmtDK(aq.direitoApos)}`, sub: 'fim do 1º período aquisitivo' })
  } else {
    lines.push({
      label: 'Férias + 1/3',
      sub: `${mNum} de 12 do ano · informe a data de admissão em Ajustes para o período exato`,
      value: brl(((baseMensal * 4) / 3) * mNum / 12)
    })
  }
  return lines
})
const baseTxt = computed(() => {
  const y = todayKey().slice(0, 4)
  return brl(num(folha.cfgFor(`${y}-12`).salario) + folha.extrasMediaAno(y))
})

const feriasCards = computed(() => {
  void now.value
  const tkNow = todayKey()
  return S.ferias.map((f, i) => {
    const fc = folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7)))
    const st = f.fim < tkNow ? ['', 'Concluídas'] : f.ini <= tkNow ? ['ok', 'Em curso'] : ['vac', 'Agendadas']
    return {
      i,
      title: `${fmtDM(f.ini)} → ${fmtDM(f.fim)}`,
      cls: st[0]!,
      label: st[1]!,
      warn: !!(S.adm && f.ini < yAdd(S.adm, 1)),
      sub: `${fc.dias} dias de gozo${f.vendidos ? ` + ${f.vendidos} vendidos` : ''} · pagamento até ${fmtDM(fc.prazo)}`,
      liq: brl(fc.liq)
    }
  })
})

const meses = computed(() => {
  void now.value
  const keys = new Set(Object.keys(S.months))
  keys.add(curMonthKey())
  return [...keys]
    .sort()
    .reverse()
    .map((k) => {
      const c = folha.computeMonth(k)
      return {
        k,
        title: nomeMes(k),
        closed: !!folha.getMonth(k).closed,
        worked: min2hm(c.worked),
        saldo: min2hm(c.worked - c.expected, true),
        pos: c.worked - c.expected >= 0,
        pend: c.pend,
        liq: brl(c.liquido + ferLiqDoMes(k))
      }
    })
})

function abrirMes(k: string): void {
  folha.activeMK = k
  router.push({ name: 'month' })
}
</script>

<template>
  <section id="view-folha">
    <header class="appbar">
      <div>
        <h1 class="title">Folha</h1>
        <div class="sub">Meses, pagamentos e o que você já acumulou</div>
      </div>
    </header>

    <main class="content">
      <section class="card ink" aria-label="Mês corrente">
        <div class="between">
          <div class="eyebrow">{{ hero.title }}</div>
          <span class="chip" :class="hero.closed ? '' : 'warn'">{{ hero.closed ? 'Fechado' : 'Em aberto' }}</span>
        </div>
        <div class="big" style="margin-top: 6px">{{ hero.total }}</div>
        <p style="margin-top: 6px; font-size: 14px; opacity: 0.85">{{ hero.sub }}</p>
        <button class="btn block" style="margin-top: 16px; background: var(--on-ink); color: var(--ink)" @click="abrirMes(hero.k)">
          Abrir {{ MESES[Number(hero.k.slice(5, 7)) - 1] }}
          <svg class="i sm" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </section>

      <section v-if="eventos.length" class="card" aria-label="Próximos pagamentos">
        <div class="h2"><span>Próximos pagamentos</span></div>
        <div class="tl">
          <div v-for="(e, i) in eventos" :key="e.dk + e.titulo" class="ev" :class="{ now: i === 0 }">
            <div class="mk">{{ e.dia }}<br />{{ e.mes }}</div>
            <div>
              <div class="t">{{ e.titulo }}</div>
              <div class="s">{{ e.sub }}</div>
            </div>
            <b>{{ e.valor }}</b>
          </div>
        </div>
      </section>

      <section class="card" aria-label="Meses">
        <div class="h2"><span>Meses</span></div>
        <div class="list">
          <button v-for="m in meses" :key="m.k" class="li" @click="abrirMes(m.k)">
            <div class="grow">
              <div class="t">{{ m.title }} <span v-if="m.closed" class="chip ink" style="margin-left: 4px">Fechado</span></div>
              <div class="s">
                {{ m.worked }} trabalhadas · saldo <b :class="m.pos ? 'pos' : 'neg'">{{ m.saldo }}</b>
                <template v-if="m.pend"> · <b style="color: var(--warn)">{{ m.pend }} pendente(s)</b></template>
              </div>
            </div>
            <b>{{ m.liq }}</b>
            <svg class="i chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
        <p class="muted" style="margin-top: 8px">Os meses anteriores aparecem aqui assim que tiverem lançamentos.</p>
      </section>

      <section class="card" aria-label="Férias">
        <div class="h2"><span>Férias programadas</span></div>
        <div v-if="feriasCards.length" class="list">
          <button v-for="c in feriasCards" :key="c.i" class="li" @click="openFerias(c.i)">
            <div class="ic" style="background: var(--vac-bg); color: var(--vac)">
              <svg class="i sm" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
            </div>
            <div class="grow">
              <div class="t">
                {{ c.title }} <span class="chip" :class="c.cls" style="margin-left: 4px">{{ c.label }}</span>
                <span v-if="c.warn" class="chip warn" style="margin-left: 4px">Antes do 1º aquisitivo</span>
              </div>
              <div class="s">{{ c.sub }}</div>
            </div>
            <b>{{ c.liq }}</b>
            <svg class="i chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
        <p v-else class="empty">Nenhum período programado.</p>
        <button class="btn sec block" style="margin-top: 8px" @click="openFerias(-1)">
          <svg class="i sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Programar férias
        </button>
        <p class="muted" style="margin-top: 10px">Até 3 períodos por ano, um deles com 14 dias ou mais. O pagamento sai até 2 dias antes do início.</p>
      </section>

      <section class="card" aria-label="Acumulado">
        <div class="h2"><span>O que você já acumulou</span></div>
        <div class="pay">
          <div v-for="(l, i) in acumulado" :key="i" class="ln">
            <div class="d">{{ l.label }}<small v-if="l.sub">{{ l.sub }}</small></div>
            <div v-if="l.value" class="v">{{ l.value }}</div>
          </div>
        </div>
        <p class="muted" style="margin-top: 8px">Base: salário atual + média das horas extras do ano = {{ baseTxt }}.</p>
      </section>
    </main>
  </section>
</template>
