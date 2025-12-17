import { defineStore } from 'pinia';
import type { TimeRange } from '@/types/trend';

export const useTableHistoryTrendStore = defineStore('tableHistoryTrend', {
  state: () => ({
    globalTimeRange: { start: Date.now() - 12 * 3600 * 1000, end: Date.now() } as TimeRange,
    visibleTimeRange: { start: Date.now() - 12 * 3600 * 1000, end: Date.now() } as TimeRange,
    pendingTimeRange: { start: Date.now() - 12 * 3600 * 1000, end: Date.now() } as TimeRange,
  }),

  actions: {
    setGlobalTimeRange(range: TimeRange) {
      this.globalTimeRange = range;
    },
    setVisibleTimeRange(range: TimeRange) {
      this.visibleTimeRange = range;
    },
    setPendingTimeRange(range: TimeRange) {
      this.pendingTimeRange = range;
    },
  },
});

export default useTableHistoryTrendStore;
