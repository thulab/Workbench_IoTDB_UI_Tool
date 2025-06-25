import http from '@/utils/http';

// 数据库
class IoTDBApi {
  static getDatabases(): HttpResponseP<IoTDB.Database[]> {
    return http.get('/relational/schema/getDatabases');
  }
}
export default IoTDBApi;
