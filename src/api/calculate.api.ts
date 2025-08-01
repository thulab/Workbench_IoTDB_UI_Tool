import http from '@/utils/http';
import type { CalculateItem, GetListRes, GetLastValueRes, ImportMeasurementDataRes } from '@/types';

// 计算
class CalculateApi {
  static getCalculateList(data: CalculateItem & globalThis.PageQuery): globalThis.HttpResponseP<GetListRes> {
    return http.post('/calculate/getCalculateList', data);
  }

  static getLastValue(measurement: string): globalThis.HttpResponseP<GetLastValueRes> {
    return http.get('/calculate/getLastValue', { params: { measurement } });
  }

  static saveCalculate(data: CalculateItem): globalThis.HttpResponseP {
    return http.post('/calculate/addCalculate', data);
  }

  static updateCalculate(data: CalculateItem): globalThis.HttpResponseP {
    return http.post('/calculate/updateCalculate', data);
  }

  static deleteCalculate(data: string[]): globalThis.HttpResponseP {
    return http.post('/calculate/deleteCalculate', { measurements: data });
  }

  // 导入
  static importCalculateData(data: FormData, fileType: string = 'csv'): globalThis.HttpResponseP<ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importCalculateCsvData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importCalculateExcelData', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出
  static exportCalculateData(data: CalculateItem & globalThis.PageQuery): globalThis.HttpResponseP {
    return http.post('/file/calculateExportId', data);
  }
}
export default CalculateApi;
