import http from '@/utils/http';

// 存储组
class StorageApi {
  static getStorageGroups(params: SearchPageQuery & { serverId: string }): HttpResponseP<StorageDevice.GetStorageListResponse> {
    return http.get('/schema/getAllStorageGroups', { params });
  }

  // get device list(list)
  static getDeviceByGroup(params: SearchPageQuery & { serverId: string, groupName: string }): HttpResponseP<StorageDevice.GetPathListResponse> {
    return http.get('/schema/getDevicesByGroupName', { params });
  }

  // Get the measurement  list under the entity
  static getMeasurementList(params: SearchPageQuery & { serverId: string, deviceName: string }):HttpResponseP<StorageDevice.GetPathListResponse> {
    return http.get('/schema/getMeasurementsByDeviceName', { params });
  }
}
export default StorageApi;
