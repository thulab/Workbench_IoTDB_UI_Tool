import http from '@/utils/http';

// 告警
class AlarmApi {
  // 获取枚举
  static getConfigEnum(): HttpResponseP {
    return http.post('/enum/get');
  }

  // 获取告警配置列表
  static getAlarmConfigList(data: Alarm.QueryConfigParams & PageQuery): HttpResponseP<Alarm.QueryConfigResultList> {
    return http.post('/alarm/getConfig', data);
  }

  // 删除告警配置
  static deleteAlarmConfig(data: number[]): HttpResponseP {
    return http.post('/alarm/deleteConfig', { alarmConfigIds: data });
  }

  // 保存告警配置
  static saveAlarmConfig(data: Alarm.ConfigData): HttpResponseP {
    return http.post('/alarm/addConfig', data);
  }

  // 更新告警配置
  static updateAlarmConfig(data: Alarm.ConfigData): HttpResponseP {
    return http.post('/alarm/updateConfig', data);
  }

  // 获取告警配置详情
  static getAlarmConfigDetail(alarmConfigId: number): HttpResponseP<Alarm.ConfigData> {
    return http.get('/alarm/getConfigDetail', { params: { alarmConfigId } });
  }

  // 更新告警配置状态
  static updateAlarmConfigStatus(alarmConfigId: number, status: number): HttpResponseP {
    return http.get('/alarm/updateStatus', { params: { alarmConfigId, status } });
  }

  // 获取告警记录列表
  static getAlarmRecordList(data: Alarm.QueryRecordParams & PageQuery): HttpResponseP<Alarm.QueryRecordResultList> {
    return http.post('/alarm/getRecords', data);
  }

  // 删除告警记录
  static deleteAlarmRecord(data: number[]): HttpResponseP {
    return http.post('/alarm/deleteRecords', { alarmRecordIds: data });
  }

  // 更新告警记录状态
  static updateAlarmRecordStatus(traceId: string): HttpResponseP {
    return http.get('/alarm/notConcerned', { params: { traceId } });
  }

  // 导出告警记录
  static exportAlarmRecord(data: Alarm.QueryRecordParams & PageQuery): HttpResponseP {
    return http.post('/file/excelAlarmRecordExportId', data);
  }
}
export default AlarmApi;
