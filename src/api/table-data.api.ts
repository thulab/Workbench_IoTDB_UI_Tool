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

  static getDevices(data: { database: string; table: string; conditions: { variable: string; value: string }[] }, pageNum: number, pageSize: number): HttpResponseP<Search.QuerySqlResponse> {
    return http.post('/relational/data/getDevices', { ...data, pageNum, pageSize });
  }

  static getTrendHistoryData(data: {
    database: string;
    tableName: string;
    fieldCondition: { variable: string; value: string }[];
    startTime: string | number;
    endTime: string | number;
    groupBy: string;
    aggregateFun: string;
  }): HttpResponseP<Trend.TableHistoryTrendResponse> {
    return http.post('/trend/relational/history', data);
  }
}
export default TableDataApi;
