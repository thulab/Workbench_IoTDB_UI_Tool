import http from '@/utils/http';
import type { QueryConfigParams, QueryConfigResultList, ImportMeasurementDataRes, ConfigData, QueryRecordParams, QueryRecordResultList } from '@/types';

// 告警
class AlarmApi {
  // 获取枚举
  static getConfigEnum(): globalThis.HttpResponseP {
    return http.post('/enum/get');
  }

  // 获取告警配置列表
  static getAlarmConfigList(data: QueryConfigParams & globalThis.PageQuery): globalThis.HttpResponseP<QueryConfigResultList> {
    return http.post('/alarm/getConfig', data);
  }

  // 导入
  static importAlarmData(data: FormData, fileType: string = 'csv'): globalThis.HttpResponseP<ImportMeasurementDataRes> {
    if (fileType === 'csv') {
      return http.post('/file/importAlarmConfigCsvData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/importAlarmConfigExcelData', data, { timeout: 60 * 30 * 1000 });
  }

  // 删除告警配置
  static deleteAlarmConfig(data: number[]): globalThis.HttpResponseP {
    return http.post('/alarm/deleteConfig', { alarmConfigIds: data });
  }

  // 保存告警配置
  static saveAlarmConfig(data: ConfigData): globalThis.HttpResponseP<ImportMeasurementDataRes> {
    return http.post('/alarm/addConfig', data);
  }

  // 更新告警配置
  static updateAlarmConfig(data: ConfigData): globalThis.HttpResponseP {
    return http.post('/alarm/updateConfig', data);
  }

  // 获取告警配置详情
  static getAlarmConfigDetail(alarmConfigId: number): globalThis.HttpResponseP<ConfigData> {
    return http.get('/alarm/getConfigDetail', { params: { alarmConfigId } });
  }

  // 更新告警配置状态
  static updateAlarmConfigStatus(alarmConfigId: number, status: number): globalThis.HttpResponseP {
    return http.get('/alarm/updateStatus', { params: { alarmConfigId, status } });
  }

  // 获取告警记录列表
  static getAlarmRecordList(data: QueryRecordParams & globalThis.PageQuery): globalThis.HttpResponseP<QueryRecordResultList> {
    return http.post('/alarm/getRecords', data);
  }

  // 删除告警记录
  static deleteAlarmRecord(data: number[]): globalThis.HttpResponseP {
    return http.post('/alarm/deleteRecords', { alarmRecordIds: data });
  }

  // 更新告警记录状态
  static updateAlarmRecordStatus(traceId: string): globalThis.HttpResponseP {
    return http.get('/alarm/notConcerned', { params: { traceId } });
  }

  // 导出告警记录
  static exportAlarmRecord(data: QueryRecordParams & globalThis.PageQuery): globalThis.HttpResponseP {
    return http.post('/file/excelAlarmRecordExportId', data);
  }
}
export default AlarmApi;
