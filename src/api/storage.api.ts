import http from '@/utils/http';

// 数据库
class StorageApi {
  // 获取所有存储组
  static getStorageGroups(params: SearchPageQuery & { serverId: number }): HttpResponseP<StorageDevice.GetStorageListResponse> {
    return http.get('/schema/getDatabases', { params });
  }

  // 删除存储组
  static deleteStorageGroups(serverId: number, groupName: string): HttpResponseP {
    return http.delete('/schema/deleteDatabase', { params: { serverId, groupName } });
  }

  // 保存/更新存储组
  static saveStorageGroups(serverId: number, data: StorageDevice.SaveStorageGroupsRequest): HttpResponseP {
    return http.post('/schema/saveDatabase', data, { params: { serverId } });
  }

  //  存储组信息
  static getStorageGroupsInfo(serverId: number, groupName: string): HttpResponseP<StorageDevice.GetStorageGroupsInfoResponse> {
    return http.get('/schema/getDatabaseInfo', { params: { serverId, groupName } });
  }

  // 根据存储组和关键词查设备
  static getDeviceByGroup(params: SearchPageQuery & { serverId: number, groupName: string }): HttpResponseP<StorageDevice.GetPathListResponse> {
    return http.get('/schema/getDevicesByGroupName', { params });
  }

  // 查询设备是否对齐
  static getIsAlignedDevice(params: { serverId: number, deviceName: string }): HttpResponseP {
    return http.get('/schema/getIsAlignedDevice', { params });
  }

  // 根据设备和关键词查物理量
  static getMeasurementList(params: SearchPageQuery & { serverId: number, deviceName: string }):HttpResponseP<StorageDevice.GetPathListResponse> {
    return http.get('/schema/getMeasurementsByDeviceName', { params });
  }

  // 模糊匹配物理量
  static getMeasurementAllList(serverId: number, keyword: string):HttpResponseP<{ measurements
  :string[] }> {
    return http.post('/schema/getMeasurementsByFuzzy', { keyword }, { params: { serverId } });
  }

  // 根据路径和关键词查物理量
  static getMeasurementsInfosByFuzzy(serverId: number, data: Record<string, string | number | Date | null> & PageQuery):HttpResponseP<StorageDevice.GetMeasurementsInfosByFuzzyRes> {
    return http.post('/schema/getMeasurementsInfosByFuzzy', data, { params: { serverId } });
  }

  // 查询物理量的最新值和时间
  static getLastValue(serverId: number, deviceName: string, measurementName: string):HttpResponseP<StorageDevice.GetLastValueRes> {
    return http.get('/data/getLastValue', { params: { serverId, deviceName, measurementName } });
  }

  // 保存物理量
  static saveMeasurementList(serverId: number, data: StorageDevice.SaveMeasurementListRequest):HttpResponseP<{ measurements
  :string[] }> {
    return http.post('/schema/upsertDevices', data, { params: { serverId } });
  }

  // 删除物理量
  static deleteMeasurements(serverId: number, measurementList: string[]):HttpResponseP {
    return http.post('/schema/deleteMeasurements', { measurementList }, { params: { serverId } });
  }

  // 下载物理量导入模版
  static downloadMeasurementTemplate() {
    return http.get('/file/exportMeasurementTemplate', { timeout: 60 * 30 * 1000 });
  }

  // 下载导入物理量错误表
  static downloadMeasurementErrorInfo(fileName: string) {
    return http.get('/file/downloadMeasurementErrorInfo', { params: { fileName }, timeout: 60 * 30 * 1000 });
  }

  // 导入物理量
  static importMeasurementData(serverId: number, data: FormData, fileType: string = 'csv'): HttpResponseP<StorageDevice.ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importMeasurementCSVData', data, { params: { serverId }, timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importMeasurementExcelData', data, { params: { serverId }, timeout: 60 * 30 * 1000 });
  }

  // 导出物理量
  static exportMeasurementData(serverId: number, data: Record<string, string | number | Date | null> & PageQuery, fileType: string = 'csv'): HttpResponseP {
    if (fileType === 'csv') {
      return http.post('/file/exportCSVMeasurementData', data, { params: { serverId }, timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/exportExcelMeasurementData', data, { params: { serverId }, timeout: 60 * 30 * 1000, responseType: 'blob' });
  }
}
export default StorageApi;
