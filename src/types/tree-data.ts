export interface MeasurementItem {
  deviceName: string;
  timeseries: string;
  alias?: string;
  description?: string;
  tags?: string;
  isAligned?: boolean;
  dataType: globalThis.IotdbDataType | string;
  encoding: globalThis.EncodingType | string;
  compression: globalThis.CompressionType | string;
  viewType?: string;
  isEditable?: boolean;
  value?: string;
  valueTime?: string;
}

export interface GetDatabaseListResponse {
  pathNames: string[];
  totalCount: number;
}

export interface GetPathListResponse {
  pathNames: string[];
  totalCount: number;
}

export interface DatabaseInfo {
  groupName: string;
  ttl?: string;
  ttlUnit?: string;
  deviceCount: number;
  measurementCount: number;
  dataCount?: number;
  partitionInterval?: number;
  partitionIntervalUnit?: number;
  schemaDuplicate?: number;
  dataDuplicate?: number;
}

export interface SaveDatabaseRequest {
  groupName: string;
  ttl?: number;
  ttlUnit?: string;
}

export interface GetMeasurementsInfosByFuzzyRes {
  measurements: MeasurementItem[];
  totalCount: number;
  totalPage: number;
}

export interface GetLastValueResData {
  value: string;
  valueTime: string;
}

export interface GetBatchLastValueRes {
  values: string[];
  timestamps: string[];
}

export interface SaveMeasurementListRequest {
  measurementVOList: Partial<MeasurementItem>[];
  deviceName: string;
  isAligned: boolean;
}

export interface InsertMeasurements {
  measurements: Partial<MeasurementItem>[];
}

export interface ImportMeasurementDataRes {
  status: boolean;
  errMsg: string;
  successNum: number;
  failNum: number;
  filePath: string;
}

export interface MeasurementDataItem {
  timeseries: string;
  dataType: globalThis.IotdbDataType;
  viewType: string;
}

export interface UploadFileStatus<T> {
  file: T;
  uploadFileName?: string;
  // 0: 待上传，1: 正在上传，2: 上传成功，-1: 上传失败
  uploadStatus: 0 | 1 | 2 | -1;
  // 0: 待导入，1: 正在导入，2: 导入成功，-1: 导入失败
  importStatus: 0 | 1 | 2 | -1;
  failedReason: string | undefined;
  importResp?: ImportMeasurementDataRes;
}

export interface ModelData {
  node: string;
  label?: string | object;
  value?: string;
  nodePath: string;
  nodeType: string; // database, database_device, device, timeseries, interna
  leaf?: boolean;
  deviceCount?: number;
  timeseriesCount?: number;
  timeseriesType?: string; // BASE，VIEW
  dataType?: string;
  newValue?: string;
  valueTime?: string;
  description?: string;
  pageNum: number;
  pageSize?: number;
  children?: ModelData[];
  collapsed?: boolean;
  hasNext?: boolean;
  hasPre?: boolean;
  leafDeep?: number;
}

export interface GetModelRes {
  list: ModelData[];
  hasNext: boolean;
  hasPre: boolean;
  pageNum: number;
  pageSize: number;
  nodePath?: string;
}

export interface TreeNodeData {
  node: string;
  nodePath: string;
  parentPath: string;
  nodeType: string;
  children?: TreeNodeData[];
  pageChildren?: TreeNodeData[];
  pageNum?: number;
  totalPage?: number;
}

export interface MeasurementData {
  timeseries: string;
  node: string;
  description: string;
  viewType: string;
  isAligned: boolean;
  dataType: globalThis.IotdbDataType | string;
  encoding: globalThis.EncodingType | string;
  compression: globalThis.CompressionType | string;
  latest: string;
  latestTime: string;
}
export interface TreeEventPayload {
  path: string;
  type: 'DATABASE' | 'MEASUREMENT';
}
