import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomAlarmConfig from '@/assets/icons/alarm-config.svg?raw';
import ICustomAlarmRecord from '@/assets/icons/alarm-record.svg?raw';
import ICustomAlarm from '@/assets/icons/alarm.svg?raw';
import ICustomAlarmActive from '~icons/custom/alarm-active.svg?raw';

const route = [
  {
    path: '/alarm',
    component: Layout,
    redirect: { name: 'AlarmConfig' },
    meta: {
      title: '告警',
      icon: ICustomAlarm,
      activeIcon: ICustomAlarmActive,
      order: 30,
    },
    children: [
      {
        path: 'config',
        name: 'AlarmConfig',
        component: () => import('@/views/alarm/alarm-config.vue'),
        meta: { keepAlive: true, title: '告警配置', icon: ICustomAlarmConfig },
      },
      {
        path: 'record',
        name: 'AlarmRecord',
        component: () => import('@/views/alarm/alarm-record.vue'),
        meta: { keepAlive: true, title: '告警记录', icon: ICustomAlarmRecord },
      },
    ],
  },
];

export default route;
