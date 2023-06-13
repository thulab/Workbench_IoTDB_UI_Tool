import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';

class UserApi {
  // 获取枚举
  static login(user: string, password: string): HttpResponseP {
    return http.post('/login', { user, password: encodeAES(password) });
  }
}
export default UserApi;
