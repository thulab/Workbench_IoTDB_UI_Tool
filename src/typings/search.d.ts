declare namespace Search {
  export interface QueryDataParams {
    measurements: string[];
    startTime?: number;
    endTime?: number;
    unitInterval?: string;
    timeInterval?: number;
    aggregation?: string;
    asc: string;
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
    metaDataList: string[];
    valueList: string[][];
    queryTime: string;
    status?: boolean;
    errMsg: string;
    startQueryTime?: string;
    sql: string;
    columns?: number;
  }

  export interface QueryHistoryTrend {
    paths: string[];
    startTime: number;
    endTime: number;
    groupBy: string;
    aggregateFun: string;
  }

  export interface TrendTemplate {
    id: string | number;
    type: string;
    name: string;
    template: string;
  }

  export interface TrendData {
    path: string;
    timestamps: number[];
    values: string[];
    disabled?: boolean;
  }

  export interface QueryHistoryTrendResponse {
    normal: TrendData[];
    abnormal: string[];
    changeAuto: string[];
  }

  export interface StatisticSearch {
    measurements: string[];
    startTime: DateModelType;
    endTime: DateModelType;
    timestamp: number;
  }

  export interface StatisticSearchMinMaxObj {
    measurement: string;
    minValue: string;
    minTime: string;
    maxValue: string;
    maxTime: string;
  }

  export interface StatisticSearchAvgSumObj {
    measurement: string;
    avgValue: string;
    sumValue: string;
    stddev: string;
    variance: string;
  }

  export interface FunctionData {
    functionName: string;
    name: string;
    enable: boolean;
  }

  export interface SpectrumFFTParams {
    resultType: string;
    compression: number | string;
    measurement: string;
    startTime: DateModelType;
    endTime: DateModelType;
  }

  export interface SpectrumENVELOPEParams {
    frequency: number | string;
    amplification: number | string;
    measurement: string;
    startTime: DateModelType;
    endTime: DateModelType;
  }

  export interface SpectrumData {
    timestamps: number[];
    values: string[];
  }
}
