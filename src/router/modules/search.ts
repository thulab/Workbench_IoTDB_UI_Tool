import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import Icon from '~icons/ep/set-up.svg?raw';

const route = [
  {
    path: '/search',
    component: Layout,
    redirect: { name: 'DataSearch' },
    meta: {
      title: '查询',
      icon: Icon,
    },
    children: [
      {
        path: 'data-search',
        name: 'DataSearch',
        component: () => import('@/views/search/data-search.vue'),
        meta: { keepAlive: true, title: '数据查询', icon: Icon, },
        // props: (route) => ({ serverId: route.query.serverId }),
      },
      {
        path: 'sql-search',
        name: 'SqlSearch',
        component: () => import('@/views/search/sql-search.vue'),
        meta: { keepAlive: true, title: 'SQL查询', icon: Icon, },
        // props: (route) => ({ serverId: route.query.serverId, queryId: route.query.queryId }),
      },
    ],
  },
];

export default route;
