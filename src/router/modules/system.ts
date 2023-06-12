import { Layout } from '@/router/constant-routes';
// 采用raw加载svg文件，v-html渲染
import ICustomAlarmConfig from '@/assets/icons/alarm-config.svg?raw';
import ICustomAlarmRecord from '@/assets/icons/alarm-record.svg?raw';
import ICustomAlarm from '@/assets/icons/alarm.svg?raw';
import ICustomAlarmActive from '~icons/custom/alarm-active.svg?raw';

const route = [
  {
    path: '/system',
    component: Layout,
    redirect: { name: 'UserManagement' },
    meta: {
      title: '系统管理',
      icon: ICustomAlarm,
      activeIcon: ICustomAlarmActive,
      order: 40,
    },
    children: [
      {
        path: 'user',
        name: 'UserManagement',
        component: () => import('@/views/auth/user-detail.vue'),
        meta: { keepAlive: true, title: '用户管理', icon: ICustomAlarmConfig },
      },
      {
        path: 'role',
        name: 'RoleManagement',
        component: () => import('@/views/auth/role-detail.vue'),
        meta: { keepAlive: true, title: '角色管理', icon: ICustomAlarmRecord },
      },
    ],
  },
];

export default route;
