declare namespace Alarm {
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
    alarmConfigId: number;
    alarmName: string;
    measurement: string;
    alarmLevel: string;
    alarmDesc: string;
    alarmRules: string;
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
    alarmConfigId?: number;
    alarmName: string;
    measurement: string[];
    measurementType?: string;
    alarmLevel: string;
    alarmDesc: string;
    alarmRulesType?: string;
    alarmRulesTypeVal?: string;
    alarmRules?: Array<{ operator?: string; value?: string }>;
    alarmFrequency: string;
    alarmDuration?: number;
    alarmDurationType: string;
  }

  export interface QueryRecordParams {
    alarmName: string | null;
    measurements: string[] | null;
    alarmLevel?: string | null;
    status?: number;
    createStartTime?: DateModelType | null;
    createEndTime?: DateModelType | null;
    orderBy: string;
    asc: string;
  }

  export interface QueryRecordResult {
    alarmRecordId: number;
    alarmTraceId: string;
    alarmName: string;
    measurement: string;
    alarmLevel: string;
    alarmRules: string;
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
