import http from '@/utils/http';

// 数据库
class StorageApi {
  // 获取所有存储组
  static getDatabases(params: SearchPageQuery): HttpResponseP<StorageDevice.GetDatabaseListResponse> {
    return http.get('/schema/getDatabases', { params });
  }

  // 删除存储组
  static deleteDatabase(groupName: string): HttpResponseP {
    return http.delete('/schema/deleteDatabase', { params: { groupName } });
  }

  // 保存/更新存储组
  static saveDatabase(data: StorageDevice.SaveDatabaseRequest): HttpResponseP {
    return http.post('/schema/saveDatabase', data);
  }

  // 修改描述
  static saveDescription(measurement: string, description: string): HttpResponseP {
    return http.post('/schema/alterDescription', { measurement, description });
  }

  // 更新存储组TTL
  static upsertDatabaseTTL(data: StorageDevice.SaveDatabaseRequest): HttpResponseP {
    return http.post('/schema/upsertDatabaseTTL', data);
  }

  //  存储组信息
  static getDatabaseInfo(groupName: string): HttpResponseP<StorageDevice.DatabaseInfo> {
    return http.get('/schema/getDatabaseInfo', { params: { groupName } });
  }

  // 根据存储组和关键词查设备
  static getDeviceByGroup(params: SearchPageQuery & { groupName: string }): HttpResponseP<StorageDevice.GetPathListResponse> {
    return http.get('/schema/getDevicesByGroupName', { params });
  }

  // 查询设备是否对齐
  static getIsAlignedDevice(params: { deviceName: string }): HttpResponseP {
    return http.get('/schema/getIsAlignedDevice', { params });
  }

  // 根据设备和关键词查物理量
  static getMeasurementList(params: SearchPageQuery & { deviceName: string }): HttpResponseP<StorageDevice.GetPathListResponse> {
    return http.get('/schema/getMeasurementsByDeviceName', { params });
  }

  // 模糊匹配物理量
  static getMeasurementAllObjList(keyword: string): HttpResponseP<{ measurements: StorageDevice.MeasurementDataItem[] }> {
    return http.post('/schema/getMeasurementsByFuzzyV2', { keyword, size: 100 });
  }

  // 根据路径和关键词查物理量
  static getMeasurementsInfosByFuzzy(data: Record<string, string | number | Date | null> & PageQuery): HttpResponseP<StorageDevice.GetMeasurementsInfosByFuzzyRes> {
    return http.post('/schema/getMeasurementsInfosByFuzzy', data);
  }

  // 查询物理量的最新值和时间
  static getLastValue(deviceName: string, measurementName: string, viewType: string): HttpResponseP<StorageDevice.GetLastValueRes> {
    return http.get('/data/getLastValue', { params: { deviceName, measurementName, viewType } });
  }

  // 批量查询物理量的最新值和时间
  static getBatchLastValue(paths: string[], viewTypeList: string[]): HttpResponseP<StorageDevice.GetBatchLastValueRes> {
    return http.post('/data/getBatchLastValue', { paths, viewTypeList });
  }

  // 保存物理量
  static saveMeasurementList(data: StorageDevice.SaveMeasurementListRequest): HttpResponseP<{ measurements: string[] }> {
    return http.post('/schema/upsertDevices', data);
  }

  // 删除物理量
  static deleteMeasurements(measurementList: string[]): HttpResponseP {
    return http.post('/schema/deleteMeasurements', { measurementList });
  }

  // 导入物理量
  static importMeasurementData(data: FormData, fileType: string = 'csv'): HttpResponseP<StorageDevice.ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importMeasurementCSVData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importMeasurementExcelData', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出物理量
  static exportMeasurementData(data: Record<string, string | number | Date | null> & PageQuery): HttpResponseP {
    return http.post('/file/measurementDataExportId', data);
  }

  // 数据模型
  static getDataModelTree(data: { nodePath: string } & PageQuery): HttpResponseP<StorageDevice.GetModelRes> {
    return http.post('/model/getNextNodes', data);
  }
}
export default StorageApi;
