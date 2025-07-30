/* eslint-disable no-unused-vars */
declare namespace AIAnalysis {
  export interface Model {
    modelId: string;
    modelType: string;
    category: string;
    categoryString: string;
    state: string;
    stateString: string;
    configs: string;
  }
  export interface SearchCondition {
    // 业务场景(预测：BUILT_IN_FORECAST；异常检测：BUILT_IN_ANOMALY_DETECTION；自定义：USER_DEFINED)
    modelType: string;
    // 模型选择
    modelId: string | string[];
    // 测点
    measurement: string;
    // 开始时间
    startTime: number;
    // 异常检测结束时间
    endTime?: number;
    // 预测数据范围
    predictLength?: number;
    // 异常比例
    exceptionPercent?: number;
    // 预测数据点数
    forecastCount?: number;
    // 预测数据依据点数
    forecastTailCount?: number;
    // "database"."table"
    path?: string;
    tags?: string[];
  }
  export interface SearchDataItem {
    time: number;
    value?: string;
    // 预测时多模型数据，key为 modelId_value
    [key: string]: string | number | undefined | boolean;
    isAnomaly?: boolean;
  }
  export interface SearchDataResult {
    raw: SearchDataItem[];
    analysis: Record<string, SearchDataItem[]>;
    rawRange?: SearchDataItem[];
  }

  export interface AnalysisVo {
    modelId: string;
    data: SearchDataItem[];
  }

  export interface CustomItem {
    name: string;
    value: string[];
  }

  export interface FineTuningData {
    rawModelId: string;
    tunedModelId: string;
    // 树模型时为：测点 root.sg1.d1.s1 ; 表模型时为  database.table
    path: string;
    // 树模型无用; 表模型时为列名(测点列)
    field?: string;
    params?: string[];
  }
  export interface CascaderOption {
    label: string;
    value: string;
    children?: CascaderOption[];
  }
}
