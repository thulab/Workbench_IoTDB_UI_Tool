import http from '@/utils/http';
import type { AuditListRes, QueryAuditList } from '@/types';

// 日志
class LogApi {
  static getAuditLogList(data: QueryAuditList & globalThis.PageQuery): globalThis.HttpResponseP<AuditListRes> {
    return http.post('/audit/getList', data);
  }
}
export default LogApi;
