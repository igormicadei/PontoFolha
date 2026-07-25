<script setup lang="ts">
/* Tela de configurações (index.html #view-config 338-444 + renderConfig
   1604-1628 + toggle13 1629-1631 + vigSel/vigNew/vigDel 1632-1649 +
   inssRow/irrfRow 1650-1657 + btnSaveCfg 1687-1703 + fetchFeriados 1709-1726 +
   doExport/fileImport 1730-1748). Campos simples (nome, salário, tabelas de
   ponto/extras/família/13º/tema) ficam ligados por v-model direto aos campos
   do estado — a store persiste sozinha via watch profundo. Escala semanal e as
   tabelas de INSS/IRPF são a excePção: o legado só grava de volta no clique de
   "Salvar" (conversão de unidade e filter/sort), então usam espelhos locais
   (escalaH/inssRows/irrfRows) sincronizados a partir da vigência em edição e só
   escritos em `cfg` dentro de salvar(). */
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFolha } from '@/stores/folha'
import type { Vigencia } from '@/stores/types'
import { MESES, DSEM, curMonthKey, num } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { confirmS } from '@/lib/dialog'
import { importBackupFile } from '@/lib/backup'
import FilhosEditor from '@/components/FilhosEditor.vue'

const folha = useFolha()
const { S } = storeToRefs(folha)
const router = useRouter()

/* vigLabel (index.html vigLabel, usado em renderConfig/vigNew/vigDel/btnSaveCfg). */
function vigLabel(v: Vigencia): string {
  return v.desde === '1900-01'
    ? 'Inicial (desde o começo)'
    : 'Desde ' + MESES[Number(v.desde.slice(5, 7)) - 1] + '/' + v.desde.slice(0, 4)
}

/* vigIdx global do legado → estado local da view, clampado quando S.vig muda de tamanho. */
const vigIdx = ref(S.value.vig.length - 1)
watch(
  () => S.value.vig.length,
  (len) => {
    if (vigIdx.value >= len) vigIdx.value = len - 1
    if (vigIdx.value < 0) vigIdx.value = 0
  }
)
const vigNewMonth = ref(curMonthKey())

const cfg = computed(() => S.value.vig[vigIdx.value]!.cfg)

const lblDedDep = computed(() => num(cfg.value.dedDep).toFixed(2).replace('.', ','))

/* Escala semanal em horas (cEscala, index.html 1619) — só volta a minutos ao salvar. */
const ESCALA_ORDEM = [1, 2, 3, 4, 5, 6, 0]
const escalaH = reactive<Record<number, string>>({})
watch(
  cfg,
  (c) => {
    for (const w of ESCALA_ORDEM) escalaH[w] = String(num(c.escala[w]) / 60)
  },
  { immediate: true }
)

/* Faixas de INSS/IRPF (tInss/tIrrf, index.html 1620-1623 + inssRow/irrfRow 1650-1657)
   — espelhos locais editáveis, só convertidos/filtrados/ordenados ao salvar. */
interface InssRow {
  ate: string
  aliq: string
}
interface IrrfRow {
  ate: string
  aliq: string
  ded: string
}
const inssRows = reactive<InssRow[]>([])
const irrfRows = reactive<IrrfRow[]>([])
watch(
  cfg,
  (c) => {
    inssRows.splice(0, inssRows.length, ...c.inss.map((f) => ({ ate: String(f.ate), aliq: String(f.aliq) })))
    irrfRows.splice(
      0,
      irrfRows.length,
      ...c.irrf.map((f) => ({
        ate: f.ate >= 999999999 ? '' : String(f.ate),
        aliq: String(f.aliq),
        ded: String(f.ded)
      }))
    )
  },
  { immediate: true }
)
function addInssRow(): void {
  inssRows.push({ ate: '', aliq: '' })
}
function delInssRow(i: number): void {
  inssRows.splice(i, 1)
}
function addIrrfRow(): void {
  irrfRows.push({ ate: '', aliq: '', ded: '' })
}
function delIrrfRow(i: number): void {
  irrfRows.splice(i, 1)
}

/* toggle13 (index.html 1629). */
const duas13 = computed(() => S.value.c13.modo === '2')

/* vigSel/vigNew/vigDel (index.html 1632-1649). */
function vigNew(): void {
  const mk = vigNewMonth.value
  if (!/^\d{4}-\d{2}$/.test(mk)) {
    toast('Escolha o mês de início da vigência.')
    return
  }
  if (S.value.vig.some((v) => v.desde === mk)) {
    toast('Já existe uma vigência nesse mês.')
    return
  }
  const base = structuredClone(folha.cfgFor(mk))
  S.value.vig.push({ desde: mk, cfg: base })
  S.value.vig.sort((a, b) => (a.desde < b.desde ? -1 : 1))
  vigIdx.value = S.value.vig.findIndex((v) => v.desde === mk)
  toast('Vigência criada — edite os valores e salve.')
}
async function vigDel(): Promise<void> {
  if (S.value.vig.length <= 1) {
    toast('É preciso manter ao menos uma vigência.')
    return
  }
  const v = S.value.vig[vigIdx.value]!
  if (!(await confirmS('Excluir vigência?', '"' + vigLabel(v) + '" — os meses passarão a usar a vigência anterior.')))
    return
  S.value.vig.splice(vigIdx.value, 1)
  vigIdx.value = S.value.vig.length - 1
  toast('Vigência excluída')
}

/* Feriados (fetchFeriados, index.html 1709-1727). */
const lblFeriados = computed(() => Object.keys(S.value.holidays).join(', ') || 'nenhum')
const feriadosLoading = ref(false)
async function buscarFeriados(): Promise<void> {
  feriadosLoading.value = true
  try {
    const { ok } = await folha.fetchFeriados()
    if (!ok) toast('Sem conexão — não foi possível buscar os feriados.')
  } finally {
    feriadosLoading.value = false
  }
}

/* Backup (doExport/fileImport, index.html 1730-1748). */
const fileInput = ref<HTMLInputElement | null>(null)
function doExport(): void {
  folha.exportBackup()
  toast('Backup exportado')
}
function pickFile(): void {
  fileInput.value?.click()
}
async function onFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const f = input.files && input.files[0]
  if (f && (await importBackupFile(f))) router.push('/')
  input.value = ''
}

/* btnSaveCfg (index.html 1687-1703) — porta verbatim as coações/conversões. */
function salvar(): void {
  const c = cfg.value
  S.value.nome = (S.value.nome || '').trim()
  S.value.adm = S.value.adm || ''
  S.value.depExtra = parseInt(String(S.value.depExtra)) || 0
  c.salario = parseFloat(String(c.salario)) || 0
  c.jornada = parseFloat(String(c.jornada)) || 220
  c.batidas = String(c.batidas)
  c.autoAlmoco = Number(c.autoAlmoco)
  c.almocoMin = parseFloat(String(c.almocoMin)) || 0
  c.modoExtras = String(c.modoExtras)
  c.pctExtra = parseFloat(String(c.pctExtra)) || 0
  c.dsr = Number(c.dsr)
  c.sfCota = parseFloat(String(c.sfCota)) || 0
  c.sfLim = parseFloat(String(c.sfLim)) || 0
  c.cesta = parseFloat(String(c.cesta)) || 0
  c.ferCat = Number(c.ferCat)
  c.dedDep = parseFloat(String(c.dedDep)) || 0
  c.redIsen = parseFloat(String(c.redIsen)) || 0
  c.redGrad = parseFloat(String(c.redGrad)) || 0
  c.redA = parseFloat(String(c.redA)) || 0
  c.redB = parseFloat(String(c.redB)) || 0
  for (const w of ESCALA_ORDEM) {
    c.escala[w] = Math.round((parseFloat(escalaH[w]!) || 0) * 60)
  }
  c.inss = inssRows
    .map((r) => ({ ate: parseFloat(r.ate) || 0, aliq: parseFloat(r.aliq) || 0 }))
    .filter((f) => f.ate > 0)
    .sort((a, b) => a.ate - b.ate)
  c.irrf = irrfRows
    .map((r) => ({
      ate: r.ate === '' ? 999999999 : parseFloat(r.ate) || 0,
      aliq: parseFloat(r.aliq) || 0,
      ded: parseFloat(r.ded) || 0
    }))
    .sort((a, b) => a.ate - b.ate)
  S.value.c13 = {
    modo: S.value.c13.modo,
    d1: S.value.c13.d1 || '30/11',
    d2: S.value.c13.d2 || '20/12',
    dU: S.value.c13.dU || '20/12'
  }
  toast('Configurações salvas — ' + vigLabel(S.value.vig[vigIdx.value]!))
  router.push('/')
}
</script>

<template>
  <main>
    <div class="card">
      <h2>Vigência das regras</h2>
      <p class="muted" style="margin-bottom: 8px">
        Cada vigência guarda salário, escala e tabelas válidos a partir de um mês. Crie uma nova quando houver
        dissídio ou mudança de tabela — meses anteriores continuam com as regras antigas.
      </p>
      <label class="f"
        >Editando a vigência
        <select v-model.number="vigIdx">
          <option v-for="(v, i) in S.vig" :key="v.desde" :value="i">{{ vigLabel(v) }}</option>
        </select>
      </label>
      <input v-model="vigNewMonth" type="month" style="margin-bottom: 8px" />
      <div class="row">
        <button class="btn sec small" @click="vigNew">Nova vigência</button>
        <button class="btn warn small" style="flex: none" @click="vigDel">Excluir</button>
      </div>
    </div>

    <details class="cfgsec" open>
      <summary>Contrato <span class="chip task">global</span></summary>
      <div class="inner">
        <label class="f">Nome e sobrenome<input v-model="S.nome" placeholder="Aparece no relatório" /></label>
        <label class="f">Data de admissão<input v-model="S.adm" type="date" /></label>
        <p class="muted">
          Usada para calcular os avos do 13º e o período aquisitivo de férias. Sem ela, o app assume ano completo.
        </p>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Salário e jornada</summary>
      <div class="inner">
        <label class="f">Salário mensal (R$)<input v-model="cfg.salario" type="number" step="0.01" inputmode="decimal" /></label>
        <label class="f"
          >Jornada mensal (horas) — base do valor-hora<input v-model="cfg.jornada" type="number" step="1" inputmode="numeric"
        /></label>
        <label class="f" style="margin-bottom: 4px">Escala semanal (horas por dia)</label>
        <div class="escala">
          <div v-for="w in ESCALA_ORDEM" :key="w">
            <label>{{ DSEM[w] }}</label>
            <input v-model="escalaH[w]" type="number" step="0.5" inputmode="decimal" />
          </div>
        </div>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Ponto</summary>
      <div class="inner">
        <label class="f"
          >Batidas por dia
          <select v-model="cfg.batidas">
            <option value="4">4 (entrada, almoço, volta, saída)</option>
            <option value="2">2 (entrada e saída)</option>
            <option value="0">Livre</option>
          </select>
        </label>
        <label class="f">
          <span>Desconto automático de almoço (quando houver só 2 batidas no dia)</span>
          <div class="row" style="margin-top: 4px">
            <select v-model="cfg.autoAlmoco">
              <option :value="1">Ativado</option>
              <option :value="0">Desativado</option>
            </select>
            <input v-model="cfg.almocoMin" type="number" step="5" inputmode="numeric" title="minutos" />
          </div>
          <span class="muted">minutos descontados</span>
        </label>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Horas extras</summary>
      <div class="inner">
        <label class="f"
          >Tratamento do saldo
          <select v-model="cfg.modoExtras">
            <option value="pagar">Pagar como extra</option>
            <option value="banco">Banco de horas (não paga)</option>
          </select>
        </label>
        <label class="f">Adicional de hora extra (%)<input v-model="cfg.pctExtra" type="number" step="5" inputmode="numeric" /></label>
        <label class="f"
          >DSR sobre horas extras
          <select v-model="cfg.dsr">
            <option :value="1">Calcular (reflexo legal)</option>
            <option :value="0">Não calcular</option>
          </select>
        </label>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Família e benefícios</summary>
      <div class="inner">
        <label class="f" style="margin-bottom: 4px">Filhos <span class="chip task">global</span></label>
        <FilhosEditor />
        <p class="muted" style="margin-bottom: 10px">
          Contagem automática por idade: até 14 anos → salário-família; até 21 → dependente de IRPF (dedução R$
          {{ lblDedDep }}/mês). Universitário de 21–24 pode ser deduzido: use o campo abaixo.
        </p>
        <label class="f"
          >Outros dependentes de IRPF (cônjuge, universitário 21–24 etc.)<input
            v-model="S.depExtra"
            type="number"
            step="1"
            inputmode="numeric"
        /></label>
        <div class="grid2">
          <label class="f">Cota salário-família (R$)<input v-model="cfg.sfCota" type="number" step="0.01" /></label>
          <label class="f">Limite de renda (R$)<input v-model="cfg.sfLim" type="number" step="0.01" /></label>
        </div>
        <label class="f"
          >Vale cesta básica (R$) — benefício, fora do salário<input v-model="cfg.cesta" type="number" step="0.01"
        /></label>
        <label class="f"
          >Feriado da categoria em 12 de maio (CCT SinSaúde)
          <select v-model="cfg.ferCat">
            <option :value="1">Aplicar automaticamente</option>
            <option :value="0">Não aplicar</option>
          </select>
        </label>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Tabela INSS</summary>
      <div class="inner">
        <table class="tx">
          <thead>
            <tr>
              <td class="muted">Até (R$)</td>
              <td class="muted">Alíq. %</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in inssRows" :key="i">
              <td><input v-model="r.ate" type="number" step="0.01" /></td>
              <td><input v-model="r.aliq" type="number" step="0.5" /></td>
              <td><button class="btn warn small" @click="delInssRow(i)">×</button></td>
            </tr>
          </tbody>
        </table>
        <button class="btn ghost small" style="margin-top: 8px" @click="addInssRow">+ faixa</button>
        <p class="muted" style="margin-top: 6px">A última faixa é o teto: acima dela não há desconto adicional.</p>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Tabela IRPF</summary>
      <div class="inner">
        <table class="tx">
          <thead>
            <tr>
              <td class="muted">Até (R$)</td>
              <td class="muted">Alíq. %</td>
              <td class="muted">Deduzir (R$)</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in irrfRows" :key="i">
              <td><input v-model="r.ate" type="number" step="0.01" placeholder="∞" /></td>
              <td><input v-model="r.aliq" type="number" step="0.5" /></td>
              <td><input v-model="r.ded" type="number" step="0.01" /></td>
              <td><button class="btn warn small" @click="delIrrfRow(i)">×</button></td>
            </tr>
          </tbody>
        </table>
        <button class="btn ghost small" style="margin-top: 8px" @click="addIrrfRow">+ faixa</button>
        <label class="f" style="margin-top: 10px">Dedução por dependente (R$)<input v-model="cfg.dedDep" type="number" step="0.01" /></label>
        <div class="grid2">
          <label class="f">Isenção total até (rend. R$)<input v-model="cfg.redIsen" type="number" step="0.01" /></label>
          <label class="f">Redução gradual até (R$)<input v-model="cfg.redGrad" type="number" step="0.01" /></label>
        </div>
        <div class="grid2">
          <label class="f">Redutor: constante A<input v-model="cfg.redA" type="number" step="0.01" /></label>
          <label class="f">Redutor: coeficiente B<input v-model="cfg.redB" type="number" step="0.000001" /></label>
        </div>
        <p class="muted">Lei 15.270/2025: redutor mensal = A − (B × rendimento tributável), limitado ao imposto.</p>
      </div>
    </details>

    <details class="cfgsec">
      <summary>13º salário <span class="chip task">global</span></summary>
      <div class="inner">
        <label class="f"
          >Forma de pagamento
          <select v-model="S.c13.modo">
            <option value="2">Duas parcelas (padrão legal)</option>
            <option value="1">Parcela única</option>
          </select>
        </label>
        <div v-if="duas13" class="grid2">
          <label class="f">1ª parcela até (dia/mês)<input v-model="S.c13.d1" placeholder="30/11" /></label>
          <label class="f">2ª parcela até (dia/mês)<input v-model="S.c13.d2" placeholder="20/12" /></label>
        </div>
        <label v-else class="f">Pagamento até (dia/mês)<input v-model="S.c13.dU" placeholder="20/12" /></label>
        <p class="muted">
          Padrão legal: 1ª parcela (adiantamento, sem descontos) até 30/11; 2ª até 20/12, com INSS e IRPF sobre o 13º
          integral.
        </p>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Aparência <span class="chip task">global</span></summary>
      <div class="inner">
        <label class="f"
          >Tema
          <select v-model="S.ui.theme">
            <option value="sys">Automático (sistema)</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </label>
        <p class="muted">
          Dica: use "Adicionar à tela de início" no menu do navegador para abrir o app em tela cheia, sem a barra de
          endereço.
        </p>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Feriados <span class="chip task">global</span></summary>
      <div class="inner">
        <p class="muted" style="margin-bottom: 8px">
          Feriados nacionais via BrasilAPI (precisa de internet). Municipais/estaduais: marque o dia manualmente.
          Anos carregados: <span class="mono">{{ lblFeriados }}</span>
        </p>
        <button class="btn sec small" :disabled="feriadosLoading" @click="buscarFeriados">
          {{ feriadosLoading ? 'Buscando…' : 'Buscar feriados (ano atual e próximo)' }}
        </button>
      </div>
    </details>

    <details class="cfgsec">
      <summary>Backup <span class="chip task">global</span></summary>
      <div class="inner">
        <p class="muted" style="margin-bottom: 8px">
          Os dados ficam no armazenamento do navegador deste aparelho. Exporte um backup de vez em quando — limpar os
          dados do navegador apaga tudo.
        </p>
        <div class="row">
          <button class="btn sec small" @click="doExport">Exportar JSON</button>
          <button class="btn ghost small" @click="pickFile">Importar JSON</button>
        </div>
        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="onFile" />
      </div>
    </details>

    <button class="btn" style="width: 100%; margin-bottom: 20px" @click="salvar">Salvar configurações</button>
  </main>
</template>
