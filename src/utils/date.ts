import dayjs from 'dayjs';

export const formatDate = (date: number | string, format = 'YYYY-MM-DD HH:mm:ss.SSS') => {
  if (!date) {
    return '';
  }
  return dayjs(new Date(date)).format(format);
};

export const timestamp = (date: number | string) => dayjs(new Date(date)).valueOf();

export const getStartAndEnd = (day: number = 7): [number, number] => [dayjs(dayjs().format('YYYY-MM-DD 00:00:00')).valueOf() - day * 24 * 60 * 60 * 1000, dayjs(dayjs().format('YYYY-MM-DD 23:59:59')).valueOf()];

export const today = () => dayjs(dayjs().format('YYYY-MM-DD 23:59:59')).valueOf();

// 此刻
export const todayNow = () => dayjs(dayjs().format('YYYY-MM-DD HH:mm:ss')).valueOf();

// 某天
export const getOneDay = (day: number = 7) => dayjs(dayjs().format('YYYY-MM-DD 23:59:59')).valueOf() - day * 24 * 60 * 60 * 1000;

// 某段时间间隔
export const getOneInterval = (day: number = 7): [number, number] => [dayjs(dayjs(new Date()).format('YYYY-MM-DD 00:00:00')).valueOf() - day * 24 * 60 * 60 * 1000, dayjs(dayjs(new Date()).format('YYYY-MM-DD 23:59:59')).valueOf() - 24 * 60 * 60 * 1000];

// 此刻-某段时间间隔
export const getOneIntervalNow = (day: number = 7): [number, number] => [dayjs(dayjs().format('YYYY-MM-DD HH:mm:ss')).valueOf() - day * 24 * 60 * 60 * 1000, dayjs(dayjs().format('YYYY-MM-DD HH:mm:ss')).valueOf()];
