import type { DateModelType } from 'element-plus';
export interface SynchronListData {
  name: string;
  measurement: string;
  range: string;
  targetAddress: string;
  state: string;
  exceptionMessage: string;
  creationTime: number;
}

export interface SynchronFormData {
  name: string;
  whole: boolean;
  path: string;
  reforward: boolean;
  isSynchronHistory: boolean;
  datetimerange: [number, number] | [string, string] | [Date, Date];
  startTime: number | string;
  endTime: number | string;
  isSynchronRealTime: boolean;
  triggerMode: string;
  processorPluginType: string;
  processorPluginName: string;
  processorPluginParam: string;
  connectorPluginType: string;
  connectorPluginName: string;
  connectorPluginParam: string;
  targetInfos: Array<{ host: string; port: number | string }>;
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
  startTime: number | string;
  endTime: number | string;
  isSynchronRealTime: boolean;
  triggerMode: string;
  isCustomProcessorPlugin: boolean;
  processorPlugin: string;
  processorPluginParam: string;
  isCustomConnectorPlugin: boolean;
  connectorPlugin: string;
  connectorPluginParam: string;
  targetInfos: Array<{ host: string; port: number | string }>;
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

export interface PipeMonitorParams {
  nodeID: string[];
  startTime: DateModelType;
  endTime: DateModelType;
  step: number;
  isMaster: boolean;
  quantile?: string;
}
export interface PipeMonitorData {
  nodeID: string;
  nodeName: string;
  unit: string;
  total: { timestamp: number[]; memoryCost: string[] };
  used: { timestamp: number[]; memoryCost: string[] };
}
