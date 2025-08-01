import type { DateModelType } from 'element-plus';
export interface QueryAuditList {
  username: string;
  address: string;
  log: string;
  startTime: DateModelType;
  endTime: DateModelType;
  timestamp: DateModelType;
  orderBy: 'asc' | 'desc';
}

export interface AuditData {
  time: DateModelType;
  username: string;
  address: string;
  log: string;
}

export interface AuditListRes {
  list: AuditData[];
  totalCount: number;
  totalPage: number;
}
