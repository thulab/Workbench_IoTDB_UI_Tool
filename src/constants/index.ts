import zhLocale from 'element-plus/es/locale/lang/zh-cn';
import enLocale from 'element-plus/es/locale/lang/en';
import deLocale from 'element-plus/es/locale/lang/de';

export const langMap = { cn: 0, en: 1, de: 2 };
export const langIndexMap = { 0: 'cn', 1: 'en', 2: 'de' };
export const langName = [zhLocale.name, enLocale.name, deLocale.name];
export const langNameMap = {
  cn: langName[0],
  en: langName[1],
  de: langName[2],
};

// 数据查询 函数树
export const functionTreeData = [
  {
    label: '聚合函数',
    value: 'sqlSearch.Aggregate',
    children: [
      { label: '求和', value: 'SUM' },
      { label: '计算数据点数', value: 'COUNT' },
      { label: '求平均值', value: 'AVG' },
      { label: '求具有最大绝对值的值。如果正值和负值的最大绝对值相等，则返回正值。', value: 'EXTREME' },
      { label: '求最大值', value: 'MAX_VALUE' },
      { label: '求最小值', value: 'MIN_VALUE' },
      { label: '求时间戳最小的值', value: 'FIRST_VALUE' },
      { label: '求时间戳最大的值', value: 'LAST_VALUE' },
      { label: '求最大时间戳', value: 'MAX_TIME' },
      { label: '求最小时间戳', value: 'MIN_TIME' },
    ],
  },
  {
    label: '数学函数',
    value: 'sqlSearch.Mathematical',
    children: [
      { label: '正弦函数', value: 'SIN' },
      { label: '余弦函数', value: 'COS' },
      { label: '正切函数', value: 'TAN' },
      { label: '反正弦函数', value: 'ASIN' },
      { label: '反余弦函数', value: 'ACOS' },
      { label: '反正切函数', value: 'ATAN' },
      { label: '双曲正弦函数', value: 'SINH' },
      { label: '双曲余弦函数', value: 'COSH' },
      { label: '双曲正切函数', value: 'TANH' },
      { label: '转角度', value: 'DEGREES' },
      { label: '转弧度', value: 'RADIANS' },
      { label: '求绝对值', value: 'ABS' },
      { label: '符号函数', value: 'SIGN' },
      { label: '向上取整', value: 'CEIL' },
      { label: '向下取整', value: 'FLOOR' },
      { label: '四舍五入', value: 'ROUND' },
      { label: '以e为底的指数', value: 'EXP' },
      { label: '以e为底的对数', value: 'LN' },
      { label: '以10为底的对数', value: 'LOG10' },
      { label: '求平方根', value: 'SQRT' },
    ],
  },
  {
    label: '比较函数',
    value: 'sqlSearch.Comparison',
    children: [
      { label: '返回ts_value >= threshold的bool值', value: 'ON_OFF' },
      { label: '返回ts_value >= lower && ts_value <= upper的bool值', value: 'IN_RANGE' },
    ],
  },
  {
    label: '字符串处理函数',
    value: 'sqlSearch.Logical',
    children: [
      { label: '判断字符串中是否存在s', value: 'STRING_CONTAINS' },
      { label: '判断字符串是否能够被正则表达式regex匹配', value: 'STRING_MATCHES' },
      { label: '返回字符串的长度', value: 'LENGTH' },
      { label: '获取target子串第一次出现在输入序列的位置，如果输入序列中不包含target则返回 -1', value: 'LOCATE' },
      { label: '判断字符串是否有指定前缀', value: 'STARTSWITH' },
      { label: '判断字符串是否有指定后缀', value: 'ENDSWITH' },
      { label: '拼接字符串和target字串', value: 'CONCAT' },
      { label: '获取下标从start到end - 1的子串', value: 'SUBSTR' },
      { label: '将字符串转化为大写', value: 'UPPER' },
      { label: '将字符串转化为小写', value: 'LOWER' },
      { label: '移除字符串前后的空格', value: 'TRIM' },
      { label: '用于比较两个输入序列，如果值相同返回 0 , 序列1的值小于序列2的值返回一个负数，序列1的值大于序列2的值返回一个正数', value: 'STRCMP' },
    ],
  },
  {
    label: '数据类型转换函数',
    value: 'sqlSearch.Conversion',
    children: [
      { label: '将数据转换为type参数指定的类型', value: 'CAST' },
    ],
  },
  {
    label: '常序列生成函数',
    value: 'sqlSearch.Constant',
    children: [
      { label: '根据输入属性 value 和 type 输出用户指定的常序列', value: 'CONST' },
      { label: '常序列的值：π 的 double 值，圆的周长与其直径的比值，即圆周率，等于 Java标准库 中的Math.PI', value: 'PI' },
      { label: '常序列的值：e 的 double 值，自然对数的底，它等于 Java 标准库 中的 Math.E', value: 'E' },
    ],
  },
  {
    label: '选择函数',
    value: 'sqlSearch.Selection',
    children: [
      { label: '返回某时间序列中值最大的k个数据点。若多于k个数据点的值并列最大，则返回时间戳最小的数据点', value: 'TOP_K' },
      { label: '返回某时间序列中值最小的k个数据点。若多于k个数据点的值并列最小，则返回时间戳最小的数据点', value: 'BOTTOM_K' },
    ],
  },
  {
    label: '区间查询函数',
    value: 'sqlSearch.ContinuousInterval',
    children: [
      { label: '返回时间序列连续为0(false)的开始时间与持续时间，持续时间t(单位ms)满足t >= min && t <= max', value: 'ZERO_DURATION' },
      { label: '返回时间序列连续不为0(false)的开始时间与持续时间，持续时间t(单位ms)满足t >= min && t <= max', value: 'NON_ZERO_DURATION' },
      { label: '返回时间序列连续为0(false)的开始时间与其后数据点的个数，数据点个数n满足n >= min && n <= max', value: 'ZERO_COUNT' },
      { label: '返回时间序列连续不为0(false)的开始时间与其后数据点的个数，数据点个数n满足n >= min && n <= max', value: 'NON_ZERO_COUNT' },
    ],
  },
  {
    label: '趋势计算函数',
    value: 'sqlSearch.VariationTrend',
    children: [
      { label: '统计序列中某数据点的时间戳与前一数据点时间戳的差。范围内第一个数据点没有对应的结果输出', value: 'TIME_DIFFERENCE' },
      { label: '统计序列中某数据点的值与前一数据点的值的差。范围内第一个数据点没有对应的结果输出', value: 'DIFFERENCE' },
      { label: '统计序列中某数据点的值与前一数据点的值的差的绝对值。范围内第一个数据点没有对应的结果输出', value: 'NON_NEGATIVE_DIFFERENCE' },
      { label: '统计序列中某数据点相对于前一数据点的变化率，数量上等同于 DIFFERENCE / TIME_DIFFERENCE。范围内第一个数据点没有对应的结果输出', value: 'DERIVATIVE' },
      { label: '统计序列中某数据点相对于前一数据点的变化率的绝对值，数量上等同于 NON_NEGATIVE_DIFFERENCE / TIME_DIFFERENCE。范围内第一个数据点没有对应的结果输出', value: 'NON_NEGATIVE_DERIVATIVE' },
      { label: '统计序列中某数据点的值与前一数据点的值的差。第一个数据点没有对应的结果输出，输出值为null', value: 'DIFF' },
    ],
  },
  {
    label: '采样函数',
    value: 'sqlSearch.Sample',
    children: [
      { label: '返回符合采样比例的等分桶随机采样', value: 'EQUAL_SIZE_BUCKET_RANDOM_SAMPLE' },
      { label: '返回符合采样比例的等分桶聚合采样', value: 'EQUAL_SIZE_BUCKET_AGG_SAMPLE' },
      { label: '返回符合采样比例的等分桶M4采样', value: 'EQUAL_SIZE_BUCKET_M4_SAMPLE' },
      { label: '返回符合采样比例和桶内采样个数的等分桶离群值采样', value: 'EQUAL_SIZE_BUCKET_OUTLIER_SAMPLE' },
      { label: '返回每个窗口内的第一个点（first）、最后一个点（last）、最小值点（bottom）、最大值点（top）。在一个窗口内的聚合点输出之前，M4会将它们按照时间戳递增排序并且去重', value: 'M4' },
    ],
  },
];
