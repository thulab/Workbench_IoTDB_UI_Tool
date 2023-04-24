declare namespace Search{
  export interface GetDataSearchListParams {
    device: string;
    time?: number;
    datetimerange?: number[];
    timeInterval?: number;
    unitInterval: string;
    aggregation: string;
  }

  export interface QueryDataResult {
    totalCount: number;
    totalPage: number;
    totalColumnCount;
    totalColumnPage;
    currentPage;
    currentColumnPage;
    metaDataList: string[];
    typeList: DataType[];
    valueList: string[][];
    measurementVOList: Item[];
  }
}