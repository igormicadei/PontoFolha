<script setup lang="ts">
/* Aba Férias: o recibo de férias que toca este mês (valor, prazo, verbas com
   toque-para-conferir, bases) e por que a folha mensal fica menor. */
import { computed, ref } from 'vue'
import { useFolha } from '@/stores/folha'
import { FER_FIELDS } from '@/lib/engine'
import { brl, num, fmtDM, fmtDKs, dow, DSEM, daysDiff, todayKey } from '@/lib/utils'
import { openFerConf, gerarConferenciaFerias } from '@/lib/confSheet'
import { openFerias } from '@/lib/ferias'

const props = defineProps<{ mk: string }>()
const folha = useFolha()
const S = folha.S
const zeros = ref<Record<number, boolean>>({})

interface Linha {
  k: string
  d: string
  ref?: string
  val: number
  isDb: boolean
  zero: boolean
  sub?: { holerite: string; diff: string; ok: boolean }
}

const cards = computed(() => {
  const tk = todayKey()
  return S.ferias
    .map((f, fi) => ({ f, fi }))
    .filter(({ f }) => f.ini.slice(0, 7) <= props.mk && f.fim.slice(0, 7) >= props.mk)
    .map(({ f, fi }) => {
      const fc = folha.feriasCalc(f, folha.cfgFor(f.ini.slice(0, 7)))
      const conf = f.conf || {}
      const l = (k: string, d: string, refTxt: string | undefined, val: number, isDb: boolean): Linha => {
        const filled = conf[k] != null && conf[k] !== ''
        let sub: Linha['sub']
        if (filled) {
          const fd = FER_FIELDS.find((x) => x.k === k)!
          const hv = num(parseFloat(conf[k]!))
          const dd = hv - fd.app(fc)
          const ok = Math.abs(dd) <= 0.05
          sub = { holerite: brl(hv), diff: ok ? '' : `${dd > 0 ? '+' : ''}${brl(dd)}`, ok }
        }
        return { k, d, ref: refTxt, val, isDb, zero: val === 0 && !filled, sub }
      }
      const linhas: Linha[] = [
        l('gozo', 'Férias', `${fc.dias} × ${brl(fc.vd)}`, fc.brutoGozo, false),
        l('terco', '1/3 constitucional', undefined, fc.terco, false)
      ]
      if (f.vendidos) linhas.push(l('abono', 'Abono + 1/3', `${f.vendidos} dias vendidos, isentos`, fc.abono + fc.abonoTerco, false))
      linhas.push(l('inss', 'INSS sobre férias', undefined, fc.inss, true))
      linhas.push(l('irpf', 'IRPF sobre férias', undefined, fc.irpf, true))
      const fdv = folha.ferConfDiffs(f)
      const bad = fdv.filter((x) => !x.ok)
      const days = daysDiff(tk, f.ini)
      const estado = f.fim < tk ? 'Concluídas' : f.ini <= tk ? 'Em curso' : days === 0 ? 'Começam hoje' : days === 1 ? 'Começam amanhã' : `Começam em ${days} dias`
      return {
        fi,
        f,
        fc,
        estado,
        linhas,
        fdv: fdv.length,
        badText: bad.map((x) => `${x.lb} (${x.diff > 0 ? '+' : ''}${brl(x.diff)})`).join(' · '),
        algum: FER_FIELDS.some((x) => conf[x.k] != null && conf[x.k] !== ''),
        todos: FER_FIELDS.every((x) => conf[x.k] != null && conf[x.k] !== ''),
        prazoTxt: `${DSEM[dow(fc.prazo)]}., ${fmtDKs(fc.prazo)}`
      }
    })
})
</script>

<template>
  <section v-if="!cards.length" class="card" style="text-align: center; padding: 28px 20px">
    <h2 style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em">Sem férias neste mês</h2>
    <p class="muted" style="margin: 6px auto 16px; max-width: 280px">Programe um período e o app calcula o recibo, o prazo de pagamento e o efeito na folha.</p>
    <button class="btn" @click="openFerias(-1)">Programar férias</button>
  </section>

  <template v-for="c in cards" :key="c.fi">
    <section class="card lilac" aria-label="Recibo de férias">
      <div class="between">
        <div class="eyebrow">Férias · {{ fmtDM(c.f.ini) }} → {{ fmtDM(c.f.fim) }}</div>
        <span class="chip ink">{{ c.estado }}</span>
      </div>
      <div class="big" style="margin-top: 6px">{{ brl(c.fc.liq) }}</div>
      <p style="margin-top: 6px; font-size: 14px">Líquido do recibo · pagamento até <b>{{ c.prazoTxt }}</b></p>
    </section>

    <section class="card" aria-label="Recibo estimado">
      <div class="h2"><span>Recibo de férias estimado</span></div>
      <p class="muted">Toque numa verba para registrar o valor do recibo oficial.</p>
      <div class="pay">
        <div class="ln"><div class="d">Dias de gozo<small>{{ c.f.vendidos ? `${c.f.vendidos} dias vendidos (abono)` : 'sem dias vendidos' }}</small></div><div class="v">{{ c.fc.dias }}</div></div>
        <template v-for="l in c.linhas" :key="l.k">
          <button v-if="!l.zero || zeros[c.fi]" class="ln" @click="openFerConf(c.fi, l.k, mk)">
            <div class="d">{{ l.d }}<small v-if="l.ref">{{ l.ref }}</small></div>
            <div class="v" :class="{ neg: l.isDb }">{{ l.isDb ? '− ' : '' }}{{ brl(l.val) }}
              <small v-if="l.sub" :class="l.sub.ok ? 'pos' : 'neg'">{{ l.sub.ok ? '✓ confere' : l.sub.diff }} · recibo {{ l.sub.holerite }}</small>
            </div>
          </button>
        </template>
        <button v-if="c.linhas.some((x) => x.zero)" class="link" style="margin-top: 4px" @click="zeros[c.fi] = !zeros[c.fi]">
          {{ zeros[c.fi] ? 'Ocultar linhas zeradas' : `Mostrar ${c.linhas.filter((x) => x.zero).length} linha(s) zerada(s)` }}
        </button>
        <hr class="hr" style="margin: 8px 0 0" />
        <button class="ln" style="font-size: 17px; font-weight: 800" @click="openFerConf(c.fi, 'liq', mk)">
          <div class="d" style="font-weight: 800">Líquido de férias</div><div class="v">{{ brl(c.fc.liq) }}</div>
        </button>
      </div>
      <div v-if="c.fdv" class="note-box" :class="c.badText ? 'err' : ''" style="margin-top: 8px">
        <template v-if="c.badText"><b>Divergências no recibo:</b> {{ c.badText }}</template>
        <template v-else>✓ Recibo de férias confere com o app.</template>
      </div>
      <div class="stack" style="margin-top: 14px">
        <button v-if="!c.todos" class="btn block" @click="gerarConferenciaFerias(c.fi)">Gerar conferência com o recibo</button>
        <button v-if="c.algum" class="btn ghost block" @click="gerarConferenciaFerias(c.fi, true)">Regenerar conferência</button>
      </div>
    </section>

    <section class="card" aria-label="Por que a folha é menor">
      <div class="rowflex" style="align-items: flex-start; gap: 12px">
        <div class="ic" style="width: 40px; height: 40px; border-radius: 14px; background: var(--warn-bg); color: var(--warn); display: grid; place-items: center; flex: none">
          <svg class="i sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></svg>
        </div>
        <div class="grow">
          <h2 style="font-size: 16px; font-weight: 700; line-height: 1.3">Por que a folha do mês fica menor?</h2>
          <p class="muted" style="margin-top: 4px; font-size: 14px">
            Os {{ c.fc.dias }} dias de férias já vieram adiantados no recibo ({{ brl(c.fc.brutoGozo) }}) e saem da folha mensal. O valor não some: só mudou de data.
          </p>
        </div>
      </div>
    </section>

    <section class="card" aria-label="Bases de cálculo das férias">
      <div class="h2"><span>Bases de cálculo</span></div>
      <div class="pay">
        <div class="ln"><div class="d">Valor do dia de férias<small>salário ÷ 30</small></div><div class="v">{{ brl(c.fc.vd) }}</div></div>
        <div class="ln"><div class="d">Base de INSS e IRPF<small>gozo + 1/3</small></div><div class="v">{{ brl(c.fc.baseTrib) }}</div></div>
        <div class="ln"><div class="d">Base do IRPF<small>base − INSS − dependentes ({{ c.fc.nDep }})</small></div><div class="v">{{ brl(c.fc.baseIR) }}</div></div>
        <div v-if="c.fc.irRed" class="ln"><div class="d">Redutor do IRPF<small>Lei 15.270/2025</small></div><div class="v">− {{ brl(c.fc.irRed) }}</div></div>
      </div>
    </section>

    <button class="btn ghost block" @click="openFerias(c.fi)">Editar período de férias</button>
  </template>
</template>
