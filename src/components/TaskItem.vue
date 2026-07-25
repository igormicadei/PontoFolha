<script setup lang="ts">
/* Item de tarefa (index.html taskItemHTML 968-975). Checkbox alterna a conclusão
   na store; ✎/× chamam editT/delT de src/lib/tasks.ts. Pontual usa ref=índice,
   recorrente usa ref=id da série. */
import { computed } from 'vue'
import { useFolha } from '@/stores/folha'
import { editT, delT } from '@/lib/tasks'
import { DSEM, dow, fmtDKs } from '@/lib/utils'

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

/** Rótulo de data ("seg 12/3") usado na lista de Tarefas (index.html
 *  renderTasks 1054); na Home o dia é implícito, então showDate fica falso. */
const dateLabel = computed(() => `${DSEM[dow(props.dk)]} ${fmtDKs(props.dk)}`)
</script>

<template>
  <div class="task-item" :class="{ done: task.ok }">
    <input
      type="checkbox"
      :checked="task.ok"
      @change="folha.toggleT(dk, task.kind, ref)"
    />
    <span v-if="showDate" class="tdate">{{ dateLabel }}</span>
    <span class="t"
      >{{ task.t
      }}<span v-if="task.kind === 'r'" class="chip rec">↻ {{ task.freq === 'w' ? 'sem' : 'mês' }}</span></span
    >
    <button class="icon" title="editar" @click="editT(dk, task.kind, ref)">✎</button>
    <button class="icon del" title="excluir" @click="delT(dk, task.kind, ref)">×</button>
  </div>
</template>
