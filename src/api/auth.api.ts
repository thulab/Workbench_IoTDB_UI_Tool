import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';

class AuthApi {
  static resetPassword(oldPassword: string, newPassword: string): HttpResponseP {
    return http.post('/resetPassword', { oldPassword: encodeAES(oldPassword), newPassword: encodeAES(newPassword) });
  }

  // 角色列表
  static getRoleList(): HttpResponseP<string[]> {
    return http.get('/privileges/getRoles');
  }

  // 删除角色
  static deleteRole(roleName: string): HttpResponseP {
    return http.delete('/privileges/deleteRole', { params: { roleName } });
  }

  // 保存角色
  static saveRole(roleName: string): HttpResponseP {
    return http.post('/privileges/createRole', null, { params: { roleName } });
  }

  // 根据角色查询权限
  static getAuthByRole(roleName: string): HttpResponseP {
    return http.get('/privileges/getPrivilegesByRoleName', { params: { roleName } });
  }

  // 根据角色更新权限
  static updateAuthByRole(data: Record<string, string | string[]>): HttpResponseP {
    return http.post('/privileges/upsertPrivilegesByRoleName', data);
  }
}
export default AuthApi;
