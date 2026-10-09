import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useFolha } from '@/stores/folha'

/** Espelha isFresh() (index.html 1798-1803): usuário sem dados algum → mostra
 *  o onboarding em vez da Início. */
function isFresh(): boolean {
  const S = useFolha().S
  if (S.onboarded) return false
  if (S.adm) return false
  if (S.rec.length) return false
  return !Object.keys(S.months).some(
    (k) => Object.keys(S.months[k]!.days).length || (S.months[k]!.pags || []).length
  )
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/tarefas', name: 'tasks', component: () => import('@/views/TasksView.vue') },
  { path: '/folha', name: 'folha', component: () => import('@/views/FolhaView.vue') },
  { path: '/mes', name: 'month', component: () => import('@/views/MonthView.vue') },
  { path: '/ajustes', name: 'ajustes', component: () => import('@/views/AjustesView.vue') },
  { path: '/ajustes/:sec', name: 'ajustes-secao', component: () => import('@/views/AjustesSecaoView.vue') },
  { path: '/relatorio/:mk', name: 'relatorio', component: () => import('@/views/ReportView.vue') },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/OnboardingView.vue')
  },
  // endereços antigos (PWA instalado, favoritos)
  { path: '/jornada', redirect: '/folha' },
  { path: '/config', redirect: '/ajustes' },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

/* Portão do onboarding (index.html startup 1834-1837): usuários novos caem no
   onboarding; usuários com dados nunca ficam presos nele. */
router.beforeEach((to) => {
  const fresh = isFresh()
  if (fresh && to.name !== 'onboarding') return { name: 'onboarding' }
  if (!fresh && to.name === 'onboarding') return { name: 'home' }
  return true
})
