<script setup lang="ts">
/* Editor de filhos, compartilhado por Onboarding e Config (index.html
   renderFilhosList 1587-1592 + addFilho 1597-1603 + delFilho 1593-1596).
   Lista cada filho com idade e chips derivados; adiciona/remove via store. */
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
  <div>
    <div v-if="!S.filhos.length" class="muted">
      <p class="muted">Nenhum filho cadastrado.</p>
    </div>
    <div v-for="(f, i) in S.filhos" :key="i" class="pagitem">
      <span>
        Nascido(a) em {{ fmtDK(f.n) }} · {{ idade(f.n) }} anos
        <span v-if="idade(f.n) < 14" class="chip abonado">sal.-família</span>
        <span v-if="idade(f.n) < 21" class="chip task">dep. IRPF</span>
      </span>
      <button class="btn warn small" @click="del(i)">×</button>
    </div>
    <div class="row" style="margin-bottom: 8px">
      <input v-model="novaData" type="date" />
      <button class="btn sec small" style="flex: none" @click="add">+ Adicionar filho</button>
    </div>
  </div>
</template>
