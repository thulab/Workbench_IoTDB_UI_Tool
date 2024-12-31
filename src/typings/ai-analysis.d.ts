declare namespace AIAnalysis {
  export interface Model {
    modelId: string;
    modelType: string;
    modelTypeValue: string;
    state: string;
    configs: string;
  }
  export interface SearchCondition {
    // 业务场景(预测：BUILT_IN_FORECAST；异常检测：BUILT_IN_ANOMALY_DETECTION；自定义：USER_DEFINED)
    modelType: string;
    // 模型选择
    modelId: string;
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
  }
  export interface SearchDataItem {
    time: number;
    value: string;
    isAnomaly?: boolean;
  }
  export interface SearchDataResult {
    raw: SearchDataItem[];
    analysis: SearchDataItem[];
    rawRange?: SearchDataItem[];
  }

  export interface CustomItem {
    name: string;
    value: string[];
  }
}
