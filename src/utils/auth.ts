/**
 * 逐级查找权限，直到找到权限或者到达根节点
 * @param path 路径
 * @param dataPrivilegeMap
 * @returns
 */

export const getPathAuthList = (path: string, dataPrivilegeMap: Array<{ path: string; privileges: string[] }> | null | undefined, level: number = 0): string[] => {
  if (!dataPrivilegeMap) return [];
  const pathData = dataPrivilegeMap.find((item) => level === 0 && item.path === path);
  if (pathData) return pathData.privileges;
  if (path === 'root') return [];
  path = path.substring(0, path.lastIndexOf('.'));
  const pathVagueData = dataPrivilegeMap.find((item) => item.path === `${path}.**`);
  if (pathVagueData) return pathVagueData.privileges;
  return getPathAuthList(path, dataPrivilegeMap, level + 1);
};

export const getParentPathAuthList = (path: string, dataPrivilegeMap: Array<{ path: string; privileges: string[] }> | null | undefined, level: number = 0): string[] => {
  if (!dataPrivilegeMap) return [];
  const pathData = dataPrivilegeMap.find((item) => level === 0 && (item.path === path || item.path === `${path}.**`));
  if (pathData) return pathData.privileges;
  if (path === 'root') return [];
  path = path.substring(0, path.lastIndexOf('.'));
  const pathVagueData = dataPrivilegeMap.find((item) => item.path === `${path}.**`);
  if (pathVagueData) return pathVagueData.privileges;
  return getParentPathAuthList(path, dataPrivilegeMap, level + 1);
};

const splitVersion = (version: string) => {
  if (version.indexOf('-') > -1) {
    return version.split('-')[0]!.split('.');
  }
  return version.split('.');
};

// 1.2.3及以上版本布置权限最新版
export const iotdbShowAuth = (version?: string, controlVersion: string = '1.2.3') => {
  const iotdbVersion = version || window.sessionStorage.getItem('iotdbVersion') || '';
  const versionArr = splitVersion(iotdbVersion) || [];
  const controlVersionArr = splitVersion(controlVersion) || [];
  if (versionArr.length && controlVersionArr.length) {
    const [majorStr, minorStr, releaseStr, minorReleaseStr] = versionArr;
    const [majorControlStr, minorControlStr, releaseControlStr, minorReleaseControlStr] = controlVersionArr;
    const major = +majorStr!; // 主版本
    const minor = +minorStr!; // 次版本
    const release = +releaseStr!; // 修订版本
    if (major > +majorControlStr!) return true;
    if (major === +majorControlStr! && minor > +minorControlStr!) return true;
    if (minorReleaseControlStr) {
      if (minorReleaseStr) {
        if ((major === +majorControlStr! && minor === +minorControlStr! && release > +releaseControlStr!) || (release === +releaseControlStr! && +minorReleaseStr >= +minorReleaseControlStr!))
          return true;
      } else if (major === +majorControlStr! && minor === +minorControlStr! && release > +releaseControlStr!) {
        return true;
      }
    } else if (major === +majorControlStr! && minor >= +minorControlStr! && release >= +releaseControlStr!) return true;
    return false;
  }
  return false;
};

/**
 * 判断版本号的位数是否大于3
 * @param {string} version 版本号字符串（如 "1.2.3.4"）
 * @returns {boolean} 如果版本号位数大于3则返回true，否则返回false
 */
export const isVersionMoreThanThreeDigits = (version: string) => {
  const parts = version.split('.');
  return parts.length > 3;
};

export default { getPathAuthList };
