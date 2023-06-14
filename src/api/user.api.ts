import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';

class UserApi {
  // 登录
  static login(user: string, password: string): HttpResponseP {
    return http.post('/login', { user, password: encodeAES(password) });
  }

  // 退出登录
  static logout(): HttpResponseP {
    return http.get('/logout');
  }

  // 当前登录用户权限
  static getLoginUserPrivileges(): HttpResponseP<Auth.LoginUserPrivileges> {
    return http.get('/privileges/getLoginUserPrivileges');
  }

  // 权限配置项
  static getPrivilegesEnum(): HttpResponseP<Auth.PrivilegesEnum> {
    return http.get('/privileges/getPrivilegeConfig');
  }
}
export default UserApi;
