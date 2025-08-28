import http from '@/utils/http';
import type { DatabaseRes, DatabaseInfoRes, TableRes, ColumnRes, Database, DatabasePostData, QueryDataByTableReq, ImportMeasurementDataRes } from '@/types';

// 数据库
class IoTDBApi {
  static getDatabases(): globalThis.HttpResponseP<DatabaseRes> {
    return http.get('/relational/schema/getDatabases');
  }

  // 新增数据库
  static saveDatabase(database: string, ttl: string, ttlUnit: string): globalThis.HttpResponseP {
    console.log('saveDatabase', database, ttl, ttlUnit);
    return http.post('/relational/schema/saveDatabase', { database, ttl, ttlUnit: 'millisecond' });
  }

  // 更新数据库
  static upsertDatabase(data: { ttl: string; ttlUnit: string; database?: string; tableName?: string }): globalThis.HttpResponseP<{ sql: string }> {
    return http.post('/relational/schema/upsertDatabaseTTL', { ...data, ttlUnit: 'millisecond' });
  }

  //  数据库信息
  static getDatabaseInfo(database: string): globalThis.HttpResponseP<DatabaseInfoRes> {
    return http.get('/relational/schema/getDatabaseInfo', { params: { database } });
  }

  static getTableList(database: string): globalThis.HttpResponseP<TableRes> {
    return http.post('/relational/schema/getTablesInfo', { database });
  }

  static getColumnsList(database: string, tableName: string): globalThis.HttpResponseP<ColumnRes> {
    return http.post('/relational/schema/getColumnsInfo', { database, tableName });
  }

  // 删除数据库
  static deleteDatabase(database: string): globalThis.HttpResponseP {
    return http.delete('/relational/schema/deleteDatabase', { params: { database } });
  }

  // 删除表
  static deleteTables(database: string, tables: string[]): globalThis.HttpResponseP {
    return http.post('/relational/schema/deleteTables', { database, tables });
  }

  // 创建表
  static saveTable(payload: Database): globalThis.HttpResponseP<number> {
    payload.tables[0]!.tableVO.ttlUnit = 'millisecond';
    return http.post('/relational/schema/saveTable', payload);
  }

  // 创建列
  static saveColumns(payload: Database): globalThis.HttpResponseP<number> {
    return http.post('/relational/schema/saveColumns', payload);
  }

  // 删除列
  static deleteColumns(payload: DatabasePostData): globalThis.HttpResponseP<number> {
    return http.post('/relational/schema/deleteColumns', payload);
  }

  static alterComment(data: { database: string; tableName: string; tableComment?: string; columnName?: string; columnComment?: string }): globalThis.HttpResponseP<{ sql: string }> {
    return http.post('/relational/schema/alterComment', data);
  }

  // 导入表数据
  static importTableData(data: FormData, fileType: string = 'csv'): globalThis.HttpResponseP<ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importCsvTableDataTable', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importExcelTableDataTable', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出表数据
  static exportTableDataId(data: QueryDataByTableReq): globalThis.HttpResponseP {
    return http.post('/file/exportTableDataTableId', data);
  }

  // 导入表/列
  static importTables(data: FormData, fileType: string = 'csv'): globalThis.HttpResponseP<ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importCsvTableColumnTable', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importExcelTableColumnTable', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出表/列
  static exportTableId(data: Record<string, string | number | Date | null | undefined> & globalThis.PageQuery): globalThis.HttpResponseP {
    return http.post('/file/exportTableColumnTableId', data);
  }
}
export default IoTDBApi;
