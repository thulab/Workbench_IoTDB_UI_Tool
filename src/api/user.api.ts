import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';
import type { ConnectionDetail, PrivilegesEnum, LoginUserPrivileges } from '@/types';

class UserApi {
  // 登录
  static login(user: string, password: string, id: number, model: string, useSsl: boolean, trustStorePassword: string, trustStoreFile?: File): globalThis.HttpResponseP {
    if (useSsl) {
      const form = new FormData();
      form.append('loginInfo', new Blob([JSON.stringify({ user, password: encodeAES(password), id, model, useSsl, trustStorePassword: encodeAES(trustStorePassword) })], { type: 'application/json' }));
      if (trustStoreFile) {
        form.append('trustStore', trustStoreFile, trustStoreFile.name);
      }
      return http.post('/login', form);
    } else {
      return http.post('/login', { user, password: encodeAES(password), id, model, useSsl: false });
    }
  }

  // 退出登录
  static logout(): globalThis.HttpResponseP {
    window.sessionStorage.setItem('nologin', '1');
    return http.get('/logout');
  }

  // 登录是否需要验证码
  static loginCaptcha(): globalThis.HttpResponseP<boolean> {
    return http.get('/verifiable');
  }

  // 当前登录用户权限
  static getLoginUserPrivileges(): globalThis.HttpResponseP<
    LoginUserPrivileges & {
      connection: ConnectionDetail;
      isMaster: boolean;
      isActive: boolean | null;
      model: 'tree' | 'table';
      slaveIsConnection: boolean;
    } & { version: string; slaveVersion: string }
  > {
    return http.get('/privileges/getLoginUserPrivileges');
  }

  // 权限配置项
  static getPrivilegesEnum(): globalThis.HttpResponseP<PrivilegesEnum> {
    return http.get('/privileges/getPrivilegeConfig');
  }
}
export default UserApi;
