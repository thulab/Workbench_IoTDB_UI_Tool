<template>
  <div @drop="handleDrop" @dragover.prevent class="graph-border border-box mt-4px pb-22px rounded-[2px]">
    <div class="pb-[8px] flex items-center">
      <div class="">
        <button class="ml-27px mr-28px border-none bg-transparent flex cursor-pointer items-center p-0!" @click="handleDeleteGroup">
          <el-icon size="15"><i-custom-close-circle /></el-icon>
        </button>
      </div>
      <el-scrollbar class="flex-1">
        <div class="fit-content flex items-center">
          <div v-for="measurement in props.group.members" class="mr-27px flex flex-shrink-0 items-center" :key="measurement.label">
            <div class="mr-8px rounded-[2px] h-12px w-12px" :style="`background: ${measurement.color}`"></div>
            <el-tooltip
              v-if="!props.isRunning && (measurementCondition.get(measurement.id) === 2 || measurementCondition.get(measurement.id) === 3)"
              class="box-item"
              effect="light"
              placement="top"
              :content="measurementCondition.get(measurement.id) === 3 ? t('dataTrend.measurementTip', { measurement: '' }) : t('dataTrend.noDataTip')"
            >
              <el-icon size="12" class="mr-[2px]"><i-custom-warning-yellow /></el-icon>
            </el-tooltip>
            <div class="text-12px mr-11px" style="color: #424561">{{ measurement.label }}</div>
            <button class="border-none bg-transparent flex cursor-pointer items-center p-0!" @click="handleDeleteMeasurement(measurement.label)">
              <el-icon size="16" color="#A0A3B8"><i-custom-close /></el-icon>
            </button>
          </div>
        </div>
      </el-scrollbar>
      <div class="ml-[30px] mr-[10px] flex">
        <el-tooltip :content="t('common.export')" effect="light" placement="top">
          <button
            class="border-none bg-transparent flex items-center p-0!"
            @click="exportImage"
            :disabled="props.group.members.length === 0"
            :style="props.group.members.length === 0 ? 'cursor: not-allowed; opacity: 0.5;' : 'cursor: pointer; opacity: 1;'"
          >
            <el-icon><i-custom-export-trend /></el-icon>
          </button>
        </el-tooltip>
      </div>
    </div>
    <div ref="stageRef" class="mt-[-2px] relative">
      <div ref="trendChartRef" class="h-full w-full" :class="{ 'opacity-50': props.loading }" :style="{ height: typeof props.height === 'number' ? props.height + 'px' : props.height }"></div>
      <div v-if="!props.isRunning || !runningTrendStore.isPlaying" class="pointer-events-none inset-0 absolute" :class="{ 'opacity-50': props.loading }">
        <button
          v-for="handle in markerHandles"
          :key="handle.id"
          class="border-b-0 border-l-[1px] border-r-0 border-t-0 border-l-white/40 border-l-dashed bg-transparent w-0 cursor-ew-resize pointer-events-auto top-1 absolute disabled:border-l-white/25 disabled:pointer-events-none"
          type="button"
          :style="{ left: handle.left, borderColor: handle.color, height: props.index === 0 ? `calc(100% - 29px)` : `calc(100% - 15px)`, top: '10px' }"
          :disabled="props.loading"
          @pointerdown="(event) => onMarkerPointerDown(handle.id, event)"
        ></button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import type { ChartMarker, ChartGroupInput, Measurement, DataPoint, MeasurementMarkerData } from '@/types/trend';
import { TableDataApi, SearchApi } from '@/api';
import { formatSelectedMeasurement } from '@/utils/format';
import { useTableHistoryTrendStore, useTableRunningTrendStore, useTreeHistoryTrendStore, useTreeRunningTrendStore } from '@/stores/trend.store';
import type { TrendData } from '@/types';

const { t } = useI18n();
const { requestFn: getHistoryTrend } = useRequest(TableDataApi.getTrendHistoryData);
const { requestFn: getTreeHistoryTrend } = useRequest(SearchApi.getHistoryTrend);

const GRID_LEFT = 34;
const GRID_RIGHT = 10;
const layoutTick = ref(0);
const isRefresh = ref(false);
const trendChartRef = ref<HTMLDivElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let ro: ResizeObserver | undefined;
let draggingId: string | null = null;

const props = withDefaults(
  defineProps<{
    isTable: boolean;
    isRunning: boolean;
    group: ChartGroupInput;
    markers: ChartMarker[];
    index: number;
    loading?: boolean;
    height?: number | string;
    needFetchData?: boolean;
    canDelete?: boolean;
    realTimeData?: TrendData[];
  }>(),
  {
    loading: false,
    // Default to false to avoid unexpected refetch on restore when parent forgets to pass the prop.
    needFetchData: false,
    canDelete: false,
  },
);

const trendStore = props.isTable ? useTableHistoryTrendStore() : useTreeHistoryTrendStore();
const runningTrendStore = props.isTable ? useTableRunningTrendStore() : useTreeRunningTrendStore();

const measurementsData = ref<Measurement[]>([]);
const markerValues = ref<MeasurementMarkerData[]>([]);
const measurementCondition = reactive(new Map(props.group.members.map((m) => [m.id, 1])));

function updateMarkerValues() {
  markerValues.value = measurementsData.value.map((measurement) => {
    const avgInterval = trendStore.measurementAverageInterval.get(measurement.label) || 0;
    const x1Marker = props.markers.find((marker) => marker.label === 'X1');
    const x2Marker = props.markers.find((marker) => marker.label === 'X2');
    const nearestPoint1 = nearestDataPoint(measurement, x1Marker ? x1Marker.timestamp : 0);
    const nearestPoint2 = nearestDataPoint(measurement, x2Marker ? x2Marker.timestamp : 0);
    const y1Value = x1Marker ? (Math.abs(nearestPoint1.timestamp - x1Marker.timestamp) <= 2 * avgInterval ? nearestPoint1.value : NaN) : NaN;
    const y2Value = x2Marker ? (Math.abs(nearestPoint2.timestamp - x2Marker.timestamp) <= 2 * avgInterval ? nearestPoint2.value : NaN) : NaN;
    return {
      name: measurement.label,
      x1: x1Marker ? x1Marker.timestamp : NaN,
      x2: x2Marker ? x2Marker.timestamp : NaN,
      x2_x1: x1Marker && x2Marker ? x2Marker.timestamp - x1Marker.timestamp : NaN,
      y1: y1Value,
      y2: y2Value,
      y2_y1: !isNaN(y1Value) && !isNaN(y2Value) ? y2Value - y1Value : NaN,
    };
  });
}

function updateRunningMarkerValues() {
  if (!props.realTimeData) return;
  markerValues.value = props.realTimeData.map((measurement) => {
    const avgInterval = runningTrendStore.measurementAverageInterval.get(measurement.path) || 0;
    const x1Marker = props.markers.find((marker) => marker.label === 'X1');
    const x2Marker = props.markers.find((marker) => marker.label === 'X2');
    const nearestPoint1 = nearestRunningDataPoint(measurement.path, x1Marker ? x1Marker.timestamp : 0);
    const nearestPoint2 = nearestRunningDataPoint(measurement.path, x2Marker ? x2Marker.timestamp : 0);
    const y1Value = x1Marker ? (Math.abs(nearestPoint1.timestamp - x1Marker.timestamp) <= 2 * avgInterval ? nearestPoint1.value : NaN) : NaN;
    const y2Value = x2Marker ? (Math.abs(nearestPoint2.timestamp - x2Marker.timestamp) <= 2 * avgInterval ? nearestPoint2.value : NaN) : NaN;
    return {
      name: measurement.path,
      x1: x1Marker ? x1Marker.timestamp : NaN,
      x2: x2Marker ? x2Marker.timestamp : NaN,
      x2_x1: x1Marker && x2Marker ? x2Marker.timestamp - x1Marker.timestamp : NaN,
      y1: y1Value,
      y2: y2Value,
      y2_y1: !isNaN(y1Value) && !isNaN(y2Value) ? y2Value - y1Value : NaN,
    };
  });
}

const emit = defineEmits<{
  drop: [payload: { groupId: string; measurementPath: string }];
  'marker-change': [payload: { id: string; timestamp: number }];
  'delete-group': [payload: { groupId: string }];
  'marker-value-change': [payload: MeasurementMarkerData[]];
  'delete-measurement': [payload: { groupId: string; measurementPath: string }];
  'update-range': [payload: { start: number; end: number }];
}>();

const markerHandles = computed(() => {
  // Re-compute positions when the chart/container is resized.
  // This matters on Windows multi-monitor setups where moving the window can
  // change effective CSS pixel sizes (per-monitor DPI) without changing marker timestamps.
  const tmp = layoutTick.value;
  const start = props.isRunning ? runningTrendStore.visibleTimeRange.start : trendStore.visibleTimeRange.start;
  const end = props.isRunning ? runningTrendStore.visibleTimeRange.end : trendStore.visibleTimeRange.end;
  if (tmp) {
    const width = getInnerWidth();
    const span = end - start || 1;
    return props.markers.map((marker) => {
      const ratio = (marker.timestamp - start) / span;
      const clamped = Math.min(Math.max(ratio, 0), 1);
      const left = GRID_LEFT + clamped * width;
      return {
        id: marker.id,
        label: marker.label,
        color: marker.color,
        left: `${left}px`,
      };
    });
  }
  const width = getInnerWidth();
  const span = end - start || 1;
  return props.markers.map((marker) => {
    const ratio = (marker.timestamp - start) / span;
    const clamped = Math.min(Math.max(ratio, 0), 1);
    const left = GRID_LEFT + clamped * width;
    return {
      id: marker.id,
      label: marker.label,
      color: marker.color,
      left: `${left}px`,
    };
  });
});

function nearestRunningDataPoint(path: string, timestamp: number): DataPoint {
  const series = props.realTimeData?.find((s) => s.path === path);
  if (!series || series.values.length === 0) return { timestamp, value: 0 };
  const values = series.values;
  const timestamps = series.timestamps;
  return nearestDataPointFromArrays(timestamps, values, timestamp);
}

function nearestDataPointFromArrays(timestamps: number[], values: string[], target: number): DataPoint {
  const len = timestamps.length;
  if (len === 0) {
    return { timestamp: target, value: 0 };
  }

  let left = 0;
  let right = len - 1;

  // 二分查找第一个 >= target 的位置
  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (Number(timestamps[mid]) < target) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  // left 是第一个 >= target 的索引
  const idx = left;

  // 边界处理
  if (idx === 0) {
    return {
      timestamp: Number(timestamps[0]),
      value: Number(values[0]),
    };
  }

  const prevIdx = idx - 1;

  const currDiff = Math.abs(Number(timestamps[idx]) - target);
  const prevDiff = Math.abs(Number(timestamps[prevIdx]) - target);

  return currDiff < prevDiff ? { timestamp: Number(timestamps[idx]), value: Number(values[idx]) } : { timestamp: Number(timestamps[prevIdx]), value: Number(values[prevIdx]) };
}

function nearestDataPoint(measurement: Measurement, timestamp: number): DataPoint {
  const values = measurement.values;
  if (values.length === 0) return { timestamp, value: 0 };
  let left = 0;
  let right = values.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midPoint = values[mid];
    if (!midPoint) break;
    if (midPoint.timestamp < timestamp) left = mid + 1;
    else right = mid;
  }
  const fallback = values[values.length - 1] ?? { timestamp, value: 0 };
  const candidate = values[left] ?? fallback;
  const previous = values[left - 1] ?? candidate;
  return Math.abs(candidate.timestamp - timestamp) < Math.abs(previous.timestamp - timestamp) ? candidate : previous;
}

function getTableHistoryData(measurement: Measurement) {
  if (!measurement.details) return;
  getHistoryTrend({
    database: measurement.details.database,
    tableName: measurement.details.tableName,
    fieldCondition: [
      {
        variable: measurement.details.measurement,
        value: measurement.details.condition,
        database: measurement.details.database,
        tableName: measurement.details.tableName,
        path: formatSelectedMeasurement(measurement.details),
      },
    ],
    startTime: trendStore.visibleTimeRange.start,
    endTime: trendStore.visibleTimeRange.end,
    groupBy: 'origin',
    aggregateFun: 'last',
  }).then((res) => {
    // process data
    const normalData = res.data?.normal || [];
    const transformedData: DataPoint[] = [];
    if (normalData[0]) {
      const point = normalData[0];
      const valueLen = point.values.length;
      for (let i = 0; i < valueLen; i++) {
        const timestamp = point.timestamps[i];
        const value = point.values[i];
        transformedData.push({ timestamp: timestamp as number, value: Number(value) });
      }
      if (valueLen >= 1) {
        const totalInterval = (point.timestamps[valueLen - 1] as number) - (point.timestamps[0] as number);
        const averageInterval = totalInterval / valueLen;
        trendStore.updateMeasurementAverageInterval(measurement.label, averageInterval);
      } else {
        trendStore.updateMeasurementAverageInterval(measurement.label, -1);
      }
      if (valueLen >= 1) {
        const totalInterval = (point.timestamps[valueLen - 1] as number) - (point.timestamps[0] as number);
        const averageInterval = totalInterval / valueLen;
        trendStore.updateMeasurementAverageInterval(measurement.label, averageInterval);
      } else {
        trendStore.updateMeasurementAverageInterval(measurement.label, -1);
      }
    }
    measurementsData.value.push({
      ...measurement,
      values: transformedData,
    });
    measurementCondition.set(measurement.id, 1);
    if (normalData[0]?.values.length === 0 && !isRefresh.value) {
      measurementCondition.set(measurement.id, 2);
    }
    const overPath = res.data?.changeAuto || [];
    if (overPath.length && !isRefresh.value) {
      measurementCondition.set(measurement.id, 3);
    }
  });
}

function getTreeHistoryData(measurement: Measurement) {
  getTreeHistoryTrend({
    paths: [measurement.label],
    startTime: trendStore.visibleTimeRange.start,
    endTime: trendStore.visibleTimeRange.end,
    groupBy: 'origin',
    aggregateFun: 'last_value',
  }).then((res) => {
    // process data
    const normalData = res.data?.normal || [];
    const transformedData: DataPoint[] = [];
    if (normalData[0]) {
      const point = normalData[0];
      const valueLen = point.values.length;
      for (let i = 0; i < valueLen; i++) {
        const timestamp = point.timestamps[i];
        const value = point.values[i];
        transformedData.push({ timestamp: timestamp as number, value: Number(value) });
      }
      if (valueLen >= 1) {
        const totalInterval = (point.timestamps[valueLen - 1] as number) - (point.timestamps[0] as number);
        const averageInterval = totalInterval / valueLen;
        trendStore.updateMeasurementAverageInterval(measurement.label, averageInterval);
      } else {
        trendStore.updateMeasurementAverageInterval(measurement.label, -1);
      }
      if (valueLen >= 1) {
        const totalInterval = (point.timestamps[valueLen - 1] as number) - (point.timestamps[0] as number);
        const averageInterval = totalInterval / valueLen;
        trendStore.updateMeasurementAverageInterval(measurement.label, averageInterval);
      } else {
        trendStore.updateMeasurementAverageInterval(measurement.label, -1);
      }
    }
    measurementsData.value.push({
      ...measurement,
      values: transformedData,
    });
    measurementCondition.set(measurement.id, 1);
    if (normalData[0]?.values.length === 0 && !isRefresh.value) {
      measurementCondition.set(measurement.id, 2);
    }
    const overPath = res.data?.changeAuto || [];
    if (overPath.length && !isRefresh.value) {
      measurementCondition.set(measurement.id, 3);
    }
  });
}

function fetchHistoryData(measurement: Measurement) {
  if (props.isTable) {
    getTableHistoryData(measurement);
    return;
  }
  getTreeHistoryData(measurement);
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  const source = event.dataTransfer?.getData('application/drag-source');
  if (source !== 'measurement-list') {
    return;
  }
  const measurementFullPath = event.dataTransfer?.getData('text/plain');
  if (measurementFullPath) {
    emit('drop', { groupId: props.group.id, measurementPath: measurementFullPath });
  }
}

function exportImage() {
  if (chart) {
    const imgData = chart.getDataURL({
      type: 'png',
      pixelRatio: 3,
      backgroundColor: '#ffffff',
    });
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `trend-group-${props.index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function handleDeleteGroup() {
  emit('delete-group', { groupId: props.group.id });
}

function handleDeleteMeasurement(measurementLabel: string) {
  emit('delete-measurement', { groupId: props.group.id, measurementPath: measurementLabel });
}

function onMarkerPointerDown(markerId: string, event: PointerEvent) {
  if (props.loading) return;
  event.preventDefault();
  draggingId = markerId;
  window.addEventListener('pointermove', onMarkerMove);
  window.addEventListener('pointerup', releaseMarker);
}

function onMarkerMove(event: PointerEvent) {
  if (!draggingId || !stageRef.value) return;
  const rect = stageRef.value.getBoundingClientRect();
  const usable = Math.max(rect.width - GRID_LEFT - GRID_RIGHT, 1);
  const rawOffset = event.clientX - rect.left - GRID_LEFT;
  const offset = Math.min(Math.max(rawOffset, 0), usable);
  const ratio = offset / usable;
  const start = props.isRunning ? runningTrendStore.visibleTimeRange.start : trendStore.visibleTimeRange.start;
  const end = props.isRunning ? runningTrendStore.visibleTimeRange.end : trendStore.visibleTimeRange.end;
  const timestamp = start + ratio * (end - start);
  emit('marker-change', { id: draggingId, timestamp });
}

function releaseMarker() {
  draggingId = null;
  window.removeEventListener('pointermove', onMarkerMove);
  window.removeEventListener('pointerup', releaseMarker);
}

function getInnerWidth() {
  const host = stageRef.value;
  if (!host) return 0;
  const rect = host.getBoundingClientRect();
  return Math.max(rect.width - GRID_LEFT - GRID_RIGHT, 0);
}

function buildOption(): ECOption {
  return {
    backgroundColor: 'transparent',
    grid: {
      left: GRID_LEFT,
      right: GRID_RIGHT,
      bottom: 0,
      top: 9,
    },
    animation: false,
    tooltip: {
      confine: true,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          width: 1,
          type: 'dashed',
        },
      },
    },
    xAxis: {
      show: props.index === 0,
      type: 'time',
      min: trendStore.visibleTimeRange.start,
      max: trendStore.visibleTimeRange.end,
      splitNumber: 4,
      axisLine: { lineStyle: { color: `#656A85`, width: 1 }, onZero: false },
      axisLabel: {
        color: '#424561',
        fontSize: 12,
        interval: 'auto',
        fontWeight: 300,
      },
      splitLine: {
        show: false,
        lineStyle: { color: '#DFE1ED', type: 'dashed' },
      },
      position: 'bottom',
    },
    yAxis: {
      type: 'value',
      scale: true,
      minInterval: 1,
      axisLine: { show: true, lineStyle: { color: '#656A85', width: 1 } },
      axisLabel: { color: '#424561', fontSize: 12, hideOverlap: true, margin: 3, fontWeight: 300 },
      splitLine: {
        lineStyle: { color: '#DFE1ED', width: 1 },
      },
      splitNumber: 2,
      boundaryGap: ['5%', '5%'],
    },
    brush: {
      brushStyle: {
        borderWidth: 0,
        color: '#495AD433',
      },
    },
    toolbox: {
      show: false,
      feature: {
        saveAsImage: {
          title: t('common.export'),
          icon: 'path://M18,12V7H7v16h11v-5 M24,15H13 M21,18l3-3l-3-3',
        },
      },
    },
    series: measurementsData.value.map((series, index) => ({
      name: series.label,
      type: 'line',
      smooth: false,
      showSymbol: false,
      sampling: 'lttb',
      color: series.color,
      lineStyle: {
        width: 1,
        color: series.color,
      },
      data: series.values.map((point) => [point.timestamp, point.value]),
    })),
  };
}

function buildRunningOption(): ECOption {
  return {
    backgroundColor: 'transparent',
    grid: {
      left: GRID_LEFT,
      right: GRID_RIGHT,
      bottom: 0,
      top: 0,
    },
    animation: false,
    tooltip: {
      confine: true,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          width: 1,
          type: 'dashed',
        },
      },
    },
    xAxis: {
      show: props.index === 0,
      type: 'time',
      min: runningTrendStore.min > 0 ? runningTrendStore.min : undefined,
      axisLine: { lineStyle: { color: '#656A85', width: 1 }, onZero: false },
      axisLabel: {
        color: '#424561',
        fontSize: 12,
        interval: 'auto',
        fontWeight: 300,
      },
      splitLine: {
        show: false,
      },
      position: 'bottom',
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: true, lineStyle: { color: '#656A85', width: 1 } },
      axisLabel: { color: '#424561', fontSize: 12, hideOverlap: true, margin: 3, fontWeight: 300 },
      splitLine: {
        lineStyle: { color: '#DFE1ED', width: 1 },
      },
      splitNumber: 2,
      boundaryGap: ['5%', '5%'],
    },
    toolbox: {
      show: false,
      feature: {
        saveAsImage: {
          title: t('common.export'),
          icon: 'path://M18,12V7H7v16h11v-5 M24,15H13 M21,18l3-3l-3-3',
        },
      },
    },
    series:
      props.realTimeData?.map((series) => ({
        name: series.path,
        type: 'line',
        smooth: false,
        showSymbol: false,
        sampling: 'lttb',
        color: findColorByMeasurementPath(series.path),
        lineStyle: {
          width: 1,
          color: findColorByMeasurementPath(series.path),
        },
        data: series.values.map((point, index) => [series.timestamps[index], point]),
      })) || [],
  };
}

function findColorByMeasurementPath(path: string): string {
  const measurement = props.group.members.find((m) => m.label === path);
  return measurement ? measurement.color : '#7a819a';
}

function initChart() {
  if (!trendChartRef.value) return;
  chart = echarts.init(trendChartRef.value);
  chart.setOption(buildOption());
  chart.on('brushEnd', function (params) {
    const XAxisRange = (params as any).areas[0].range;
    if (!XAxisRange || !stageRef.value) return;
    const startX = XAxisRange[0];
    const endX = XAxisRange[1];
    const rect = stageRef.value.getBoundingClientRect();
    const usable = Math.max(rect.width - GRID_LEFT - GRID_RIGHT, 1);
    const start = props.isRunning ? runningTrendStore.visibleTimeRange.start : trendStore.visibleTimeRange.start;
    const end = props.isRunning ? runningTrendStore.visibleTimeRange.end : trendStore.visibleTimeRange.end;

    const rawOffsetStart = startX - GRID_LEFT;
    const offsetStart = Math.min(Math.max(rawOffsetStart, 0), usable);
    const ratioStart = offsetStart / usable;
    const timestampStart = start + ratioStart * (end - start);

    const rawOffsetEnd = endX - GRID_LEFT;
    const offsetEnd = Math.min(Math.max(rawOffsetEnd, 0), usable);
    const ratioEnd = offsetEnd / usable;
    const timestampEnd = start + ratioEnd * (end - start);

    emit('update-range', { start: timestampStart, end: timestampEnd });
  });
  if (!props.isRunning && props.group.members.length > 0) {
    chart.on('finished', () => {
      chart?.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: {
          brushType: 'lineX',
        },
      });
    });
  }
  ro = new ResizeObserver(() => {
    chart?.resize();
    layoutTick.value += 1;
  });
  const target = stageRef.value ?? trendChartRef.value;
  if (target) {
    ro.observe(target);
  }
}

function disposeChart() {
  ro?.disconnect();
  chart?.dispose();
  chart = null;
}

function setStorage() {
  const storageData = {
    measurements: measurementsData.value.map((measurement) => ({
      id: measurement.id,
      label: measurement.label,
      details: measurement.details,
    })),
    visibleTimeRange: {
      start: trendStore.visibleTimeRange.start,
      end: trendStore.visibleTimeRange.end,
    },
  };
  try {
    window.sessionStorage.setItem('newTableHistoryTrend' + props.group.id, JSON.stringify(storageData));
  } catch (e) {
    console.warn('Failed to save history trend config to sessionStorage:', e);
  }
}

const restoreData = () => {
  const storageData = window.sessionStorage.getItem('newTableHistoryTrend' + props.group.id);
  if (!storageData) {
    return;
  }
  try {
    const parsed = JSON.parse(storageData);
    const measurements: Measurement[] = Array.isArray(parsed.measurements) ? parsed.measurements : Array.isArray(parsed.measurementsData) ? parsed.measurementsData : [];
    if (measurements.length === 0) {
      return;
    }
    measurementsData.value = measurements.map((measurement) => ({
      ...measurement,
      values: [],
    }));
  } catch (e) {
    console.error('Failed to parse storage data:', e);
  }
};

defineExpose({
  restoreData,
});

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  releaseMarker();
  disposeChart();
});

watch(
  () => trendStore.visibleTimeRange,
  () => {
    if (props.isRunning) {
      return;
    }
    if (props.group.id === 'default') {
      if (chart) {
        chart.setOption(buildOption(), true);
      }
      return;
    }
    if (!props.needFetchData) {
      return;
    }
    measurementsData.value = [];
    if (!isRefresh.value) {
      isRefresh.value = true;
      for (const measurement of props.group.members) {
        fetchHistoryData(measurement);
      }
      nextTick(() => {
        isRefresh.value = false;
      });
    }
  },
  { deep: true },
);

watch(
  () => props.index,
  () => {
    if (chart) {
      if (props.isRunning) {
        chart.setOption(buildRunningOption(), true);
        return;
      }
      chart.setOption(buildOption(), true);
    }
  },
);

watch(
  () => props.group,
  (newGroup) => {
    if (props.isRunning) {
      return;
    }
    if (!props.needFetchData) {
      return;
    }
    measurementsData.value = [];
    if (!isRefresh.value) {
      isRefresh.value = true;
      for (const measurement of newGroup.members) {
        fetchHistoryData(measurement);
      }
      nextTick(() => {
        isRefresh.value = false;
      });
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => measurementsData.value,
  () => {
    if (props.isRunning) {
      return;
    }
    setStorage();
    updateMarkerValues();
    if (chart) {
      chart.setOption(buildOption(), true);
    }
  },
  { deep: true },
);

watch(
  () => props.realTimeData,
  () => {
    if (!props.isRunning) {
      return;
    }
    if (chart) {
      chart.setOption(buildRunningOption(), true);
    }
  },
  { deep: true },
);

watch(
  () => runningTrendStore.min,
  () => {
    if (!props.isRunning) {
      return;
    }
    if (chart) {
      chart.setOption(buildRunningOption(), true);
    }
  },
);

watch(
  () => markerValues.value,
  (newValues) => {
    emit('marker-value-change', newValues);
  },
  { deep: true },
);

watch(
  () => props.markers,
  () => {
    if (props.isRunning) {
      updateRunningMarkerValues();
      return;
    }
    updateMarkerValues();
  },
  { deep: true },
);
</script>

<style>
.graph-border {
  border: 1px solid transparent;
}

.chart-area {
  width: 100%;
  height: 400px;
}
</style>
