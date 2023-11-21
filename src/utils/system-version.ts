import { type RouteRecordRaw } from 'vue-router';

const appType = Number(import.meta.env.VITE_APP_TYPE);
export function getRouterByType(data: RouteRecordRaw[]) {
  const res = data.filter((i) => !i.meta?.appType || i.meta.appType === appType);
  res.forEach((item) => {
    if (item.children && item.children.length) {
      item.children = getRouterByType(item.children);
    }
  });
  return res;
}

export default { getRouterByType };
