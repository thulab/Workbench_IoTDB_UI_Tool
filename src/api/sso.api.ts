import http from '@/utils/http';

class SSOApi {
  static getLoginInfo(): HttpResponseP<{ name: string; id: string; urls: Record<string, string> }> {
    return http.get('/user/get');
  }

  static enabledSSO(): HttpResponseP<boolean> {
    return http.get('/sso/enabledSSO');
  }

  static isLogin(): HttpResponseP<boolean> {
    return http.get('/sso/isLogin');
  }

  static doLoginByTicket(ticket: string):HttpResponseP<string> {
    return http.post('/sso/doLoginByTicket', { ticket });
  }

  static getSsoAuthUrl(): HttpResponseP<string> {
    return http.get('/sso/getSsoAuthUrl', { params: { clientLoginUrl: window.location.href } });
  }

  static logout(): HttpResponseP<boolean> {
    return http.get('/sso/logout');
  }
}

export default SSOApi;
