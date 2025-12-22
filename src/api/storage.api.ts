import http from '@/utils/http';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type {
  GetDatabaseListResponse,
  SaveDatabaseRequest,
  GetPathListResponse,
  GetMeasurementsInfosByFuzzyRes,
  GetLastValueRes,
  GetBatchLastValueRes,
  SaveMeasurementListRequest,
  InsertMeasurements,
  ImportMeasurementDataRes,
  GetModelRes,
  MeasurementDataItem,
  MeasurementData,
  TreeNodeData,
  DatabaseInfo,
} from '@/types';

// 数据库
class StorageApi {
  // 获取所有存储组
  static getDatabases(params: globalThis.PageQuery): globalThis.HttpResponseP<GetDatabaseListResponse> {
    return http.get('/schema/getDatabases', { params });
  }

  // 删除存储组
  static deleteDatabase(groupName: string): globalThis.HttpResponseP {
    return http.delete('/schema/deleteDatabase', { params: { groupName } });
  }

  // 保存/更新存储组
  static saveDatabase(data: SaveDatabaseRequest): globalThis.HttpResponseP {
    return http.post('/schema/saveDatabase', { ...data, database: data.groupName });
  }

  // 修改描述
  static saveDescription(measurement: string, description: string): globalThis.HttpResponseP {
    return http.post('/schema/alterDescription', { measurement, description });
  }

  static saveAlias(measurement: string, description: string): globalThis.HttpResponseP {
    return http.post('/schema/alterAlias', { measurement, description });
  }

  // 更新存储组TTL
  static upsertDatabaseTTL(data: SaveDatabaseRequest): globalThis.HttpResponseP {
    return http.post('/schema/upsertDatabaseTTL', { ...data, database: data.groupName });
  }

  //  存储组信息
  static getDatabaseInfo(groupName: string): globalThis.HttpResponseP<DatabaseInfo> {
    return http.get('/schema/getDatabaseInfo', { params: { groupName } });
  }

  // 根据存储组和关键词查设备
  static getDeviceByGroup(params: globalThis.PageQuery & { groupName: string; keyword: string }): globalThis.HttpResponseP<GetPathListResponse> {
    return http.get('/schema/getDevicesByGroupName', { params });
  }

  // 查询设备是否对齐
  static getIsAlignedDevice(params: { deviceName: string }): globalThis.HttpResponseP {
    return http.get('/schema/getIsAlignedDevice', { params });
  }

  // 根据设备和关键词查物理量
  static getMeasurementList(params: globalThis.PageQuery & { deviceName: string; keyword: string }): globalThis.HttpResponseP<GetPathListResponse> {
    return http.get('/schema/getMeasurementsByDeviceName', { params });
  }

  // 模糊匹配物理量
  static getMeasurementAllObjList(keyword: string): globalThis.HttpResponseP<{ measurements: MeasurementDataItem[] }> {
    return http.post('/schema/getMeasurementsByFuzzyV2', { keyword, size: 100 });
  }

  // 根据路径和关键词查物理量
  static getMeasurementsInfosByFuzzy(data: Record<string, string | number | Date | null> & globalThis.PageQuery): globalThis.HttpResponseP<GetMeasurementsInfosByFuzzyRes> {
    return http.post('/schema/getMeasurementsInfosByFuzzy', data);
  }

  // 查询物理量的最新值和时间
  static getLastValue(deviceName: string, measurementName: string, viewType: string): globalThis.HttpResponseP<GetLastValueRes> {
    return http.get('/data/getLastValue', { params: { deviceName, measurementName, viewType } });
  }

  // 批量查询物理量的最新值和时间
  static getBatchLastValue(paths: string[], viewTypeList: string[]): globalThis.HttpResponseP<GetBatchLastValueRes> {
    return http.post('/data/getBatchLastValue', { paths, viewTypeList });
  }

  // 保存物理量
  static saveMeasurementList(data: SaveMeasurementListRequest): globalThis.HttpResponseP<{ measurements: string[] }> {
    return http.post('/schema/upsertDevices', data);
  }

  // 保存物理量--new
  static insertMeasurements(data: InsertMeasurements): globalThis.HttpResponseP<{ measurements: string[] }> {
    return http.post('/schema/insertMeasurements', data);
  }

  // 删除物理量
  static deleteMeasurements(measurementList: string[]): globalThis.HttpResponseP {
    return http.post('/schema/deleteMeasurements', { measurements: measurementList });
  }

  // 导入物理量
  static importMeasurementData(data: FormData, fileType: string = 'csv'): globalThis.HttpResponseP<ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importMeasurementCSVData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importMeasurementExcelData', data, { timeout: 60 * 30 * 1000 });
  }

  // 导出物理量
  static exportMeasurementData(data: Record<string, string | number | Date | null> & globalThis.PageQuery): globalThis.HttpResponseP {
    return http.post('/file/measurementDataExportId', data);
  }

  // 数据模型
  static getDataModelTree(data: { nodePath: string } & globalThis.PageQuery): globalThis.HttpResponseP<GetModelRes> {
    return http.post('/model/getNextNodes', data);
  }

  // 测点列表左侧树形 按序列查询
  static getNextNodeInfos(nodePath: string): globalThis.HttpResponseP<Array<TreeNodeData>> {
    return http.get('/model/getChildNodes', { params: { nodePath } });
  }

  // 测点详情
  static getMeasurementsInfo(pathName: string): globalThis.HttpResponseP<MeasurementData> {
    return http.get('/schema/getMeasurementsInfo', { params: { pathName } });
  }

  // 删除树级路径
  static deletePaths(path: string, type: string): globalThis.HttpResponseP {
    return http.delete('/schema/deletePaths', { params: { path, type } });
  }

  //  存储组信息
  static async getSSEData(searchText: string, handleData: (data: any) => void) {
    fetchEventSource(`/api/sse/searchSchemaTree?path=${searchText}`, {
      async onopen(response) {
        if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
          // everything's good
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          // client-side errors are usually non-retriable:
          throw new Error();
        } else {
          throw new Error();
        }
      },
      onmessage(msg) {
        if (msg.event === 'Error') {
          console.log('onmessage Error:', msg.data);
        } else {
          handleData(msg.data);
        }
      },
      onclose() {
        console.log('onclose');
      },
      onerror(err) {
        console.log('onerror:', err);
      },
    });
  }
}
export default StorageApi;
