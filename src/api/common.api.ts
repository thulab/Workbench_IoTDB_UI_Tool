import http from '@/utils/http';

export default class CommonApi {
  /**
   *
   * @param intention security-安全认证;login-登录;googleAuth-开启google;cancelGoogleAuth-解绑google
   * @returns
   */
  static sendSms(intention: 'security' | 'login' | 'googleAuth' | 'cancelGoogleAuth' | string): HttpResponseP {
    return http.get(`/verification/sendSms/${intention}`);
  }

  // 上传图片
  static uploadImage(data: FormData): HttpResponseP {
    return http.post('/upload/image', data);
  }
}
