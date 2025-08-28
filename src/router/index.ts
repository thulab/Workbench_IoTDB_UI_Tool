import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { HOME_URL } from '@/config/app-config';
import Login from '@/views/the-login.vue';
import { getRouterByType } from '@/utils/system-version';
import { registerGuard as registerAuthGuard } from './guard/auth-guard';

const metaRouters = import.meta.glob('./modules/*.ts', { eager: true, import: 'default' });
export const asyncRoutes: Array<RouteRecordRaw> = [];
Object.keys(metaRouters).forEach((item) => {
  const data: Array<RouteRecordRaw> = getRouterByType(metaRouters[item] as RouteRecordRaw[]);
  data.forEach((menuItem: RouteRecordRaw) => {
    menuItem.path = `/view${menuItem.path}`;
  });
  asyncRoutes.push(...data);
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
    path: '/view/login',
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
    routes.push(item);
    router.addRoute(item);
  });
}

registerAuthGuard(router);

addRoutes();

export default router;
