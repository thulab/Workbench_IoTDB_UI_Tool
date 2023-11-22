import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomDataSync from '@/assets/icons/data-sync.svg?raw';
import ICustomDataSyncActive from '@/assets/icons/data-sync-active.svg?raw';

const route = [
  {
    path: '/data-sync',
    component: Layout,
    redirect: { name: 'DataSync' },
    meta: {
      title: '数据同步',
      icon: ICustomDataSync,
      activeIcon: ICustomDataSyncActive,
      showTopLine: true,
      order: 35,
    },
    children: [
      {
        path: 'detail',
        name: 'DataSync',
        component: () => import('@/views/data-sync/detail.vue'),
        meta: { keepAlive: true, title: '数据同步', icon: ICustomDataSync },
      },
    ],
  },
];

export default route;
