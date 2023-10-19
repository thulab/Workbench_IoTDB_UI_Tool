declare namespace DataSync {

  export interface SynchronListData {
    name: string;
    measurement: string;
    range: string;
    resourceAddress: string;
    targetAddress: string;
    status: string;
    exceptionMessage: string;
  }

  export interface SynchronFormData {
    name: string;
    whole: boolean;
    path: string;
    reforward: boolean;
    isSynchronHistory: boolean;
    datetimerange: [DateModelType, DateModelType],
    // startTime: DateModelType;
    // endTime: DateModelType;
    isSynchronRealTime: boolean;
    triggerMode: number;
    isCustomProcessorPlugin: boolean;
    processorPluginType: string;
    processorPlugin: string;
    processorPluginParam: string;
    isCustomConnectorPlugin: boolean;
    connectorPluginType: string;
    connectorPlugin: string;
    connectorPluginParam: string;
    targetInfos: Array<{ host: string, port: number | string }>;
    isLogSendBatch: boolean;
    logSendBatchWaitTime: string | number;
    logSendBatchSize: string | number;
    targetUserName: string;
    targetPassword: string;
    targetVersion: string;
    targetOverTime: string | number;
  }

  export interface SynchronData {
    name: string;
    whole: boolean;
    path: string;
    reforward: boolean;
    isSynchronHistory: boolean;
    startTime: DateModelType;
    endTime: DateModelType;
    isSynchronRealTime: boolean;
    triggerMode: number;
    isCustomProcessorPlugin: boolean;
    processorPlugin: string;
    processorPluginParam: string;
    isCustomConnectorPlugin: boolean;
    connectorPlugin: string;
    connectorPluginParam: string;
    targetInfos: Array<{ host: string, port: number | string }>;
    isLogSendBatch: boolean;
    logSendBatchWaitTime: string;
    logSendBatchSize: string;
    targetUserName: string;
    targetPassword: string;
    targetVersion: string;
    targetOverTime: string | number;
  }

  export interface PluginList {

  }
}
