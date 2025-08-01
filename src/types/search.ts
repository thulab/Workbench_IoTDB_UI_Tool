import type { DateModelType } from 'element-plus';

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
  metaDataTypeList?: string[];
  typeList: globalThis.IotdbDataType[];
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
  startTime?: DateModelType;
  endTime?: DateModelType;
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
  startTime?: DateModelType;
  endTime?: DateModelType;
}

export interface SpectrumENVELOPEParams {
  frequency: number | string;
  amplification: number | string;
  measurement: string;
  startTime: DateModelType;
  endTime: DateModelType;
}

export interface SpectrumDWTParams {
  method: string;
  coef: string;
  layer: string | number;
  measurement: string;
  startTime: DateModelType;
  endTime: DateModelType;
}

export interface DataCountParams {
  measurement: string;
  startTime: DateModelType;
  endTime: DateModelType;
}

export interface SpectrumPassParams {
  udf: string;
  wpass: number | string;
  measurement: string;
  startTime: DateModelType;
  endTime: DateModelType;
}
export interface PatternMatchParams {
  // 模式匹配：pattern_match
  udf: string;
  // 待匹配测点
  patternSeries: string;
  // 待匹配序列数据开始时间
  patternStartTime: DateModelType;
  // 待匹配序列数据结束时间
  patternEndTime: DateModelType;
  // 对比数据时间
  times?: string[];
  // 对比数据
  values?: string[];
  // 对比测点
  partSeries?: string;
  // 对比片段数据开始时间
  partStartTime?: DateModelType;
  // 对比片段数据结束时间
  partEndTime?: DateModelType;
  // 相似度阈值
  threshold?: number | string;
}

export interface SpectrumData {
  timestamps: number[];
  values: string[];
}

export interface MatchItem {
  distance: number;
  startTime: number;
  endTime: number;
  checked?: boolean;
}
export interface MatchResp {
  patternTimestamps: number[];
  patternRawTimestamps: number[];
  patternValues: string[];
  partTimestamps: number[];
  partValues: string[];
  matchValue: MatchItem[];
}

export interface ParsingMatchDataRes {
  status: boolean;
  errMsg: string;
  successNum: number;
  failNum: number;
  filePath: string;
  times: string[];
  values: string[];
}
