import http from '@/utils/http';

// 数据库
class IoTDBApi {
  static getDatabases(): HttpResponseP<IoTDB.DatabaseRes> {
    return http.get('/relational/schema/getDatabases');
  }

  // 新增数据库
  static saveDatabase(databasee: string, ttl: string, ttlUnit: string): HttpResponseP {
    return http.post('/relational/schema/saveDatabase', { params: { databasee, ttl, ttlUnit } });
  }

  // 更新数据库
  static upsertDatabase(params: { ttl: string; ttlUnit: string; database?: string; tableName?: string }): HttpResponseP {
    return http.post('/relational/schema/upsertDatabase', { params: { database: params.database, tableName: params.tableName, ttl: params.ttl, ttlUnit: params.ttlUnit } });
  }
}
export default IoTDBApi;
