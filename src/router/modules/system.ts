import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomSystemConfig from '@/assets/icons/system-config.svg?raw';
import ICustomSystemConfigActive from '@/assets/icons/system-config-active.svg?raw';
import ICustomAuth from '@/assets/icons/auth.svg?raw';
import ICustomAuthUser from '@/assets/icons/auth-user.svg?raw';
import ICustomTrend from '@/assets/icons/trend.svg?raw';
// import ICustomTrendActive from '@/assets/icons/trend-active.svg?raw';
import ICustomCalculate from '@/assets/icons/calculate.svg?raw';
import ICustomCalculateActive from '@/assets/icons/calculate-active.svg?raw';
import ICustomAuthRole from '@/assets/icons/auth-role.svg?raw';
// import ICustomLogManagement from '@/assets/icons/log-management.svg?raw';
import ICustomAuditLog from '@/assets/icons/audit-log.svg?raw';
import ICustomIotdbConfig from '@/assets/icons/iotdb-config.svg?raw';
// import ICustomWhiteList from '@/assets/icons/white-list.svg?raw';
import ICustomVisualization from '@/assets/icons/visualization.svg?raw';
import ICustomVisualizationActive from '@/assets/icons/visualization-active.svg?raw';
import ICustomSpectrum from '@/assets/icons/spectrum.svg?raw';

const route = [
  {
    path: '/system',
    component: Layout,
    redirect: { name: 'UserManagement' },
    meta: {
      title: 'page.system',
      icon: ICustomSystemConfig,
      activeIcon: ICustomSystemConfigActive,
      order: 40,
      sqlDialect: 'all',
    },
    children: [
      {
        path: 'auth',
        redirect: { name: 'UserManagement' },
        meta: {
          title: 'page.auth',
          hideLine: true,
          icon: ICustomAuth,
          isAuthMenu: true,
          sqlDialect: 'all',
        },
        children: [
          {
            path: 'user',
            name: 'UserManagement',
            component: () => import('@/views/auth/user-detail.vue'),
            meta: {
              keepAlive: true,
              title: 'page.user',
              icon: ICustomAuthUser,
              isAuthMenu: true,
            },
          },
          {
            path: 'table-user',
            name: 'TableUserManagement',
            component: () => import('@/views/auth/table-user-detail.vue'),
            meta: {
              sqlDialect: 'table',
              keepAlive: true,
              title: 'page.user',
              icon: ICustomAuthUser,
              isAuthMenu: true,
            },
          },
          {
            path: 'role',
            name: 'RoleManagement',
            component: () => import('@/views/auth/role-detail.vue'),
            meta: {
              keepAlive: true,
              title: 'page.role',
              icon: ICustomAuthRole,
              isAuthMenu: true,
            },
          },
          {
            path: 'table-role',
            name: 'TableRoleManagement',
            component: () => import('@/views/auth/table-role-detail.vue'),
            meta: {
              sqlDialect: 'table',
              keepAlive: true,
              title: 'page.role',
              icon: ICustomAuthRole,
              isAuthMenu: true,
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
        component: () => import('@/views/log-management/the-audit.vue'),
        meta: {
          keepAlive: true,
          title: 'page.auditLog',
          icon: ICustomAuditLog,
        },
      },
      {
        path: 'config',
        name: 'IoTDBConfig',
        component: () => import('@/views/iotdb-config/iotdb-config.vue'),
        meta: {
          keepAlive: true,
          title: 'page.config',
          icon: ICustomIotdbConfig,
          needVersion: '1.3.3',
        },
      },
      // {
      //   path: 'white-list',
      //   name: 'WhiteList',
      //   component: () => import('@/views/white-list/white-list.vue'),
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
      title: 'page.visualization',
      icon: ICustomVisualization,
      activeIcon: ICustomVisualizationActive,
      showTopLine: true,
      order: 25,
      sqlDialect: 'all',
    },
    children: [
      {
        path: 'table-running-trend',
        name: 'TableRunningTrend',
        component: () => import('@/views/data-trend/table-running-trend.vue'),
        meta: {
          sqlDialect: 'table',
          keepAlive: true,
          title: 'page.runningTrend',
          icon: ICustomTrend,
        },
      },
      {
        path: 'table-history-trend',
        name: 'TableHistoryTrend',
        component: () => import('@/views/data-trend/table-history-trend.vue'),
        meta: {
          sqlDialect: 'table',
          keepAlive: true,
          title: 'page.historyTrend',
          icon: ICustomTrend,
        },
      },
      {
        path: 'tree-running-trend',
        name: 'TreeRunningTrend',
        component: () => import('@/views/data-trend/tree-running-trend.vue'),
        meta: {
          keepAlive: true,
          title: 'page.runningTrend',
          icon: ICustomTrend,
        },
      },
      {
        path: 'tree-history-trend',
        name: 'TreeHistoryTrend',
        component: () => import('@/views/data-trend/tree-history-trend.vue'),
        meta: {
          keepAlive: true,
          title: 'page.historyTrend',
          icon: ICustomTrend,
        },
      },
      {
        path: 'detail',
        name: 'TrendDetail',
        component: () => import('@/views/data-trend/trend-detail.vue'),
        meta: {
          keepAlive: true,
          title: 'page.trend',
          icon: ICustomTrend,
        },
      },
      // {
      //   path: 'table-detail',
      //   name: 'TableTrendDetail',
      //   component: () => import('@/views/data-trend/table-trend-detail.vue'),
      //   meta: {
      //     sqlDialect: 'table',
      //     keepAlive: true,
      //     title: 'page.trend',
      //     icon: ICustomTrend,
      //   },
      // },
      {
        path: 'spectrum',
        name: 'SpectrumDetail',
        component: () => import('@/views/data-spectrum/the-spectrum.vue'),
        meta: {
          keepAlive: true,
          title: 'page.spectrum',
          icon: ICustomSpectrum,
        },
      },
    ],
  },
  {
    path: '/calculate',
    component: Layout,
    redirect: { name: 'CalculateDetail' },
    meta: {
      title: 'page.calculate',
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
        component: () => import('@/views/calculate/the-calculate.vue'),
        meta: { keepAlive: true },
      },
    ],
  },
  {
    path: '/calculate',
    component: Layout,
    redirect: { name: 'CalculateDetail' },
    meta: {
      title: 'page.view',
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
        component: () => import('@/views/calculate/the-calculate.vue'),
        meta: { keepAlive: true },
      },
    ],
  },
];

export default route;
