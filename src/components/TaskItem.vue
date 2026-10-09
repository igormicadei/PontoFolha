<script setup lang="ts">
/* Linha de tarefa: caixa de conclusão de 44 px, texto que abre a edição, chip
   de recorrência e exclusão. Pontual usa ref=índice, recorrente usa ref=id. */
import { computed } from 'vue'
import { useFolha } from '@/stores/folha'
import { editT, delT } from '@/lib/tasks'
import { fmtDia, todayKey } from '@/lib/utils'

/** Espelha os itens de dayTasks (engine): pontual {kind:'p',idx} ou
 *  recorrente {kind:'r',id,freq}. */
export interface TaskItemData {
  t: string
  ok: boolean
  kind: 'p' | 'r'
  idx?: number
  id?: string
  freq?: string
}

const props = defineProps<{ dk: string; task: TaskItemData; showDate?: boolean }>()

const folha = useFolha()

const ref = computed<string | number>(() =>
  props.task.kind === 'p' ? props.task.idx! : props.task.id!
)

const dateLabel = computed(() => {
  const t = todayKey()
  if (props.dk === t) return 'Hoje'
  return fmtDia(props.dk)
})
const late = computed(() => !props.task.ok && props.dk < todayKey())
</script>

<template>
  <div class="li" :class="{ done: task.ok }" style="min-height: 56px">
    <button
      class="check"
      :aria-label="(task.ok ? 'Reabrir: ' : 'Concluir: ') + task.t"
      @click="folha.toggleT(dk, task.kind, ref)"
    >
      <i>
        <svg v-if="task.ok" class="i" viewBox="0 0 24 24" style="width: 14px; height: 14px; stroke-width: 3"><path d="M5 12l5 5 9-10" /></svg>
      </i>
    </button>
    <button class="grow" style="text-align: left" :aria-label="'Editar: ' + task.t" @click="editT(dk, task.kind, ref)">
      <div class="t">{{ task.t }}</div>
      <div v-if="showDate" class="s" :style="late ? 'color: var(--bad); font-weight: 600' : ''">{{ dateLabel }}</div>
    </button>
    <span v-if="task.kind === 'r'" class="chip vac">↻ {{ task.freq === 'w' ? 'sem.' : 'mês' }}</span>
    <button class="iconplain bad" :aria-label="'Excluir: ' + task.t" @click="delT(dk, task.kind, ref)">
      <svg class="i sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  </div>
</template>
