import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomAlarmConfig from '@/assets/icons/alarm-config.svg?raw';

const route = [
  {
    path: '/',
    component: Layout,
    redirect: { name: 'Dashboard' },
    meta: {
      title: 'dashboard',
      icon: ICustomAlarmConfig,
      activeIcon: ICustomAlarmConfig,
      hiddenMenu: true,
      order: 5,
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/the-dashboard.vue'),
        meta: { keepAlive: true, title: 'dashboard', icon: ICustomAlarmConfig },
      },
    ],
  },
];

export default route;
