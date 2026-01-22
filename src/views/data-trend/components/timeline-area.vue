<template>
  <div>
    <div ref="timelineWrapperRef" class="h-60px w-full relative">
      <div ref="timelineChartRef" class="h-60px w-full"></div>
      <el-tooltip :content="t('common.previousPage')" effect="light" placement="top">
        <button class="flip-button rounded-[2px] bg-white h-40px w-20px cursor-pointer top-0 absolute p-0!" @click="handlePageDown">
          <i-custom-arrow-left-trend />
        </button>
      </el-tooltip>
      <el-tooltip :content="t('common.nextPage')" effect="light" placement="top">
        <button class="flip-button rounded-[2px] bg-white h-40px w-20px cursor-pointer right-0 top-0 absolute p-0!" @click="handlePageUp">
          <i-custom-arrow-right-trend />
        </button>
      </el-tooltip>
      <div class="flex w-full items-center bottom-[-11px] absolute">
        <el-date-picker
          style="--el-date-editor-width: 160px"
          v-model="startTime"
          type="datetime"
          :clearable="false"
          placeholder="Select start date and time"
          @change="onStartTimeSelected"
          :prefix-icon="ICustomCalender"
          :disabled-date="disabledDate"
        />
        <div class="text-[14px] text-center flex-grow"></div>
        <el-date-picker
          style="--el-date-editor-width: 160px"
          v-model="endTime"
          type="datetime"
          :clearable="false"
          placeholder="Select end date and time"
          @change="onEndTimeSelected"
          :prefix-icon="ICustomCalender"
          :disabled-date="disabledDate"
        />
      </div>
      <div class="mx-[24px] pointer-events-none inset-0 absolute">
        <div class="timeline-outline rounded-[2px] bg-transparent h-40px w-full box-border absolute"></div>
        <div
          class="range-slider-fill rounded-[2px] bg-[#495AD420] h-40px pointer-events-auto box-border absolute"
          :style="{
            left: handleLeftPos + 'px',
            right: containerWidth - handleRightPos - 48 + 'px',
          }"
          @pointerdown="(e) => onSliderBlockPointerDown(e)"
        ></div>
        <div class="drag-button ml-[-12px]" :style="{ left: handleLeftPos + 'px' }" @pointerdown="(e) => onSliderPointerDown({ id: 'start', x: 0 }, e)">...</div>
        <div class="drag-button" :style="{ left: handleRightPos + 'px' }" @pointerdown="(e) => onSliderPointerDown({ id: 'end', x: 0 }, e)">...</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ICustomCalender from '~icons/custom/calender.svg';
import type { TimeRange, RangeHandle, Measurement, DataPoint } from '@/types/trend';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import { TableDataApi, SearchApi } from '@/api';
import { formatSelectedMeasurement } from '@/utils/format';
import { useTableHistoryTrendStore, useTreeHistoryTrendStore } from '@/stores/trend.store';

const GRID_LEFT = 24; // 64
const GRID_RIGHT = 24; // 32

const { t } = useI18n();

const { requestFn: getHistoryTrend } = useRequest(TableDataApi.getTrendHistoryData);
const { requestFn: getTreeHistoryTrend } = useRequest(SearchApi.getHistoryTrend);

const props = defineProps<{
  isTable: boolean;
  allMeasurementInfo: Measurement[];
  needFetchMeasurementId: string[];
  needDeleteMeasurementsId: string[];
}>();

const trendStore = props.isTable ? useTableHistoryTrendStore() : useTreeHistoryTrendStore();

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
  return (rangeStartPercent.value * (containerWidth.value - (GRID_LEFT + GRID_RIGHT + 24))) / 100 + 12;
});
const handleRightPos = computed(() => {
  if (!timelineWrapperRef.value) return containerWidth.value;
  return (rangeEndPercent.value * (containerWidth.value - (GRID_LEFT + GRID_RIGHT + 24))) / 100 + 12;
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

function fetchTableFullRangeHistoryData(measurement: Measurement) {
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
    if (fullDataSet.value.find((m) => m.id === measurement.id)) {
      // update existing measurement data
      fullDataSet.value = fullDataSet.value.map((m) => {
        if (m.id === measurement.id) {
          return {
            ...m,
            values: transformedData,
          };
        }
        return m;
      });
      return;
    }
    fullDataSet.value.push({
      ...measurement,
      values: transformedData,
    });
  });
}

function fetchTreeFullRangeHistoryData(measurement: Measurement) {
  getTreeHistoryTrend({
    paths: [measurement.label],
    startTime: trendStore.globalTimeRange.start,
    endTime: trendStore.globalTimeRange.end,
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
    }
    if (fullDataSet.value.find((m) => m.id === measurement.id)) {
      // update existing measurement data
      fullDataSet.value = fullDataSet.value.map((m) => {
        if (m.id === measurement.id) {
          return {
            ...m,
            values: transformedData,
          };
        }
        return m;
      });
      return;
    }
    fullDataSet.value.push({
      ...measurement,
      values: transformedData,
    });
  });
}

function fetchFullRangeHistoryData(measurement: Measurement) {
  if (props.isTable) {
    fetchTableFullRangeHistoryData(measurement);
    return;
  }
  fetchTreeFullRangeHistoryData(measurement);
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
  const offsetX = event.clientX - rect.left - GRID_LEFT - 12;
  const percent = Math.min(Math.max((offsetX / (rect.width - (GRID_LEFT + GRID_RIGHT + 24))) * 100, 0), 100);
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
  let offsetX = event.clientX - rect.left - GRID_LEFT;
  if (draggingHandle.id === 'end') {
    offsetX += 12;
  } else {
    offsetX -= 12;
  }
  const percent = Math.min(Math.max((offsetX / (rect.width - (GRID_LEFT + GRID_RIGHT + 24))) * 100, 0), 100);

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
      left: GRID_LEFT + 12,
      right: GRID_RIGHT + 12,
      top: 10,
      bottom: 0,
    },
    tooltip: { show: false },
    xAxis: fullDataSet.value.map((measurement, index) => ({
      type: 'time',
      show: index === 0,
      min: trendStore.globalTimeRange.start,
      max: trendStore.globalTimeRange.end,
      splitNumber: 4,
      axisLabel: {
        color: '#424561',
        fontSize: 12,
        interval: 'auto',
      },
      axisLine: {
        show: false,
        lineStyle: { color: '#444B63' },
      },
    })),
    yAxis: fullDataSet.value.map((measurement, index) => ({
      alignTicks: false,
      id: measurement.id,
      type: 'value',
      show: false,
      splitLine: { show: false },
    })),
    series: fullDataSet.value.map((measurement) => ({
      yAxisId: measurement.id,
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
  border: 1px solid #dfe1ed;
  display: flex;
  justify-content: center;
  align-items: center;
}

.timeline-outline {
  border: 1px solid #dfe1ed;
}

.range-slider-fill {
  border: 1px solid #495ad4;
}

.drag-button {
  position: absolute;
  height: 40px;
  width: 12px;
  cursor: ew-resize;
  pointer-events: auto;
  border: #495ad4 1px solid;
  background-color: #495ad4;
  writing-mode: vertical-lr;
  font-weight: 400;
  font-size: 25px;
  line-height: 1;
  color: white;
  display: flex;
  justify-content: center;
}
</style>
