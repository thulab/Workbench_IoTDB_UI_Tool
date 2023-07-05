import http from '@/utils/http';

// 计算
class CalculateApi {
  static getCalculateList(data: Calculate.CalculateItem & PageQuery): HttpResponseP<Calculate.GetListRes> {
    return http.post('/calculate/getCalculateList', data);
  }

  static getLastValue(measurement: string):HttpResponseP<Calculate.GetLastValueRes> {
    return http.get('/calculate/getLastValue', { params: { measurement } });
  }

  static saveCalculate(data: Calculate.CalculateItem): HttpResponseP {
    return http.post('/calculate/addCalculate', data);
  }

  static updateCalculate(data: Calculate.CalculateItem): HttpResponseP {
    return http.post('/calculate/updateCalculate', data);
  }

  static deleteCalculate(data: string[]): HttpResponseP {
    return http.post('/calculate/deleteCalculate', { measurements: data });
  }
}
export default CalculateApi;
