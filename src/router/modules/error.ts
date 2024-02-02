import type { RouteRecordRaw } from 'vue-router';

// 错误页面模块
const errorRouter: Array<RouteRecordRaw> = [
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/error/error-403.vue'),
    meta: {
      requiresAuth: false,
      hiddenMenu: true,
      title: 'page.403',
      key: '403',
    },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/error-404.vue'),
    meta: {
      requiresAuth: false,
      hiddenMenu: true,
      title: 'page.404',
      key: '404',
    },
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/views/error/error-500.vue'),
    meta: {
      requiresAuth: false,
      hiddenMenu: true,
      title: 'page.500',
      key: '500',
    },
  },
];

export default errorRouter;
