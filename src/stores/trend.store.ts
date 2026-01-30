import { defineStore } from 'pinia';
import type { TimeRange } from '@/types/trend';

const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;

export const useTreeHistoryTrendStore = defineStore('treeHistoryTrend', {
  state: () => ({
    globalTimeRange: { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() } as TimeRange,
    visibleTimeRange: { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() } as TimeRange,
    pendingTimeRange: { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() } as TimeRange,
    measurementAverageInterval: new Map<string, number>(),
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
    updateMeasurementAverageInterval(measurement: string, interval: number) {
      this.measurementAverageInterval.set(measurement, interval);
    },
    initializeState() {
      this.globalTimeRange = { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() };
      this.visibleTimeRange = { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() };
      this.pendingTimeRange = { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() };
      this.measurementAverageInterval.clear();
    },
  },
});

export const useTreeRunningTrendStore = defineStore('treeRunningTrend', {
  state: () => ({
    min: -1,
    isPlaying: true,
    visibleTimeRange: { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() } as TimeRange,
    measurementAverageInterval: new Map<string, number>(),
  }),

  actions: {
    setMin(value: number) {
      this.min = value;
    },
    setIsPlaying(value: boolean) {
      this.isPlaying = value;
    },
    setVisibleTimeRange(range: TimeRange) {
      this.visibleTimeRange = range;
    },
    updateMeasurementAverageInterval(measurement: string, interval: number) {
      this.measurementAverageInterval.set(measurement, interval);
    },
  },
});

export const useTableHistoryTrendStore = defineStore('tableHistoryTrend', {
  state: () => ({
    globalTimeRange: { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() } as TimeRange,
    visibleTimeRange: { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() } as TimeRange,
    pendingTimeRange: { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() } as TimeRange,
    measurementAverageInterval: new Map<string, number>(),
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
    updateMeasurementAverageInterval(measurement: string, interval: number) {
      this.measurementAverageInterval.set(measurement, interval);
    },
    initializeState() {
      this.globalTimeRange = { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() };
      this.visibleTimeRange = { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() };
      this.pendingTimeRange = { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() };
      this.measurementAverageInterval.clear();
    },
  },
});

export const useTableRunningTrendStore = defineStore('tableRunningTrend', {
  state: () => ({
    min: -1,
    isPlaying: true,
    visibleTimeRange: { start: Date.now() - SEVEN_DAYS_MS, end: Date.now() } as TimeRange,
    measurementAverageInterval: new Map<string, number>(),
  }),

  actions: {
    setMin(value: number) {
      this.min = value;
    },
    setIsPlaying(value: boolean) {
      this.isPlaying = value;
    },
    setVisibleTimeRange(range: TimeRange) {
      this.visibleTimeRange = range;
    },
    updateMeasurementAverageInterval(measurement: string, interval: number) {
      this.measurementAverageInterval.set(measurement, interval);
    },
  },
});
