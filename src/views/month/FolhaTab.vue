<script setup lang="ts">
/* Aba Folha: itens avulsos (créditos e débitos que contam no cálculo), o
   demonstrativo estimado com toque-para-conferir, a conferência com o holerite
   oficial, o 13º previsto no mês, as bases de cálculo e o fechamento. */
import { computed, ref } from 'vue'
import { useFolha } from '@/stores/folha'
import { CONF_FIELDS } from '@/lib/engine'
import { MESES, brl, num, pad, parseDM } from '@/lib/utils'
import { openConf, openConfX, gerarConferencia } from '@/lib/confSheet'
import { openItemSheet, removeItem } from '@/lib/itemSheet'
import { itemType, pagKind, pagTag } from '@/lib/itemTypes'
import { abrirRelatorio } from '@/lib/report'
import FeriasAvisos from '@/components/FeriasAvisos.vue'

const props = defineProps<{ mk: string }>()
const emit = defineEmits<{ fechar: [] }>()
const folha = useFolha()
const S = folha.S

const m = computed(() => folha.getMonth(props.mk))
const H = computed(() => folha.holLines(props.mk))
const c = computed(() => H.value.c)
/** Férias que tocam este mês (a média de horas extras delas pesa no INSS da competência). */
const feriasDoMes = computed(() => S.ferias.filter((f) => f.ini.slice(0, 7) <= props.mk && f.fim.slice(0, 7) >= props.mk))
const mesNome = computed(() => MESES[Number(props.mk.slice(5, 7)) - 1]!)

/* ---- itens avulsos ---- */
const itens = computed(() =>
  m.value.pags.map((p, i) => {
    const k = pagKind(p)
    return {
      i,
      k,
      nome: p.d,
      tipo: itemType(p.ty, k).label,
      tag: pagTag(p),
      val: brl(num(p.v))
    }
  })
)

/* ---- demonstrativo ---- */
interface Linha {
  k: string
  d: string
  ref?: string
  val: string
  isDb: boolean
  zero: boolean
  confable: boolean
  sub?: { holerite: string; diff: string; ok: boolean }
}
const mostrarZeros = ref(false)
const linhas = computed<Linha[]>(() => {
  const conf = m.value.conf || {}
  return H.value.lines.map((l) => {
    const confable = !l.k.startsWith('_')
    const appV = l.db != null ? l.db : l.cr || 0
    let sub: Linha['sub']
    const preenchido = confable && conf[l.k] != null && conf[l.k] !== ''
    if (preenchido) {
      const hv = num(parseFloat(conf[l.k]!))
      const dd = hv - appV
      const ok = Math.abs(dd) <= 0.05
      sub = { holerite: brl(hv), diff: ok ? '' : `${dd > 0 ? '+' : ''}${brl(dd)}`, ok }
    }
    return {
      k: l.k,
      d: l.d,
      ref: l.ref,
      val: brl(appV),
      isDb: l.db != null,
      zero: appV === 0 && !preenchido && l.k !== '_banco',
      confable,
      sub
    }
  })
})
const zeros = computed(() => linhas.value.filter((l) => l.zero))
const visiveis = computed(() => linhas.value.filter((l) => !l.zero || mostrarZeros.value))
const creditos = computed(() => visiveis.value.filter((l) => !l.isDb))
const debitos = computed(() => visiveis.value.filter((l) => l.isDb))

/* ---- conferência ---- */
const conf = computed(() => {
  const cf = m.value.conf || {}
  const dv = folha.confDiffs(props.mk)
  const bad = dv.filter((x) => !x.ok)
  const algum = CONF_FIELDS.some((f) => cf[f.k] != null && cf[f.k] !== '')
  const todos = CONF_FIELDS.every((f) => cf[f.k] != null && cf[f.k] !== '')
  return {
    dv: dv.length,
    badText: bad.map((x) => `${x.lb} (${x.diff > 0 ? '+' : ''}${brl(x.diff)})`).join(' · '),
    nBad: bad.length,
    algum,
    todos,
    liq: cf.liquido ? ` (${brl(num(parseFloat(cf.liquido)))})` : '',
    x: (m.value.confX || []).map((x, i) => ({ i, d: x.d, isDb: x.t === 'd', val: brl(num(x.v)) }))
  }
})
const confChip = computed(() => {
  if (!conf.value.algum && !conf.value.x.length) return { t: 'Não iniciada', cls: '' }
  if (conf.value.nBad || conf.value.x.length) return { t: `${conf.value.nBad + conf.value.x.length} divergência(s)`, cls: 'bad' }
  return { t: '✓ Confere', cls: 'ok' }
})

/* ---- 13º previsto no mês ---- */
const c13 = computed(() => {
  const [y, mmS] = props.mk.split('-')
  const mmNum = Number(mmS)
  const dm1 = parseDM(S.c13.d1)
  const dm2 = parseDM(S.c13.d2)
  const dmU = parseDM(S.c13.dU)
  const t13 = folha.calc13(y!)
  const rows: { label: string; value: string; neg?: boolean }[] = []
  if (S.c13.modo === '2') {
    if (dm1 && mmNum === dm1.m) rows.push({ label: `1ª parcela (adiantamento, sem descontos) até ${pad(dm1.d)}/${pad(dm1.m)}`, value: brl(t13.p1) })
    if (dm2 && mmNum === dm2.m) {
      rows.push({ label: `2ª parcela até ${pad(dm2.d)}/${pad(dm2.m)}`, value: brl(t13.p2) })
      rows.push({ label: 'INSS + IRPF do 13º (na 2ª parcela)', value: '− ' + brl(t13.inss + t13.irpf), neg: true })
    }
  } else if (dmU && mmNum === dmU.m) {
    rows.push({ label: `Parcela única até ${pad(dmU.d)}/${pad(dmU.m)}`, value: brl(t13.liq) })
    rows.push({ label: 'INSS + IRPF do 13º', value: '− ' + brl(t13.inss + t13.irpf), neg: true })
  }
  return rows.length ? { avos: t13.avos, base: brl(t13.base), rows } : null
})

function conferir(l: Linha): void {
  if (l.confable) openConf(props.mk, l.k)
}
</script>

<template>
  <FeriasAvisos v-for="f in feriasDoMes" :key="f.ini" :ferias="f" so="warn" titulo />

  <section class="card" aria-label="Itens avulsos">
    <div class="h2"><span>Itens avulsos</span></div>
    <template v-if="itens.length">
      <div class="list">
        <div v-for="it in itens" :key="it.i" class="li">
          <button class="grow" style="text-align: left; min-height: 44px" :aria-label="`Editar ${it.nome}`" @click="openItemSheet(mk, it.i)">
            <div class="t">{{ it.nome }}</div>
            <div class="s">{{ it.tipo }} · <span class="chip" :class="it.k === 'd' ? 'bad' : it.tag === 'Tributável' ? '' : 'vac'" style="height: 20px">{{ it.tag }}</span></div>
          </button>
          <b :class="{ neg: it.k === 'd' }">{{ it.k === 'd' ? '− ' : '+ ' }}{{ it.val }}</b>
          <button class="iconplain bad" :aria-label="`Remover ${it.nome}`" @click="removeItem(mk, it.i)">
            <svg class="i sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>
    </template>
    <p v-else class="muted">Nenhum item neste mês. Prêmios, comissões, reembolsos e descontos entram aqui e já contam no demonstrativo abaixo.</p>
    <button class="btn sec block" style="margin-top: 12px" :disabled="m.closed" @click="openItemSheet(mk)">
      <svg class="i sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Adicionar item
    </button>
  </section>

  <section class="card" aria-label="Demonstrativo estimado">
    <div class="h2"><span>Demonstrativo estimado</span></div>
    <p class="muted">Toque numa verba para registrar o valor do holerite oficial.</p>
    <div class="pay">
      <div class="eyebrow" style="padding-top: 14px">Créditos</div>
      <template v-for="l in creditos" :key="l.k">
        <button v-if="l.confable" class="ln" @click="conferir(l)">
          <div class="d">{{ l.d }}<small v-if="l.ref">{{ l.ref }}</small></div>
          <div class="v">{{ l.val }}
            <small v-if="l.sub" :class="l.sub.ok ? 'pos' : 'neg'">{{ l.sub.ok ? '✓ confere' : l.sub.diff }} · holerite {{ l.sub.holerite }}</small>
          </div>
        </button>
        <div v-else class="ln">
          <div class="d">{{ l.d }}<small v-if="l.ref">{{ l.ref }}</small></div>
          <div class="v">{{ l.val }}</div>
        </div>
      </template>
      <div class="eyebrow" style="padding-top: 14px">Débitos</div>
      <template v-for="l in debitos" :key="l.k">
        <button v-if="l.confable" class="ln" @click="conferir(l)">
          <div class="d">{{ l.d }}<small v-if="l.ref">{{ l.ref }}</small></div>
          <div class="v neg">− {{ l.val }}
            <small v-if="l.sub" :class="l.sub.ok ? 'pos' : 'neg'">{{ l.sub.ok ? '✓ confere' : l.sub.diff }} · holerite {{ l.sub.holerite }}</small>
          </div>
        </button>
        <div v-else class="ln">
          <div class="d">{{ l.d }}<small v-if="l.ref">{{ l.ref }}</small></div>
          <div class="v neg">− {{ l.val }}</div>
        </div>
      </template>
      <button v-if="zeros.length" class="link" style="margin-top: 4px" @click="mostrarZeros = !mostrarZeros">
        {{ mostrarZeros ? 'Ocultar linhas zeradas' : `Mostrar ${zeros.length} ${zeros.length === 1 ? 'linha zerada' : 'linhas zeradas'}` }}
      </button>
      <p v-if="zeros.length && !mostrarZeros" class="muted">Sem valor neste mês: {{ zeros.map((z) => z.d.toLowerCase()).join(', ') }}.</p>
      <hr class="hr" style="margin: 12px 0 0" />
      <div class="tot sub"><span>Total de créditos</span><span>{{ brl(H.totCr) }}</span></div>
      <div class="tot sub" style="padding-top: 4px"><span>Total de débitos</span><span class="neg">− {{ brl(H.totDb) }}</span></div>
      <div class="tot" style="padding-top: 14px"><span>Líquido</span><span>{{ brl(c.liquido) }}</span></div>
      <template v-if="c.cesta">
        <div class="tot sub" style="padding-top: 8px"><span>+ Vale cesta (benefício)</span><span>{{ brl(c.cesta) }}</span></div>
        <div class="tot" style="padding-top: 8px"><span>Total a receber</span><span>{{ brl(c.totalReceber) }}</span></div>
      </template>
    </div>
  </section>

  <section class="card" aria-label="Conferência com o holerite">
    <div class="h2"><span>Conferir com o holerite</span><span class="chip" :class="confChip.cls">{{ confChip.t }}</span></div>
    <p class="muted">Registre os valores do holerite oficial e o app destaca diferenças acima de R$ 0,05. Elas entram no PDF.</p>

    <div v-if="conf.x.length" class="list" style="margin-top: 8px">
      <button v-for="x in conf.x" :key="x.i" class="li" style="min-height: 52px" @click="openConfX(mk, x.i)">
        <div class="grow"><div class="t">{{ x.d }}</div><div class="s">Só no holerite</div></div>
        <b :class="{ neg: x.isDb }">{{ x.isDb ? '− ' : '' }}{{ x.val }}</b>
      </button>
    </div>

    <div v-if="conf.dv" class="note-box" :class="conf.nBad ? 'err' : ''" style="margin-top: 10px">
      <template v-if="conf.badText"><b>Divergências:</b> {{ conf.badText }}</template>
      <template v-else>✓ Holerite confere com o app em todas as verbas preenchidas.</template>
    </div>

    <div class="stack" style="margin-top: 14px">
      <button v-if="!conf.todos" class="btn block" :disabled="m.closed" @click="gerarConferencia(mk)">Gerar conferência</button>
      <button v-if="conf.algum" class="btn ghost block" :disabled="m.closed" @click="gerarConferencia(mk, true)">Regenerar conferência</button>
      <div class="rowflex">
        <button class="btn ghost sm grow" @click="openConf(mk, 'liquido')">Conferir líquido{{ conf.liq }}</button>
        <button class="btn ghost sm grow" :disabled="m.closed" @click="openConfX(mk, -1)">+ Verba do holerite</button>
      </div>
    </div>
  </section>

  <section v-if="c13" class="card" aria-label="13º salário previsto">
    <div class="h2"><span>13º salário previsto neste mês</span></div>
    <div class="pay">
      <div class="ln"><div class="d">Base<small>{{ c13.avos }}/12 avos × salário + média de extras</small></div><div class="v">{{ c13.base }}</div></div>
      <div v-for="(r, i) in c13.rows" :key="i" class="ln">
        <div class="d">{{ r.label }}</div>
        <div class="v" :class="{ neg: r.neg }">{{ r.value }}</div>
      </div>
    </div>
    <p class="muted" style="margin-top: 8px">O 13º é pago à parte da folha mensal, com tributação exclusiva: não entra no líquido do mês acima.</p>
  </section>

  <section class="card" aria-label="Bases de cálculo">
    <div class="h2"><span>Bases de cálculo</span></div>
    <div class="pay">
      <div class="ln"><div class="d">Bruto tributável</div><div class="v">{{ brl(c.bruto) }}</div></div>
      <div class="ln"><div class="d">Base do INSS da competência<small v-if="c.vFerias">inclui férias e 1/3</small></div><div class="v">{{ brl(c.baseInss) }}</div></div>
      <div class="ln"><div class="d">Base do IRPF<small>bruto − INSS − dependentes ({{ c.nDep }})</small></div><div class="v">{{ brl(c.baseIR) }}</div></div>
      <div v-if="c.irRed" class="ln"><div class="d">Redutor do IRPF<small>Lei 15.270/2025</small></div><div class="v">− {{ brl(c.irRed) }}</div></div>
      <div class="ln"><div class="d">Valor-hora</div><div class="v">{{ brl(c.vh) }}</div></div>
      <div class="ln"><div class="d">Hora extra +{{ c.pctExtra }}%</div><div class="v">{{ brl(c.vhe) }}</div></div>
    </div>
  </section>

  <section class="card" aria-label="Fechamento">
    <div class="stack">
      <button class="btn block" @click="abrirRelatorio(mk)">Gerar PDF do mês</button>
      <button class="btn ghost block" @click="emit('fechar')">{{ m.closed ? `Reabrir ${mesNome}` : `Fechar ${mesNome}` }}</button>
    </div>
    <p class="muted" style="margin-top: 12px">
      Fechar congela os cálculos com as regras de hoje. Mudanças futuras não afetam meses fechados, e você pode reabrir quando quiser.
    </p>
  </section>
</template>
