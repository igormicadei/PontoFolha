<script setup lang="ts">
/* Editor de filhos, compartilhado por Onboarding e Ajustes. Lista cada filho
   com idade e o que ele muda no cálculo; adiciona/remove direto na store. */
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFolha } from '@/stores/folha'
import { fmtDK, idade, todayKey } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { confirmS } from '@/lib/dialog'

const folha = useFolha()
const { S } = storeToRefs(folha)
const novaData = ref('')

function add(): void {
  const n = novaData.value
  if (!n) {
    toast('Escolha a data de nascimento.')
    return
  }
  if (n > todayKey()) {
    toast('Data no futuro.')
    return
  }
  folha.addFilho(n)
  novaData.value = ''
  toast('Filho adicionado')
}

async function del(i: number): Promise<void> {
  if (!(await confirmS('Remover este filho?', ''))) return
  folha.delFilho(i)
  toast('Removido')
}
</script>

<template>
  <div class="stack" style="gap: 10px">
    <p v-if="!S.filhos.length" class="muted">Nenhum filho cadastrado.</p>
    <div v-if="S.filhos.length" class="list">
      <div v-for="(f, i) in S.filhos" :key="i" class="li" style="min-height: 56px">
        <div class="grow">
          <div class="t">Nascido(a) em {{ fmtDK(f.n) }}</div>
          <div class="s">
            {{ idade(f.n) }} anos
            <span v-if="idade(f.n) < 14" class="chip ok" style="margin-left: 4px">sal.-família</span>
            <span v-if="idade(f.n) < 21" class="chip" style="margin-left: 4px">dep. IRPF</span>
          </div>
        </div>
        <button class="iconplain bad" :aria-label="`Remover filho nascido em ${fmtDK(f.n)}`" @click="del(i)">
          <svg class="i sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
    <div class="rowflex">
      <input v-model="novaData" type="date" class="input grow" aria-label="Data de nascimento do filho" />
      <button class="btn sec sm" style="flex: none" @click="add">Adicionar</button>
    </div>
  </div>
</template>
