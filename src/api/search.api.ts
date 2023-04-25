import http from '@/utils/http';

// 查询
class SearchApi {
  static getDataSearchList(params: Record<string, any>, data: Record<string, any>): HttpResponseP<Search.QueryDataResult> {
    return http.post('/data/getDataByDevice', data, { params });
  }

  static getQuery(serverId: string): HttpResponseP<Array<{ id: number, queryName: string }>> {
    return http.get('/query/query', { params: { serverId } });
  }

  // save sql
  static saveQuery(serverId: string, data: Search.SaveSqlParams): HttpResponseP<number> {
    return http.post('/query/query', data, { params: { serverId } });
  }

  // Delete query
  static deleteQueryS(serverId: string, queryId: string): HttpResponseP {
    return http.delete('/query/query', { params: { serverId, queryId } });
  }

  // Gets the specified query
  static getSql(serverId: string, queryId: string): HttpResponseP<Search.GetSqlResponse> {
    return http.get('/query/queryById', { params: { serverId, queryId } });
  }

  // sql query
  static querySql(serverId: string, data: Search.QuerySqlParams): HttpResponseP<Search.QuerySqlResponse[]> {
    return http.post('/query/querySql', data, { params: { serverId } });
  }

  static queryStop(serverId: string, timestamp: number): HttpResponseP {
    return http.get('/query/stop', { params: { timestamp, serverId } });
  }

  // Import query
  static exportDataSql(serverId: string, sql: string): HttpResponseP {
    return http.get('/file/exportData', { params: { sql, serverId } });
  }
}
export default SearchApi;
