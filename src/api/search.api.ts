import http from '@/utils/http';

// 查询
class SearchApi {
  static getDataSearchList(data: Search.QueryDataParams, controller?: AbortController): HttpResponseP<Search.QueryDataResult> {
    return http.post('/data/getDataByMeasurements', data, { signal: controller?.signal });
  }

  static getQuery(keyword: string): HttpResponseP<Array<{ id: number; queryName: string }>> {
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

  // 导入
  static importQueryData(data: FormData, fileType: string = 'csv'): HttpResponseP<StorageDevice.ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importDataCSVData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importDataExcelData', data, { timeout: 60 * 30 * 1000 });
  }

  // 历史趋势查询
  static getHistoryTrend(data: Search.QueryHistoryTrend): HttpResponseP<Search.QueryHistoryTrendResponse> {
    return http.post('/trend/history', data);
  }

  // 新增/更新趋势模板
  static upsertTrendTemplate(data: Search.TrendTemplate): HttpResponseP {
    return http.post('/trend/upsertTemplate', data);
  }

  // 趋势模板列表
  static getTrendTemplate(keyword: string): HttpResponseP {
    return http.get('/trend/templates', { params: { keyword } });
  }

  // 趋势模板删除
  static delTrendTemplate(id: number): HttpResponseP {
    return http.delete('/trend/delTemplate', { params: { id } });
  }

  // 统计查询-最大最小值
  static getStatisticSearchMinMax(data: Search.StatisticSearch): HttpResponseP<{ data: Search.StatisticSearchMinMaxObj[]; code: number; message: string }> {
    return http.post('/data/getStatisticalMaxMinValue', data);
  }

  // 统计查询-平均总和
  static getStatisticSearchAvgSum(data: Search.StatisticSearch): HttpResponseP<{ data: Search.StatisticSearchAvgSumObj[]; code: number; message: string }> {
    return http.post('/data/getStatisticalAvgSumValue', data);
  }

  // 统计查询-批量
  static getStatisticData(data: Search.StatisticSearch): HttpResponseP<Array<Search.StatisticSearchMinMaxObj & Search.StatisticSearchAvgSumObj>> {
    return http.post('/data/getStatisticInfo', data);
  }

  // 统计查询-导出
  static exportStatisticData(data: Search.StatisticSearch): HttpResponseP {
    return http.post('/file/statisticsGetExportId', data);
  }

  // 频谱 udf 函数
  static getUDFFunction(): HttpResponseP<Array<Search.FunctionData>> {
    return http.get('/visualization/getFunctions');
  }

  // 频谱 fft
  static getFFTData(data: Search.SpectrumFFTParams): HttpResponseP<Search.SpectrumData> {
    return http.post('/visualization/getFFTData', data);
  }

  // 频谱 envelope
  static getEnvelopeDemodulationData(data: Search.SpectrumENVELOPEParams): HttpResponseP<Search.SpectrumData> {
    return http.post('/visualization/getEnvelopeDemodulationData', data);
  }

  // 频谱 custom
  static getCustomData(sql: string): HttpResponseP<Search.SpectrumData> {
    return http.post('/visualization/getCustomAlgorithmData', { sql });
  }
}
export default SearchApi;
