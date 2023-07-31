declare namespace StorageDevice{
  export interface MeasurementItem {
    deviceName: string;
    timeseries: string;
    dataType: IotdbDataType;
    encoding: EncodingType;
    compression: CompressionType;
    viewType?: string;
    isEditable?: boolean;
    value?: string;
    valueTime?: string;
  }

  export interface GetStorageListResponse {
    pathNames: string[];
    totalCount: number;
  }

  export interface GetPathListResponse {
    pathNames: string[];
    totalCount: number;
  }

  export interface GetStorageGroupsInfoResponse {
    groupName: string;
    ttl?: string;
    ttlUnit?: string;
    deviceCount: number;
    measurementCount: number;
    dataCount: number;
  }

  export interface SaveStorageGroupsRequest {
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

  export interface SaveMeasurementListRequest {
    measurementDTOList: Partial<MeasurementItem>[];
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
    nodePath: string;
    nodeType: string; // database, database_device, device, timeseries, interna
    deviceCount?: number;
    timeseriesCount?: number;
    timeseriesType?: string; // BASE，VIEW
    dataType?: string;
    value?: string;
    valueTime?: string;
    pageNum: number;
    pageSize: number;
    children?: ModelData[];
    collapsed?: boolean;
    hasNext?: boolean;
    hasPre?: boolean;
    label?: Object;
  }

  export interface GetModelRes {
    list: ModelData[];
    hasNext: boolean;
    hasPre: boolean;
    pageNum: number;
    pageSize: number;
  }
}
