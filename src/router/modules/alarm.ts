import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomQueryData from '@/assets/icons/query-data.svg?raw';
import ICustomQuerySQL from '@/assets/icons/query-sql.svg?raw';
import ICustomQuery from '@/assets/icons/query.svg?raw';
import ICustomQueryActive from '~icons/custom/query-active.svg?raw';

const route = [
  {
    path: '/alarm',
    component: Layout,
    redirect: { name: 'AlarmConfig' },
    meta: {
      title: '告警管理',
      icon: ICustomQuery,
      activeIcon: ICustomQueryActive,
    },
    children: [
      {
        path: 'config',
        name: 'AlarmConfig',
        component: () => import('@/views/alarm/alarm-config.vue'),
        meta: { keepAlive: true, title: '告警配置', icon: ICustomQueryData },
      },
      {
        path: 'record',
        name: 'AlarmRecord',
        component: () => import('@/views/alarm/alarm-record.vue'),
        meta: { keepAlive: true, title: '告警记录', icon: ICustomQuerySQL },
      },
    ],
  },
];

export default route;
