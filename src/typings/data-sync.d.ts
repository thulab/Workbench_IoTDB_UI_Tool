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
  }

  export interface PluginList {

  }
}
