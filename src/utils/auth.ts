/**
 * 逐级查找权限，直到找到权限或者到达根节点
 * @param path 路径
 * @param dataPrivilegeLMap
 * @returns
 */

export const getPathAuthList = (path: string, dataPrivilegeLMap: Array<{ path: string, privileges: string[] }> | null | undefined, level: number = 0): string[] => {
  if (!dataPrivilegeLMap) return [];
  const pathData = dataPrivilegeLMap.find((item) => level === 0 && item.path === path);
  if (pathData) return pathData.privileges;
  if (path === 'root') return [];
  path = path.substring(0, path.lastIndexOf('.'));
  const pathVagueData = dataPrivilegeLMap.find((item) => item.path === `${path}.**`);
  if (pathVagueData) return pathVagueData.privileges;
  return getPathAuthList(path, dataPrivilegeLMap, level + 1);
};

export const getParentPathAuthList = (path: string, dataPrivilegeLMap: Array<{ path: string, privileges: string[] }> | null | undefined, level: number = 0): string[] => {
  if (!dataPrivilegeLMap) return [];
  const pathData = dataPrivilegeLMap.find((item) => level === 0 && (item.path === path || item.path === `${path}.**`));
  if (pathData) return pathData.privileges;
  if (path === 'root') return [];
  path = path.substring(0, path.lastIndexOf('.'));
  const pathVagueData = dataPrivilegeLMap.find((item) => item.path === `${path}.**`);
  if (pathVagueData) return pathVagueData.privileges;
  return getParentPathAuthList(path, dataPrivilegeLMap, level + 1);
};

export default { getPathAuthList };
