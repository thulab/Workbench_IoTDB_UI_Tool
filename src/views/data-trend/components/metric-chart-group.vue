<template>
  <div @drop="handleDrop" @dragover.prevent>
    <div style="display: flex">
      <button class="close-button" :disabled="!props.canDelete" @click="handleDeleteGroup" :style="props.canDelete ? 'cursor: pointer' : ''">
        <el-icon size="20"><i-custom-close /></el-icon>
      </button>
      <div style="display: flex">
        <div v-for="measurement in measurementsData" class="measurement-row" :key="measurement.label">
          <div>{{ measurement.label }}</div>
          <button class="close-button" :disabled="measurementsData.length <= 1" @click="handleDeleteMeasurement(measurement.label)" :style="measurementsData.length > 1 ? 'cursor: pointer' : ''">
            <el-icon size="20"><i-custom-close /></el-icon>
          </button>
        </div>
      </div>
    </div>
    <div ref="stageRef" class="stage-wrapper">
      <div ref="trendChartRef" class="chart-area" :style="{ height: typeof props.height === 'number' ? props.height + 'px' : props.height }"></div>
      <div class="marker-overlay" :class="{ 'marker-overlay--disabled': props.loading }">
        <button
          v-for="handle in markerHandles"
          :key="handle.id"
          class="marker-overlay-handle"
          type="button"
          :style="{ left: handle.left, borderColor: handle.color }"
          :disabled="props.loading"
          @pointerdown="(event) => onMarkerPointerDown(handle.id, event)"
        >
          <span :style="{ background: handle.color }">{{ handle.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import type { ChartMarker, ChartGroupInput, Measurement, DataPoint, MeasurementMarkerData } from '@/types/trend';
import { TableDataApi } from '@/api';
import { formatSelectedMeasurement } from '@/utils/format';
import { useTableHistoryTrendStore } from '@/stores/trend';

const trendStore = useTableHistoryTrendStore();

const { t } = useI18n();
const { requestFn: getHistoryTrend } = useRequest(TableDataApi.getTrendHistoryData);

const GRID_LEFT = 64;
const GRID_RIGHT = 32;
const layoutTick = ref(0);
const isRefresh = ref(false);
// const isFetchingData = ref(false);
const trendChartRef = ref<HTMLDivElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let ro: ResizeObserver | undefined;
let draggingId: string | null = null;

const props = withDefaults(
  defineProps<{
    group: ChartGroupInput;
    markers: ChartMarker[];
    index: number;
    loading?: boolean;
    height?: number | string;
    needFetchData?: boolean;
    canDelete?: boolean;
  }>(),
  {
    loading: false,
    // Default to false to avoid unexpected refetch on restore when parent forgets to pass the prop.
    needFetchData: false,
    canDelete: false,
  },
);

const measurementsData = ref<Measurement[]>([]);
const markerValues = ref<MeasurementMarkerData[]>([]);

function updateMarkerValues() {
  markerValues.value = measurementsData.value.map((measurement) => {
    const x1Marker = props.markers.find((marker) => marker.label === 'X1');
    const x2Marker = props.markers.find((marker) => marker.label === 'X2');
    const y1Value = x1Marker ? nearestDataPoint(measurement, x1Marker.timestamp).value : NaN;
    const y2Value = x2Marker ? nearestDataPoint(measurement, x2Marker.timestamp).value : NaN;
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

const emit = defineEmits<{
  drop: [payload: { groupId: string; measurementPath: string }];
  'marker-change': [payload: { id: string; timestamp: number }];
  'delete-group': [payload: { groupId: string }];
  'marker-value-change': [payload: MeasurementMarkerData[]];
  'delete-measurement': [payload: { groupId: string; measurementPath: string }];
}>();

const markerHandles = computed(() => {
  // Re-compute positions when the chart/container is resized.
  // This matters on Windows multi-monitor setups where moving the window can
  // change effective CSS pixel sizes (per-monitor DPI) without changing marker timestamps.
  const tmp = layoutTick.value;
  if (tmp) {
    const width = getInnerWidth();
    const span = trendStore.visibleTimeRange.end - trendStore.visibleTimeRange.start || 1;
    return props.markers.map((marker) => {
      const ratio = (marker.timestamp - trendStore.visibleTimeRange.start) / span;
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
  const span = trendStore.visibleTimeRange.end - trendStore.visibleTimeRange.start || 1;
  return props.markers.map((marker) => {
    const ratio = (marker.timestamp - trendStore.visibleTimeRange.start) / span;
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

function fetchHistoryData(measurement: Measurement) {
  console.log('Fetching data for group:' + props.group.id + '  measurement:', measurement);
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
    }
    measurementsData.value.push({
      ...measurement,
      values: transformedData,
    });
    if (!normalData.length && !isRefresh.value) {
      ElMessage.warning({ message: `测点 ${measurement.label} 在 ${t('dataTrend.noDataTip')}`, grouping: true });
    }
    const overPath = res.data?.changeAuto || [];
    if (overPath.length && !isRefresh.value) {
      const paths = overPath.join(',');
      ElMessage.warning({ message: t('dataTrend.measurementTip', { measurement: paths }), grouping: true });
    }
  });
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  const measurementFullPath = event.dataTransfer?.getData('text/plain');
  if (measurementFullPath) {
    emit('drop', { groupId: props.group.id, measurementPath: measurementFullPath });
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
  const timestamp = trendStore.visibleTimeRange.start + ratio * (trendStore.visibleTimeRange.end - trendStore.visibleTimeRange.start);
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
      top: 0,
    },
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#91a3ff',
          width: 1,
          type: 'dashed',
        },
      },
      valueFormatter: (value) => {
        const numeric = typeof value === 'number' ? value : Number(value ?? 0);
        return numeric.toFixed(2);
      },
    },
    xAxis: {
      type: 'time',
      min: trendStore.visibleTimeRange.start,
      max: trendStore.visibleTimeRange.end,
      splitNumber: 4,
      axisLine: { lineStyle: { color: '#444b63' } },
      axisLabel: {
        color: '#7a819a',
        interval: 'auto',
        formatter: (value: number) =>
          new Date(value).toLocaleTimeString('zh-CN', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
      splitLine: {
        show: true,
        lineStyle: { color: 'rgba(122, 129, 154, 0.2)', type: 'dashed' },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: true, lineStyle: { color: '#444b63' } },
      axisLabel: { color: '#7a819a' },
      splitLine: {
        lineStyle: { color: 'rgba(122, 129, 154, 0.15)' },
      },
    },
    series: measurementsData.value.map((series, index) => ({
      name: series.label,
      type: 'line',
      smooth: true,
      showSymbol: false,
      sampling: 'lttb',
      lineStyle: {
        width: 2,
        color: series.color,
      },
      areaStyle: {
        color: `${series.color}33`,
      },
      data: series.values.map((point) => [point.timestamp, point.value]),
      // markLine:
      //   index === 0
      //     ? {
      //       symbol: 'none',
      //       silent: true,
      //       label: { color: '#fff', fontSize: 11 },
      //       data: props.markers as unknown as ECOption['data'],
      //     }
      //     : undefined,
    })),
    // series: [
    //   {
    //     type: 'line',
    //     name: '示例数据',
    //     smooth: true,
    //     showSymbol: false,
    //     data: [],
    //     lineStyle: {
    //       width: 2,
    //       color: '#5470C6',
    //     },
    //   },
    // ],
  };
}

function initChart() {
  if (!trendChartRef.value) return;
  chart = echarts.init(trendChartRef.value);
  chart.setOption(buildOption());
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
    measurementsData: measurementsData.value,
  };
  window.sessionStorage.setItem('newTableHistoryTrend' + props.group.id, JSON.stringify(storageData));
}

const restoreData = () => {
  const storageData = window.sessionStorage.getItem('newTableHistoryTrend' + props.group.id);
  if (storageData) {
    try {
      const parsed = JSON.parse(storageData);
      measurementsData.value = parsed.measurementsData || [];
    } catch (e) {
      console.error('Failed to parse storage data:', e);
    }
  }
};

defineExpose({
  restoreData,
});

onMounted(() => {
  initChart();
  // if (!window.sessionStorage.getItem('newTableHistoryTrend' + props.group.id)) {
  //   window.sessionStorage.setItem('newTableHistoryTrend' + props.group.id, '');
  // }
});

onUnmounted(() => {
  releaseMarker();
  disposeChart();
});

watch(
  () => trendStore.visibleTimeRange,
  () => {
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
  () => props.group,
  (newGroup) => {
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
    setStorage();
    updateMarkerValues();
    if (chart) {
      chart.setOption(buildOption(), true);
    }
  },
  { deep: true },
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
    // if (chart) {
    //   chart.setOption(buildOption());
    // }
    updateMarkerValues();
  },
  { deep: true },
);
</script>

<style>
.close-button {
  background-color: transparent;
  border: none;
}

.chart-area {
  width: 100%;
  height: 400px;
}

.marker-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.marker-overlay--disabled {
  opacity: 0.5;
}

.marker-overlay-handle {
  position: absolute;
  top: 4px;
  width: 0;
  height: calc(100% - 24px);
  border-left: 1.5px dashed rgb(255 255 255 / 40%);
  pointer-events: auto;
  background: none;
  border-top: none;
  border-right: none;
  border-bottom: none;
  cursor: ew-resize;
}

.marker-overlay-handle:disabled {
  pointer-events: none;
  border-left: 1.5px dashed rgb(255 255 255 / 25%);
}

.marker-overlay-handle span {
  position: absolute;
  top: -12px;
  left: -20px;
  font-size: 11px;
  color: #0d101a;
  padding: 2px 6px;
  border-radius: 999px;
}

.stage-wrapper {
  position: relative;
}

.measurement-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: small;
}
</style>
