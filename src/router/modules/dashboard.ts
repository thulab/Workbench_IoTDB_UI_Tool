import { Layout2 } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomDashboard from '@/assets/icons/dashboard.svg?raw';
import ICustomDashboardActive from '@/assets/icons/dashboard-active.svg?raw';
import i18n from '@/locale/index';

const { t } = i18n.global;

const route = [
  {
    path: '/',
    component: Layout2,
    redirect: { name: 'Dashboard' },
    meta: {
      title: t('page.dashboard'),
      icon: ICustomDashboard,
      activeIcon: ICustomDashboardActive,
      // hiddenMenu: true,
      order: 5,
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/the-dashboard.vue'),
        meta: { keepAlive: true, title: 'dashboard', icon: ICustomDashboard },
      },
    ],
  },
];

export default route;
