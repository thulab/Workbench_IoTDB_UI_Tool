<template>
  <div class="pt-[6px] flex-1 w-full overflow-y-auto" style="overflow-x: hidden" ref="wrapperRef">
    <div>
      <draggable v-model="draggableData" item-key="id" @end="handleDragEnd" filter=".el-scrollbar__bar" :prevent-on-filter="false">
        <template #item="{ element, index }">
          <MetricChartGroup
            class="item"
            :isTable="props.isTable"
            :isPlaying="isPlaying"
            :isRunning="props.isRunning"
            :ref="(el) => el && chartRefs[element.group.id] === el"
            :id="element.group.id"
            :key="element.group.id"
            :group="element.group"
            :index="draggableData.length - 1 - index"
            :range="trendStore.visibleTimeRange"
            :markers="props.markers"
            :height="chartHeight"
            :loading="props.loading"
            :need-fetch-data="props.needFetchGroupsId?.includes(element.group.id)"
            :can-delete="props.measurementGroupInfo.length > 1"
            :realTimeData="filteredRealTimeData(element.group)"
            @drop="handleMeasurementDrop"
            @delete-group="handleDeleteGroup"
            @marker-change="updateMarker"
            @marker-value-change="handleMarkerValueChange"
            @delete-measurement="handleDeleteMeasurement"
            @update-range="handleUpdateTimeRange"
          />
        </template>
      </draggable>
    </div>
    <div v-if="props.measurementGroupInfo.length === 0" class="flex flex-col items-center justify-center" :style="{ marginTop: tipMarginTop + 'px' }">
      <div class="flex flex-wrap gap-[40px]" :style="{ maxWidth: props.isTable ? '800px' : '550px' }">
        <div v-if="props.isTable" class="tip-box">
          <div class="tip-title">Tip 1</div>
          <div class="tip-content">
            <span>{{ $t('dataTrend.step1p1') }}</span>
            <span class="tip-highlight">{{ $t('dataTrend.step1p2') }}</span>
            <span>{{ $t('dataTrend.step1p3') }}</span>
          </div>
          <img src="@/assets/add-meas-step.svg" alt="" />
        </div>
        <div class="tip-box">
          <div class="tip-title">{{ props.isTable ? 'Tip 2' : 'Tip 1' }}</div>
          <div class="tip-content">
            <span class="tip-highlight" style="margin-left: 0">{{ $t('dataTrend.step2p1') }}</span>
            <span>{{ $t('dataTrend.step2p2') }}</span>
          </div>
          <img src="@/assets/click-meas-step.svg" alt="" />
        </div>
        <div class="tip-box">
          <div class="tip-title">{{ props.isTable ? 'Tip 3' : 'Tip 2' }}</div>
          <div class="tip-content">
            <span>{{ $t('dataTrend.step3p1') }}</span>
            <span class="tip-highlight">{{ $t('dataTrend.step3p2') }}</span>
            <span>{{ $t('dataTrend.step3p3') }}</span>
          </div>
          <img src="@/assets/drag-meas-step.svg" alt="" />
        </div>
        <div class="tip-box">
          <div class="tip-title">{{ props.isTable ? 'Tip 4' : 'Tip 3' }}</div>
          <div class="tip-content">
            <span>{{ $t('dataTrend.step4p1') }}</span>
            <span class="tip-highlight">{{ $t('dataTrend.step4p2') }}</span>
            <span>{{ $t('dataTrend.step4p3') }}</span>
          </div>
          <img src="@/assets/select-data-step.svg" alt="" />
        </div>
        <div class="tip-box">
          <div class="tip-title">{{ props.isTable ? 'Tip 5' : 'Tip 4' }}</div>
          <div class="tip-content">
            <span>{{ $t('dataTrend.step5p1') }}</span>
            <span class="tip-highlight">{{ $t('dataTrend.step5p2') }}</span>
            <span>{{ $t('dataTrend.step5p3') }}</span>
          </div>
          <img src="@/assets/drag-order-step.svg" alt="" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import MetricChartGroup from './metric-chart-group.vue';
import type { ChartMarker, ChartGroupInput, MeasurementMarkerData } from '@/types/trend';
import type { TrendData } from '@/types';
import { ref, watch } from 'vue';
import { useTableHistoryTrendStore, useTreeHistoryTrendStore } from '@/stores/trend.store';
import draggable from 'vuedraggable';

const selectedTemplateId = ref<number | string>('');

const wrapperRef = ref<HTMLElement | null>(null);
const wrapperHeight = ref(0);
let observer: ResizeObserver | null = null;

const isPlaying = ref(false);

const props = withDefaults(
  defineProps<{
    isTable: boolean;
    isRunning: boolean;
    markers: ChartMarker[];
    measurementGroupInfo: ChartGroupInput[];
    loading?: boolean;
    needFetchGroupsId?: string[];
    realTimeData?: TrendData[];
  }>(),
  {},
);
const draggableData = ref<
  {
    id: string;
    index: number;
    group: ChartGroupInput;
  }[]
>([]);

const trendStore = props.isTable ? useTableHistoryTrendStore() : useTreeHistoryTrendStore();

const chartRefs = ref<Record<string, InstanceType<typeof MetricChartGroup>>>({});

const tipMarginTop = computed(() => {
  let result = 100;
  const h = wrapperHeight.value;
  if (h) {
    result = (h - 470) / 2;
    if (result < 0) {
      result = 0;
    }
  }
  return result;
});

const chartHeight = computed(() => {
  let result = 240;
  const h = wrapperHeight.value;
  if (h) {
    const groupCount = props.measurementGroupInfo.length || 1; // 至少有
    if (groupCount >= 3) {
      result = Math.floor((h - 123) / 3);
    } else if (groupCount === 2) {
      result = Math.floor((h - 82) / groupCount);
    } else {
      result = h - 41;
    }
  }
  return result - 9;
});

const emit = defineEmits<{
  'marker-change': [payload: { id: string; timestamp: number }];
  'merge-into-group': [payload: { groupId: string; measurementPath: string }];
  'delete-group': [payload: { groupId: string }];
  'delete-measurement': [payload: { groupId: string; measurementPath: string }];
  'marker-value-change': [payload: MeasurementMarkerData[]];
  'update-range': [payload: { start: number; end: number }];
  'update-order': [payload: number[]];
}>();

const measurementsMarkerData = ref<MeasurementMarkerData[]>([]);

const deleteMeasurementMarkerDataByName = (name: string) => {
  const index = measurementsMarkerData.value.findIndex((item) => item.name === name);
  measurementsMarkerData.value.splice(index, 1);
};

const clearAllMeasurementMarkerData = () => {
  measurementsMarkerData.value = [];
};

const restoreChartData = () => {
  Object.values(chartRefs.value).forEach((chartRef) => {
    chartRef.restoreData();
  });
};

const resetSelectedTemplate = () => {
  selectedTemplateId.value = '';
};

const scrollToBottom = () => {
  if (wrapperRef.value) {
    wrapperRef.value.scrollTo({
      top: wrapperRef.value.scrollHeight,
      behavior: 'smooth',
    });
  }
};

defineExpose({
  deleteMeasurementMarkerDataByName,
  restoreChartData,
  resetSelectedTemplate,
  clearAllMeasurementMarkerData,
  scrollToBottom,
});

function convertPath(original: string): string {
  if (!props.isTable) {
    return original;
  }
  const firstParen = original.indexOf('(');
  const lastParen = original.indexOf(')');
  if (firstParen === -1 || lastParen === -1 || lastParen <= firstParen) {
    return original;
  }
  const prefix = original.slice(0, firstParen);
  const lastDotIndex = prefix.lastIndexOf('.');
  const dbTb = prefix.slice(0, lastDotIndex);
  const measurement = prefix.slice(lastDotIndex + 1);
  const devices = original.slice(firstParen + 1, lastParen).split(', ');
  const device = devices.join('.');
  const processed = `${dbTb}.${device}.${measurement}`;
  return processed;
}

function filteredRealTimeData(group: ChartGroupInput): TrendData[] {
  const result: TrendData[] = [];
  for (const item of props.realTimeData || []) {
    const convertedPath = convertPath(item.path);
    if (group.members.some((measurement) => measurement.label === convertedPath)) {
      result.push({ ...item, path: convertedPath });
    }
  }
  return result;
}

function handleDragEnd() {
  const newOrder = draggableData.value.map((item) => item.index);
  emit('update-order', newOrder);
}

function handleMarkerValueChange(payload: MeasurementMarkerData[]) {
  payload.forEach((newData) => {
    const index = measurementsMarkerData.value.findIndex((item) => item.name === newData.name);
    if (index === -1) {
      measurementsMarkerData.value.push(newData);
    } else {
      measurementsMarkerData.value[index] = newData;
    }
  });
  emit('marker-value-change', measurementsMarkerData.value);
}

function updateMarker(payload: { id: string; timestamp: number }) {
  emit('marker-change', payload);
}

function handleMeasurementDrop(payload: { groupId: string; measurementPath: string }) {
  emit('merge-into-group', payload);
}

function handleDeleteGroup(payload: { groupId: string }) {
  emit('delete-group', payload);
}

function handleDeleteMeasurement(payload: { groupId: string; measurementPath: string }) {
  emit('delete-measurement', payload);
}

function handleUpdateTimeRange(payload: { start: number; end: number }) {
  emit('update-range', payload);
}

onMounted(() => {
  if (wrapperRef.value) {
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        wrapperHeight.value = entry.contentRect.height;
      }
    });
    observer.observe(wrapperRef.value);
  }
});

onBeforeUnmount(() => {
  if (observer && wrapperRef.value) {
    observer.unobserve(wrapperRef.value);
    observer = null;
  }
});

watch(
  () => props.measurementGroupInfo,
  (newVal) => {
    draggableData.value = newVal.map((item, index) => ({
      id: item.id,
      index,
      group: item as ChartGroupInput,
    }));
  },
  { immediate: true },
);
</script>

<style>
.el-scrollbar__wrap {
  overflow-x: hidden;
}

.tip-box {
  width: 234px;
}

.tip-title {
  color: #495ad4;
  font-size: 16px;
  font-weight: 700;
  line-height: 23.17px;
}

.tip-content {
  color: #131926;
  font-size: 14px;
  font-weight: 400;
  margin-top: 6px;
  line-height: 20.27px;
  height: 57px;
}

.tip-highlight {
  color: #495ad4;
  font-weight: 500;
  margin-left: 4px;
  margin-right: 4px;
}
</style>
