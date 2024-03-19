import zhLocale from 'element-plus/es/locale/lang/zh-cn';
import enLocale from 'element-plus/es/locale/lang/en';
// import deLocale from 'element-plus/es/locale/lang/de';

export const langMap = { cn: 0, en: 1 };
export const langIndexMap = { 0: 'cn', 1: 'en' };
export const langName = [zhLocale.name, enLocale.name];
export const langNameMap = {
  cn: langName[0],
  en: langName[1],
  // de: langName[2],
};

// 数据查询 函数树
export const functionTreeData = [
  {
    label: 'searchIotdb.aggregate',
    value: 'sqlSearch.Aggregate',
    children: [
      { label: 'searchIotdb.sum', value: 'SUM' },
      { label: 'searchIotdb.count', value: 'COUNT' },
      { label: 'searchIotdb.count', value: 'AVG' },
      { label: 'searchIotdb.extreme', value: 'EXTREME' },
      { label: 'searchIotdb.maxValue', value: 'MAX_VALUE' },
      { label: 'searchIotdb.minValue', value: 'MIN_VALUE' },
      { label: 'searchIotdb.firstValue', value: 'FIRST_VALUE' },
      { label: 'searchIotdb.lastValue', value: 'LAST_VALUE' },
      { label: 'searchIotdb.maxTime', value: 'MAX_TIME' },
      { label: 'searchIotdb.minTime', value: 'MIN_TIME' },
    ],
  },
  {
    label: 'searchIotdb.math',
    value: 'sqlSearch.Mathematical',
    children: [
      { label: 'searchIotdb.sin', value: 'SIN' },
      { label: 'searchIotdb.cos', value: 'COS' },
      { label: 'searchIotdb.tan', value: 'TAN' },
      { label: 'searchIotdb.asin', value: 'ASIN' },
      { label: 'searchIotdb.acos', value: 'ACOS' },
      { label: 'searchIotdb.atan', value: 'ATAN' },
      { label: 'searchIotdb.sinh', value: 'SINH' },
      { label: 'searchIotdb.cosh', value: 'COSH' },
      { label: 'searchIotdb.tanh', value: 'TANH' },
      { label: 'searchIotdb.degrees', value: 'DEGREES' },
      { label: 'searchIotdb.radians', value: 'RADIANS' },
      { label: 'searchIotdb.abs', value: 'ABS' },
      { label: 'searchIotdb.sign', value: 'SIGN' },
      { label: 'searchIotdb.ceil', value: 'CEIL' },
      { label: 'searchIotdb.floor', value: 'FLOOR' },
      { label: 'searchIotdb.round', value: 'ROUND' },
      { label: 'searchIotdb.exp', value: 'EXP' },
      { label: 'searchIotdb.ln', value: 'LN' },
      { label: 'searchIotdb.log10', value: 'LOG10' },
      { label: 'searchIotdb.sqrt', value: 'SQRT' },
    ],
  },
  {
    label: 'searchIotdb.comparison',
    value: 'sqlSearch.Comparison',
    children: [
      { label: 'searchIotdb.onOff', value: 'ON_OFF' },
      { label: 'searchIotdb.inRange', value: 'IN_RANGE' },
    ],
  },
  {
    label: 'searchIotdb.logical',
    value: 'sqlSearch.Logical',
    children: [
      { label: 'searchIotdb.stringContains', value: 'STRING_CONTAINS' },
      { label: 'searchIotdb.stringMatches', value: 'STRING_MATCHES' },
      { label: 'searchIotdb.length', value: 'LENGTH' },
      { label: 'searchIotdb.locate', value: 'LOCATE' },
      { label: 'searchIotdb.startsWith', value: 'STARTSWITH' },
      { label: 'searchIotdb.endsWith', value: 'ENDSWITH' },
      { label: 'searchIotdb.concat', value: 'CONCAT' },
      { label: 'searchIotdb.substr', value: 'SUBSTR' },
      { label: 'searchIotdb.upper', value: 'UPPER' },
      { label: 'searchIotdb.lower', value: 'LOWER' },
      { label: 'searchIotdb.trim', value: 'TRIM' },
      { label: 'searchIotdb.strcmp', value: 'STRCMP' },
    ],
  },
  {
    label: 'searchIotdb.conversion',
    value: 'sqlSearch.Conversion',
    children: [{ label: 'searchIotdb.cast', value: 'CAST' }],
  },
  {
    label: 'searchIotdb.constant',
    value: 'sqlSearch.Constant',
    children: [
      { label: 'searchIotdb.const', value: 'CONST' },
      { label: 'searchIotdb.pi', value: 'PI' },
      { label: 'searchIotdb.e', value: 'E' },
    ],
  },
  {
    label: 'searchIotdb.selection',
    value: 'sqlSearch.Selection',
    children: [
      { label: 'searchIotdb.topK', value: 'TOP_K' },
      { label: 'searchIotdb.bottomK', value: 'BOTTOM_K' },
    ],
  },
  {
    label: 'searchIotdb.continuousInterval',
    value: 'sqlSearch.ContinuousInterval',
    children: [
      { label: 'searchIotdb.zeroDuration', value: 'ZERO_DURATION' },
      { label: 'searchIotdb.nonZeroDuration', value: 'NON_ZERO_DURATION' },
      { label: 'searchIotdb.zeroCount', value: 'ZERO_COUNT' },
      { label: 'searchIotdb.nonZeroCount', value: 'NON_ZERO_COUNT' },
    ],
  },
  {
    label: 'searchIotdb.variationTrend',
    value: 'sqlSearch.VariationTrend',
    children: [
      { label: 'searchIotdb.timeDifference', value: 'TIME_DIFFERENCE' },
      { label: 'searchIotdb.difference', value: 'DIFFERENCE' },
      { label: 'searchIotdb.nonNegativeDifference', value: 'NON_NEGATIVE_DIFFERENCE' },
      { label: 'searchIotdb.derivative', value: 'DERIVATIVE' },
      { label: 'searchIotdb.nonNegativeDerivative', value: 'NON_NEGATIVE_DERIVATIVE' },
      { label: 'searchIotdb.diff', value: 'DIFF' },
    ],
  },
  {
    label: 'searchIotdb.sample',
    value: 'sqlSearch.Sample',
    children: [
      { label: 'searchIotdb.equalSizeBucketRandomSample', value: 'EQUAL_SIZE_BUCKET_RANDOM_SAMPLE' },
      { label: 'searchIotdb.equalSizeBucketAggSample', value: 'EQUAL_SIZE_BUCKET_AGG_SAMPLE' },
      { label: 'searchIotdb.equalSizeBucketM4Sample', value: 'EQUAL_SIZE_BUCKET_M4_SAMPLE' },
      { label: 'searchIotdb.equalSizeBucketOutlierSample', value: 'EQUAL_SIZE_BUCKET_OUTLIER_SAMPLE' },
      { label: 'searchIotdb.m4', value: 'M4' },
    ],
  },
];
