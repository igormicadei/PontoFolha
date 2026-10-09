<script setup lang="ts">
/* Formulário de item avulso da folha (crédito ou débito) e, num segundo passo,
   a lista de tipos. O tipo define a tributação; só "Outro crédito" deixa o
   usuário escolher. */
import { computed } from 'vue'
import Sheet from './Sheet.vue'
import { GROUP_LABEL, effectLines, isTaxable, typesOf, type ItemType } from '@/lib/itemTypes'
import { MESES, cap } from '@/lib/utils'
import { itemSheet, closeItemSheet, saveItem, setKind, pickType, currentType } from '@/lib/itemSheet'

const tipo = computed(() => currentType())
const tributavel = computed(() => isTaxable(tipo.value, itemSheet.taxable))
const efeito = computed(() => effectLines(tipo.value, tributavel.value))
const tag = computed(() => (tipo.value.kind === 'd' ? 'Desconto' : tributavel.value ? 'Tributável' : 'Não tributável'))
const mesTxt = computed(() =>
  itemSheet.mk ? `${cap(MESES[Number(itemSheet.mk.slice(5, 7)) - 1]!)} ${itemSheet.mk.slice(0, 4)}` : ''
)

interface Grupo {
  id: ItemType['group']
  titulo: string
  itens: ItemType[]
}
const grupos = computed<Grupo[]>(() => {
  const ts = typesOf(itemSheet.kind)
  const ids: ItemType['group'][] = itemSheet.kind === 'c' ? ['trib', 'ntrib', 'livre'] : ['deb']
  return ids.map((id) => ({ id, titulo: GROUP_LABEL[id], itens: ts.filter((t) => t.group === id) }))
})

const titulo = computed(() =>
  itemSheet.step === 'tipo' ? 'Tipo do item' : itemSheet.idx >= 0 ? 'Editar item' : 'Adicionar item'
)
const sub = computed(() => (itemSheet.step === 'tipo' ? 'O tipo define se entra nos impostos' : `Entra na folha de ${mesTxt.value}`))

function escolher(id: string): void {
  pickType(id)
  itemSheet.step = 'form'
}
</script>

<template>
  <Sheet :open="itemSheet.open" :title="titulo" :subtitle="sub" :back="itemSheet.step === 'tipo'" @close="closeItemSheet">
    <template v-if="itemSheet.step === 'form'">
      <div class="seg" role="group" aria-label="Crédito ou débito">
        <button :class="{ on: itemSheet.kind === 'c' }" :aria-pressed="itemSheet.kind === 'c'" @click="setKind('c')">
          Crédito<span class="muted" style="font-size: 12px">soma</span>
        </button>
        <button :class="{ on: itemSheet.kind === 'd' }" :aria-pressed="itemSheet.kind === 'd'" @click="setKind('d')">
          Débito<span class="muted" style="font-size: 12px">desconta</span>
        </button>
      </div>

      <div class="field">
        <span class="lb" aria-hidden="true">Tipo</span>
        <button
          :aria-label="`Tipo: ${tipo.label}. Toque para mudar`"
          class="between"
          style="width: 100%; min-height: 56px; padding: 8px 14px; border-radius: 14px; border: 1.5px solid var(--line); background: var(--card); text-align: left; font-size: 16px; font-weight: 600"
          @click="itemSheet.step = 'tipo'"
        >
          <span class="grow">{{ tipo.label }}</span>
          <span class="chip">{{ tag }}</span>
          <svg class="i" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      <div v-if="tipo.choose" class="field">
        <span id="it-tb" class="lb">Tributação deste crédito</span>
        <div class="seg" role="group" aria-labelledby="it-tb">
          <button :class="{ on: itemSheet.taxable }" :aria-pressed="itemSheet.taxable" @click="itemSheet.taxable = true">Tributável</button>
          <button :class="{ on: !itemSheet.taxable }" :aria-pressed="!itemSheet.taxable" @click="itemSheet.taxable = false">Não tributável</button>
        </div>
      </div>

      <div class="field">
        <label for="it-v">Valor</label>
        <div class="inwrap">
          <span class="pre">R$</span>
          <input id="it-v" v-model="itemSheet.valor" class="input num withpre" inputmode="decimal" placeholder="0,00" style="font-size: 20px" @keyup.enter="saveItem" />
        </div>
      </div>

      <div class="field">
        <label for="it-d">Descrição <span style="font-weight: 500; color: var(--ink3)">(opcional)</span></label>
        <input id="it-d" v-model="itemSheet.desc" class="input" :placeholder="tipo.kind === 'c' ? 'Ex.: Prêmio de produtividade' : 'Ex.: Adiantamento de 15/10'" />
        <span class="hint">Aparece assim no demonstrativo. Em branco, usa o nome do tipo.</span>
      </div>

      <div class="note-box">
        <div class="eyebrow" style="color: var(--ink2)">Como entra na folha</div>
        <ul style="margin: 6px 0 0; padding-left: 18px; line-height: 1.5">
          <li v-for="l in efeito" :key="l">{{ l }}</li>
        </ul>
        <p class="muted" style="margin-top: 6px">Definido pelo tipo. Mudando o tipo, muda aqui.</p>
      </div>
    </template>

    <template v-else>
      <div class="seg" role="group" aria-label="Crédito ou débito">
        <button :class="{ on: itemSheet.kind === 'c' }" :aria-pressed="itemSheet.kind === 'c'" @click="setKind('c')">Crédito</button>
        <button :class="{ on: itemSheet.kind === 'd' }" :aria-pressed="itemSheet.kind === 'd'" @click="setKind('d')">Débito</button>
      </div>
      <div role="radiogroup" :aria-label="itemSheet.kind === 'c' ? 'Tipo de crédito' : 'Tipo de débito'" style="display: flex; flex-direction: column; padding-bottom: 8px">
        <template v-for="g in grupos" :key="g.id">
          <div class="eyebrow" style="padding: 10px 0 2px">{{ g.titulo }}</div>
          <div class="list">
            <button
              v-for="t in g.itens"
              :key="t.id"
              class="li"
              :class="{ sel: t.id === itemSheet.typeId }"
              role="radio"
              :aria-checked="t.id === itemSheet.typeId"
              @click="escolher(t.id)"
            >
              <div class="grow">
                <div class="t">{{ t.label }}</div>
                <div v-if="t.hint" class="s">{{ t.hint }}</div>
              </div>
              <svg v-if="t.id === itemSheet.typeId" class="i" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10" /></svg>
            </button>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <template v-if="itemSheet.step === 'form'">
        <button class="btn ghost" @click="itemSheet.open = false">Cancelar</button>
        <button class="btn grow" @click="saveItem">{{ itemSheet.idx >= 0 ? 'Salvar item' : 'Adicionar item' }}</button>
      </template>
      <button v-else class="btn block" @click="itemSheet.step = 'form'">Usar “{{ tipo.label }}”</button>
    </template>
  </Sheet>
</template>
