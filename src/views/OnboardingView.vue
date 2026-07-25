<script setup lang="ts">
/* Onboarding (index.html #view-onboard 207-229 + obStart 1804-1813 + obImport
   1815). Coleta nome/admissão/salário e filhos (via FilhosEditor), grava na
   última vigência e marca S.onboarded. O botão "importar" reaproveita o mesmo
   fluxo de backup do Config (input file oculto → importBackupFile). */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFolha } from '@/stores/folha'
import { toast } from '@/lib/toast'
import { importBackupFile } from '@/lib/backup'
import FilhosEditor from '@/components/FilhosEditor.vue'

const folha = useFolha()
const { S } = storeToRefs(folha)
const router = useRouter()

const obNome = ref('')
const obAdm = ref('')
const obSalario = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

/* obStart (index.html 1804-1813). */
function start(): void {
  const adm = obAdm.value
  const sal = parseFloat(obSalario.value)
  S.value.nome = obNome.value.trim()
  if (adm) S.value.adm = adm
  const c = S.value.vig[S.value.vig.length - 1]!.cfg
  if (isFinite(sal) && sal > 0) c.salario = sal
  S.value.onboarded = true
  toast(S.value.nome ? `Tudo pronto, ${S.value.nome.split(' ')[0]}!` : 'Tudo pronto!')
  router.push('/')
}

/* obImport (index.html 1815) → dispara o input file oculto. */
function pickFile(): void {
  fileInput.value?.click()
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
    <div class="punch-wrap" style="padding-bottom: 0">
      <div
        style="
          width: 100px;
          height: 100px;
          border-radius: 24px;
          background: var(--ink);
          color: var(--bg);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
        "
      >
        ⏱
      </div>
    </div>
    <h2
      style="
        text-align: center;
        font-family: var(--disp);
        font-weight: 700;
        font-size: 22px;
        letter-spacing: -0.01em;
        text-transform: none;
        color: var(--ink);
        margin-top: 16px;
      "
    >
      Bem-vinda ao Ponto &amp; Folha
    </h2>
    <p class="muted" style="text-align: center; margin-bottom: 16px">
      Controle de jornada, agenda e conferência de folha — tudo neste aparelho. Comece com o básico;
      o resto (escala, tabelas de impostos, benefícios) já vem preenchido e pode ser ajustado depois
      em Config.
    </p>
    <div class="card">
      <label class="f">Nome e sobrenome<input v-model="obNome" placeholder="Como aparece no holerite" /></label>
      <label class="f">Data de admissão<input v-model="obAdm" type="date" /></label>
      <label class="f"
        >Salário mensal (R$)<input
          v-model="obSalario"
          type="number"
          step="0.01"
          inputmode="decimal"
          placeholder="1878,14 (piso CCT 2026)"
      /></label>
      <label class="f" style="margin-bottom: 4px">Filhos (data de nascimento)</label>
      <FilhosEditor />
      <p class="muted">
        Pela data de nascimento o app calcula sozinho, mês a mês, quem conta para o salário-família
        (até 14 anos) e para a dedução de IRPF (até 21 anos).
      </p>
    </div>
    <button class="btn" style="width: 100%" @click="start">Começar</button>
    <button class="btn ghost" style="width: 100%; margin-top: 8px" @click="pickFile">
      Já tenho um backup — importar JSON
    </button>
    <input ref="fileInput" type="file" accept=".json" class="hidden" @change="onFile" />
    <p class="muted" style="text-align: center; margin: 12px 0 20px">
      Os dados ficam somente neste aparelho. Nada é enviado a servidores.
    </p>
  </section>
</template>
