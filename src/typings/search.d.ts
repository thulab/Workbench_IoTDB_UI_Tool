declare namespace Search{
  export interface QueryDataParams {
    measurementList: string[];
    startTime?: number;
    endTime?: number;
    unitInterval?: string;
    timeInterval?: number;
    aggregation?: string;
    spage?: number;
    ssize?: number;
  }

  export interface QueryDataResult {
    totalCount: number;
    totalPage: number;
    totalColumnCount: number;
    totalColumnPage: number;
    currentPage: number;
    currentColumnPage: number;
    metaDataList: string[];
    typeList: DataType[];
    valueList: string[][];
    queryTime: string;
    status?: boolean;
    errMsg: string;
  }

  export interface SqlList {
    id: number | string;
    queryName: string;
  }

  export interface SaveSqlParams {
    serverId: number;
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
  }

  export interface QuerySqlResponse {
    metaDataList: string [];
    valueList: string [][];
    queryTime: string;
    status?: boolean;
    errMsg: string;
    startQueryTime?: string;
    sql: string;
    columns?: number;
  }
}
