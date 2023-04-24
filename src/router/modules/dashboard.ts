import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import IconEpHomeFilled from '~icons/ep/home-filled.svg?raw';

const route = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { title: 'dashboard', icon: IconEpHomeFilled, order: 0 },
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/the-dashboard.vue'),
      },
    ],
  },
];

export default route;
