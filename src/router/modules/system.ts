import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomSystemConfig from '@/assets/icons/system-config.svg?raw';
import ICustomSystemConfigActive from '@/assets/icons/system-config-active.svg?raw';
import ICustomAuth from '@/assets/icons/auth.svg?raw';
import ICustomAuthUser from '@/assets/icons/auth-user.svg?raw';
import ICustomTrend from '@/assets/icons/trend.svg?raw';
import ICustomTrendActive from '@/assets/icons/trend-active.svg?raw';
import ICustomAuthRole from '~icons/custom/auth-role.svg?raw';

const route = [
  {
    path: '/system',
    component: Layout,
    redirect: { name: 'UserManagement' },
    meta: {
      title: '系统管理',
      icon: ICustomSystemConfig,
      activeIcon: ICustomSystemConfigActive,
      order: 40,
    },
    children: [
      {
        path: 'auth',
        redirect: { name: 'UserManagement' },
        meta: {
          title: '权限管理',
          hideLine: true,
          icon: ICustomAuth,
        },
        children: [
          {
            path: 'user',
            name: 'UserManagement',
            component: () => import('@/views/auth/user-detail.vue'),
            meta: { keepAlive: true, title: '用户管理', icon: ICustomAuthUser },
          },
          {
            path: 'role',
            name: 'RoleManagement',
            component: () => import('@/views/auth/role-detail.vue'),
            meta: { keepAlive: true, title: '角色管理', icon: ICustomAuthRole },
          },
        ],
      },
    ],
  },
  {
    path: '/trend',
    component: Layout,
    redirect: { name: 'TrendDetail' },
    meta: {
      title: '趋势',
      icon: ICustomTrend,
      activeIcon: ICustomTrendActive,
      order: 50,
    },
    children: [
      {
        path: 'detail',
        name: 'TrendDetail',
        component: () => import('@/views/data-trend/trend-detail.vue'),
        meta: { keepAlive: true },
      },
    ],
  },

];

export default route;
