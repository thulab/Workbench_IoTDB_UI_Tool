declare namespace Log {
  export interface QueryAuditList {
    username: string;
    address: string;
    log: string;
    startTime: DateModelType;
    endTime: DateModelType;
    timestamp: DateModelType;
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
}
