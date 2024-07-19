declare namespace StorageDevice {
  export interface MeasurementItem {
    deviceName: string;
    timeseries: string;
    description?: string;
    isAligned?: boolean;
    dataType: IotdbDataType | string;
    encoding: EncodingType | string;
    compression: CompressionType | string;
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

  export interface GetLastValueRes {
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

  export interface ImportMeasurementDataRes {
    status: boolean;
    errMsg: string;
    successNum: number;
    failNum: number;
    filePath: string;
  }

  export interface MeasurementDataItem {
    timeseries: string;
    dataType: IotdbDataType;
    viewType: string;
  }

  export interface ModelData {
    node: string;
    label?: string | Object;
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
    pageNum: number;
    pageSize?: number;
    children?: ModelData[];
    collapsed?: boolean;
    hasNext?: boolean;
    hasPre?: boolean;
    label?: Object;
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
    totalPage?: number;
    currentPage?: number;
  }

  export interface MeasurementData {
    timeseries: string;
    node: string;
    description: string;
    viewType: string;
    isAligned: boolean;
    dataType: IotdbDataType | string;
    encoding: EncodingType | string;
    compression: CompressionType | string;
    latest: string;
    latestTime: string;
  }
}
