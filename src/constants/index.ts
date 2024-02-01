import zhLocale from 'element-plus/es/locale/lang/zh-cn';
import enLocale from 'element-plus/es/locale/lang/en';
// import deLocale from 'element-plus/es/locale/lang/de';
import i18n from '@/locale/index';

const { t } = i18n.global;
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
    label: t('searchIotdb.aggregate'),
    value: 'sqlSearch.Aggregate',
    children: [
      { label: t('searchIotdb.sum'), value: 'SUM' },
      { label: t('searchIotdb.count'), value: 'COUNT' },
      { label: t('searchIotdb.count'), value: 'AVG' },
      { label: t('searchIotdb.extreme'), value: 'EXTREME' },
      { label: t('searchIotdb.maxValue'), value: 'MAX_VALUE' },
      { label: t('searchIotdb.minValue'), value: 'MIN_VALUE' },
      { label: t('searchIotdb.firstValue'), value: 'FIRST_VALUE' },
      { label: t('searchIotdb.lastValue'), value: 'LAST_VALUE' },
      { label: t('searchIotdb.maxTime'), value: 'MAX_TIME' },
      { label: t('searchIotdb.minTime'), value: 'MIN_TIME' },
    ],
  },
  {
    label: t('searchIotdb.math'),
    value: 'sqlSearch.Mathematical',
    children: [
      { label: t('searchIotdb.sin'), value: 'SIN' },
      { label: t('searchIotdb.cos'), value: 'COS' },
      { label: t('searchIotdb.tan'), value: 'TAN' },
      { label: t('searchIotdb.asin'), value: 'ASIN' },
      { label: t('searchIotdb.acos'), value: 'ACOS' },
      { label: t('searchIotdb.atan'), value: 'ATAN' },
      { label: t('searchIotdb.sinh'), value: 'SINH' },
      { label: t('searchIotdb.cosh'), value: 'COSH' },
      { label: t('searchIotdb.tanh'), value: 'TANH' },
      { label: t('searchIotdb.degrees'), value: 'DEGREES' },
      { label: t('searchIotdb.padins'), value: 'RADIANS' },
      { label: t('searchIotdb.abs'), value: 'ABS' },
      { label: t('searchIotdb.sign'), value: 'SIGN' },
      { label: t('searchIotdb.ceil'), value: 'CEIL' },
      { label: t('searchIotdb.floor'), value: 'FLOOR' },
      { label: t('searchIotdb.round'), value: 'ROUND' },
      { label: t('searchIotdb.exp'), value: 'EXP' },
      { label: t('searchIotdb.ln'), value: 'LN' },
      { label: t('searchIotdb.log10'), value: 'LOG10' },
      { label: t('searchIotdb.sqrt'), value: 'SQRT' },
    ],
  },
  {
    label: t('searchIotdb.comparison'),
    value: 'sqlSearch.Comparison',
    children: [
      { label: t('searchIotdb.onOff'), value: 'ON_OFF' },
      { label: t('searchIotdb.inRange'), value: 'IN_RANGE' },
    ],
  },
  {
    label: t('searchIotdb.logical'),
    value: 'sqlSearch.Logical',
    children: [
      { label: t('searchIotdb.stringContains'), value: 'STRING_CONTAINS' },
      { label: t('searchIotdb.stringMathes'), value: 'STRING_MATCHES' },
      { label: t('searchIotdb.length'), value: 'LENGTH' },
      { label: t('searchIotdb.locate'), value: 'LOCATE' },
      { label: t('searchIotdb.startSwith'), value: 'STARTSWITH' },
      { label: t('searchIotdb.endSwitch'), value: 'ENDSWITH' },
      { label: t('searchIotdb.concat'), value: 'CONCAT' },
      { label: t('searchIotdb.substr'), value: 'SUBSTR' },
      { label: t('searchIotdb.upper'), value: 'UPPER' },
      { label: t('searchIotdb.lower'), value: 'LOWER' },
      { label: t('searchIotdb.trim'), value: 'TRIM' },
      { label: t('searchIotdb.strcmp'), value: 'STRCMP' },
    ],
  },
  {
    label: t('searchIotdb.conversion'),
    value: 'sqlSearch.Conversion',
    children: [
      { label: t('searchIotdb.cast'), value: 'CAST' },
    ],
  },
  {
    label: t('searchIotdb.constant'),
    value: 'sqlSearch.Constant',
    children: [
      { label: t('searchIotdb.const'), value: 'CONST' },
      { label: t('searchIotdb.pi'), value: 'PI' },
      { label: t('searchIotdb.e'), value: 'E' },
    ],
  },
  {
    label: t('searchIotdb.selection'),
    value: 'sqlSearch.Selection',
    children: [
      { label: t('searchIotdb.topK'), value: 'TOP_K' },
      { label: t('searchIotdb.bottomK'), value: 'BOTTOM_K' },
    ],
  },
  {
    label: t('searchIotdb.continuousInterval'),
    value: 'sqlSearch.ContinuousInterval',
    children: [
      { label: t('searchIotdb.zeroDuration'), value: 'ZERO_DURATION' },
      { label: t('searchIotdb.nonZeroDuration'), value: 'NON_ZERO_DURATION' },
      { label: t('searchIotdb.zeroCount'), value: 'ZERO_COUNT' },
      { label: t('searchIotdb.nonZeroCount'), value: 'NON_ZERO_COUNT' },
    ],
  },
  {
    label: t('searchIotdb.variationTrend'),
    value: 'sqlSearch.VariationTrend',
    children: [
      { label: t('searchIotdb.timeDifference'), value: 'TIME_DIFFERENCE' },
      { label: t('searchIotdb.difference'), value: 'DIFFERENCE' },
      { label: t('searchIotdb.nonNegativeDifference'), value: 'NON_NEGATIVE_DIFFERENCE' },
      { label: t('searchIotdb.derivative'), value: 'DERIVATIVE' },
      { label: t('searchIotdb.nonNegativeDerivative'), value: 'NON_NEGATIVE_DERIVATIVE' },
      { label: t('searchIotdb.diff'), value: 'DIFF' },
    ],
  },
  {
    label: t('searchIotdb.sample'),
    value: 'sqlSearch.Sample',
    children: [
      { label: t('searchIotdb.equalSizeBucketRandomSample'), value: 'EQUAL_SIZE_BUCKET_RANDOM_SAMPLE' },
      { label: t('searchIotdb.equalSizeBucketAggSample'), value: 'EQUAL_SIZE_BUCKET_AGG_SAMPLE' },
      { label: t('searchIotdb.equalSizeBucketM4Sample'), value: 'EQUAL_SIZE_BUCKET_M4_SAMPLE' },
      { label: t('searchIotdb.equalSizeBucketOutlierSample'), value: 'EQUAL_SIZE_BUCKET_OUTLIER_SAMPLE' },
      { label: t('searchIotdb.m4'), value: 'M4' },
    ],
  },
];
