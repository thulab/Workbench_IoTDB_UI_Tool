import NProgress from '@/config/nprogress-config';
import { HOME_URL } from '@/config/app-config';
import useAppStore from '@/stores/app';
import useMenuStore from '@/stores/menu';
import type { Router } from 'vue-router';

/**
 * 使用递归处理路由菜单
 * @param newArr 所有菜单数组
 */
export function handleRouter(routerList: MenuOptions[], newArr: string[] = []) {
  routerList.forEach((item: MenuOptions) => {
    if (typeof item === 'object' && item.path) {
      newArr.push(item.path);
    }
    if (item.children && item.children.length !== 0) {
      handleRouter(item.children, newArr);
    }
  });
  return newArr;
}

export function registerGuard(router: Router) {
  // * 路由拦截
  router.beforeEach((to, from, next) => {
    // console.time('页面载入时间');
    NProgress.start();
    useAppStore().routerViewLoading = true;
    // * 判断当前路由是否需要访问权限
    if (!to.matched.some((record) => record.meta.requiresAuth)) return next();

    const menuStore = useMenuStore();
    const dynamicRouter = handleRouter(menuStore.menuList);
    // * Static Router(静态路由，必须配置首页地址，否则不能进首页)
    const staticRouter = [HOME_URL, '/view/403'];
    const routerList = dynamicRouter.concat(staticRouter);

    // * 如果访问的地址没有在路由表中重定向到403页面
    if (routerList.indexOf(to.path) !== -1) return next();
    return next({
      path: '/view/403',
    });
  });

  router.afterEach(() => {
    // console.timeEnd('页面载入时间');
    useAppStore().routerViewLoading = false;
    NProgress.done();
  });
}
