<template>
  <div class="timeline-area-wrapper">
    <div class="date-picker-row">
      选框时间：
      <el-date-picker v-model="startTime" type="datetime" placeholder="Select start date and time" @change="onStartTimeSelected" :prefix-icon="ICustomCalender" :disabled-date="disabledDate" />
      <div style="flex-grow: 1"></div>
      <el-date-picker v-model="endTime" type="datetime" placeholder="Select end date and time" @change="onEndTimeSelected" :prefix-icon="ICustomCalender" :disabled-date="disabledDate" />
    </div>
    <div ref="timelineWrapperRef" class="full-data-wrapper">
      <div ref="timelineChartRef" class="full-data-timeline-chart"></div>
      <button class="flip-page-button flip-page-button-left">
        <el-icon color="white" size="15"><ArrowLeft /></el-icon>
      </button>
      <button class="flip-page-button flip-page-button-right">
        <el-icon color="white" size="15"><ArrowRight /></el-icon>
      </button>
      <div class="range-slider">
        <div
          class="range-slider-fill"
          :style="{
            left: handleLeftPos + 'px',
            right: containerWidth - handleRightPos + 'px',
          }"
          @pointerdown="(e) => onSliderBlockPointerDown(e)"
        ></div>
        <button class="range-slider-handle" :style="{ left: handleLeftPos + 'px' }" @pointerdown="(e) => onSliderPointerDown({ id: 'start', x: 0 }, e)" type="button"></button>
        <button class="range-slider-handle" :style="{ left: handleRightPos + 'px' }" @pointerdown="(e) => onSliderPointerDown({ id: 'end', x: 0 }, e)" type="button"></button>
        <!-- <span :style="{ position: 'absolute', left: handleLeftPos + 'px' }">{{ startTimeLabel }}</span>
        <span :style="{ position: 'absolute', left: handleRightPos + 'px' }">{{ endTimeLabel }}</span> -->
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ICustomCalender from '~icons/custom/calender.svg';
import type { TimeRange, RangeHandle } from '@/types/trend';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';

const GRID_LEFT = 64;
const GRID_RIGHT = 32;

const props = defineProps<{
  // allGroupInfo: ChartGroupInput[]
  // fullData: Measurement[]
  fullRange: TimeRange;
  range: TimeRange;
}>();

const emit = defineEmits<{
  'update:range': [payload: TimeRange];
}>();

const disabledDate = computed(() => {
  return (time: number) => time < props.fullRange.start || time > props.fullRange.end;
});
const startTime = ref<Date | null>(props.range.start ? new Date(props.range.start) : null);
const endTime = ref<Date | null>(props.range.end ? new Date(props.range.end) : null);
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
  return (rangeStartPercent.value * (containerWidth.value - 96)) / 100 + 64;
});
const handleRightPos = computed(() => {
  if (!timelineWrapperRef.value) return containerWidth.value;
  return (rangeEndPercent.value * (containerWidth.value - 96)) / 100 + 64;
});
// const startTimeLabel = computed(() => {
//   const span = props.fullRange.end - props.fullRange.start;
//   const startTs = props.fullRange.start + (rangeStartPercent.value / 100) * span;
//   return new Date(startTs).toLocaleTimeString('zh-CN', {
//     year: '2-digit',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// });
// const endTimeLabel = computed(() => {
//   const span = props.fullRange.end - props.fullRange.start;
//   const endTs = props.fullRange.start + (rangeEndPercent.value / 100) * span;
//   return new Date(endTs).toLocaleTimeString('zh-CN', {
//     year: '2-digit',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// });

function updateRangePercent() {
  const span = props.fullRange.end - props.fullRange.start;
  rangeStartPercent.value = ((props.range.start - props.fullRange.start) / span) * 100;
  rangeEndPercent.value = ((props.range.end - props.fullRange.start) / span) * 100;
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
    end: props.range.end,
  });
}

function onEndTimeSelected(date: Date | null) {
  if (!date) return;
  const selectedTs = date.getTime();
  emit('update:range', {
    start: props.range.start,
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
  const offsetX = event.clientX - rect.left - 64;
  const percent = Math.min(Math.max((offsetX / (rect.width - 96)) * 100, 0), 100);
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

  const span = props.fullRange.end - props.fullRange.start;
  const startTs = props.fullRange.start + (rangeStartPercent.value / 100) * span;
  const endTs = props.fullRange.start + (rangeEndPercent.value / 100) * span;

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
  const offsetX = event.clientX - rect.left - 64;
  const percent = Math.min(Math.max((offsetX / (rect.width - 96)) * 100, 0), 100);

  if (draggingHandle.id === 'start') {
    rangeStartPercent.value = Math.min(percent, rangeEndPercent.value);
  } else {
    rangeEndPercent.value = Math.max(percent, rangeStartPercent.value);
  }

  const span = props.fullRange.end - props.fullRange.start;
  const startTs = props.fullRange.start + (rangeStartPercent.value / 100) * span;
  const endTs = props.fullRange.start + (rangeEndPercent.value / 100) * span;
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
      min: props.fullRange.start,
      max: props.fullRange.end,
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
    series: {
      // TODO: 传入趋势图中所有测点在完整时间范围内的数据
      type: 'line',
    },
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

onMounted(() => {
  initTimelineChart();
});

onUnmounted(() => {
  disposeTimelineChart();
});

watch(
  () => props.fullRange,
  () => {
    startTime.value = props.range.start ? new Date(props.range.start) : null;
    endTime.value = props.range.end ? new Date(props.range.end) : null;
    updateContainerWidth();
    if (timelineChart) {
      timelineChart.setOption(buildTimelineChartOption());
    }
  },
  { deep: true },
);

watch(
  () => props.range,
  () => {
    startTime.value = props.range.start ? new Date(props.range.start) : null;
    endTime.value = props.range.end ? new Date(props.range.end) : null;
    updateRangePercent();
  },
  { deep: true },
);
</script>

<style scoped>
.timeline-area-wrapper {
  width: 100%;
  box-sizing: border-box;
  padding: 0 16px;
}

.date-picker-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 28px 0 12px;
  align-items: center;
}

.full-data-wrapper {
  position: relative;
  width: 100%;
  height: 70px;
}

.full-data-timeline-chart {
  width: 100%;
  height: 100%;
}

.flip-page-button {
  position: absolute;
  top: 30%;
  background: rgb(0 0 0 / 40%);
  border-radius: 50%;
  width: 26px;
  height: 26px;
  border: 0;
  align-items: center;
  cursor: pointer;

  /* transform: translateY(-50%);
  background: rgb(0 0 0 / 40%);
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white; */
}

.flip-page-button-left {
  left: 31px;
}

.flip-page-button-right {
  right: 0;
}

.range-slider {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.range-slider-fill {
  position: absolute;
  top: 0;
  bottom: 25px;
  background: rgb(226 226 226 / 15%);
  border: 1px solid rgb(94 94 94);

  /* border-left: 2px solid rgb(118 131 255 / 80%);
  border-right: 2px solid rgb(118 131 255 / 80%); */
  pointer-events: auto;
}

.range-slider-handle {
  position: absolute;
  margin-left: -2px;
  top: 0;
  bottom: 25px;
  width: 1px;
  padding: 0;
  cursor: ew-resize;
  pointer-events: auto;

  /* margin-left: -6px;
  background: aqua;
  border: none;
  cursor: ew-resize;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center; */
}
</style>
