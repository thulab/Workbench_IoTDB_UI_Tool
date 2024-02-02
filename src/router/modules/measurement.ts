import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomMeasurement from '@/assets/icons/measurement.svg?raw';
import ICustomMeasurementActive from '@/assets/icons/measurement-active.svg?raw';
import ICustomMeasurementList from '@/assets/icons/measurement-list.svg?raw';
import ICustomDataModel from '@/assets/icons/data-model.svg?raw';

const route = [
  {
    path: '/measurement-management',
    component: Layout,
    redirect: { name: 'MeasurementManagement' },
    meta: {
      title: 'page.measurement',
      icon: ICustomMeasurement,
      activeIcon: ICustomMeasurementActive,
      order: 10,
    },
    children: [
      {
        path: 'list',
        name: 'MeasurementManagement',
        component: () => import('@/views/measurement-management/measurement-management.vue'),
        meta: { keepAlive: true, title: 'measurement.measurementList', icon: ICustomMeasurementList },
      },
      {
        path: 'model',
        name: 'MeasurementModel',
        component: () => import('@/views/measurement-management/measurement-model.vue'),
        meta: { keepAlive: true, title: 'measurement.databaseModel', icon: ICustomDataModel },
      },
    ],
  },
];

export default route;
