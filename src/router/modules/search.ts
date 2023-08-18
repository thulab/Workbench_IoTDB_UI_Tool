import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomQueryData from '@/assets/icons/query-data.svg?raw';
import ICustomQuerySQL from '@/assets/icons/query-sql.svg?raw';
import ICustomQuery from '@/assets/icons/query.svg?raw';
import ICustomQueryActive from '@/assets/icons/query-active.svg?raw';
import ICustomQueryStatistic from '@/assets/icons/query-statistic.svg?raw';

const route = [
  {
    path: '/search',
    component: Layout,
    redirect: { name: 'DataSearch' },
    meta: {
      title: '查询',
      icon: ICustomQuery,
      activeIcon: ICustomQueryActive,
      order: 20,
    },
    children: [
      {
        path: 'data-search',
        name: 'DataSearch',
        component: () => import('@/views/search/data-search.vue'),
        meta: { keepAlive: true, title: '数据查询', icon: ICustomQueryData },
      },
      {
        path: 'statistic-search',
        name: 'StatisticSearch',
        component: () => import('@/views/search/statistic-search.vue'),
        meta: { keepAlive: true, title: '统计查询', icon: ICustomQueryStatistic },
      },
      {
        path: 'sql-search',
        name: 'SqlSearch',
        component: () => import('@/views/search/sql-search-container.vue'),
        meta: { keepAlive: true, title: 'SQL操作', icon: ICustomQuerySQL },
      },
    ],
  },
];

export default route;
