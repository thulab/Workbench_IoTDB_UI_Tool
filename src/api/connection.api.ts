import http from '@/utils/http';

// 连接
class ConnectionApi {
  // 获取连接实例列表
  static getConnectionList(): HttpResponseP<Connection.ConnectionItem[]> {
    return http.get('/connection/getConnectionList');
  }

  // 删除连接实例
  static deleteConnection(id: number): HttpResponseP {
    return http.delete('/connection/deleteConnectionById', { params: { id } });
  }
}
export default ConnectionApi;
