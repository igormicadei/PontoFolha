<script setup lang="ts">
/* Onboarding em três passos curtos: você (nome, admissão, salário), família
   (filhos) e pronto. Importar um backup é uma opção de primeira classe desde o
   primeiro passo. Grava na última vigência e marca S.onboarded. */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFolha } from '@/stores/folha'
import { toast } from '@/lib/toast'
import { importBackupFile } from '@/lib/backup'
import { brl } from '@/lib/utils'
import FilhosEditor from '@/components/FilhosEditor.vue'

const folha = useFolha()
const { S } = storeToRefs(folha)
const router = useRouter()

const passo = ref(1)
const obNome = ref('')
const obAdm = ref('')
const obSalario = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const salNum = computed(() => parseFloat(obSalario.value.replace(/\./g, '').replace(',', '.')))
const salOk = computed(() => isFinite(salNum.value) && salNum.value > 0)

function start(): void {
  S.value.nome = obNome.value.trim()
  if (obAdm.value) S.value.adm = obAdm.value
  const c = S.value.vig[S.value.vig.length - 1]!.cfg
  if (salOk.value) c.salario = salNum.value
  S.value.onboarded = true
  toast(S.value.nome ? `Tudo pronto, ${S.value.nome.split(' ')[0]}!` : 'Tudo pronto!')
  router.push('/')
}

async function onFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const f = input.files && input.files[0]
  if (f && (await importBackupFile(f))) router.push('/')
  input.value = ''
}
</script>

<template>
  <section>
    <main class="content" style="padding-top: calc(28px + env(safe-area-inset-top)); gap: 20px">
      <div class="rowflex" style="gap: 6px" role="progressbar" :aria-label="`Passo ${passo} de 3`" aria-valuemin="1" aria-valuemax="3" :aria-valuenow="passo">
        <span v-for="n in 3" :key="n" style="flex: 1; height: 6px; border-radius: 999px" :style="{ background: n <= passo ? 'var(--ink)' : 'var(--line)' }"></span>
      </div>

      <div>
        <svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label="Ponto&amp;Folha">
          <rect width="72" height="72" rx="22" fill="#0E0E10" />
          <circle cx="36" cy="36" r="20" fill="none" stroke="#FFFFFF" stroke-width="4" />
          <path d="M36 24v12l8 6" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="54" cy="18" r="7" fill="#FF3D8B" />
        </svg>
        <h1 style="margin-top: 20px; font-size: 32px; line-height: 1.1; font-weight: 800; letter-spacing: -0.035em; text-wrap: balance">
          {{ passo === 1 ? 'Vamos configurar em um minuto' : passo === 2 ? 'Sua família' : 'Tudo pronto' }}
        </h1>
        <p style="margin-top: 10px; color: var(--ink2); font-size: 16px; line-height: 1.5; text-wrap: pretty">
          <template v-if="passo === 1">Controle de jornada e conferência de folha, tudo neste aparelho. Escala, impostos e benefícios já vêm preenchidos; ajuste depois em Ajustes.</template>
          <template v-else-if="passo === 2">Pela data de nascimento o app calcula sozinho, mês a mês, quem conta para o salário-família (até 14 anos) e para a dedução de IRPF (até 21 anos).</template>
          <template v-else>Confira o resumo. Você pode mudar tudo depois em Ajustes.</template>
        </p>
      </div>

      <section v-if="passo === 1" class="card">
        <div class="stack" style="gap: 16px">
          <div class="field">
            <label for="ob-n">Nome e sobrenome</label>
            <input id="ob-n" v-model="obNome" class="input" autocomplete="name" />
            <span class="hint">Aparece no relatório em PDF.</span>
          </div>
          <div class="field">
            <label for="ob-a">Data de admissão</label>
            <input id="ob-a" v-model="obAdm" type="date" class="input" />
            <span class="hint">Define os avos do 13º e o período aquisitivo das férias.</span>
          </div>
          <div class="field">
            <label for="ob-s">Salário mensal</label>
            <div class="inwrap"><span class="pre">R$</span><input id="ob-s" v-model="obSalario" class="input num withpre" inputmode="decimal" placeholder="1.878,14" /></div>
            <span class="hint">Piso da CCT 2026: R$ 1.878,14.</span>
          </div>
        </div>
      </section>

      <section v-else-if="passo === 2" class="card"><FilhosEditor /></section>

      <section v-else class="card">
        <div class="pay">
          <div class="ln"><div class="d">Nome</div><div class="v">{{ obNome.trim() || 'Não informado' }}</div></div>
          <div class="ln"><div class="d">Admissão</div><div class="v">{{ obAdm ? obAdm.split('-').reverse().join('/') : 'Não informada' }}</div></div>
          <div class="ln"><div class="d">Salário mensal</div><div class="v">{{ salOk ? brl(salNum) : 'Padrão (piso da CCT)' }}</div></div>
          <div class="ln"><div class="d">Filhos</div><div class="v">{{ S.filhos.length || 'Nenhum' }}</div></div>
        </div>
      </section>

      <div class="stack" style="gap: 10px">
        <button v-if="passo < 3" class="btn block" @click="passo++">Continuar</button>
        <button v-else class="btn block" @click="start">Começar</button>
        <button v-if="passo > 1" class="btn ghost block" @click="passo--">Voltar</button>
        <button v-if="passo === 1" class="btn ghost block" @click="fileInput?.click()">Já tenho um backup: importar JSON</button>
        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="onFile" />
      </div>

      <p class="muted" style="text-align: center">Nada é enviado a servidores. Os dados ficam só neste aparelho.</p>
    </main>
  </section>
</template>
