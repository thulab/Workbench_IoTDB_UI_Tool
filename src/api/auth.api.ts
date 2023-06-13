import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';

class AuthApi {
  static resetPassword(oldPassword: string, newPassword: string): HttpResponseP {
    return http.post('/resetPassword', { oldPassword: encodeAES(oldPassword), newPassword: encodeAES(newPassword) });
  }
}
export default AuthApi;
