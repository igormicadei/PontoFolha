/* ================= backup (import) ================= */
/* Lê um arquivo JSON de backup, valida a forma mínima, confirma e substitui o
   estado (index.html fileImport onchange 1740–1748). Retorna true se importou.
   O <input type=file> em si vive na view; aqui fica a lógica compartilhada
   entre Onboarding e Config. */

import { useFolha } from '@/stores/folha'
import { toast } from './toast'
import { confirmS } from './dialog'

export function importBackupFile(file: File): Promise<boolean> {
  const folha = useFolha()
  return new Promise((resolve) => {
    const rd = new FileReader()
    rd.onload = async () => {
      try {
        const o = JSON.parse(rd.result as string)
        if (!o.months && !o.vig && !o.cfg) throw new Error('formato inválido')
        if (await confirmS('Importar backup?', 'Os dados atuais serão substituídos.')) {
          folha.importBackup(o)
          toast('Backup importado')
          resolve(true)
        } else {
          resolve(false)
        }
      } catch (err) {
        toast('Arquivo inválido: ' + (err as Error).message)
        resolve(false)
      }
    }
    rd.readAsText(file)
  })
}
