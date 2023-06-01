import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomStorage from '@/assets/icons/storage.svg?raw';
import ICustomStorageActive from '@/assets/icons/storage-active.svg?raw';

const route = [
  {
    path: '/',
    component: Layout,
    redirect: { name: 'MeasurementManagement' },
    meta: {
      title: '测点管理',
      icon: ICustomStorage,
      activeIcon: ICustomStorageActive,
      order: 10,
    },
    children: [
      {
        path: 'measurement-management',
        name: 'MeasurementManagement',
        component: () => import('@/views/measurement-management/measurement-management.vue'),
        meta: { keepAlive: true },
      },
    ],
  },
];

export default route;
