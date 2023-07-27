import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomMeasurement from '@/assets/icons/measurement.svg?raw';
import ICustomMeasurementActive from '@/assets/icons/measurement-active.svg?raw';

const route = [
  {
    path: '/measurement-management',
    component: Layout,
    redirect: { name: 'MeasurementManagement' },
    meta: {
      title: '测点管理',
      icon: ICustomMeasurement,
      activeIcon: ICustomMeasurementActive,
    },
    children: [
      {
        path: 'list',
        name: 'MeasurementManagement',
        component: () => import('@/views/measurement-management/measurement-management.vue'),
        meta: { keepAlive: true },
      },
    ],
  },
];

export default route;
