import http from '@/utils/http';
import type { QueryDataByTableReq, QueryDataResult, DeleteTableDataReq, InsertTableDataReq, TableHistoryTrendResponse, WriteBackTablePayload, QuerySqlResponse } from '@/types';

// 表模型数据
class TableDataApi {
  static getTableData(data: QueryDataByTableReq, controller?: AbortController): globalThis.HttpResponseP<{ sql: string; value: QueryDataResult }> {
    return http.post('/relational/data/getDataByTableInfo', data, { signal: controller?.signal });
  }

  static deleteTableData(data: DeleteTableDataReq): globalThis.HttpResponseP<{ sql: string }> {
    return http.post('/relational/data/deleteDataInfo', data);
  }

  static insertTableData(data: InsertTableDataReq): globalThis.HttpResponseP<{ sql: string }> {
    return http.post('/relational/data/saveDataInfo', data);
  }

  static getDevices(data: { database: string; tableName: string; conditions: { variable: string; value: string }[] }, pageNum: number, pageSize: number): globalThis.HttpResponseP<QuerySqlResponse> {
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
  }): globalThis.HttpResponseP<TableHistoryTrendResponse> {
    return http.post('/trend/relational/history', data);
  }

  static writeBack(data: WriteBackTablePayload): globalThis.HttpResponseP {
    return http.post('/ai-analysis/relational/writeBack', data);
  }
}
export default TableDataApi;
