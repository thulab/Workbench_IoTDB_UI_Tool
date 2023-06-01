import http from '@/utils/http';

// 告警
class AlarmApi {
  // 获取枚举
  static getConfigEnum(): HttpResponseP {
    return http.post('/enum/get');
  }

  // 获取告警配置列表
  static getAlarmConfigList(data: Alarm.QueryConfigParams & PageQuery): HttpResponseP<Alarm.QueryConfigResultList> {
    return http.post('/alarm/getConf', data);
  }

  // 删除告警配置
  static deleteAlarmConfig(data: number[]): HttpResponseP {
    return http.post('/alarm/deleteConf', { alarmConfIds: data });
  }

  // 保存告警配置
  static saveAlarmConfig(data: Alarm.ConfigData): HttpResponseP {
    return http.post('/alarm/addConf', data);
  }

  // 更新告警配置
  static updateAlarmConfig(data: Alarm.ConfigData): HttpResponseP {
    return http.post('/alarm/updateConf', data);
  }

  // 获取告警配置详情
  static getAlarmConfigDetail(alarmConfId: number): HttpResponseP<Alarm.ConfigData> {
    return http.get('/alarm/getConfDetail', { params: { alarmConfId } });
  }

  // 更新告警配置状态
  static updateAlarmConfigStatus(alarmConfId: number, status: number): HttpResponseP {
    return http.get('/alarm/updateStatus', { params: { alarmConfId, status } });
  }

  // 获取告警记录列表
  static getAlarmRecordList(data: Alarm.QueryRecordParams): HttpResponseP<Alarm.QueryRecordResultList> {
    return http.post('/alarm/getRecords', data);
  }

  // 删除告警记录
  static deleteAlarmRecord(data: number[]): HttpResponseP {
    return http.post('/alarm/deleteRecords', { alarmRecordIds: data });
  }

  // 导出告警记录
  static exportAlarmRecord(data: Record<string, string | number | Date | string[] | null | any>, fileType: string = 'csv'): HttpResponseP {
    if (fileType === 'csv') {
      return http.post('/file/exportCSVAlarmRecordData', data, { timeout: 60 * 30 * 1000 });
    }
    return http.post('/file/exportExcelAlarmRecordData', data, { timeout: 60 * 30 * 1000 });
  }
}
export default AlarmApi;
