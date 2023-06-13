import {
  AES, mode, pad, enc,
} from 'crypto-js';

export const encodeAES = (data?: string, key = 'a=cd;fg.ijklmnop8rstu5wx*z12==56') => {
  if (!data) return '';
  const encrypted = AES.encrypt(data, enc.Utf8.parse(key), {
    mode: mode.ECB,
    pad: pad.Pkcs7,
  });
  // 这里的encrypted不是字符串，而是一个CipherParams对象
  return encrypted.ciphertext.toString(enc.Base64);
};
export default { encodeAES };
