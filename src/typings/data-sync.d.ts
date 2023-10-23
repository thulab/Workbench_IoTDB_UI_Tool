declare namespace DataSync {

  export interface SynchronListData {
    name: string;
    measurement: string;
    range: string;
    targetAddress: string;
    state: string;
    exceptionMessage: string;
    creationTime: DateModelType;
  }

  export interface SynchronFormData {
    name: string;
    whole: boolean;
    path: string;
    reforward: boolean;
    isSynchronHistory: boolean;
    datetimerange: [DateModelType, DateModelType],
    startTime: DateModelType;
    endTime: DateModelType;
    isSynchronRealTime: boolean;
    triggerMode: string;
    processorPluginType: string;
    processorPluginName: string;
    processorPluginParam: string;
    connectorPluginType: string;
    connectorPluginName: string;
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
    triggerMode: string;
    isCustomProcessorPlugin: boolean;
    processorPlugin: string;
    processorPluginParam: string;
    isCustomConnectorPlugin: boolean;
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

  export interface PluginData {
    pluginDesc: string;
    pluginName: string;
    pluginType: string;
  }

  export interface PluginList {
    connector: PluginData[];
    processor: PluginData[];
  }
}
