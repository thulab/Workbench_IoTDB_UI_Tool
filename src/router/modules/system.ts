import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomSystemConfig from '@/assets/icons/system-config.svg?raw';
import ICustomSystemConfigActive from '@/assets/icons/system-config-active.svg?raw';
import ICustomAuth from '@/assets/icons/auth.svg?raw';
import ICustomAuthUser from '@/assets/icons/auth-user.svg?raw';
import ICustomTrend from '@/assets/icons/trend.svg?raw';
import ICustomTrendActive from '@/assets/icons/trend-active.svg?raw';
import ICustomCalculate from '@/assets/icons/calculate.svg?raw';
import ICustomCalculateActive from '@/assets/icons/calculate-active.svg?raw';
import ICustomAuthRole from '@/assets/icons/auth-role.svg?raw';
// import ICustomLogManagement from '@/assets/icons/log-management.svg?raw';
import ICustomAuditLog from '@/assets/icons/audit-log.svg?raw';
import ICustomWhiteList from '@/assets/icons/white-list.svg?raw';

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
          isAuthMenu: true,
        },
        children: [
          {
            path: 'user',
            name: 'UserManagement',
            component: () => import('@/views/auth/user-detail.vue'),
            meta: {
              keepAlive: true, title: '用户管理', icon: ICustomAuthUser, isAuthMenu: true,
            },
          },
          {
            path: 'role',
            name: 'RoleManagement',
            component: () => import('@/views/auth/role-detail.vue'),
            meta: {
              keepAlive: true, title: '角色管理', icon: ICustomAuthRole, isAuthMenu: true,
            },
          },
        ],
      },
      // {
      //   path: 'log',
      //   redirect: { name: 'AuditLog' },
      //   meta: {
      //     title: '日志管理',
      //     hideLine: true,
      //     icon: ICustomLogManagement,
      //     alwayShow: true,
      //   },
      //   children: [
      //     {
      //       path: 'audit',
      //       name: 'AuditLog',
      //       component: () => import('@/views/log-management/audit.vue'),
      //       meta: { keepAlive: true, title: '审计日志', icon: ICustomAuditLog },
      //     },
      //   ],
      // },
      {
        path: 'audit',
        name: 'AuditLog',
        component: () => import('@/views/log-management/audit.vue'),
        meta: {
          keepAlive: true,
          title: '审计日志',
          icon: ICustomAuditLog,
        },
      },
      // {
      //   path: 'white-list',
      //   name: 'WhiteList',
      //   component: () => import('@/views/white-list/detail.vue'),
      //   meta: {
      //     keepAlive: true,
      //     title: '白名单管理',
      //     icon: ICustomWhiteList,
      //   },
      // },
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
      showTopLine: true,
      order: 25,
      // appType: 1,
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
  {
    path: '/calculate',
    component: Layout,
    redirect: { name: 'CalculateDetail' },
    meta: {
      title: '计算',
      icon: ICustomCalculate,
      activeIcon: ICustomCalculateActive,
      showTopLine: true,
      order: 26,
      appType: 1,
    },
    children: [
      {
        path: 'detail',
        name: 'CalculateDetail',
        component: () => import('@/views/calculate/detail.vue'),
        meta: { keepAlive: true },
      },
    ],
  },
  {
    path: '/calculate',
    component: Layout,
    redirect: { name: 'CalculateDetail' },
    meta: {
      title: '视图',
      icon: ICustomCalculate,
      activeIcon: ICustomCalculateActive,
      showTopLine: true,
      order: 26,
      appType: 2,
    },
    children: [
      {
        path: 'detail',
        name: 'CalculateDetail',
        component: () => import('@/views/calculate/detail.vue'),
        meta: { keepAlive: true },
      },
    ],
  },
];

export default route;
