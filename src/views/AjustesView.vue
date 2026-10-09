<script setup lang="ts">
/* Ajustes: lista de seções, cada uma com a prévia do valor atual. As regras do
   trabalho valem por vigência (a escolhida fica no topo do grupo); o resto é
   global. Cada seção abre sua própria página (AjustesSecaoView). */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import Sheet from '@/components/Sheet.vue'
import { vigIdx, clampVig, vigLabel } from '@/lib/vigSel'
import { brl, num, curMonthKey, fmtDK, todayKey, daysDiff } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { confirmS } from '@/lib/dialog'

const folha = useFolha()
const router = useRouter()
const S = folha.S
clampVig(S)

const cfg = computed(() => S.vig[vigIdx.value]!.cfg)
const aberta = ref(false)
const nova = reactive({ mes: curMonthKey() })

const fmtPct = (n: number): string => String(n).replace('.', ',')
const horasSemana = computed(() => {
  const t = [0, 1, 2, 3, 4, 5, 6].reduce((a, d) => a + num(cfg.value.escala[d]), 0) / 60
  return String(Math.round(t * 10) / 10).replace('.', ',')
})
const tempoCasa = computed(() => {
  if (!S.adm) return ''
  const dias = daysDiff(S.adm, todayKey())
  if (dias < 0) return ''
  const meses = Math.floor(dias / 30.4375)
  const a = Math.floor(meses / 12)
  const m = meses % 12
  const pa = a ? `${a} ${a === 1 ? 'ano' : 'anos'}` : ''
  const pm = m ? `${m} ${m === 1 ? 'mês' : 'meses'}` : ''
  return [pa, pm].filter(Boolean).join(' e ')
})

const regras = computed(() => {
  const c = cfg.value
  const nIn = c.inss.length
  return [
    { sec: 'salario', t: 'Salário e jornada', s: `${brl(num(c.salario))} · ${num(c.jornada)} h/mês · ${horasSemana.value} h/semana`, ic: 'coin' },
    {
      sec: 'ponto',
      t: 'Ponto',
      s: `${c.batidas === '0' ? 'Batidas livres' : c.batidas + ' batidas'} · ${Number(c.autoAlmoco) === 1 ? `almoço automático de ${num(c.almocoMin)} min` : 'sem almoço automático'}`,
      ic: 'clock'
    },
    {
      sec: 'extras',
      t: 'Horas extras',
      s: `${c.modoExtras === 'pagar' ? 'Pagar como extra' : 'Banco de horas'} · +${fmtPct(num(c.pctExtra))}% · DSR ${Number(c.dsr) === 1 ? 'ligado' : 'desligado'}`,
      ic: 'bolt'
    },
    {
      sec: 'familia',
      t: 'Família e benefícios',
      s: `${S.filhos.length ? `${S.filhos.length} ${S.filhos.length === 1 ? 'filho' : 'filhos'}` : 'Nenhum filho'} · vale cesta ${brl(num(c.cesta))}`,
      ic: 'users'
    },
    {
      sec: 'inss',
      t: 'Tabela do INSS',
      s: nIn ? `${nIn} faixas · de ${fmtPct(num(c.inss[0]!.aliq))}% a ${fmtPct(num(c.inss[nIn - 1]!.aliq))}%` : 'Sem faixas',
      ic: 'table'
    },
    { sec: 'irpf', t: 'Tabela do IRPF', s: `${c.irrf.length} faixas · redutor da Lei 15.270/2025`, ic: 'table' }
  ]
})

const globais = computed(() => [
  {
    sec: '13o',
    t: '13º salário',
    s: S.c13.modo === '2' ? `Duas parcelas · até ${S.c13.d1} e ${S.c13.d2}` : `Parcela única · até ${S.c13.dU}`,
    ic: 'gift'
  },
  {
    sec: 'aparencia',
    t: 'Aparência',
    s: S.ui.theme === 'sys' ? 'Automático (segue o sistema)' : S.ui.theme === 'dark' ? 'Escuro' : 'Claro',
    ic: 'sun'
  },
  {
    sec: 'feriados',
    t: 'Feriados',
    s: Object.keys(S.holidays).length ? `${Object.keys(S.holidays).join(' e ')} carregados` : 'Nenhum ano carregado',
    ic: 'cal'
  }
])
const backupSub = computed(() => (S.lastExport ? `Último: ${fmtDK(S.lastExport)}` : 'Nunca exportado neste aparelho'))

function ir(sec: string): void {
  router.push({ name: 'ajustes-secao', params: { sec } })
}

function criar(): void {
  const mk = nova.mes
  if (!/^\d{4}-\d{2}$/.test(mk)) {
    toast('Escolha o mês de início da vigência.')
    return
  }
  if (S.vig.some((v) => v.desde === mk)) {
    toast('Já existe uma vigência nesse mês.')
    return
  }
  const base = structuredClone(folha.cfgFor(mk))
  S.vig.push({ desde: mk, cfg: base })
  S.vig.sort((a, b) => (a.desde < b.desde ? -1 : 1))
  vigIdx.value = S.vig.findIndex((v) => v.desde === mk)
  aberta.value = false
  toast('Vigência criada — edite os valores e salve.')
}
async function excluir(): Promise<void> {
  if (S.vig.length <= 1) {
    toast('É preciso manter ao menos uma vigência.')
    return
  }
  const v = S.vig[vigIdx.value]!
  if (!(await confirmS('Excluir vigência?', `"${vigLabel(v)}" — os meses passarão a usar a vigência anterior.`))) return
  S.vig.splice(vigIdx.value, 1)
  vigIdx.value = S.vig.length - 1
  toast('Vigência excluída')
}
</script>

<template>
  <section>
    <header class="appbar">
      <div>
        <h1 class="title">Ajustes</h1>
        <div class="sub">os dados ficam só neste aparelho</div>
      </div>
    </header>

    <main class="content">
      <section class="card cream" aria-label="Perfil">
        <button class="rowflex" style="gap: 14px; width: 100%; text-align: left" @click="ir('contrato')">
          <div style="width: 52px; height: 52px; border-radius: 999px; background: var(--ink); color: var(--on-ink); display: grid; place-items: center; font-size: 22px; font-weight: 800; flex: none">
            {{ (S.nome || 'Você')[0]!.toUpperCase() }}
          </div>
          <div class="grow">
            <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em">{{ S.nome || 'Seu nome' }}</div>
            <div class="eyebrow">
              {{ S.adm ? `Admissão ${fmtDK(S.adm)}${tempoCasa ? ' · ' + tempoCasa : ''}` : 'Informe a data de admissão' }}
            </div>
          </div>
          <svg class="i" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </section>

      <section class="card" aria-label="Regras do trabalho">
        <div class="h2"><span>Regras do trabalho</span></div>
        <button
          class="between"
          style="width: 100%; min-height: 56px; padding: 8px 14px; border-radius: 16px; border: 1.5px solid var(--line); background: var(--bg); text-align: left; font-size: 15px"
          @click="aberta = true"
        >
          <span>
            <span class="eyebrow" style="display: block; color: var(--ink2)">Regras em vigor</span>
            <b>{{ vigLabel(S.vig[vigIdx]!) }}</b>
          </span>
          <svg class="i" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <p class="muted" style="margin: 8px 0 4px">Mudou o salário ou as tabelas? Crie uma vigência nova. Os meses antigos continuam com as regras antigas.</p>
        <div class="list">
          <button v-for="r in regras" :key="r.sec" class="li" @click="ir(r.sec)">
            <div class="ic">
              <svg class="i sm" viewBox="0 0 24 24">
                <template v-if="r.ic === 'coin'"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5" /></template>
                <template v-else-if="r.ic === 'clock'"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></template>
                <template v-else-if="r.ic === 'bolt'"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></template>
                <template v-else-if="r.ic === 'users'"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2" /><path d="M17 14c2.5 0 4 1.6 4 4" /></template>
                <template v-else><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 10h18M9 10v10" /></template>
              </svg>
            </div>
            <div class="grow"><div class="t">{{ r.t }}</div><div class="s">{{ r.s }}</div></div>
            <svg class="i chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </section>

      <section class="card" aria-label="Você e o app">
        <div class="h2"><span>Você e o app</span></div>
        <div class="list">
          <button v-for="r in globais" :key="r.sec" class="li" @click="ir(r.sec)">
            <div class="ic">
              <svg class="i sm" viewBox="0 0 24 24">
                <template v-if="r.ic === 'gift'"><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 13h18M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0" /></template>
                <template v-else-if="r.ic === 'sun'"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></template>
                <template v-else><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></template>
              </svg>
            </div>
            <div class="grow"><div class="t">{{ r.t }}</div><div class="s">{{ r.s }}</div></div>
            <svg class="i chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <button class="li" @click="ir('backup')">
            <div class="ic" :style="S.lastExport ? '' : 'background: var(--warn-bg); color: var(--warn)'">
              <svg class="i sm" viewBox="0 0 24 24"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
            </div>
            <div class="grow"><div class="t">Backup</div><div class="s">{{ backupSub }}</div></div>
            <span v-if="!S.lastExport" class="chip warn">Exportar</span>
            <svg v-else class="i chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </section>
    </main>

    <Sheet :open="aberta" title="Regras em vigor" subtitle="Cada vigência guarda salário, escala e tabelas a partir de um mês" @close="aberta = false">
      <div role="radiogroup" aria-label="Vigência" class="list">
        <button v-for="(v, i) in S.vig" :key="v.desde" class="li" :class="{ sel: i === vigIdx }" role="radio" :aria-checked="i === vigIdx" @click="(vigIdx = i), (aberta = false)">
          <div class="grow"><div class="t">{{ vigLabel(v) }}</div></div>
          <svg v-if="i === vigIdx" class="i" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10" /></svg>
        </button>
      </div>
      <div class="field">
        <label for="vg-m">Nova vigência a partir de</label>
        <input id="vg-m" v-model="nova.mes" type="month" class="input" />
        <span class="hint">Começa com uma cópia das regras desse mês.</span>
      </div>
      <button class="link bad" style="align-self: flex-start" @click="excluir">Excluir a vigência selecionada</button>
      <template #footer>
        <button class="btn ghost" @click="aberta = false">Fechar</button>
        <button class="btn grow" @click="criar">Criar vigência</button>
      </template>
    </Sheet>
  </section>
</template>
