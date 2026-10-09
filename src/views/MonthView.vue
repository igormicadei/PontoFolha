<script setup lang="ts">
/* Tela do mês: cabeçalho com troca de mês, resumo com o líquido em destaque e
   três abas, em vez de uma rolagem única:
   Dias (calendário + lançamentos), Folha (itens avulsos, demonstrativo,
   conferência, fechamento) e Férias (recibo do mês). `folha.activeMK` guarda o
   mês em foco; a aba vive na query (?aba=) para o voltar do navegador funcionar. */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import { salFamAlert } from '@/lib/engine'
import { MESES, brl, min2hm, mAdd, cap } from '@/lib/utils'
import { ask, confirmS } from '@/lib/dialog'
import { toast } from '@/lib/toast'
import { abrirRelatorio } from '@/lib/report'
import DiasTab from './month/DiasTab.vue'
import FolhaTab from './month/FolhaTab.vue'
import FeriasTab from './month/FeriasTab.vue'

type Aba = 'dias' | 'folha' | 'ferias'

const folha = useFolha()
const route = useRoute()
const router = useRouter()
const S = folha.S

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => (timer = setInterval(() => (now.value = new Date()), 60000)))
onUnmounted(() => timer && clearInterval(timer))

const mk = computed(() => folha.activeMK)
const aba = computed<Aba>(() => {
  const q = String(route.query.aba || '')
  return q === 'folha' || q === 'ferias' ? q : 'dias'
})
function setAba(a: Aba): void {
  router.replace({ name: 'month', query: a === 'dias' ? {} : { aba: a } })
}
function mPrev(): void {
  folha.activeMK = mAdd(folha.activeMK, -1)
}
function mNext(): void {
  folha.activeMK = mAdd(folha.activeMK, 1)
}

const m = computed(() => (now.value, folha.getMonth(mk.value)))
const c = computed(() => (now.value, folha.computeMonth(mk.value)))
const title = computed(() => {
  const [y, mm] = mk.value.split('-')
  return `${cap(MESES[Number(mm) - 1]!)} ${y}`
})
const saldo = computed(() => c.value.worked - c.value.expected)
const ferCount = computed(
  () => S.ferias.filter((f) => f.ini.slice(0, 7) <= mk.value && f.fim.slice(0, 7) >= mk.value).length
)

interface Alert {
  cls: string
  title?: string
  text: string
}
const alerts = computed<Alert[]>(() => {
  const list: Alert[] = []
  if (m.value.closed) list.push({ cls: '', text: 'Mês fechado — valores congelados. Reabra para editar.' })
  const sf = salFamAlert(c.value)
  if (sf) list.push({ cls: sf.level === 'err' ? 'err' : 'warn', title: sf.title, text: sf.text })
  if (mk.value.slice(5, 7) === '05' && Number(folha.cfgFor(mk.value).ferCat) !== 1) {
    list.push({
      cls: '',
      text: 'Lembrete: a CCT do SinSaúde costuma prever feriado da categoria em maio (12/05). Confira a convenção vigente e marque o dia se aplicável.'
    })
  }
  return list
})

async function toggleFechar(): Promise<void> {
  const mkv = mk.value
  const mm = folha.getMonth(mkv)
  if (mm.closed) {
    if (await confirmS('Reabrir o mês?', 'Os valores voltarão a ser recalculados com as regras vigentes.')) {
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

async function menu(): Promise<void> {
  const v = await ask('Ações do mês', '', [
    { lb: 'Gerar PDF do mês', val: 'pdf' },
    { lb: m.value.closed ? 'Reabrir o mês' : 'Fechar o mês', cls: 'sec', val: 'fechar' }
  ])
  if (v === 'pdf') await abrirRelatorio(mk.value)
  else if (v === 'fechar') await toggleFechar()
}
</script>

<template>
  <section id="view-month">
    <header class="appbar" style="padding-bottom: 4px">
      <button class="back" @click="router.push({ name: 'folha' })">
        <svg class="i" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>Folha
      </button>
      <button class="iconbtn" aria-label="Mais ações do mês" @click="menu">
        <svg class="i" viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3" /></svg>
      </button>
    </header>

    <main class="content">
      <div class="between">
        <button class="iconbtn" aria-label="Mês anterior" @click="mPrev">
          <svg class="i" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div style="text-align: center">
          <h1 style="font-size: 24px; line-height: 1.15; font-weight: 800; letter-spacing: -0.03em">{{ title }}</h1>
          <span class="chip" :class="m.closed ? 'ink' : 'warn'" style="margin-top: 4px">{{ m.closed ? 'Fechado' : 'Em aberto' }}</span>
        </div>
        <button class="iconbtn" aria-label="Próximo mês" @click="mNext">
          <svg class="i" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      <div v-for="(a, i) in alerts" :key="i" class="note-box" :class="a.cls">
        <b v-if="a.title">{{ a.title }}</b> {{ a.text }}
      </div>

      <section class="card cream" aria-label="Resumo do mês">
        <div class="eyebrow">Líquido da folha de {{ MESES[Number(mk.slice(5, 7)) - 1] }}</div>
        <div class="big" style="margin-top: 4px">{{ brl(c.liquido) }}</div>
        <p v-if="c.cesta" class="eyebrow" style="margin-top: 6px">
          + {{ brl(c.cesta) }} de vale cesta = <b style="color: var(--cream-ink)">{{ brl(c.totalReceber) }}</b> a receber
        </p>
        <div class="stats" style="margin-top: 14px">
          <div class="stat"><span>Trabalhadas</span><b>{{ min2hm(c.worked) }}</b></div>
          <div class="stat"><span>Saldo</span><b :style="{ color: saldo >= 0 ? 'var(--ok)' : 'var(--bad)' }">{{ min2hm(saldo, true) }}</b></div>
          <div class="stat"><span>Férias</span><b>{{ c.diasFerias }} {{ c.diasFerias === 1 ? 'dia' : 'dias' }}</b></div>
        </div>
      </section>

      <div class="seg" role="tablist" aria-label="Seções do mês">
        <button role="tab" :aria-selected="aba === 'dias'" :class="{ on: aba === 'dias' }" @click="setAba('dias')">Dias</button>
        <button role="tab" :aria-selected="aba === 'folha'" :class="{ on: aba === 'folha' }" @click="setAba('folha')">Folha</button>
        <button role="tab" :aria-selected="aba === 'ferias'" :class="{ on: aba === 'ferias' }" @click="setAba('ferias')">
          Férias<span v-if="ferCount" class="chip vac" style="height: 20px; padding: 0 7px">{{ ferCount }}</span>
        </button>
      </div>

      <DiasTab v-if="aba === 'dias'" :mk="mk" />
      <FolhaTab v-else-if="aba === 'folha'" :mk="mk" @fechar="toggleFechar" />
      <FeriasTab v-else :mk="mk" />
    </main>
  </section>
</template>
