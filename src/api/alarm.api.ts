import http from '@/utils/http';

// 告警
class AlarmApi {
  // 获取告警配置列表
  static getAlarmConfigList(data: Alarm.QueryConfigParams): HttpResponseP<Alarm.QueryConfigResultList> {
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
}
export default AlarmApi;
