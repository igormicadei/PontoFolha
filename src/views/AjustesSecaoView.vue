<script setup lang="ts">
/* Página de uma seção dos Ajustes. As seções de regras e de contrato editam um
   rascunho; a barra de salvar só liga quando há mudança e a saída com mudanças
   pendentes pergunta antes. Aparência, feriados e backup agem na hora. As
   coações numéricas são as do botão "Salvar" original. */
import { computed, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useFolha } from '@/stores/folha'
import FilhosEditor from '@/components/FilhosEditor.vue'
import { vigIdx, clampVig, vigLabel } from '@/lib/vigSel'
import { DSEM, brl, fmtDK, num } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { confirmS } from '@/lib/dialog'
import { importBackupFile } from '@/lib/backup'

const folha = useFolha()
const route = useRoute()
const router = useRouter()
const S = folha.S
clampVig(S)

const sec = computed(() => String(route.params.sec))
const TITULOS: Record<string, string> = {
  contrato: 'Contrato',
  salario: 'Salário e jornada',
  ponto: 'Ponto',
  extras: 'Horas extras',
  familia: 'Família e benefícios',
  inss: 'Tabela do INSS',
  irpf: 'Tabela do IRPF',
  '13o': '13º salário',
  aparencia: 'Aparência',
  feriados: 'Feriados',
  backup: 'Backup'
}
const SEM_SALVAR = ['aparencia', 'feriados', 'backup']
const regra = ['salario', 'ponto', 'extras', 'familia', 'inss', 'irpf'].includes(sec.value)
const comBarra = !SEM_SALVAR.includes(sec.value)
if (!TITULOS[sec.value]) router.replace({ name: 'ajustes' })

const cfg = S.vig[vigIdx.value]!.cfg
const ESCALA_ORDEM = [1, 2, 3, 4, 5, 6, 0]

function novoRascunho() {
  return {
    nome: S.nome || '',
    adm: S.adm || '',
    depExtra: S.depExtra,
    c13: { ...S.c13 },
    cfg: structuredClone({ ...cfg, inss: undefined, irrf: undefined, escala: undefined }) as Record<string, any>,
    escalaH: Object.fromEntries(ESCALA_ORDEM.map((d) => [d, String(num(cfg.escala[d]) / 60)])) as Record<number, string>,
    inss: cfg.inss.map((f) => ({ ate: String(f.ate), aliq: String(f.aliq) })),
    irrf: cfg.irrf.map((f) => ({ ate: f.ate >= 999999999 ? '' : String(f.ate), aliq: String(f.aliq), ded: String(f.ded) }))
  }
}
const d = reactive(novoRascunho())
const inicial = ref(JSON.stringify(d))
const dirty = computed(() => JSON.stringify(d) !== inicial.value)
const editando = ref(false)

const horasSemana = computed(() => {
  const t = ESCALA_ORDEM.reduce((a, k) => a + (parseFloat(d.escalaH[k]!) || 0), 0)
  return String(Math.round(t * 10) / 10).replace('.', ',')
})
const valorHora = computed(() => (parseFloat(d.cfg.salario) || 0) / Math.max(1, parseFloat(d.cfg.jornada) || 220))

function descartar(): void {
  Object.assign(d, novoRascunho())
  inicial.value = JSON.stringify(d)
}

function salvar(): void {
  S.nome = (d.nome || '').trim()
  S.adm = d.adm || ''
  S.depExtra = parseInt(String(d.depExtra)) || 0
  const c = cfg as Record<string, any>
  const n = d.cfg
  c.salario = parseFloat(String(n.salario)) || 0
  c.jornada = parseFloat(String(n.jornada)) || 220
  c.batidas = String(n.batidas)
  c.autoAlmoco = Number(n.autoAlmoco)
  c.almocoMin = parseFloat(String(n.almocoMin)) || 0
  c.modoExtras = String(n.modoExtras)
  c.pctExtra = parseFloat(String(n.pctExtra)) || 0
  c.dsr = Number(n.dsr)
  c.sfCota = parseFloat(String(n.sfCota)) || 0
  c.sfLim = parseFloat(String(n.sfLim)) || 0
  c.cesta = parseFloat(String(n.cesta)) || 0
  c.ferCat = Number(n.ferCat)
  c.dedDep = parseFloat(String(n.dedDep)) || 0
  c.descSimplificado = parseFloat(String(n.descSimplificado)) || 0
  c.redIsen = parseFloat(String(n.redIsen)) || 0
  c.redGrad = parseFloat(String(n.redGrad)) || 0
  c.redA = parseFloat(String(n.redA)) || 0
  c.redB = parseFloat(String(n.redB)) || 0
  for (const w of ESCALA_ORDEM) c.escala[w] = Math.round((parseFloat(d.escalaH[w]!) || 0) * 60)
  c.inss = d.inss
    .map((r) => ({ ate: parseFloat(r.ate) || 0, aliq: parseFloat(r.aliq) || 0 }))
    .filter((f) => f.ate > 0)
    .sort((a, b) => a.ate - b.ate)
  c.irrf = d.irrf
    .map((r) => ({ ate: r.ate === '' ? 999999999 : parseFloat(r.ate) || 0, aliq: parseFloat(r.aliq) || 0, ded: parseFloat(r.ded) || 0 }))
    .sort((a, b) => a.ate - b.ate)
  S.c13 = {
    modo: d.c13.modo,
    d1: d.c13.d1 || '30/11',
    d2: d.c13.d2 || '20/12',
    dU: d.c13.dU || '20/12'
  }
  Object.assign(d, novoRascunho())
  inicial.value = JSON.stringify(d)
  toast(regra ? `Salvo em: ${vigLabel(S.vig[vigIdx.value]!)}` : 'Alterações salvas')
  router.back()
}

onBeforeRouteLeave(async () => {
  if (comBarra && dirty.value) return await confirmS('Descartar alterações?', 'O que você mudou nesta página ainda não foi salvo.')
  return true
})

/* ---- ações imediatas ---- */
const feriadosLoading = ref(false)
async function buscarFeriados(): Promise<void> {
  feriadosLoading.value = true
  try {
    const { ok } = await folha.fetchFeriados()
    toast(ok ? 'Feriados atualizados' : 'Sem conexão — não foi possível buscar os feriados.')
  } finally {
    feriadosLoading.value = false
  }
}
const fileInput = ref<HTMLInputElement | null>(null)
function doExport(): void {
  folha.exportBackup()
  toast('Backup exportado')
}
async function onFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const f = input.files && input.files[0]
  if (f && (await importBackupFile(f))) router.push('/')
  input.value = ''
}
const lblDedDep = computed(() => num(d.cfg.dedDep).toFixed(2).replace('.', ','))
const duas13 = computed(() => d.c13.modo === '2')
const anosFeriados = computed(() => Object.keys(S.holidays).join(', ') || 'nenhum')
</script>

<template>
  <section v-if="TITULOS[sec]">
    <header class="appbar" style="padding-bottom: 4px">
      <button class="back" @click="router.back()">
        <svg class="i" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>Ajustes
      </button>
    </header>

    <main class="content" :style="comBarra ? 'padding-bottom: 120px' : ''">
      <div>
        <h1 style="font-size: 26px; line-height: 1.15; font-weight: 800; letter-spacing: -0.03em">{{ TITULOS[sec] }}</h1>
        <div v-if="regra" class="rowflex" style="margin-top: 8px">
          <span class="chip" style="background: var(--lilac); color: var(--lilac-ink)">Regras: {{ vigLabel(S.vig[vigIdx]!) }}</span>
        </div>
      </div>

      <!-- contrato -->
      <template v-if="sec === 'contrato'">
        <section class="card">
          <div class="stack" style="gap: 16px">
            <div class="field">
              <label for="c-n">Nome e sobrenome</label>
              <input id="c-n" v-model="d.nome" class="input" placeholder="Aparece no relatório" autocomplete="name" />
            </div>
            <div class="field">
              <label for="c-a">Data de admissão</label>
              <input id="c-a" v-model="d.adm" type="date" class="input" />
              <span class="hint">Define os avos do 13º e o período aquisitivo das férias. Sem ela, o app assume ano completo.</span>
            </div>
          </div>
        </section>
      </template>

      <!-- salário e jornada -->
      <template v-else-if="sec === 'salario'">
        <section class="card">
          <div class="stack" style="gap: 16px">
            <div class="field">
              <label for="s-s">Salário mensal</label>
              <div class="inwrap"><span class="pre">R$</span><input id="s-s" v-model="d.cfg.salario" class="input num withpre" type="number" step="0.01" inputmode="decimal" /></div>
            </div>
            <div class="field">
              <label for="s-j">Jornada mensal</label>
              <div class="inwrap"><input id="s-j" v-model="d.cfg.jornada" class="input num withsuf" type="number" step="1" inputmode="numeric" /><span class="suf">h</span></div>
              <span class="hint">Base do valor-hora.</span>
            </div>
          </div>
        </section>
        <section class="card">
          <div class="h2"><span>Escala semanal</span><span class="muted">horas por dia</span></div>
          <div class="escala">
            <div v-for="w in ESCALA_ORDEM" :key="w" class="field" style="gap: 4px">
              <label :for="'e' + w">{{ DSEM[w]![0]!.toUpperCase() + DSEM[w]!.slice(1) }}</label>
              <input :id="'e' + w" v-model="d.escalaH[w]" class="input" type="number" step="0.5" inputmode="decimal" />
            </div>
          </div>
        </section>
        <section class="card cream">
          <div class="eyebrow">Com estes valores</div>
          <div class="between" style="margin-top: 6px; align-items: flex-end">
            <div><div class="big sm">{{ horasSemana }} h</div><div class="eyebrow">por semana</div></div>
            <div style="text-align: right"><div class="big sm">{{ brl(valorHora) }}</div><div class="eyebrow">valor-hora</div></div>
          </div>
        </section>
      </template>

      <!-- ponto -->
      <template v-else-if="sec === 'ponto'">
        <section class="card">
          <div class="stack" style="gap: 16px">
            <div class="field">
              <label for="p-b">Batidas por dia</label>
              <select id="p-b" v-model="d.cfg.batidas" class="input">
                <option value="4">4 (entrada, almoço, volta, saída)</option>
                <option value="2">2 (entrada e saída)</option>
                <option value="0">Livre</option>
              </select>
            </div>
            <div class="field">
              <span id="p-al" class="lb">Desconto automático de almoço</span>
              <div class="seg" role="group" aria-labelledby="p-al">
                <button :class="{ on: Number(d.cfg.autoAlmoco) === 1 }" :aria-pressed="Number(d.cfg.autoAlmoco) === 1" @click="d.cfg.autoAlmoco = 1">Ativado</button>
                <button :class="{ on: Number(d.cfg.autoAlmoco) === 0 }" :aria-pressed="Number(d.cfg.autoAlmoco) === 0" @click="d.cfg.autoAlmoco = 0">Desativado</button>
              </div>
              <span class="hint">Vale só quando o dia tem exatamente 2 batidas.</span>
            </div>
            <div class="field">
              <label for="p-m">Minutos descontados</label>
              <div class="inwrap"><input id="p-m" v-model="d.cfg.almocoMin" class="input num withsuf" type="number" step="5" inputmode="numeric" /><span class="suf">min</span></div>
            </div>
          </div>
        </section>
      </template>

      <!-- horas extras -->
      <template v-else-if="sec === 'extras'">
        <section class="card">
          <div class="stack" style="gap: 16px">
            <div class="field">
              <span id="x-t" class="lb">Tratamento do saldo</span>
              <div class="seg" role="group" aria-labelledby="x-t">
                <button :class="{ on: d.cfg.modoExtras === 'pagar' }" :aria-pressed="d.cfg.modoExtras === 'pagar'" @click="d.cfg.modoExtras = 'pagar'">Pagar como extra</button>
                <button :class="{ on: d.cfg.modoExtras === 'banco' }" :aria-pressed="d.cfg.modoExtras === 'banco'" @click="d.cfg.modoExtras = 'banco'">Banco de horas</button>
              </div>
            </div>
            <div class="field">
              <label for="x-p">Adicional de hora extra</label>
              <div class="inwrap"><input id="x-p" v-model="d.cfg.pctExtra" class="input num withsuf" type="number" step="5" inputmode="numeric" /><span class="suf">%</span></div>
            </div>
            <div class="field">
              <span id="x-d" class="lb">DSR sobre horas extras</span>
              <div class="seg" role="group" aria-labelledby="x-d">
                <button :class="{ on: Number(d.cfg.dsr) === 1 }" :aria-pressed="Number(d.cfg.dsr) === 1" @click="d.cfg.dsr = 1">Calcular</button>
                <button :class="{ on: Number(d.cfg.dsr) === 0 }" :aria-pressed="Number(d.cfg.dsr) === 0" @click="d.cfg.dsr = 0">Não calcular</button>
              </div>
              <span class="hint">Reflexo legal do descanso semanal remunerado.</span>
            </div>
          </div>
        </section>
      </template>

      <!-- família e benefícios -->
      <template v-else-if="sec === 'familia'">
        <section class="card">
          <div class="h2"><span>Filhos</span><span class="chip">vale para todos os meses</span></div>
          <FilhosEditor />
          <p class="muted" style="margin-top: 10px">
            Contagem automática por idade: até 14 anos conta para o salário-família; até 21, como dependente de IRPF (dedução de R$ {{ lblDedDep }} por mês).
          </p>
        </section>
        <section class="card">
          <div class="stack" style="gap: 16px">
            <div class="field">
              <label for="f-dx">Outros dependentes de IRPF</label>
              <input id="f-dx" v-model="d.depExtra" class="input num" type="number" step="1" inputmode="numeric" />
              <span class="hint">Cônjuge, universitário de 21 a 24 anos etc.</span>
            </div>
            <div class="grid2">
              <div class="field">
                <label for="f-sc">Cota salário-família</label>
                <div class="inwrap"><span class="pre">R$</span><input id="f-sc" v-model="d.cfg.sfCota" class="input num withpre" type="number" step="0.01" inputmode="decimal" /></div>
              </div>
              <div class="field">
                <label for="f-sl">Limite de renda</label>
                <div class="inwrap"><span class="pre">R$</span><input id="f-sl" v-model="d.cfg.sfLim" class="input num withpre" type="number" step="0.01" inputmode="decimal" /></div>
              </div>
            </div>
            <div class="field">
              <label for="f-ce">Vale cesta básica</label>
              <div class="inwrap"><span class="pre">R$</span><input id="f-ce" v-model="d.cfg.cesta" class="input num withpre" type="number" step="0.01" inputmode="decimal" /></div>
              <span class="hint">Benefício pago à parte, fora do salário.</span>
            </div>
            <div class="field">
              <span id="f-fc" class="lb">Feriado da categoria em 12 de maio (CCT SinSaúde)</span>
              <div class="seg" role="group" aria-labelledby="f-fc">
                <button :class="{ on: Number(d.cfg.ferCat) === 1 }" :aria-pressed="Number(d.cfg.ferCat) === 1" @click="d.cfg.ferCat = 1">Aplicar</button>
                <button :class="{ on: Number(d.cfg.ferCat) === 0 }" :aria-pressed="Number(d.cfg.ferCat) === 0" @click="d.cfg.ferCat = 0">Não aplicar</button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- INSS -->
      <template v-else-if="sec === 'inss'">
        <section class="card">
          <div v-if="!editando" class="pay">
            <div v-for="(r, i) in d.inss" :key="i" class="ln">
              <div class="d">{{ i === 0 ? 'Até' : 'De ' + brl(num(d.inss[i - 1]!.ate)).replace('R$', 'R$') + ' até' }} {{ brl(num(r.ate)) }}</div>
              <div class="v">{{ String(num(r.aliq)).replace('.', ',') }}%</div>
            </div>
          </div>
          <table v-else class="tx">
            <thead><tr><th>Até (R$)</th><th>Alíq. %</th><th></th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in d.inss" :key="i">
                <td><input v-model="r.ate" class="input" type="number" step="0.01" :aria-label="`Faixa ${i + 1}: até`" /></td>
                <td><input v-model="r.aliq" class="input" type="number" step="0.5" :aria-label="`Faixa ${i + 1}: alíquota`" /></td>
                <td><button class="iconplain bad" :aria-label="`Remover faixa ${i + 1}`" @click="d.inss.splice(i, 1)"><svg class="i sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button></td>
              </tr>
            </tbody>
          </table>
          <div class="rowflex" style="margin-top: 10px">
            <button class="btn ghost sm" @click="editando = !editando">{{ editando ? 'Concluir edição' : 'Editar tabela' }}</button>
            <button v-if="editando" class="btn ghost sm" @click="d.inss.push({ ate: '', aliq: '' })">+ Faixa</button>
          </div>
          <p class="muted" style="margin-top: 8px">A última faixa é o teto: acima dela não há desconto adicional.</p>
        </section>
      </template>

      <!-- IRPF -->
      <template v-else-if="sec === 'irpf'">
        <section class="card">
          <div v-if="!editando" class="pay">
            <div v-for="(r, i) in d.irrf" :key="i" class="ln">
              <div class="d">{{ r.ate === '' ? 'Acima da faixa anterior' : 'Até ' + brl(num(r.ate)) }}<small>deduzir {{ brl(num(r.ded)) }}</small></div>
              <div class="v">{{ String(num(r.aliq)).replace('.', ',') }}%</div>
            </div>
          </div>
          <table v-else class="tx">
            <thead><tr><th>Até (R$)</th><th>Alíq. %</th><th>Deduzir</th><th></th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in d.irrf" :key="i">
                <td><input v-model="r.ate" class="input" type="number" step="0.01" placeholder="∞" :aria-label="`Faixa ${i + 1}: até`" /></td>
                <td><input v-model="r.aliq" class="input" type="number" step="0.5" :aria-label="`Faixa ${i + 1}: alíquota`" /></td>
                <td><input v-model="r.ded" class="input" type="number" step="0.01" :aria-label="`Faixa ${i + 1}: deduzir`" /></td>
                <td><button class="iconplain bad" :aria-label="`Remover faixa ${i + 1}`" @click="d.irrf.splice(i, 1)"><svg class="i sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button></td>
              </tr>
            </tbody>
          </table>
          <div class="rowflex" style="margin-top: 10px">
            <button class="btn ghost sm" @click="editando = !editando">{{ editando ? 'Concluir edição' : 'Editar tabela' }}</button>
            <button v-if="editando" class="btn ghost sm" @click="d.irrf.push({ ate: '', aliq: '', ded: '' })">+ Faixa</button>
          </div>
        </section>
        <section class="card">
          <div class="stack" style="gap: 16px">
            <div class="field">
              <label for="i-ds">Desconto simplificado mensal</label>
              <div class="inwrap"><span class="pre">R$</span><input id="i-ds" v-model="d.cfg.descSimplificado" class="input num withpre" type="number" step="0.01" inputmode="decimal" /></div>
            </div>
            <div class="field">
              <label for="i-dd">Dedução por dependente</label>
              <div class="inwrap"><span class="pre">R$</span><input id="i-dd" v-model="d.cfg.dedDep" class="input num withpre" type="number" step="0.01" inputmode="decimal" /></div>
            </div>
            <div class="grid2">
              <div class="field"><label for="i-ri">Isenção total até</label><div class="inwrap"><span class="pre">R$</span><input id="i-ri" v-model="d.cfg.redIsen" class="input num withpre" type="number" step="0.01" /></div></div>
              <div class="field"><label for="i-rg">Redução gradual até</label><div class="inwrap"><span class="pre">R$</span><input id="i-rg" v-model="d.cfg.redGrad" class="input num withpre" type="number" step="0.01" /></div></div>
              <div class="field"><label for="i-ra">Redutor: constante A</label><input id="i-ra" v-model="d.cfg.redA" class="input num" type="number" step="0.01" /></div>
              <div class="field"><label for="i-rb">Redutor: coeficiente B</label><input id="i-rb" v-model="d.cfg.redB" class="input num" type="number" step="0.000001" /></div>
            </div>
            <span class="hint">Lei 15.270/2025: redutor mensal = A − (B × rendimento tributável), limitado ao imposto.</span>
          </div>
        </section>
      </template>

      <!-- 13º -->
      <template v-else-if="sec === '13o'">
        <section class="card">
          <div class="stack" style="gap: 16px">
            <div class="field">
              <span id="t-m" class="lb">Forma de pagamento</span>
              <div class="seg" role="group" aria-labelledby="t-m">
                <button :class="{ on: d.c13.modo === '2' }" :aria-pressed="d.c13.modo === '2'" @click="d.c13.modo = '2'">Duas parcelas</button>
                <button :class="{ on: d.c13.modo === '1' }" :aria-pressed="d.c13.modo === '1'" @click="d.c13.modo = '1'">Parcela única</button>
              </div>
            </div>
            <div v-if="duas13" class="grid2">
              <div class="field"><label for="t-1">1ª parcela até</label><input id="t-1" v-model="d.c13.d1" class="input" placeholder="30/11" /><span class="hint">dia/mês</span></div>
              <div class="field"><label for="t-2">2ª parcela até</label><input id="t-2" v-model="d.c13.d2" class="input" placeholder="20/12" /><span class="hint">dia/mês</span></div>
            </div>
            <div v-else class="field"><label for="t-u">Pagamento até</label><input id="t-u" v-model="d.c13.dU" class="input" placeholder="20/12" /><span class="hint">dia/mês</span></div>
            <span class="hint">Padrão legal: 1ª parcela (adiantamento, sem descontos) até 30/11; 2ª até 20/12, com INSS e IRPF sobre o 13º integral.</span>
          </div>
        </section>
      </template>

      <!-- aparência -->
      <template v-else-if="sec === 'aparencia'">
        <section class="card">
          <div class="field">
            <span id="a-t" class="lb">Tema</span>
            <div class="seg" role="group" aria-labelledby="a-t">
              <button :class="{ on: S.ui.theme === 'sys' }" :aria-pressed="S.ui.theme === 'sys'" @click="S.ui.theme = 'sys'">Automático</button>
              <button :class="{ on: S.ui.theme === 'light' }" :aria-pressed="S.ui.theme === 'light'" @click="S.ui.theme = 'light'">Claro</button>
              <button :class="{ on: S.ui.theme === 'dark' }" :aria-pressed="S.ui.theme === 'dark'" @click="S.ui.theme = 'dark'">Escuro</button>
            </div>
            <span class="hint">Automático segue o tema do sistema.</span>
          </div>
        </section>
        <p class="muted">Dica: use "Adicionar à tela de início" no menu do navegador para abrir o app em tela cheia, sem a barra de endereço.</p>
      </template>

      <!-- feriados -->
      <template v-else-if="sec === 'feriados'">
        <section class="card">
          <p class="muted" style="font-size: 14px">Feriados nacionais via BrasilAPI (precisa de internet). Municipais e estaduais: marque o dia manualmente na tela do mês.</p>
          <p style="margin-top: 10px">Anos carregados: <b class="mono">{{ anosFeriados }}</b></p>
          <button class="btn block" style="margin-top: 14px" :disabled="feriadosLoading" @click="buscarFeriados">
            {{ feriadosLoading ? 'Buscando…' : 'Buscar feriados do ano atual e do próximo' }}
          </button>
        </section>
      </template>

      <!-- backup -->
      <template v-else-if="sec === 'backup'">
        <section class="card">
          <p class="muted" style="font-size: 14px">Os dados ficam no armazenamento do navegador deste aparelho. Exporte um backup de vez em quando: limpar os dados do navegador apaga tudo.</p>
          <p style="margin-top: 10px">{{ S.lastExport ? `Último backup: ${fmtDK(S.lastExport)}` : 'Nunca exportado neste aparelho.' }}</p>
          <div class="stack" style="margin-top: 14px">
            <button class="btn block" @click="doExport">Exportar JSON</button>
            <button class="btn ghost block" @click="fileInput?.click()">Importar JSON</button>
          </div>
          <input ref="fileInput" type="file" accept=".json" class="hidden" @change="onFile" />
        </section>
      </template>
    </main>

    <div v-if="comBarra" class="savebar">
      <button class="btn ghost grow" :disabled="!dirty" @click="descartar">Descartar</button>
      <button class="btn grow" :disabled="!dirty" @click="salvar">Salvar</button>
    </div>
  </section>
</template>
