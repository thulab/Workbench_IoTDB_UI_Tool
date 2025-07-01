import http from '@/utils/http';

// 表模型数据
class TableDataApi {
  static getTableData(data: IoTDB.QueryDataByTableReq, controller?: AbortController): HttpResponseP<{ sql: string; value: Search.QueryDataResult }> {
    return http.post('/relational/data/getDataByTableInfo', data, { signal: controller?.signal });
  }

  static deleteTableData(data: IoTDB.DeleteTableDataReq): HttpResponseP<{ sql: string }> {
    return http.post('/relational/data/deleteDataInfo', data);
  }

  static insertTableData(data: IoTDB.InsertTableDataReq): HttpResponseP<{ sql: string }> {
    return http.post('/relational/data/saveDataInfo', data);
  }

  static getDevices(database: string, table: string): HttpResponseP<Search.QuerySqlResponse> {
    return http.get('/relational/data/getDevices', { params: { database, table } });
  }
}
export default TableDataApi;
