import http from '@/utils/http';

// 存储组
class StorageApi {
  static getStorageGroups(params: SearchPageQuery & { serverId: number }): HttpResponseP<StorageDevice.GetStorageListResponse> {
    return http.get('/schema/getDatabases', { params });
  }

  // get device list(list)
  static getDeviceByGroup(params: SearchPageQuery & { serverId: number, groupName: string }): HttpResponseP<StorageDevice.GetPathListResponse> {
    return http.get('/schema/getDevicesByGroupName', { params });
  }

  // Get the measurement  list under the entity
  static getMeasurementList(params: SearchPageQuery & { serverId: number, deviceName: string }):HttpResponseP<StorageDevice.GetPathListResponse> {
    return http.get('/schema/getMeasurementsByDeviceName', { params });
  }

  // Get the measurement  list under the entity
  static getMeasurementAllList(serverId: number, keyword: string):HttpResponseP<{ measurements
  :string[] }> {
    return http.post('/schema/getMeasurementsByFuzzy', { keyword }, { params: { serverId } });
  }
}
export default StorageApi;
