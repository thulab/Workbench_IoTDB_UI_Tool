import http from '@/utils/http';

// 数据库
class IoTDBApi {
  static getDatabases(): HttpResponseP<IoTDB.DatabaseRes> {
    return http.get('/relational/schema/getDatabases');
  }

  // 新增数据库
  static saveDatabase(database: string, ttl: string, ttlUnit: string): HttpResponseP {
    console.log('saveDatabase', database, ttl, ttlUnit);
    return http.post('/relational/schema/saveDatabase', { database, ttl, ttlUnit: 'millisecond' });
  }

  // 更新数据库
  static upsertDatabase(data: { ttl: string; ttlUnit: string; database?: string; tableName?: string }): HttpResponseP {
    return http.post('/relational/schema/upsertDatabaseTTL', { ...data, ttlUnit: 'millisecond' });
  }

  //  数据库信息
  static getDatabaseInfo(database: string): HttpResponseP<IoTDB.DatabaseInfoRes> {
    return http.get('/relational/schema/getDatabaseInfo', { params: { database } });
  }

  static getTableList(database: string): HttpResponseP<IoTDB.TableRes> {
    return http.post('/relational/schema/getTablesInfo', { database });
  }

  static deleteDatabase(database: string): HttpResponseP {
    return http.get('/relational/schema/deleteDatabase', { params: { database } });
  }

  static deleteTables(tables: string[]): HttpResponseP {
    return http.post('/relational/schema/deleteTable', tables);
  }

  // 创建表
  static saveTable(payload: IoTDB.Database): HttpResponseP<number> {
    return http.post('/relational/schema/saveTable', payload);
  }

  static alterComment(data: { database: string; tableName: string; tableComment?: string; columnName?: string; columnComment?: string }): HttpResponseP {
    return http.post('/relational/schema/alterComment', data);
  }
}
export default IoTDBApi;
