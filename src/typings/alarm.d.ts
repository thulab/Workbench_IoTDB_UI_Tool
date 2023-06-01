declare namespace Alarm{
  export interface QueryConfigParams {
    alarmName: string | null;
    measurements: string[] | null;
    alarmLevel?: string | null;
    status?: string | number | null;
    createStartTime?: DateModelType | null;
    createEndTime?: DateModelType | null;
    updateStartTime?: DateModelType | null;
    updateEndTime?: DateModelType | null;
    orderBy: string;
    asc: string;
  }

  export interface QueryConfigResult {
    alarmConfId: number;
    alarmName: string;
    measurement: string;
    alarmLevel: string;
    alarmDesc: string;
    alarmRule: string;
    status: number;
    createTime: DateModelType;
    updateTime: DateModelType;
  }

  export interface QueryConfigResultList {
    list: QueryConfigResult[];
    totalCount: number;
    totalPage: number;
  }

  export interface ConfigData {
    alarmConfId?: number;
    alarmName: string;
    measurement?: string;
    measurementType?: string;
    alarmLevel: string;
    alarmDesc: string;
    alarmRulesType?: string;
    alarmRulesTypeVal?: string;
    alarmRules?: Array<Record<string, any>>;
    alarmFrequency: string;
    alarmDuration: string;
    alarmDurationType: string;
  }

  export interface QueryRecordParams {
    alarmName: string | null;
    measurements: string[] | null;
    alarmLevel?: string | null;
    status?: string | null;
    createStartTime?: DateModelType | null;
    createEndTime?: DateModelType | null;
    orderBy: string;
    asc: string;
  }

  export interface QueryRecordResult {
    alarmRecordId: number;
    alarmTraceId: number;
    alarmName: string;
    measurement: string;
    alarmLevel: string;
    alarmDesc: string;
    alarmValue: DateModelType;
    hasRead: boolean;
    createTime: DateModelType;
  }

  export interface QueryRecordResultList {
    list: QueryRecordResult[];
    totalCount: number;
    totalPage: number;
  }
}
