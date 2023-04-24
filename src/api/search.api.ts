import http from '@/utils/http';

class SearchApi {
  static getDataSearchList(params: Record<string, any>, data: Record<string, any>): HttpResponseP<Search.QueryDataResult> {
    return http.post('/data/getDataByDevice', data, { params });
  }
}
export default SearchApi;
