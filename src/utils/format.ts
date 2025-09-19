import type { SelectedMeasurement } from '@/types';
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

export function toThousands(num: number, defaultFormat: string = '') {
  if (num === 0) return num;
  if (!num) return defaultFormat;
  const resNum = `${num}`;
  if (resNum.length < 6) return resNum;
  return resNum.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
}

export function transformDecimal(num: number, point: number) {
  let decimalNum = null;
  const arr = num.toString().split('.');
  if (arr.length > 1 && arr[1]!.length > point) {
    const decimal = arr[1]!.slice(point, point + 1);
    if (decimal === '5') {
      num += 0.1 ** (point + 1);
    }
    decimalNum = num.toFixed(point);
  } else {
    decimalNum = num;
  }
  decimalNum = Number(decimalNum);
  return decimalNum;
}

export function limitMax(num: number, max: number) {
  if (num > max) return max;
  return num;
}

export function formatSelectedMeasurement(data: SelectedMeasurement) {
  const tags = formatDevice(data.device);
  return `${data.database || ''}.${data.tableName || ''}.${data.measurement}${tags ? `(${tags})` : ''}`;
}

function formatDevice(
  device: {
    variable: string;
    value?: string;
  }[],
) {
  return device
    .filter((item) => item.value)
    .map((item) => item.value)
    .join(', ');
  // '-' +
  // measurement
}
