export const LOCALE: { [key: string]: string } = {
  ZH_CN: 'zh-cn',
  EN: 'en',
  DE: 'de',
};

// 配置语言列表
export const localeList = [
  {
    label: '简体中文',
    locale: LOCALE.ZH_CN,
  },
  {
    label: 'English',
    locale: LOCALE.EN,
  },
  {
    label: 'German',
    locale: LOCALE.DE,
  },
];

// 数据查询 函数树
export const functionTreeData = [
  {
    label: '聚合函数',
    value: 'sqlSearch.Aggregate',
    children: [
      { label: '统计测点的个数', value: 'COUNT' },
      { label: '测点数据的平均值', value: 'AVG' },
      { label: '测点数据的和', value: 'SUM' },
      { label: '首次插入的数据值', value: 'FIRST_VALUE' },
      { label: '最新一次插入的数据值', value: 'LAST_VALUE' },
      { label: '最小的数据值', value: 'MIN_VALUE' },
      { label: '最大的数据值', value: 'MAX_VALUE' },
      { label: '最小的时间戳', value: 'MIN_TIME' },
      { label: '最大的时间戳', value: 'MAX_TIME' },
    ],
  },
  {
    label: '数学函数',
    value: 'sqlSearch.math',
    children: [
      { label: '正弦函数', value: 'SIN' },
      { label: '余弦函数', value: 'COS' },
      { label: '正切函数', value: 'TAN' },
      { label: '反正弦函数', value: 'ASIN' },
      { label: '反余弦函数', value: 'ACOS' },
      { label: '反正切函数', value: 'ATAN' },
      { label: '转角度', value: 'DEGREES' },
      { label: '转弧度', value: 'RADIANS' },
      { label: '符号函数', value: 'SIGN' },
      { label: '向上取整', value: 'CEIL' },
      { label: '向下取整', value: 'FLOOR' },
      { label: '四舍五入', value: 'ROUND' },
      { label: '以e为底的指数', value: 'EXP' },
      { label: '以e为底的对数', value: 'LN' },
      { label: '以10为底的对数', value: 'LOG10' },
      { label: '求平方根', value: 'SQRT' },
      { label: '求绝对值', value: 'ABS' },
    ],
  },
  {
    label: '字符串函数',
    value: 'sqlSearch.string',
    children: [
      { label: '用于判断字符串中是否存在字符串s', value: 'STRING_CONTAINS' },
      { label: '用于判断字符串是否能够被正则表达式regex匹配', value: 'STRING_MATCHES' },
    ],
  },
  {
    label: '选择函数',
    value: 'sqlSearch.select',
    children: [
      { label: '返回某测点中值最大的k个数据点', value: 'TOP_K' },
      { label: '返回某测点中值最小的k个数据点', value: 'BOTTOM_K' },
    ],
  },
  {
    label: '趋势计算函数',
    value: 'sqlSearch.sum',
    children: [
      { label: '统计测点中某数据点的时间戳与前一数据点时间戳的差', value: 'TIME_DIFFERENCE' },
      { label: '统计测点中某数据点的值与前一数据点的值的差', value: 'DIFFERENCE' },
      { label: '统计测点中某数据点的值与前一数据点的值的差的绝对值', value: 'NON_NEGATIVE_DIFFERENCE' },
      { label: '统计测点中某数据点相对于前一数据点的变化率', value: 'DERIVATIVE' },
      { label: '统计测点中某数据点相对于前一数据点的变化率的绝对值', value: 'NON_NEGATIVE_DERIVATIVE' },
    ],
  },
  {
    label: '时间函数',
    value: 'sqlSearch.date',
    children: [{ label: '表示当前时间', value: 'NOW' }],
  },
];
