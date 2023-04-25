import http from '@/utils/http';

// 存储组
class StorageApi {
  static getStorageGroups(serverId: string, showAll?: boolean): HttpResponseP<Array<{ groupName: string }>> {
    return http.get('/schema/getAllStorageGroups', { params: { serverId, showAll } });
  }

  // get device list(list)
  static getDeviceByGroup(serverId: string, groupName: string): HttpResponseP<Array<string>> {
    return http.get('/schema/getDevicesByGroupName', { params: { serverId, groupName } });
  }

  // Get the measurement  list under the entity
  static getMeasurementList(
    params: Record<string, string | number>,
    data: Record<string, string | number>,
  ): HttpResponseP<Storage.MeasurementResult> {
    return http.post('/schema/getMeasurementsByDeviceName', data, { params });
  }
}
export default StorageApi;
