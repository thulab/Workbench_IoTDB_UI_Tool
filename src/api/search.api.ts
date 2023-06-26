import http from '@/utils/http';

// 查询
class SearchApi {
  static getDataSearchList(data: Search.QueryDataParams, controller?: AbortController): HttpResponseP<Search.QueryDataResult> {
    return http.post('/data/getDataByMeasurements', data, { signal: controller?.signal });
  }

  static getQuery(keyword: string): HttpResponseP<Array<{ id: number, queryName: string }>> {
    return http.get('/query/query', { params: { keyword } });
  }

  // save sql
  static saveQuery(data: Search.SaveSqlParams): HttpResponseP<number> {
    return http.post('/query/query', data);
  }

  // Delete query
  static deleteQueryS(queryId: string): HttpResponseP {
    return http.delete('/query/query', { params: { queryId } });
  }

  // Gets the specified query
  static getSql(queryId: string): HttpResponseP<Search.GetSqlResponse> {
    return http.get('/query/queryById', { params: { queryId } });
  }

  // sql query
  static querySql(data: Search.QuerySqlParams, controller?: AbortController): HttpResponseP<Search.QuerySqlResponse[]> {
    return http.post('/query/querySql', data, { signal: controller?.signal });
  }

  static queryStop(timestamp: number): HttpResponseP {
    return http.get('/query/stop', { params: { timestamp } });
  }

  // Import query
  static exportData(data: Search.QueryDataParams): HttpResponseP {
    return http.post('/file/dataGetExportId', data);
  }

  // 历史趋势查询
  static getHistoryTrend(data: Search.QueryHistoryTrend): HttpResponseP {
    return http.post('/trend/history', data);
  }
}
export default SearchApi;
