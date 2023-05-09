import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomQueryData from '@/assets/icons/query-data.svg?raw';
import ICustomQuerySQL from '@/assets/icons/query-sql.svg?raw';
import ICustomQuery from '@/assets/icons/query.svg?raw';
import ICustomQueryActive from '~icons/custom/query-active.svg?raw';

const route = [
  {
    path: '/search',
    component: Layout,
    redirect: { name: 'DataSearch' },
    meta: {
      title: '查询',
      icon: ICustomQuery,
      activeIcon: ICustomQueryActive,
    },
    children: [
      {
        path: 'data-search',
        name: 'DataSearch',
        component: () => import('@/views/search/data-search.vue'),
        meta: { keepAlive: true, title: '数据查询', icon: ICustomQueryData },
        // props: (route) => ({ serverId: route.query.serverId }),
      },
      {
        path: 'sql-search',
        name: 'SqlSearch',
        component: () => import('@/views/search/sql-search-container.vue'),
        meta: { keepAlive: true, title: 'SQL查询', icon: ICustomQuerySQL },
        // props: (route) => ({ serverId: route.query.serverId, queryId: route.query.queryId }),
      },
    ],
  },
];

export default route;
