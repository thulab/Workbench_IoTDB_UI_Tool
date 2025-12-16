<template>
  <div @drop="handleDrop" @dragover.prevent>
    <button class="close-button" :disabled="!props.canDelete" @click="handleDeleteGroup" :style="props.canDelete ? 'cursor: pointer' : ''">
      <el-icon size="20"><i-custom-close /></el-icon>
    </button>
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
import type { TimeRange, ChartMarker, ChartGroupInput, Measurement, DataPoint } from '@/types/trend';
import { TableDataApi } from '@/api';
import { formatSelectedMeasurement } from '@/utils/format';

const { t } = useI18n();
const { requestFn: getHistoryTrend } = useRequest(TableDataApi.getTrendHistoryData);

const GRID_LEFT = 64;
const GRID_RIGHT = 32;
const layoutTick = ref(0);
const trendChartRef = ref<HTMLDivElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let ro: ResizeObserver | undefined;
let draggingId: string | null = null;

const props = withDefaults(
  defineProps<{
    group: ChartGroupInput;
    range: TimeRange;
    markers: ChartMarker[];
    index: number;
    loading?: boolean;
    height?: number | string;
    needFetchData?: boolean;
    canDelete?: boolean;
  }>(),
  {
    loading: false,
    needFetchData: true,
    canDelete: false,
  },
);

const measurementsData = ref<Measurement[]>([]);

const emit = defineEmits<{
  // remove: [payload: { groupId: string; measurementId: string }]
  drop: [payload: { groupId: string; measurementPath: string }];
  'marker-change': [payload: { id: string; timestamp: number }];
  'delete-group': [payload: { groupId: string }];
}>();

const markerHandles = computed(() => {
  const width = getInnerWidth();
  const span = props.range.end - props.range.start || 1;
  return props.markers.map((marker) => {
    const ratio = (marker.timestamp - props.range.start) / span;
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

function fetchHistoryData(measurement: Measurement) {
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
      } as any,
    ],
    startTime: props.range.start,
    endTime: props.range.end,
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
    if (!normalData.length) {
      ElMessage.warning({ message: `测点 ${measurement.label} 在 ${t('dataTrend.noDataTip')}`, grouping: true });
    }
    const overPath = res.data?.changeAuto || [];
    if (overPath.length) {
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
  const timestamp = props.range.start + ratio * (props.range.end - props.range.start);
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
      min: props.range.start,
      max: props.range.end,
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

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  releaseMarker();
  disposeChart();
});

watch(
  () => props.range,
  () => {
    if (!props.needFetchData) {
      console.log('No need to fetch data for group', props.group.id);
      return;
    }
    console.log('Fetching data for group', props.group.id);
    measurementsData.value = [];
    for (const measurement of props.group.members) {
      fetchHistoryData(measurement);
    }
  },
  { deep: true },
);

watch(
  () => props.group,
  (newGroup) => {
    if (!props.needFetchData) {
      console.log('No need to fetch data for group', newGroup.id);
      return;
    }
    console.log('Fetching data for group', newGroup.id);
    measurementsData.value = [];
    for (const measurement of newGroup.members) {
      fetchHistoryData(measurement);
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => measurementsData.value,
  () => {
    if (chart) {
      chart.setOption(buildOption());
    }
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
</style>
