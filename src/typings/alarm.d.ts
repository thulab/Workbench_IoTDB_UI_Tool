declare namespace Alarm{
  export interface QueryConfigParams {
    alarmName: string;
    measurements: string[];
    alarmLevel?: string;
    status?: string;
    createStartTime?: DateModelType;
    createEndTime?: DateModelType;
    updateStartTime?: DateModelType;
    updateEndTime?: DateModelType;
    size: number;
    page: number;
  }

  export interface QueryConfigResult {
    alarmConfId: number;
    alarmName: string;
    measurements: string;
    alarmLevel: string;
    alarmDesc: string;
    alarmRule: string;
    status: string;
    createTime: DateModelType;
    updateTime: DateModelType;
  }

  export interface QueryConfigResultList {
    data: QueryConfigResult[];
    totalCount: number;
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
    alarmName: string;
    measurements: string[];
    alarmLevel?: string;
    status?: string;
    createStartTime?: DateModelType;
    createEndTime?: DateModelType;
    size: number;
    page: number;
  }

  export interface QueryRecordResult {
    alarmRecordId: number;
    alarmName: string;
    measurement: string;
    alarmLevel: string;
    alarmDesc: string;
    alarmValue: DateModelType;
    createTime: DateModelType;
  }

  export interface QueryRecordResultList {
    data: QueryRecordResult[];
    totalCount: number;
  }
}
