export { formatDate } from './date';
export const formatTimeseries = (timeseries: string, prefix?: string) => {
  if (!timeseries) {
    return '';
  }
  if (prefix) {
    return timeseries.replace(`${prefix}.`, '');
  }
  return timeseries.substring(timeseries.lastIndexOf('.') + 1);
};

export const getOptionField = (val: string | number | boolean | undefined | null, options: Array<Record<string, any>>, valueFiled: string = 'value', labelField: string = 'name') => {
  if (val === null || val === undefined || val === '') return '';
  const data = options.find((f) => f[valueFiled] === val);
  return data ? data[labelField] : '';
};

export function toThousands(num: number) {
  if (num === 0) return num;
  const resNum = `${num}`;
  if (resNum.length < 6) return resNum;
  return resNum.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
}
