import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomAlarmConfig from '@/assets/icons/alarm-config.svg?raw';
import ICustomAlarmRecord from '@/assets/icons/alarm-record.svg?raw';
import ICustomAlarm from '@/assets/icons/alarm.svg?raw';
import ICustomAlarmActive from '@/assets/icons/alarm-active.svg?raw';
import i18n from '@/locale/index';

const { t } = i18n.global;

const route = [
  {
    path: '/alarm',
    component: Layout,
    redirect: { name: 'AlarmConfig' },
    meta: {
      title: t('page.alarm'),
      icon: ICustomAlarm,
      activeIcon: ICustomAlarmActive,
      order: 30,
      appType: 1,
    },
    children: [
      {
        path: 'config',
        name: 'AlarmConfig',
        component: () => import('@/views/alarm/alarm-config.vue'),
        meta: { keepAlive: true, title: t('alarm.alarmConfig'), icon: ICustomAlarmConfig },
      },
      {
        path: 'record',
        name: 'AlarmRecord',
        component: () => import('@/views/alarm/alarm-record.vue'),
        meta: { keepAlive: true, title: t('alarm.alarmRecord'), icon: ICustomAlarmRecord },
      },
    ],
  },
];

export default route;
