import http from '@/utils/http';

// 日志
class LogApi {
  static getAuditLogList(data: Log.QueryAuditList & PageQuery): HttpResponseP<Log.AuditListRes> {
    return http.post('/audit/getList', data);
  }
}
export default LogApi;
