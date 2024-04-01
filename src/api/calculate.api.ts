import http from '@/utils/http';

// 计算
class CalculateApi {
  static getCalculateList(data: Calculate.CalculateItem & PageQuery): HttpResponseP<Calculate.GetListRes> {
    return http.post('/calculate/getCalculateList', data);
  }

  static getLastValue(measurement: string): HttpResponseP<Calculate.GetLastValueRes> {
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

  // 导入
  static importCalculateData(data: FormData, fileType: string = 'csv'): HttpResponseP<StorageDevice.ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importCalculateCsvData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importCalculateExcelData', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出
  static exportCalculateData(data: Calculate.CalculateItem & PageQuery): HttpResponseP {
    return http.post('/file/calculateExportId', data);
  }
}
export default CalculateApi;
