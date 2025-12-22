<template>
  <div class="w-full flex-1 overflow-auto" ref="wrapperRef">
    <div>
      <el-scrollbar>
        <div>
          <MetricChartGroup
            v-for="(group, index) in props.measurementGroupInfo"
            :isTable="props.isTable"
            :isPlaying="isPlaying"
            :isRunning="props.isRunning"
            :ref="(el) => el && chartRefs[group.id] === el"
            :id="group.id"
            :key="group.id"
            :group="group"
            :index="index"
            :range="trendStore.visibleTimeRange"
            :markers="props.markers"
            :height="chartHeight"
            :loading="props.loading"
            :need-fetch-data="props.needFetchGroupsId?.includes(group.id)"
            :can-delete="props.measurementGroupInfo.length > 1"
            :realTimeData="filteredRealTimeData(group)"
            @drop="handleMeasurementDrop"
            @delete-group="handleDeleteGroup"
            @marker-change="updateMarker"
            @marker-value-change="handleMarkerValueChange"
            @delete-measurement="handleDeleteMeasurement"
          />
          <MetricChartGroup
            v-if="props.measurementGroupInfo.length === 0"
            :isTable="props.isTable"
            :isRunning="props.isRunning"
            :group="{ id: 'default', members: [] }"
            :index="0"
            :range="trendStore.visibleTimeRange"
            :markers="props.markers"
            :height="chartHeight"
            :loading="props.loading"
            :need-fetch-data="false"
            :can-delete="false"
            @drop="handleMeasurementDrop"
            @delete-group="handleDeleteGroup"
            @marker-change="updateMarker"
            @marker-value-change="handleMarkerValueChange"
            @delete-measurement="handleDeleteMeasurement"
          />
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script lang="ts" setup>
import MetricChartGroup from './metric-chart-group.vue';
import type { ChartMarker, ChartGroupInput, MeasurementMarkerData } from '@/types/trend';
import type { TrendData } from '@/types';
import { ref } from 'vue';
import { useTableHistoryTrendStore, useTreeHistoryTrendStore } from '@/stores/trend.store';

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

const trendStore = props.isTable ? useTableHistoryTrendStore() : useTreeHistoryTrendStore();

const chartRefs = ref<Record<string, InstanceType<typeof MetricChartGroup>>>({});

const chartHeight = computed(() => {
  let result = 240;
  const h = wrapperHeight.value;
  if (h) {
    const groupCount = props.measurementGroupInfo.length || 1; // 至少有
    if (groupCount >= 3) {
      result = Math.floor((h - 105) / 3);
    } else if (groupCount === 2) {
      result = Math.floor((h - 70) / groupCount);
    } else {
      result = h - 35;
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
}>();

const measurementsMarkerData = ref<MeasurementMarkerData[]>([]);

const deleteMeasurementMarkerDataByName = (name: string) => {
  const index = measurementsMarkerData.value.findIndex((item) => item.name === name);
  measurementsMarkerData.value.splice(index, 1);
};

const restoreChartData = () => {
  Object.values(chartRefs.value).forEach((chartRef) => {
    chartRef.restoreData();
  });
};

const resetSelectedTemplate = () => {
  selectedTemplateId.value = '';
};

defineExpose({
  deleteMeasurementMarkerDataByName,
  restoreChartData,
  resetSelectedTemplate,
});

function convertPath(original: string): string {
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
</script>

<style>
.el-scrollbar__wrap {
  overflow-x: hidden;
}
</style>
