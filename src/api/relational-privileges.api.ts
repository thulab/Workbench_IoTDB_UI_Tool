import type { DataPrivilegeVo, IoTDBUserVo, SinglePrivilegeVo, UpdateGlobalPrivilegeAo, RelateUserWithRolesAo, UpdateDataPrivilegeAo } from '@/types/relational-privileges';
import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';

class RelationalPrivilegesApi {
  static basePath = 'relational/privileges';

  /**
   *
   * @summary 新建角色
   * @param {string} roleName 角色名

   * @throws {RequiredError}
   */
  static createRole(roleName: string): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/createRole`, undefined, { params: { roleName } });
  }

  /**
   *
   * @summary 新建用户
   * @param {IoTDBUserAo} [ioTdbUserAo]

   * @throws {RequiredError}
   */
  static createUser(name: string, password: string): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/createUser`, { name, password: encodeAES(password) });
  }

  /**
   *
   * @summary 删除角色
   * @param {string} roleName 角色名

   * @throws {RequiredError}
   */
  static deleteRole(roleName: string): globalThis.HttpResponseP {
    return http.delete(`${RelationalPrivilegesApi.basePath}/deleteRole`, { params: { roleName } });
  }

  /**
   *
   * @summary 删除用户
   * @param {string} userName 用户名

   * @throws {RequiredError}
   */
  static deleteUser(userName: string): globalThis.HttpResponseP {
    return http.delete(`${RelationalPrivilegesApi.basePath}/deleteUser`, { params: { userName } });
  }

  /**
   *
   * @summary 根据角色名获取数据权限
   * @param {string} roleName  角色名

   * @throws {RequiredError}
   */
  static getDataPrivilegesByRoleName(roleName: string): globalThis.HttpResponseP<DataPrivilegeVo[]> {
    return http.get(`${RelationalPrivilegesApi.basePath}/getDataPrivilegesByRoleName`, { params: { roleName } });
  }

  /**
   *
   * @summary 根据用户名获取数据权限
   * @param {string} userName 用户名

   * @throws {RequiredError}
   */
  static getDataPrivilegesByUserName(userName: string): globalThis.HttpResponseP<DataPrivilegeVo[]> {
    return http.get(`${RelationalPrivilegesApi.basePath}/getDataPrivilegesByUserName`, { params: { userName } });
  }

  /**
   *
   * @summary 根据角色名获取全局权限
   * @param {string} roleName 角色名

   * @throws {RequiredError}
   */
  static getGlobalPrivilegesByRoleName(roleName: string): globalThis.HttpResponseP<SinglePrivilegeVo[]> {
    return http.get(`${RelationalPrivilegesApi.basePath}/getGlobalPrivilegesByRoleName`, { params: { roleName } });
  }

  /**
   *
   * @summary 根据用户名获取全局权限
   * @param {string} userName 用户名

   * @throws {RequiredError}
   */
  static getGlobalPrivilegesByUserName(userName: string): globalThis.HttpResponseP<SinglePrivilegeVo[]> {
    return http.get(`${RelationalPrivilegesApi.basePath}/getGlobalPrivilegesByUserName`, { params: { userName } });
  }

  /**
   *
   * @summary 获取所有iotdb角色

   * @throws {RequiredError}
   */
  static getRoles(): globalThis.HttpResponseP<string[]> {
    return http.get(`${RelationalPrivilegesApi.basePath}/getRoles`);
  }

  /**
   *
   * @summary 获取所有iotdb用户

   * @throws {RequiredError}
   */
  static getUsers(): globalThis.HttpResponseP<IoTDBUserVo[]> {
    return http.get(`${RelationalPrivilegesApi.basePath}/getUsers`);
  }

  /**
   *
   * @summary 获取用户关联的所有角色名
   * @param {string} userName 用户名

   * @throws {RequiredError}
   */
  static getRoleNamesByUserName(userName: string): globalThis.HttpResponseP<string[]> {
    return http.get(`${RelationalPrivilegesApi.basePath}/getRoleNamesByUserName`, { params: { userName } });
  }

  /**
   *
   * @summary 获取角色绑定的所有用户名
   * @param {string} roleName 角色名

   * @throws {RequiredError}
   */
  static getUserNamesByRoleName(roleName: string): globalThis.HttpResponseP<string[]> {
    return http.get(`${RelationalPrivilegesApi.basePath}/getUserNamesByRoleName`, { params: { roleName } });
  }

  /**
   *
   * @summary 授予角色全局权限
   * @param {UpdateGlobalPrivilegeAo} [updateGlobalPrivilegeAo]

   * @throws {RequiredError}
   */
  static grantGlobalPrivilegeToRole(updateGlobalPrivilegeAo?: UpdateGlobalPrivilegeAo): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/grantGlobalPrivilegeToRole`, updateGlobalPrivilegeAo);
  }

  /**
   *
   * @summary 授予用户全局权限
   * @param {UpdateGlobalPrivilegeAo} [updateGlobalPrivilegeAo]

   * @throws {RequiredError}
   */
  static grantGlobalPrivilegeToUser(updateGlobalPrivilegeAo?: UpdateGlobalPrivilegeAo): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/grantGlobalPrivilegeToUser`, updateGlobalPrivilegeAo);
  }

  /**
   *
   * @summary 赋予用户角色
   * @param {RelateUserWithRolesAo} [relateUserWithRolesAo]

   * @throws {RequiredError}
   */
  static grantRolesToUser(relateUserWithRolesAo?: RelateUserWithRolesAo): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/grantRolesToUser`, relateUserWithRolesAo);
  }

  /**
   *
   * @summary 撤销角色的全局权限
   * @param {UpdateGlobalPrivilegeAo} [updateGlobalPrivilegeAo]

   * @throws {RequiredError}
   */
  static revokeGlobalPrivilegeFromRole(updateGlobalPrivilegeAo?: UpdateGlobalPrivilegeAo): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/revokeGlobalPrivilegeFromRole`, updateGlobalPrivilegeAo);
  }

  /**
   *
   * @summary 撤销用户的全局权限
   * @param {UpdateGlobalPrivilegeAo} [updateGlobalPrivilegeAo]

   * @throws {RequiredError}
   */
  static revokeGlobalPrivilegeFromUser(updateGlobalPrivilegeAo?: UpdateGlobalPrivilegeAo): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/revokeGlobalPrivilegeFromUser`, updateGlobalPrivilegeAo);
  }

  /**
   *
   * @summary 移除用户角色
   * @param {RelateUserWithRolesAo} [relateUserWithRolesAo]

   * @throws {RequiredError}
   */
  static revokeRoleFromUser(relateUserWithRolesAo?: RelateUserWithRolesAo): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/revokeRoleFromUser`, relateUserWithRolesAo);
  }

  /**
   *
   * @summary 授予/撤销角色的数据权限
   * @param {UpdateDataPrivilegeAo} [updateDataPrivilegeAo]

   * @throws {RequiredError}
   */
  static updateDataPrivilegeByRoleName(updateDataPrivilegeAo?: UpdateDataPrivilegeAo): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/updateDataPrivilegeByRoleName`, updateDataPrivilegeAo);
  }

  /**
   *
   * @summary 授予/撤销用户的数据权限
   * @param {UpdateDataPrivilegeAo} [updateDataPrivilegeAo]

   * @throws {RequiredError}
   */
  static updateDataPrivilegeByUserName(updateDataPrivilegeAo?: UpdateDataPrivilegeAo): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/updateDataPrivilegeByUserName`, updateDataPrivilegeAo);
  }

  /**
   *
   * @summary 编辑用户
   * @param {IoTDBUserAo} [ioTdbUserAo]

   * @throws {RequiredError}
   */
  static updateUser(name: string, rawPassword: string, password: string): globalThis.HttpResponseP {
    return http.post(`${RelationalPrivilegesApi.basePath}/updateUser`, { name, rawPassword: encodeAES(rawPassword), password: encodeAES(password) });
  }
}

export default RelationalPrivilegesApi;
