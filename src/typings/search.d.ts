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

  export interface SaveSqlParams {
    connectionId: number;
    id: string | null;
    queryName: string | null;
    sqls: string;
  }

  export interface GetSqlResponse {
    queryName: string;
    sqls: string;
  }

  export interface QuerySqlParams {
    sqls: string[];
    timestamp: string | number;
    isShowAll: boolean;
  }

  export interface QuerySqlResponse {
    columns: number;
    line: number;
    metaDataList: string [];
    valueList: string [][];
    queryTime: string;
    rows: number;
  }
}