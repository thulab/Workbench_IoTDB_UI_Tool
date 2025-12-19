<template>
  <div>
    <div class="flex mt-16px mb-4px items-center">
      <el-date-picker v-model="startTime" type="datetime" placeholder="Select start date and time" @change="onStartTimeSelected" :prefix-icon="ICustomCalender" :disabled-date="disabledDate" />
      <div class="flex-grow text-center text-[14px]">数据选取窗口</div>
      <el-date-picker v-model="endTime" type="datetime" placeholder="Select end date and time" @change="onEndTimeSelected" :prefix-icon="ICustomCalender" :disabled-date="disabledDate" />
    </div>
    <div ref="timelineWrapperRef" class="relative w-full h-40px">
      <div ref="timelineChartRef" class="w-full h-40px"></div>
      <button class="flip-button cursor-pointer absolute top-0 h-full w-20px rounded-[2px] bg-white p-0!" @click="handlePageDown">
        <el-icon color="rgba(160, 163, 184, 1)" size="20"><ArrowLeft /></el-icon>
      </button>
      <button class="flip-button cursor-pointer absolute top-0 right-0 h-full w-20px rounded-[2px] bg-white p-0!" @click="handlePageUp">
        <el-icon color="rgba(160, 163, 184, 1)" size="20"><ArrowRight /></el-icon>
      </button>
      <div class="absolute inset-0 pointer-events-none mx-[24px]">
        <div class="timeline-outline absolute w-full h-full bg-transparent rounded-[2px] box-border"></div>
        <div
          class="range-slider-fill absolute h-full rounded-[2px] pointer-events-auto box-border bg-[rgb(73_90_212_/_20%)]"
          :style="{
            left: handleLeftPos + 'px',
            right: containerWidth - handleRightPos - 48 + 'px',
          }"
          @pointerdown="(e) => onSliderBlockPointerDown(e)"
        ></div>
        <div
          class="bg-transparent absolute h-full w-[2px] p-0 cursor-ew-resize pointer-events-auto"
          :style="{ left: handleLeftPos + 'px' }"
          @pointerdown="(e) => onSliderPointerDown({ id: 'start', x: 0 }, e)"
        ></div>
        <div
          class="bg-transparent absolute h-full w-[2px] p-0 cursor-ew-resize pointer-events-auto"
          :style="{ left: handleRightPos + 'px' }"
          @pointerdown="(e) => onSliderPointerDown({ id: 'end', x: 0 }, e)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ICustomCalender from '~icons/custom/calender.svg';
import type { TimeRange, RangeHandle, Measurement, DataPoint } from '@/types/trend';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { TableDataApi } from '@/api';
import { formatSelectedMeasurement } from '@/utils/format';
import { useTableHistoryTrendStore } from '@/stores/trend';

const trendStore = useTableHistoryTrendStore();

const GRID_LEFT = 24; // 64
const GRID_RIGHT = 24; // 32

const { requestFn: getHistoryTrend } = useRequest(TableDataApi.getTrendHistoryData);

const props = defineProps<{
  allMeasurementInfo: Measurement[];
  needFetchMeasurementId: string[];
  needDeleteMeasurementsId: string[];
}>();

const emit = defineEmits<{
  'update:range': [payload: TimeRange];
  'clear-need-fetch-measurements': [];
  'clear-need-delete-measurements': [];
}>();

const disabledDate = computed(() => {
  return (time: number) => time < trendStore.globalTimeRange.start || time > trendStore.globalTimeRange.end;
});
const startTime = ref<Date | null>(trendStore.pendingTimeRange.start ? new Date(trendStore.pendingTimeRange.start) : null);
const endTime = ref<Date | null>(trendStore.pendingTimeRange.end ? new Date(trendStore.pendingTimeRange.end) : null);
const timelineChartRef = ref<HTMLDivElement | null>(null);
const timelineWrapperRef = ref<HTMLDivElement | null>(null);
let timelineChart: echarts.ECharts | null = null;
let timelineChartRo: ResizeObserver | undefined;
let draggingHandle: RangeHandle | null = null;

const containerWidth = ref(0);
const rangeStartPercent = ref(0);
const rangeEndPercent = ref(100);
const percentXStart = ref(0);
const percentXEnd = ref(0);
const handleLeftPos = computed(() => {
  if (!timelineWrapperRef.value) return 0;
  return (rangeStartPercent.value * (containerWidth.value - (GRID_LEFT + GRID_RIGHT))) / 100;
});
const handleRightPos = computed(() => {
  if (!timelineWrapperRef.value) return containerWidth.value;
  return (rangeEndPercent.value * (containerWidth.value - (GRID_LEFT + GRID_RIGHT))) / 100;
});
const fullDataSet = ref<Measurement[]>([]);

function handlePageUp() {
  // const span = trendStore.globalTimeRange.end - trendStore.globalTimeRange.start;
  const visibleSpan = trendStore.pendingTimeRange.end - trendStore.pendingTimeRange.start;
  let newStart = trendStore.pendingTimeRange.start + visibleSpan;
  let newEnd = trendStore.pendingTimeRange.end + visibleSpan;
  if (newEnd > trendStore.globalTimeRange.end) {
    newEnd = trendStore.globalTimeRange.end;
    newStart = newEnd - visibleSpan;
  }
  emit('update:range', {
    start: newStart,
    end: newEnd,
  });
}

function handlePageDown() {
  // const span = trendStore.globalTimeRange.end - trendStore.globalTimeRange.start;
  const visibleSpan = trendStore.pendingTimeRange.end - trendStore.pendingTimeRange.start;
  let newStart = trendStore.pendingTimeRange.start - visibleSpan;
  let newEnd = trendStore.pendingTimeRange.end - visibleSpan;
  if (newStart < trendStore.globalTimeRange.start) {
    newStart = trendStore.globalTimeRange.start;
    newEnd = newStart + visibleSpan;
  }
  emit('update:range', {
    start: newStart,
    end: newEnd,
  });
}

watch(
  () => props.allMeasurementInfo,
  () => {
    if (props.needFetchMeasurementId.length > 0) {
      const toFetchIds = [...props.needFetchMeasurementId];
      toFetchIds.forEach((id) => {
        const measurement = props.allMeasurementInfo.find((m) => m.id === id);
        if (measurement) {
          fetchFullRangeHistoryData(measurement);
        }
      });
      emit('clear-need-fetch-measurements');
    }
    if (props.needDeleteMeasurementsId.length > 0) {
      const toDeleteIds = new Set(props.needDeleteMeasurementsId);
      fullDataSet.value = fullDataSet.value.filter((m) => !toDeleteIds.has(m.id));
      emit('clear-need-delete-measurements');
    }
  },
  { deep: true, immediate: true },
);

watch(
  () => fullDataSet.value,
  () => {
    if (timelineChart) {
      timelineChart.setOption(buildTimelineChartOption(), true);
    }
  },
  { deep: true },
);

function fetchFullRangeHistoryData(measurement: Measurement) {
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
    startTime: trendStore.globalTimeRange.start,
    endTime: trendStore.globalTimeRange.end,
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
    fullDataSet.value.push({
      ...measurement,
      values: transformedData,
    });
    if (!normalData.length) {
      // ElMessage.warning({ message: `测点 ${measurement.label} 在 ${t('dataTrend.noDataTip')}`, grouping: true });
    }
    const overPath = res.data?.changeAuto || [];
    if (overPath.length) {
      // const paths = overPath.join(',');
      // ElMessage.warning({ message: t('dataTrend.measurementTip', { measurement: paths }), grouping: true });
    }
  });
}

function updateRangePercent() {
  const span = trendStore.globalTimeRange.end - trendStore.globalTimeRange.start;
  rangeStartPercent.value = ((trendStore.pendingTimeRange.start - trendStore.globalTimeRange.start) / span) * 100;
  rangeEndPercent.value = ((trendStore.pendingTimeRange.end - trendStore.globalTimeRange.start) / span) * 100;
}

function updateContainerWidth() {
  if (!timelineWrapperRef.value) return;
  const rect = timelineWrapperRef.value.getBoundingClientRect();
  containerWidth.value = rect.width;
  updateRangePercent();
}

function onStartTimeSelected(date: Date | null) {
  if (!date) return;
  const selectedTs = date.getTime();
  emit('update:range', {
    start: selectedTs,
    end: trendStore.pendingTimeRange.end,
  });
}

function onEndTimeSelected(date: Date | null) {
  if (!date) return;
  const selectedTs = date.getTime();
  emit('update:range', {
    start: trendStore.pendingTimeRange.start,
    end: selectedTs,
  });
}

function onSliderBlockPointerDown(event: PointerEvent) {
  event.preventDefault();
  if (!timelineWrapperRef.value) return;
  const rect = timelineWrapperRef.value.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const distXStart = Math.abs(offsetX - handleLeftPos.value);
  percentXStart.value = (distXStart / (handleRightPos.value - handleLeftPos.value)) * 100;
  percentXEnd.value = 100 - percentXStart.value;
  window.addEventListener('pointermove', onSliderBlockMove);
  window.addEventListener('pointerup', onSliderBlockUp);
}

function onSliderBlockUp() {
  window.removeEventListener('pointermove', onSliderBlockMove);
  window.removeEventListener('pointerup', onSliderBlockUp);
}

function onSliderBlockMove(event: PointerEvent) {
  if (!timelineWrapperRef.value) return;
  const rect = timelineWrapperRef.value.getBoundingClientRect();
  const offsetX = event.clientX - rect.left - GRID_LEFT;
  const percent = Math.min(Math.max((offsetX / (rect.width - (GRID_LEFT + GRID_RIGHT))) * 100, 0), 100);
  const rangeSpan = rangeEndPercent.value - rangeStartPercent.value;
  let newStartPercent = percent - (percentXStart.value / 100) * rangeSpan;
  let newEndPercent = percent + (percentXEnd.value / 100) * rangeSpan;

  if (newStartPercent < 0) {
    newStartPercent = 0;
    newEndPercent = rangeSpan;
  } else if (newEndPercent > 100) {
    newEndPercent = 100;
    newStartPercent = 100 - rangeSpan;
  }

  rangeStartPercent.value = newStartPercent;
  rangeEndPercent.value = newEndPercent;

  const span = trendStore.globalTimeRange.end - trendStore.globalTimeRange.start;
  const startTs = trendStore.globalTimeRange.start + (rangeStartPercent.value / 100) * span;
  const endTs = trendStore.globalTimeRange.start + (rangeEndPercent.value / 100) * span;

  emit('update:range', {
    start: startTs,
    end: endTs,
  });
}

function onSliderPointerDown(handle: RangeHandle, event: PointerEvent) {
  event.preventDefault();
  draggingHandle = handle;
  window.addEventListener('pointermove', onSliderPointerMove);
  window.addEventListener('pointerup', onSliderPointerUp);
}

function onSliderPointerUp() {
  draggingHandle = null;
  window.removeEventListener('pointermove', onSliderPointerMove);
  window.removeEventListener('pointerup', onSliderPointerUp);
}

function onSliderPointerMove(event: PointerEvent) {
  if (!draggingHandle || !timelineWrapperRef.value) return;
  const rect = timelineWrapperRef.value.getBoundingClientRect();
  const offsetX = event.clientX - rect.left - GRID_LEFT;
  const percent = Math.min(Math.max((offsetX / (rect.width - (GRID_LEFT + GRID_RIGHT))) * 100, 0), 100);

  if (draggingHandle.id === 'start') {
    rangeStartPercent.value = Math.min(percent, rangeEndPercent.value);
  } else {
    rangeEndPercent.value = Math.max(percent, rangeStartPercent.value);
  }

  const span = trendStore.globalTimeRange.end - trendStore.globalTimeRange.start;
  const startTs = trendStore.globalTimeRange.start + (rangeStartPercent.value / 100) * span;
  const endTs = trendStore.globalTimeRange.start + (rangeEndPercent.value / 100) * span;
  startTime.value = new Date(startTs);
  endTime.value = new Date(endTs);

  emit('update:range', {
    start: startTs,
    end: endTs,
  });
}

function buildTimelineChartOption(): ECOption {
  return {
    backgroundColor: 'transparent',
    animation: false,
    grid: {
      left: GRID_LEFT,
      right: GRID_RIGHT,
      top: 10,
      bottom: 0,
    },
    tooltip: { show: false },
    xAxis: {
      type: 'time',
      show: false,
      min: trendStore.globalTimeRange.start,
      max: trendStore.globalTimeRange.end,
      splitNumber: 4,
      axisLabel: {
        color: '#8d95a5',
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
      axisLine: { lineStyle: { color: '#4b5168' } },
      splitLine: {
        show: true,
        lineStyle: { color: 'rgba(122, 129, 154, 0.2)', type: 'dashed' },
      },
    },
    yAxis: {
      type: 'value',
      show: false,
      splitLine: { show: false },
    },
    series: fullDataSet.value.map((measurement) => ({
      name: measurement.label,
      type: 'line',
      smooth: true,
      data: measurement.values.map((point) => [point.timestamp, point.value]),
      showSymbol: false,
      lineStyle: {
        width: 1.5,
        color: measurement.color,
      },
    })),
  };
}

function initTimelineChart() {
  if (!timelineChartRef.value) return;
  timelineChart = echarts.init(timelineChartRef.value);
  timelineChart.setOption(buildTimelineChartOption());
  timelineChartRo = new ResizeObserver(() => {
    timelineChart?.resize();
    updateContainerWidth();
  });
  if (timelineChartRef.value) {
    timelineChartRo.observe(timelineChartRef.value);
  }
}

function disposeTimelineChart() {
  timelineChartRo?.disconnect();
  if (timelineChart) {
    timelineChart.dispose();
    timelineChart = null;
  }
}

function setStorage() {
  const storageData = {
    measurements: fullDataSet.value.map((measurement) => ({
      id: measurement.id,
      label: measurement.label,
      details: measurement.details,
    })),
    globalTimeRange: {
      start: trendStore.globalTimeRange.start,
      end: trendStore.globalTimeRange.end,
    },
    visibleTimeRange: {
      start: trendStore.pendingTimeRange.start,
      end: trendStore.pendingTimeRange.end,
    },
  };
  try {
    window.sessionStorage.setItem('timelineAreaChart', JSON.stringify(storageData));
  } catch (error) {
    console.warn('Failed to save timeline area config to sessionStorage:', error);
  }
}

const restoreData = () => {
  const storageData = window.sessionStorage.getItem('timelineAreaChart');
  fullDataSet.value = [];
  const allMeasurements = props.allMeasurementInfo;

  if (!storageData) {
    for (const measurement of allMeasurements) {
      fetchFullRangeHistoryData(measurement);
    }
    return;
  }

  try {
    const parsedData = JSON.parse(storageData);
    const storedMeasurementIds: string[] = Array.isArray(parsedData.measurements)
      ? parsedData.measurements.map((item: { id?: string }) => item.id).filter((id: string | undefined): id is string => Boolean(id))
      : [];

    const idsToUse = storedMeasurementIds.length > 0 ? storedMeasurementIds : allMeasurements.map((item) => item.id);

    for (const id of idsToUse) {
      const measurement = allMeasurements.find((item) => item.id === id);
      if (measurement) {
        fetchFullRangeHistoryData(measurement);
      }
    }
  } catch (error) {
    console.error('Error parsing timeline area chart data from sessionStorage:', error);
    for (const measurement of allMeasurements) {
      fetchFullRangeHistoryData(measurement);
    }
  }
};

export interface TimelineExpose {
  restoreData: () => void;
}

defineExpose<TimelineExpose>({
  restoreData,
});

onMounted(() => {
  initTimelineChart();
});

onUnmounted(() => {
  disposeTimelineChart();
});

watch(
  () => fullDataSet.value,
  () => {
    setStorage();
  },
  { deep: true },
);

watch(
  () => trendStore.globalTimeRange,
  () => {
    startTime.value = trendStore.pendingTimeRange.start ? new Date(trendStore.pendingTimeRange.start) : null;
    endTime.value = trendStore.pendingTimeRange.end ? new Date(trendStore.pendingTimeRange.end) : null;
    updateContainerWidth();
    for (const measurement of props.allMeasurementInfo) {
      fetchFullRangeHistoryData(measurement);
    }
    if (timelineChart) {
      timelineChart.setOption(buildTimelineChartOption());
    }
  },
  { deep: true },
);

watch(
  () => trendStore.pendingTimeRange,
  () => {
    startTime.value = trendStore.pendingTimeRange.start ? new Date(trendStore.pendingTimeRange.start) : null;
    endTime.value = trendStore.pendingTimeRange.end ? new Date(trendStore.pendingTimeRange.end) : null;
    updateRangePercent();
  },
  { deep: true },
);
</script>

<style scoped>
.flip-button {
  border: 1px solid rgb(223 225 237 / 100%);
}

.timeline-outline {
  border: 1px solid rgb(223 225 237 / 100%);
}

.range-slider-fill {
  border: 1px solid rgb(73 90 212 / 100%);
}
</style>
