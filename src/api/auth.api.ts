import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';
import type { AuthByRoleRes, UpdateAuthByRole, UpdateRoleUsers, DBUser, UserAuthInfo, UserPrivileges } from '@/types';

class AuthApi {
  // 角色列表
  static getRoleList(): globalThis.HttpResponseP<string[]> {
    return http.get('/privileges/getRoles');
  }

  // 删除角色
  static deleteRole(roleName: string): globalThis.HttpResponseP {
    return http.delete('/privileges/deleteRole', { params: { roleName } });
  }

  // 保存角色
  static saveRole(roleName: string): globalThis.HttpResponseP {
    return http.post('/privileges/createRole', null, { params: { roleName } });
  }

  // 查询角色绑定的所有用户名
  static getUserNamesByRoleName(roleName: string): globalThis.HttpResponseP<string[]> {
    return http.get('/privileges/getUserNamesByRoleName', { params: { roleName } });
  }

  // 根据角色查询权限
  static getAuthByRole(roleName: string): globalThis.HttpResponseP<AuthByRoleRes> {
    return http.get('/privileges/getPrivilegesByRoleName', { params: { roleName } });
  }

  // 根据角色更新权限
  static updateAuthByRole(data: UpdateAuthByRole): globalThis.HttpResponseP {
    return http.post('/privileges/upsertPrivilegesByRoleName', data);
  }

  // 更新角色关联用户集合
  static updateRoleWithUsers(data: UpdateRoleUsers): globalThis.HttpResponseP {
    return http.post('/privileges/relateRoleWithUsers', data);
  }

  // 用户列表
  static getUserList(): globalThis.HttpResponseP<DBUser[]> {
    return http.get('/privileges/getUsers');
  }

  // 删除用户
  static deleteUser(userName: string): globalThis.HttpResponseP {
    return http.delete('/privileges/deleteUser', { params: { userName } });
  }

  // 新建用户
  static addUser(name: string, password: string): globalThis.HttpResponseP {
    return http.post('/privileges/createUser', { name, password: encodeAES(password) });
  }

  // 更新用户
  static updateUser(name: string, rawPassword: string, password: string): globalThis.HttpResponseP {
    return http.post('/privileges/updateUser', { name, rawPassword: encodeAES(rawPassword), password: encodeAES(password) });
  }

  // 根据用户查询权限
  static getUserAuth(userName: string): globalThis.HttpResponseP<UserPrivileges> {
    return http.get('/privileges/getPrivilegesByUserName', { params: { userName } });
  }

  // 更新用户权限
  static updateUserAuth(data: UserAuthInfo): globalThis.HttpResponseP {
    return http.post('/privileges/upsertPrivilegesByUserName', data);
  }
}
export default AuthApi;
