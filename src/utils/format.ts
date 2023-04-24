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
