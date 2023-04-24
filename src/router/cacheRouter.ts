import type { RouteRecordRaw, RouteRecordName } from 'vue-router';
import { asyncRoutes } from '@/router';

// * 过滤需要缓存的路由
const cacheRouter: any[] = [];
const filterKeepAlive = (_route: RouteRecordRaw[], _cache: RouteRecordName[]): void => {
  _route.forEach((item) => {
    if (item.meta?.keepAlive && item.name) {
      _cache.push(item.name);
    }
    if (item.children && item.children.length !== 0) {
      filterKeepAlive(item.children, _cache);
    }
  });
};

filterKeepAlive(asyncRoutes, cacheRouter);

export default cacheRouter;
