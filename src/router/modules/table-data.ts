import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomDataManage from '@/assets/icons/data-manage.svg?raw';
import ICustomDataManageActive from '@/assets/icons/data-manage-active.svg?raw';

const route = [
  {
    path: '/table-data',
    component: Layout,
    redirect: { name: 'DataManage' },
    meta: {
      title: 'page.dataManage',
      icon: ICustomDataManage,
      activeIcon: ICustomDataManageActive,
      showTopLine: true,
      order: 7,
      sqlDialect: 'table',
    },
    children: [
      {
        path: 'detail',
        name: 'DataManage',
        component: () => import('@/views/table-data/detail.vue'),
        meta: { keepAlive: true },
      },
    ],
  },
];

export default route;
