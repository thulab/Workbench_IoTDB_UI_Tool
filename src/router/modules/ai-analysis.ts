import { Layout } from '@/router/constant-routes';
import ICustomModelManagement from '@/assets/icons/ai-model-management.svg?raw';
import ICustomAIAnalysis from '@/assets/icons/ai-analysis.svg?raw';

const route = [
  {
    path: '/ai-analysis',
    component: Layout,
    redirect: { name: 'AIAnalysis' },
    meta: {
      title: 'page.aiAnalysis',
      icon: ICustomAIAnalysis,
      activeIcon: ICustomAIAnalysis,
      order: 25,
      needVersion: '1.3.0',
      sqlDialect: 'table',
    },
    children: [
      {
        path: 'visualization',
        name: 'Visualization',
        component: () => import('@/views/ai-analysis/the-visualization.vue'),
        meta: { keepAlive: true, title: 'aiAnalysis.visualization', icon: ICustomAIAnalysis, sqlDialect: 'table' },
      },
      {
        path: 'model-management',
        name: 'ModelManagement',
        component: () => import('@/views/ai-analysis/model-management.vue'),
        meta: { keepAlive: true, title: 'aiAnalysis.modelManagement', icon: ICustomModelManagement, sqlDialect: 'table' },
      },
    ],
  },
];

export default route;
