import http from '@/utils/http';

// 查询
class SearchApi {
  static getDataSearchList(serverId: number, data: Search.QueryDataParams, controller?: AbortController): HttpResponseP<Search.QueryDataResult> {
    return http.post('/data/getDataByMeasurements', data, { params: { serverId }, signal: controller?.signal });
  }

  static getQuery(serverId: number, keyword: string): HttpResponseP<Array<{ id: number, queryName: string }>> {
    return http.get('/query/query', { params: { serverId, keyword } });
  }

  // save sql
  static saveQuery(serverId: number, data: Search.SaveSqlParams): HttpResponseP<number> {
    return http.post('/query/query', data, { params: { serverId } });
  }

  // Delete query
  static deleteQueryS(serverId: number, queryId: string): HttpResponseP {
    return http.delete('/query/query', { params: { serverId, queryId } });
  }

  // Gets the specified query
  static getSql(serverId: number, queryId: string): HttpResponseP<Search.GetSqlResponse> {
    return http.get('/query/queryById', { params: { serverId, queryId } });
  }

  // sql query
  static querySql(serverId: number, data: Search.QuerySqlParams, controller?: AbortController): HttpResponseP<Search.QuerySqlResponse[]> {
    return http.post('/query/querySql', data, { params: { serverId }, signal: controller?.signal });
  }

  static queryStop(serverId: number, timestamp: number): HttpResponseP {
    return http.get('/query/stop', { params: { timestamp, serverId } });
  }

  // Import query
  static exportData(data: Search.QueryDataParams): HttpResponseP {
    return http.post('/file/dataGetExportId', data);
  }
}
export default SearchApi;
