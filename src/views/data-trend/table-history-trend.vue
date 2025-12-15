<template>
  <div class="history-trend-page-container">
    <div class="database-list-wrapper">
      <TableSideTree namespace="history" />
    </div>
    <div class="trend-details-wrapper">
      <TrendGraphArea
        :is-running="false"
        :loading="isFetching"
        :range="visibleRange"
        :markers="markers"
        :measurement-group-info="resolvedGroups"
        @marker-change="updateMarker"
        @global-time-change="handleGlobalTimeChange"
      />
      <TimelineArea :range="pendingRange" :full-range="globalTimeRange" @update:range="updateRange" />
      <MarkerTableArea :is-running="false" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import TableSideTree from './components/table-side-tree.vue';
import TrendGraphArea from './components/trend-graph-area.vue';
import MarkerTableArea from './components/marker-table-area.vue';
import TimelineArea from './components/timeline-area.vue';
import type { TimeRange, GroupState, ChartGroupInput, Measurement, ChartMarker } from '@/types/trend';

const globalTimeRange = ref<TimeRange>({
  start: Date.now() - 12 * 3600 * 1000,
  end: Date.now(),
});
const visibleRange = ref<TimeRange>({ ...globalTimeRange.value });
const pendingRange = ref<TimeRange>({ ...globalTimeRange.value });
const isFetching = ref(false);
let fetchTimer: ReturnType<typeof setTimeout> | null = null;

const measurementList: Measurement[] = []; // 所有左侧测点
const measurementMap = new Map(measurementList.map((item) => [item.id, item]));
const groups = ref<GroupState[]>([]); // 测点的分组信息
const resolvedGroups = computed<ChartGroupInput[]>(() =>
  groups.value.map((group) => ({
    id: group.id,
    members: group.measurementIds.map((measurementId) => measurementMap.get(measurementId)).filter(Boolean) as typeof measurementList,
  })),
);

const markers = ref<ChartMarker[]>(createInitialMarkers(globalTimeRange.value));

function createInitialMarkers(range: TimeRange = globalTimeRange.value): ChartMarker[] {
  const span = Math.max(range.end - range.start, 1);
  return [
    {
      id: 'marker-1',
      label: 'X1',
      color: '#ff9478',
      timestamp: range.start + span * 0.25,
    },
    {
      id: 'marker-2',
      label: 'X2',
      color: '#59d5ff',
      timestamp: range.start + span * 0.7,
    },
  ];
}

function updateMarker(payload: { id: string; timestamp: number }) {
  const range = visibleRange.value;
  const clamped = Math.min(Math.max(payload.timestamp, range.start), range.end);
  markers.value = markers.value.map((marker) => (marker.id === payload.id ? { ...marker, timestamp: clamped } : marker));
}

function handleGlobalTimeChange(payload: TimeRange) {
  globalTimeRange.value.start = payload.start;
  globalTimeRange.value.end = payload.end;
}

function updateRange(range: TimeRange) {
  const nextRange = {
    start: Math.max(range.start, globalTimeRange.value.start),
    end: Math.min(range.end, globalTimeRange.value.end),
  };
  pendingRange.value = nextRange;
  triggerSimulatedFetch(nextRange);
}

function triggerSimulatedFetch(nextRange: TimeRange) {
  isFetching.value = true;
  if (fetchTimer) {
    clearTimeout(fetchTimer);
  }
  fetchTimer = setTimeout(() => {
    markers.value = createInitialMarkers(nextRange);
    visibleRange.value = nextRange;
    isFetching.value = false;
    fetchTimer = null;
  }, 650);
}

watch(
  globalTimeRange,
  (newVal) => {
    pendingRange.value = { ...newVal };
    visibleRange.value = { ...newVal };
  },
  { deep: true },
);

watch(
  () => visibleRange.value,
  (range) => {
    if (!isFetching.value) {
      pendingRange.value = range;
    }
    markers.value = markers.value.map((marker) => ({
      ...marker,
      timestamp: Math.min(Math.max(marker.timestamp, range.start), range.end),
    }));
  },
  { deep: true },
);
</script>

<style>
.history-trend-page-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.database-list-wrapper {
  width: 240px;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.trend-details-wrapper {
  width: calc(100% - 256px);
  margin-left: 256px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  background-color: #fff;
  border-radius: 6px;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}
</style>
