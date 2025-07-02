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
  static upsertDatabase(data: { ttl: string; ttlUnit: string; database?: string; tableName?: string }): HttpResponseP<{ sql: string }> {
    return http.post('/relational/schema/upsertDatabaseTTL', { ...data, ttlUnit: 'millisecond' });
  }

  //  数据库信息
  static getDatabaseInfo(database: string): HttpResponseP<IoTDB.DatabaseInfoRes> {
    return http.get('/relational/schema/getDatabaseInfo', { params: { database } });
  }

  static getTableList(database: string): HttpResponseP<IoTDB.TableRes> {
    return http.post('/relational/schema/getTablesInfo', { database });
  }

  static getColumnsList(database: string, tableName: string): HttpResponseP<IoTDB.ColumnRes> {
    return http.post('/relational/schema/getColumnsInfo', { database, tableName });
  }

  // 删除数据库
  static deleteDatabase(database: string): HttpResponseP {
    return http.delete('/relational/schema/deleteDatabase', { params: { database } });
  }

  // 删除表
  static deleteTables(database: string, tables: string[]): HttpResponseP {
    return http.post('/relational/schema/deleteTables', { database, tables });
  }

  // 创建表
  static saveTable(payload: IoTDB.Database): HttpResponseP<number> {
    return http.post('/relational/schema/saveTable', payload);
  }

  // 创建列
  static saveColumns(payload: IoTDB.Database): HttpResponseP<number> {
    return http.post('/relational/schema/saveColumns', payload);
  }

  // 删除列
  static deleteColumns(payload: IoTDB.DatabasePostData): HttpResponseP<number> {
    return http.post('/relational/schema/deleteColumns', payload);
  }

  static alterComment(data: { database: string; tableName: string; tableComment?: string; columnName?: string; columnComment?: string }): HttpResponseP<{ sql: string }> {
    return http.post('/relational/schema/alterComment', data);
  }

  // 导入表数据
  static importTableData(data: FormData, fileType: string = 'csv'): HttpResponseP<StorageDevice.ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importTableDataCSVData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importTableDataExcelData', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出表数据
  static exportTableData(data: Record<string, string | number | Date | null> & PageQuery): HttpResponseP {
    return http.post('/file/tableDataExportId', data);
  }

  // 导入列
  static importColumns(data: FormData, fileType: string = 'csv'): HttpResponseP<StorageDevice.ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importMeasurementCSVData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importMeasurementExcelData', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出列
  static exportColumns(data: Record<string, string | number | Date | null> & PageQuery): HttpResponseP {
    return http.post('/file/measurementDataExportId', data);
  }

  static importTables(data: FormData, fileType: string = 'csv'): HttpResponseP<StorageDevice.ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importCsvTableColumnTable', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importExcelTableColumnTable', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出表
  static exportTableId(data: Record<string, string | number | Date | null> & PageQuery): HttpResponseP {
    return http.post('/file/exportTableColumnTableId', data);
  }
}
export default IoTDBApi;
