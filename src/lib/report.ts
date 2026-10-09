/* ================= relatório ================= */
/* O relatório agora é uma tela do app (/relatorio/:mk, ReportView.vue) com CSS
   de impressão A4, em vez de uma janela aberta por window.open — que celulares
   costumam bloquear e que não existe num PWA instalado. Aqui fica só a pergunta
   que o legado já fazia (incluir a agenda de atividades?) e a navegação. */

import { ask } from './dialog'
import { router } from '@/router'

export async function abrirRelatorio(mk: string): Promise<void> {
  const incAtvRaw = await ask(
    'Gerar PDF do mês',
    'Incluir a agenda de atividades e tarefas dos dias no documento?',
    [
      { lb: 'Com atividades', val: true },
      { lb: 'Sem atividades', cls: 'sec', val: false }
    ]
  )
  if (incAtvRaw === null) return
  await router.push({ name: 'relatorio', params: { mk }, query: { atv: incAtvRaw === true ? '1' : '0' } })
}
