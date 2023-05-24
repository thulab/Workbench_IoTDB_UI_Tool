declare namespace Search{
  export interface QueryDataParams {
    measurements: string[];
    startTime?: number;
    endTime?: number;
    unitInterval?: string;
    timeInterval?: number;
    aggregation?: string;
    spage?: number;
    ssize?: number;
    size: number;
    page: number;
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
    hasNext: boolean;
  }

  export interface SqlList {
    id: number | string;
    queryName: string;
    focused?: boolean;
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
