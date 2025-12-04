import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/pages/HomeView.vue';
import ChatPage from '@/pages/ChatPage.vue';
import AnalyticsPage from '@/pages/AnalyticsPage.vue';
import AdminAiAppsPage from '@/pages/AdminAiAppsPage.vue';
import AdminAiAssistantsPage from '@/pages/AdminAiAssistantsPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/chat',
    name: 'chat',
    component: ChatPage,
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: AnalyticsPage,
  },
  {
    path: '/admin/ai-apps',
    name: 'admin-ai-apps',
    component: AdminAiAppsPage,
  },
  {
    path: '/admin/ai-assistants',
    name: 'admin-ai-assistants',
    component: AdminAiAssistantsPage,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
