import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { HOME_URL } from '@/config/app-config';
import Login from '@/views/the-login.vue';
import { iotdbShowAuth } from '@/utils/auth';
import { registerGuard as registerAuthGuard } from './guard/auth-guard';

const metaRouters = import.meta.glob('./modules/*.ts', { eager: true, import: 'default' }) as Record<string, Array<RouteRecordRaw>>;
export const asyncRoutes: Array<RouteRecordRaw> = [];
Object.keys(metaRouters).forEach((item) => {
  asyncRoutes.push(...metaRouters[item]);
});

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: HOME_URL,
  },
  {
    // 找不到路由重定向到404页面
    path: '/:pathMatch(.*)',
    redirect: { name: '404' },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  strict: false,
  // 切换页面，滚动到最顶部
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

export function addRoutes() {
  asyncRoutes.forEach((item) => {
    if (item.path === '/system') {
      if (item.children?.length) {
        const authRouteIndex = item.children.findIndex((child) => child.path === 'auth');
        if (authRouteIndex !== -1) {
          if (!iotdbShowAuth()) {
            item.children?.splice(authRouteIndex, 1);
            if (item.redirect && (item.redirect as any).name) {
              (item.redirect as any).name = 'AuditLog';
            }
          }
        }
      }
    }
    routes.push(item);
    router.addRoute(item);
  });
}

registerAuthGuard(router);

addRoutes();

export default router;
