import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';

// 连接
class ConnectionApi {
  // 获取连接实例列表
  static getConnectionList(): HttpResponseP<Connection.ConnectionItem[]> {
    return http.get('/connection/getConnectionList');
  }

  // 获取连接实例详情
  static getConnectionDetail(id: number): HttpResponseP<Connection.ConnectionDetail> {
    return http.get('/connection/getConnectionById', { params: { id } });
  }

  // 删除连接实例
  static deleteConnection(id: number): HttpResponseP {
    return http.get('/connection/deleteConnectionById', { params: { id } });
  }

  // 保存更新连接实例
  static saveConnection(data: Connection.ConnectionDetail): HttpResponseP<number> {
    return http.post('/connection/saveOrUpdateConnection', { ...data, password: '' });
  }

  // 测试连接实例
  static testConnection(data: Connection.ConnectionDetail): HttpResponseP {
    return http.post('/connection/testConnection', { ...data, password: encodeAES(data.password) });
  }

  // 登录保存连接实例
  static loginByConnection(data: Connection.ConnectionDetail): HttpResponseP<number> {
    return http.post('/loginAndSave', { ...data, password: encodeAES(data.password) });
  }
}
export default ConnectionApi;
