<template>
  <div class="flex h-full w-full relative">
    <div :style="{ width: sideTreeWidth + 'px', position: 'relative' }" class="rounded-6px bg-white flex-shrink-0">
      <div
        :style="{ height: '100%', width: '4px', backgroundColor: 'transparent', position: 'absolute', left: sideTreeWidth + 'px', cursor: 'ew-resize' }"
        @pointerdown="(e) => onSliderPointerDown(e)"
      ></div>
      <div style="position: relative">
        <SideTree ref="measurementSideTree" :can-read-write-schema="canReadWriteSchema" :current-node="currentNode" @doubleClickMeasurement="createGroup" />
      </div>
    </div>

    <div class="ml-8px p-[0px_8px_8px] rounded-6px bg-white flex flex-1 flex-col min-w-0">
      <div>
        <OperateButtonRow
          ref="operateButtonRowRef"
          :isTable="false"
          :isRunning="false"
          :templateList="templateList"
          :canOperate="resolvedGroups.length > 0"
          @global-time-change="handleGlobalTimeChange"
          @save-template="handleSaveTemplate"
          @handle-operate="handleOperateTemplate"
          @get-query-list="getTemplateList"
          @reset-graph="handleResetGraphArea"
          @reset-trend="setStorage"
        />
      </div>
      <TrendGraphArea
        ref="trendGraphRef"
        :isTable="false"
        :is-running="false"
        :loading="isFetching"
        :range="trendStore.visibleTimeRange"
        :markers="markers"
        :measurement-group-info="resolvedGroups"
        :needFetchGroupsId="needFetchGroupsId"
        @marker-change="updateMarker"
        @merge-into-group="mergeGroup"
        @delete-group="deleteGroup"
        @delete-measurement="deleteMeasurement"
        @marker-value-change="handleMarkerValueChange"
        @update-range="updateRange"
        @update-order="updateOrder"
      />
      <TimelineArea
        ref="timelineAreaRef"
        :isTable="false"
        :range="trendStore.pendingTimeRange"
        :full-range="trendStore.globalTimeRange"
        :all-measurement-info="measurementList"
        :need-fetch-measurement-id="needFetchMeasurementsId"
        :need-delete-measurements-id="needDeleteMeasurementsId"
        @update:range="updateRange"
        @clear-need-fetch-measurements="clearNeedFetchMeasurements"
        @clear-need-delete-measurements="clearNeedDeleteMeasurements"
      />
      <MarkerTableArea :is-running="false" :marker-datas="markerDatas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SideTree from './components/tree-side-tree.vue';
import OperateButtonRow from './components/operate-button-row.vue';
import TrendGraphArea from './components/trend-graph-area.vue';
import TimelineArea from './components/timeline-area.vue';
import type { TimelineExpose } from './components/timeline-area.vue';
import MarkerTableArea from './components/marker-table-area.vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores';
import type { GroupState, ChartGroupInput, Measurement, TimeRange, ChartMarker, MeasurementMarkerData } from '@/types/trend';
import type { TrendTemplate } from '@/types';
import { useTreeHistoryTrendStore } from '@/stores/trend.store';
import { SearchApi } from '@/api';
import dayjs from 'dayjs';

const userStore = useUserStore();
const { canReadWriteSchema } = storeToRefs(userStore);
const currentNode = ref('root');
const storageKey = 'newTreeDataHistoryTrendStorage';

const measurementList = ref<Measurement[]>([]); // 所有被添加的测点列表
const measurementMap = new Map(measurementList.value.map((item) => [item.id, item]));
const visibleMeasurementCountMap = ref<Map<string, number>>(new Map()); // 所有可见测点的数量统计
const needFetchMeasurementsId = ref<string[]>([]); // 时间轴中需要新加载的测点
const needDeleteMeasurementsId = ref<string[]>([]); // 时间轴中需要删除的测点
const needFetchGroupsId = ref<string[]>([]); // 趋势图中需要新加载的分组
const usedColors = ref<Set<string>>(new Set());
const predefineColors = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#8AC211'];
const groups = ref<GroupState[]>([]); // 测点的分组信息
const resolvedGroups = computed<ChartGroupInput[]>(() =>
  groups.value.map((group) => ({
    id: group.id,
    members: group.measurementIds.map((measurementId) => measurementMap.get(measurementId)).filter(Boolean) as Measurement[],
  })),
);

const operateButtonRowRef = ref<InstanceType<typeof OperateButtonRow>>();
const templateList = ref<TrendTemplate[]>([]);
const trendStore = useTreeHistoryTrendStore();
const markers = ref<ChartMarker[]>(createInitialMarkers());
const markerDatas = ref<MeasurementMarkerData[]>([]);
const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);
const { requestFn: getTrendTemplate /** loading */ } = useRequest(SearchApi.getTrendTemplate);
const { t } = useI18n();

const trendGraphRef = ref<InstanceType<typeof TrendGraphArea>>();

const timelineAreaRef = ref<TimelineExpose | null>(null);
const isFetching = ref(false);
let fetchTimer: ReturnType<typeof setTimeout> | null = null;

const measurementSideTree = ref<InstanceType<typeof SideTree> | null>(null);
const sideTreeWidth = ref<number>(256);

function onSliderPointerDown(event: PointerEvent) {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = measurementSideTree.value?.$el.offsetWidth || 256;

  function onPointerMove(e: PointerEvent) {
    const deltaX = e.clientX - startX;
    const newWidth = Math.min(Math.max(200, startWidth + deltaX), 600);
    if (measurementSideTree.value) {
      sideTreeWidth.value = newWidth;
    }
  }

  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

// ========== 侧边栏所需函数 ==========

function addToMeasurementListIfNotExist(fullPath: string) {
  if (measurementList.value.find((m) => m.label === fullPath)) {
    return;
  }
  const allocatedColor =
    predefineColors.find((c) => !usedColors.value.has(c)) ||
    `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')}`;
  usedColors.value.add(allocatedColor);

  const newMeasurement: Measurement = {
    id: fullPath,
    label: fullPath,
    color: allocatedColor,
    details: null,
    values: [],
  };
  measurementList.value.push(newMeasurement);
  measurementMap.set(newMeasurement.id, newMeasurement);
}

function createGroup(fullPath: string) {
  if (groups.value.length >= 5) {
    ElMessage.warning({ message: t('dataTrend.groupMaxWarning'), grouping: true });
    return;
  }

  addToMeasurementListIfNotExist(fullPath);

  const groupId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  groups.value.push({
    id: groupId,
    measurementIds: [fullPath],
  });
  if (!visibleMeasurementCountMap.value.has(fullPath)) {
    visibleMeasurementCountMap.value.set(fullPath, 1);
    needFetchMeasurementsId.value.push(fullPath);
  } else {
    visibleMeasurementCountMap.value.set(fullPath, visibleMeasurementCountMap.value.get(fullPath)! + 1);
  }
  needFetchGroupsId.value = [];
  needFetchGroupsId.value.push(groupId);
  setStorage();
  setTimeout(() => {
    trendGraphRef.value?.scrollToBottom();
  }, 1000);
}

// ========== 操作按钮行所需函数 ==========

function handleGlobalTimeChange(payload: TimeRange) {
  trendStore.setGlobalTimeRange(payload);
  trendStore.setVisibleTimeRange(payload);
  trendStore.setPendingTimeRange(payload);
  needFetchGroupsId.value = [];
  needFetchGroupsId.value = groups.value.map((g) => g.id);
  markers.value = createInitialMarkers();

  setStorage();
}

function createInitialMarkers(range: TimeRange = trendStore.globalTimeRange): ChartMarker[] {
  const span = Math.max(range.end - range.start, 1);
  return [
    {
      id: 'marker-1',
      label: 'X1',
      color: '#D43030',
      timestamp: range.start + span * 0.25,
    },
    {
      id: 'marker-2',
      label: 'X2',
      color: '#D43030',
      timestamp: range.start + span * 0.7,
    },
  ];
}

function getTemplateList() {
  getTrendTemplate('', '').then((res) => {
    const data = res.data || [];
    templateList.value = data.filter((item: TrendTemplate) => item.type === 'new-tree-history');
  });
}

function handleSaveTemplate(name: string) {
  operateButtonRowRef.value?.setSaveTemplateLoading(true);
  const groupInfoToSave = groups.value.map((group) => ({
    id: group.id,
    members: group.measurementIds.map((measurementId) => measurementMap.get(measurementId)).filter(Boolean) as Measurement[],
  }));
  const data = JSON.stringify({
    type: 'new-tree-history',
    globalTimeRange: [dayjs(trendStore.globalTimeRange.start).valueOf(), dayjs(trendStore.globalTimeRange.end).valueOf()],
    localTimeRange: [dayjs(trendStore.visibleTimeRange.start).valueOf(), dayjs(trendStore.visibleTimeRange.end).valueOf()],
    visibleGroupInfo: groupInfoToSave,
    selectedMeasurements: measurementList.value,
  });
  upsertTrendTemplate({
    id: '',
    type: 'new-tree-history',
    name,
    template: data,
  })
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      operateButtonRowRef.value?.setTemplateVisible(false);
      getTemplateList();
    })
    .finally(() => {
      operateButtonRowRef.value?.setSaveTemplateLoading(false);
    });
}

function handleOperateTemplate(payload: { action: string; data: TrendTemplate }) {
  if (payload.action === 'rename') {
    operateButtonRowRef.value?.setRenameData({
      id: +payload.data.id,
      name: payload.data.name,
      type: payload.data.type,
      template: payload.data.template,
    });
    operateButtonRowRef.value?.setRenameVisible(true);
    operateButtonRowRef.value?.setSaveTemplateLoading(false);
  } else {
    const templateData = JSON.parse(payload.data.template);
    trendStore.setGlobalTimeRange({
      start: templateData.globalTimeRange[0],
      end: templateData.globalTimeRange[1],
    });
    trendStore.setVisibleTimeRange({
      start: templateData.localTimeRange[0],
      end: templateData.localTimeRange[1],
    });
    trendStore.setPendingTimeRange({
      start: templateData.localTimeRange[0],
      end: templateData.localTimeRange[1],
    });
    const measurementsToAdd = templateData.selectedMeasurements.filter((item: Measurement) => {
      return !measurementList.value.find((m) => m.id === item.id);
    });
    for (const m of measurementsToAdd) {
      addToMeasurementListIfNotExist(m.id);
    }
    measurementMap.clear();
    measurementList.value.forEach((item: Measurement) => {
      measurementMap.set(item.id, item);
    });
    trendGraphRef.value?.clearAllMeasurementMarkerData();
    groups.value = templateData.visibleGroupInfo.map((group: ChartGroupInput) => ({
      id: group.id,
      measurementIds: group.members.map((member: Measurement) => member.id),
    }));
    visibleMeasurementCountMap.value = new Map();
    groups.value.forEach((group) => {
      group.measurementIds.forEach((measurementId) => {
        if (!visibleMeasurementCountMap.value.has(measurementId)) {
          visibleMeasurementCountMap.value.set(measurementId, 1);
        } else {
          visibleMeasurementCountMap.value.set(measurementId, visibleMeasurementCountMap.value.get(measurementId)! + 1);
        }
      });
    });
    needFetchMeasurementsId.value = measurementList.value.map((m) => m.id);
    needFetchGroupsId.value = [];
    needFetchGroupsId.value = groups.value.map((g) => g.id);
    markers.value = createInitialMarkers(trendStore.visibleTimeRange);
    setStorage();
  }
}

function handleResetGraphArea() {
  usedColors.value.clear();
  measurementList.value = [];
  measurementMap.clear();
  needDeleteMeasurementsId.value = groups.value.flatMap((group) => group.measurementIds);
  for (const measurementId of needDeleteMeasurementsId.value) {
    trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurementId);
  }
  groups.value = [];
  visibleMeasurementCountMap.value.clear();
  needFetchMeasurementsId.value = [];
  needFetchGroupsId.value = [];
  markerDatas.value = [];
  operateButtonRowRef.value?.setSelectedTemplateId('');
  setStorage();
}

// ========== 趋势图所需函数 ==========

function updateMarker(payload: { id: string; timestamp: number }) {
  const range = trendStore.visibleTimeRange;
  const clamped = Math.min(Math.max(payload.timestamp, range.start), range.end);
  markers.value = markers.value.map((marker) => (marker.id === payload.id ? { ...marker, timestamp: clamped } : marker));

  setStorage();
}

function mergeGroup(payload: { groupId: string; measurementPath: string }) {
  addToMeasurementListIfNotExist(payload.measurementPath);
  const group = groups.value.find((g) => g.id === payload.groupId);
  if (group && !group.measurementIds.includes(payload.measurementPath)) {
    if (group.measurementIds.length >= 10) {
      ElMessage.warning({ message: t('dataTrend.measurementMaxWarning'), grouping: true });
      return;
    }
    group.measurementIds.push(payload.measurementPath);
    if (!visibleMeasurementCountMap.value.has(payload.measurementPath)) {
      visibleMeasurementCountMap.value.set(payload.measurementPath, 1);
      needFetchMeasurementsId.value.push(payload.measurementPath);
    } else {
      visibleMeasurementCountMap.value.set(payload.measurementPath, visibleMeasurementCountMap.value.get(payload.measurementPath)! + 1);
    }
    needFetchGroupsId.value = [];
    needFetchGroupsId.value.push(payload.groupId);
    setStorage();
  }
}

function deleteMeasurementInfoIfUnused(measurementId: string) {
  if (visibleMeasurementCountMap.value.has(measurementId)) {
    const count = visibleMeasurementCountMap.value.get(measurementId)! - 1;
    if (count <= 0) {
      visibleMeasurementCountMap.value.delete(measurementId);
      needDeleteMeasurementsId.value.push(measurementId);
      trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurementId);
      usedColors.value.delete(measurementMap.get(measurementId)?.color || '');
      measurementList.value = measurementList.value.filter((m) => m.id !== measurementId);
      measurementMap.delete(measurementId);
    } else {
      visibleMeasurementCountMap.value.set(measurementId, count);
    }
  }
}

function deleteGroup(payload: { groupId: string }) {
  const group = groups.value.find((g) => g.id === payload.groupId);
  if (group) {
    group.measurementIds.forEach((measurementId) => {
      deleteMeasurementInfoIfUnused(measurementId);
    });
  }
  groups.value = groups.value.filter((g) => g.id !== payload.groupId);
  needFetchGroupsId.value = [];
  setStorage();
}

function deleteMeasurement(payload: { groupId: string; measurementPath: string }) {
  const group = groups.value.find((g) => g.id === payload.groupId);
  if (group) {
    group.measurementIds = group.measurementIds.filter((id) => id !== payload.measurementPath);
    if (group.measurementIds.length === 0) {
      groups.value = groups.value.filter((g) => g.id !== payload.groupId);
    }
    deleteMeasurementInfoIfUnused(payload.measurementPath);
    needFetchGroupsId.value = [];
    needFetchGroupsId.value.push(payload.groupId);
    setStorage();
  }
}

function handleMarkerValueChange(payload: MeasurementMarkerData[]) {
  markerDatas.value = payload;
}

// ========== 时间轴所需函数 ==========

function updateRange(range: TimeRange) {
  const nextRange = {
    start: Math.max(range.start, trendStore.globalTimeRange.start),
    end: Math.min(range.end, trendStore.globalTimeRange.end),
  };
  trendStore.setPendingTimeRange(nextRange);
  triggerSimulatedFetch(nextRange);
}

function updateOrder(newOrder: number[]) {
  const newGroupsOrder: GroupState[] = [];
  for (const index of newOrder) {
    const group = groups.value[index];
    if (group) {
      newGroupsOrder.push(group);
    }
  }
  groups.value = [...newGroupsOrder];
  setStorage();
}

function triggerSimulatedFetch(nextRange: TimeRange) {
  isFetching.value = true;
  if (fetchTimer) {
    clearTimeout(fetchTimer);
  }
  fetchTimer = setTimeout(() => {
    markers.value = createInitialMarkers(nextRange);
    trendStore.setVisibleTimeRange(nextRange);
    isFetching.value = false;
    fetchTimer = null;
  }, 650);
}

function clearNeedFetchMeasurements() {
  needFetchMeasurementsId.value = [];
}

function clearNeedDeleteMeasurements() {
  needDeleteMeasurementsId.value = [];
}

// ========== 数据缓存相关函数 ==========

function setStorage() {
  const storageData = {
    globalTimeRange: trendStore.globalTimeRange,
    visibleRange: trendStore.visibleTimeRange,
    pendingRange: trendStore.pendingTimeRange,
    groups: groups.value,
    measurements: measurementList.value,
    markers: markers.value,
    visibleMeasurementCounts: Array.from(visibleMeasurementCountMap.value.entries()),
    selectedTemplateId: operateButtonRowRef.value?.getSelectedTemplateId() || '',
  };
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(storageData));
  } catch (e) {
    console.warn('Failed to save history trend page state to sessionStorage:', e);
  }
}

function restoreData() {
  const storageData = window.sessionStorage.getItem(storageKey);
  if (storageData) {
    try {
      const parsed = JSON.parse(storageData);
      trendStore.setGlobalTimeRange(parsed.globalTimeRange);
      trendStore.setVisibleTimeRange(parsed.visibleRange);
      trendStore.setPendingTimeRange(parsed.pendingRange);
      operateButtonRowRef.value?.setSelectedDateTime([trendStore.globalTimeRange.start, trendStore.globalTimeRange.end]);
      groups.value = parsed.groups;
      measurementList.value = parsed.measurements;
      usedColors.value.clear();
      measurementList.value.forEach((m: Measurement) => {
        usedColors.value.add(m.color);
      });
      markers.value = parsed.markers?.length ? parsed.markers : createInitialMarkers(trendStore.globalTimeRange);
      measurementMap.clear();
      measurementList.value.forEach((item) => {
        measurementMap.set(item.id, item);
      });

      if (Array.isArray(parsed.visibleMeasurementCounts)) {
        visibleMeasurementCountMap.value = new Map(parsed.visibleMeasurementCounts);
      } else {
        visibleMeasurementCountMap.value = new Map();
        groups.value.forEach((group) => {
          group.measurementIds.forEach((measurementId) => {
            if (!visibleMeasurementCountMap.value.has(measurementId)) {
              visibleMeasurementCountMap.value.set(measurementId, 1);
            } else {
              visibleMeasurementCountMap.value.set(measurementId, visibleMeasurementCountMap.value.get(measurementId)! + 1);
            }
          });
        });
      }

      needFetchGroupsId.value = [];
      needFetchMeasurementsId.value = [];
      needDeleteMeasurementsId.value = [];

      nextTick(() => {
        trendGraphRef.value?.restoreChartData();
        timelineAreaRef.value?.restoreData();
        operateButtonRowRef.value?.setSelectedTemplateId(parsed.selectedTemplateId || '');
        setStorage();
      });
    } catch (e) {
      console.error('Failed to parse storage data:', e);
    }
  }
}

// ========== 生命周期函数 ==========

onMounted(() => {
  if (window.sessionStorage.getItem(storageKey)) {
    restoreData();
  } else {
    window.sessionStorage.setItem(storageKey, '');
  }
  getTemplateList();
});

// ========== 监控函数 ==========

watch(
  () => trendStore.globalTimeRange,
  () => {
    setStorage();
  },
  { deep: true },
);

watch(
  () => trendStore.visibleTimeRange,
  (range) => {
    if (!isFetching.value) {
      trendStore.setPendingTimeRange(range);
    }
    markers.value = markers.value.map((marker) => ({
      ...marker,
      timestamp: Math.min(Math.max(marker.timestamp, range.start), range.end),
    }));
    needFetchGroupsId.value = [];
    needFetchGroupsId.value = groups.value.map((g) => g.id);
    setStorage();
  },
  { deep: true },
);

watch(
  () => trendStore.pendingTimeRange,
  () => {
    setStorage();
  },
  { deep: true },
);
</script>
