<template>
  <div class="relative w-full h-full flex">
    <div class="w-256px bg-white flex-shrink-0 rounded-6px">
      <TableSideTree
        ref="sideTreeRef"
        namespace="history"
        @updateSelectedMeasurements="(list) => handleSelectedMeasurementsUpdate({ selectedMeasurements: list })"
        @deleteMeasurement="handleDeleteMeasurement"
        @doubleClickMeasurement="createGroup"
        @resetMeasurement="handleResetMeasurement"
      />
    </div>

    <div class="flex-1 ml-8px bg-white rounded-6px p-[0px_8px_8px] flex flex-col min-w-0">
      <div>
        <OperateButtonRow
          ref="operateButtonRowRef"
          :isTable="true"
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
        :isTable="true"
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
      />
      <TimelineArea
        ref="timelineAreaRef"
        :isTable="true"
        :range="trendStore.pendingTimeRange"
        :full-range="trendStore.globalTimeRange"
        :all-measurement-info="visibleMeasurementsSet"
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

<script lang="ts" setup>
import TableSideTree from './components/table-side-tree.vue';
import TrendGraphArea from './components/trend-graph-area.vue';
import MarkerTableArea from './components/marker-table-area.vue';
import TimelineArea from './components/timeline-area.vue';
import OperateButtonRow from './components/operate-button-row.vue';
import type { TimeRange, GroupState, ChartGroupInput, Measurement, ChartMarker, MeasurementMarkerData } from '@/types/trend';
import type { SelectedMeasurement, TrendTemplate } from '@/types';
import dayjs from 'dayjs';
import { SearchApi } from '@/api';
import { useTableHistoryTrendStore } from '@/stores/trend.store';
import type { TimelineExpose } from './components/timeline-area.vue';

const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);
const { requestFn: getTrendTemplate /** loading */ } = useRequest(SearchApi.getTrendTemplate);

const trendStore = useTableHistoryTrendStore();
const { t } = useI18n();
const isFetching = ref(false);
let fetchTimer: ReturnType<typeof setTimeout> | null = null;

const sideTreeRef = ref<InstanceType<typeof TableSideTree>>();
const timelineAreaRef = ref<TimelineExpose | null>(null);
const trendGraphRef = ref<InstanceType<typeof TrendGraphArea>>();
const operateButtonRowRef = ref<InstanceType<typeof OperateButtonRow>>();
const measurementList = ref<Measurement[]>([]); // 所有左侧测点
const measurementMap = new Map(measurementList.value.map((item) => [item.id, item]));
const groups = ref<GroupState[]>([]); // 测点的分组信息
const resolvedGroups = computed<ChartGroupInput[]>(() =>
  groups.value.map((group) => ({
    id: group.id,
    members: group.measurementIds.map((measurementId) => measurementMap.get(measurementId)).filter(Boolean) as Measurement[],
  })),
);
const visibleMeasurementCountMap = ref<Map<string, number>>(new Map());
const needFetchGroupsId = ref<string[]>([]);
const needFetchMeasurementsId = ref<string[]>([]);
const needDeleteMeasurementsId = ref<string[]>([]);
const visibleMeasurementsSet = computed<Measurement[]>(() => {
  return measurementList.value.filter((item) => visibleMeasurementCountMap.value.has(item.id));
});

const markers = ref<ChartMarker[]>(createInitialMarkers());
const markerDatas = ref<MeasurementMarkerData[]>([]);

const templateList = ref<TrendTemplate[]>([]);

const usedColors = ref<Set<string>>(new Set());
const predefineColors = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#8AC211'];

function handleMarkerValueChange(payload: MeasurementMarkerData[]) {
  markerDatas.value = payload;
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

function handleResetMeasurement() {
  measurementList.value = [];
  measurementMap.clear();
  usedColors.value.clear();
  handleResetGraphArea();
}

function handleResetGraphArea() {
  needDeleteMeasurementsId.value = groups.value.flatMap((group) => group.measurementIds);
  for (const measurementId of needDeleteMeasurementsId.value) {
    trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurementId);
  }
  groups.value = [];
  visibleMeasurementCountMap.value.clear();
  needFetchMeasurementsId.value = [];
  needFetchGroupsId.value = [];
  operateButtonRowRef.value?.setSelectedTemplateId('');
  setStorage();
}

function handleSelectedMeasurementsUpdate(payload: { selectedMeasurements: SelectedMeasurement[] }) {
  const newMeasurements = payload.selectedMeasurements.filter((item) => {
    return !measurementList.value.find((m) => m.id === `${item.database}.${item.tableName}.${item.device?.map((d) => d.value).join('.')}.${item.measurement}`);
  });
  for (const item of newMeasurements) {
    let deviceName = '';
    for (const curTag of item.device ?? []) {
      if (curTag.value) {
        deviceName += `${curTag.value}.`;
      }
    }
    if (deviceName.endsWith('.')) {
      deviceName = deviceName.slice(0, -1);
    }

    // 串行查找可用颜色
    let color = predefineColors.find((c) => !usedColors.value.has(c));
    if (!color) {
      // 生成随机颜色，确保不重复
      do {
        color = `#${Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, '0')}`;
      } while (usedColors.value.has(color)); // 检查是否已使用
    }

    usedColors.value.add(color);

    const label = `${item.database}.${item.tableName}.${deviceName}.${item.measurement}`;
    measurementList.value.push({
      id: label,
      label,
      color,
      details: item,
      values: [],
    });
  }
  // measurementList.value.push(
  //   ...newMeasurements.map((item) => {
  //     let deviceName = '';
  //     for (const curTag of item.device ?? []) {
  //       deviceName += `${curTag.value}.`;
  //     }
  //     if (deviceName.endsWith('.')) {
  //       deviceName = deviceName.slice(0, -1);
  //     }

  //     const color =
  //       predefineColors.find((c) => !usedColors.value.has(c)) ||
  //       `#${Math.floor(Math.random() * 0xffffff)
  //         .toString(16)
  //         .padStart(6, '0')}`;
  //     usedColors.value.add(color);

  //     const label = `${item.database}.${item.tableName}.${deviceName}.${item.measurement}`;
  //     return {
  //       id: label,
  //       label,
  //       color,
  //       details: item,
  //       values: [],
  //     } as unknown as Measurement;
  //   }),
  // );
  measurementMap.clear();
  measurementList.value.forEach((item) => {
    measurementMap.set(item.id, item);
  });
  setStorage();
}

function handleDeleteMeasurement(fullpath: string) {
  usedColors.value.delete(measurementList.value.find((item) => item.label === fullpath)?.color || '');
  measurementList.value = measurementList.value.filter((item) => {
    return item.label !== fullpath;
  });
  measurementMap.clear();
  measurementList.value.forEach((item) => {
    measurementMap.set(item.id, item);
  });
  needFetchGroupsId.value = [];
  for (const group of groups.value) {
    group.measurementIds = group.measurementIds.filter((id) => {
      return id !== fullpath;
    });
    if (group.measurementIds.length === 0) {
      groups.value = groups.value.filter((g) => g.id !== group.id);
    } else {
      needFetchGroupsId.value.push(group.id);
    }
  }
  visibleMeasurementCountMap.value.delete(fullpath);
  trendGraphRef.value?.deleteMeasurementMarkerDataByName(fullpath);
  needDeleteMeasurementsId.value.push(fullpath);
  setStorage();
}

function createGroup(fullpath: string) {
  if (groups.value.length >= 5) {
    ElMessage.warning({ message: t('dataTrend.groupMaxWarning'), grouping: true });
    return;
  }
  const groupId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  groups.value.push({
    id: groupId,
    measurementIds: [fullpath],
  });
  if (!visibleMeasurementCountMap.value.has(fullpath)) {
    visibleMeasurementCountMap.value.set(fullpath, 1);
    needFetchMeasurementsId.value.push(fullpath);
  } else {
    visibleMeasurementCountMap.value.set(fullpath, visibleMeasurementCountMap.value.get(fullpath)! + 1);
  }
  needFetchGroupsId.value = [];
  needFetchGroupsId.value.push(groupId);
  setStorage();
}

function mergeGroup(payload: { groupId: string; measurementPath: string }) {
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

function deleteGroup(payload: { groupId: string }) {
  const group = groups.value.find((g) => g.id === payload.groupId);
  if (group) {
    group.measurementIds.forEach((measurementId) => {
      if (visibleMeasurementCountMap.value.has(measurementId)) {
        const count = visibleMeasurementCountMap.value.get(measurementId)! - 1;
        if (count <= 0) {
          visibleMeasurementCountMap.value.delete(measurementId);
          needDeleteMeasurementsId.value.push(measurementId);
          trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurementId);
        } else {
          visibleMeasurementCountMap.value.set(measurementId, count);
        }
      }
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

    if (visibleMeasurementCountMap.value.has(payload.measurementPath)) {
      const count = visibleMeasurementCountMap.value.get(payload.measurementPath)! - 1;
      if (count <= 0) {
        visibleMeasurementCountMap.value.delete(payload.measurementPath);
        needDeleteMeasurementsId.value.push(payload.measurementPath);
        trendGraphRef.value?.deleteMeasurementMarkerDataByName(payload.measurementPath);
      } else {
        visibleMeasurementCountMap.value.set(payload.measurementPath, count);
      }
    }
    needFetchGroupsId.value = [];
    needFetchGroupsId.value.push(payload.groupId);

    setStorage();
  }
}

function clearNeedFetchMeasurements() {
  needFetchMeasurementsId.value = [];
}

function clearNeedDeleteMeasurements() {
  needDeleteMeasurementsId.value = [];
}

function updateMarker(payload: { id: string; timestamp: number }) {
  const range = trendStore.visibleTimeRange;
  const clamped = Math.min(Math.max(payload.timestamp, range.start), range.end);
  markers.value = markers.value.map((marker) => (marker.id === payload.id ? { ...marker, timestamp: clamped } : marker));

  setStorage();
}

function handleGlobalTimeChange(payload: TimeRange) {
  trendStore.setGlobalTimeRange(payload);
  trendStore.setVisibleTimeRange(payload);
  trendStore.setPendingTimeRange(payload);
  needFetchGroupsId.value = [];
  needFetchGroupsId.value = groups.value.map((g) => g.id);
  markers.value = createInitialMarkers();

  setStorage();
}

function updateRange(range: TimeRange) {
  const nextRange = {
    start: Math.max(range.start, trendStore.globalTimeRange.start),
    end: Math.min(range.end, trendStore.globalTimeRange.end),
  };
  trendStore.setPendingTimeRange(nextRange);
  triggerSimulatedFetch(nextRange);
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

function getTemplateList() {
  getTrendTemplate('', '').then((res) => {
    const data = res.data || [];
    templateList.value = data.filter((item: TrendTemplate) => item.type === 'new-table-history');
  });
}

function handleSaveTemplate(name: string) {
  operateButtonRowRef.value?.setSaveTemplateLoading(true);
  const groupInfoToSave = groups.value.map((group) => ({
    id: group.id,
    members: group.measurementIds.map((measurementId) => measurementMap.get(measurementId)).filter(Boolean) as Measurement[],
  }));
  const data = JSON.stringify({
    type: 'new-table-history',
    globalTimeRange: [dayjs(trendStore.globalTimeRange.start).valueOf(), dayjs(trendStore.globalTimeRange.end).valueOf()],
    localTimeRange: [dayjs(trendStore.visibleTimeRange.start).valueOf(), dayjs(trendStore.visibleTimeRange.end).valueOf()],
    visibleGroupInfo: groupInfoToSave,
    selectedMeasurements: measurementList.value,
  });
  upsertTrendTemplate({
    id: '',
    type: 'new-table-history',
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
    // measurementList.value = templateData.selectedMeasurements;
    const measurementsToAdd = templateData.selectedMeasurements.filter((item: Measurement) => {
      return !measurementList.value.find((m) => m.id === item.id);
    });
    handleSelectedMeasurementsUpdate({ selectedMeasurements: measurementsToAdd.map((m: Measurement) => m.details) });
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
    sideTreeRef.value?.restoreSelectedMeasurements(convertMeasurementListToSelectedMeasurements(measurementList.value));
    setStorage();
  }
}

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
    window.sessionStorage.setItem('newTableDataHistoryTrendStorage', JSON.stringify(storageData));
  } catch (e) {
    console.warn('Failed to save history trend page state to sessionStorage:', e);
  }
}

function convertMeasurementListToSelectedMeasurements(list: Measurement[]): SelectedMeasurement[] {
  return list
    .map((item) => {
      if (item.details) {
        return item.details;
      }
      // 如果 details 为空，尝试从 id 和 label 解析信息
      const parts = item.label.split('.');
      if (parts.length >= 3) {
        const database = parts[0];
        const tableName = parts[1];
        const measurement = parts[parts.length - 1];
        const deviceParts = parts.slice(2, parts.length - 1);
        const device = deviceParts.map((value) => ({ value }));

        return {
          database,
          tableName,
          device,
          condition: '',
          measurement,
          measurementType: '',
        } as SelectedMeasurement;
      }
      // 如果无法解析，返回一个基本的 SelectedMeasurement
      return {
        database: '',
        tableName: '',
        device: [],
        condition: '',
        measurement: item.label,
        measurementType: '',
      } as SelectedMeasurement;
    })
    .filter(Boolean) as SelectedMeasurement[];
}

function restoreData() {
  const storageData = window.sessionStorage.getItem('newTableDataHistoryTrendStorage');
  if (storageData) {
    try {
      const parsed = JSON.parse(storageData);
      trendStore.setGlobalTimeRange(parsed.globalTimeRange);
      trendStore.setVisibleTimeRange(parsed.visibleRange);
      trendStore.setPendingTimeRange(parsed.pendingRange);
      operateButtonRowRef.value?.setSelectedDateTime([trendStore.globalTimeRange.start, trendStore.globalTimeRange.end]);
      groups.value = parsed.groups;
      measurementList.value = parsed.measurements;
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

onMounted(() => {
  if (window.sessionStorage.getItem('newTableDataHistoryTrendStorage')) {
    restoreData();
  } else {
    window.sessionStorage.setItem('newTableDataHistoryTrendStorage', '');
  }
  getTemplateList();
});

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
