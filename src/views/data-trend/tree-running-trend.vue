<template>
  <div class="flex flex-row h-full w-full relative">
    <div :style="{ width: sideTreeWidth + 'px', position: 'relative' }" class="rounded-6px bg-white flex-shrink-0">
      <div
        :style="{ height: '100%', width: '4px', backgroundColor: 'transparent', position: 'absolute', left: sideTreeWidth + 'px', cursor: 'ew-resize' }"
        @pointerdown="(e) => onSliderPointerDown(e)"
      ></div>
      <div style="position: relative">
        <SideTree ref="measurementSideTree" :can-read-write-schema="canReadWriteSchema" :current-node="currentNode" @doubleClickMeasurement="createGroup" />
      </div>
    </div>

    <div class="ml-8px flex flex-1 flex-col min-w-0">
      <div class="p-[0px_16px_8px] rounded-6px bg-white flex flex-col min-w-0" :style="{ height: tableCollapse ? 'calc(100% - 26px)' : 'calc(100% - 116px)' }">
        <OperateButtonRow
          ref="operateButtonRowRef"
          :isTable="false"
          :isRunning="true"
          :templateList="templateList"
          :canOperate="resolvedGroups.length > 0"
          @save-template="handleSaveTemplate"
          @handle-operate="handleOperateTemplate"
          @get-query-list="getTemplateList"
          @running-play="handlePlay(true)"
          @running-pause="handlePlay(false)"
          @reset-graph="handleResetGraphArea"
          @reset-trend="setStorage"
        />
        <TrendGraphArea
          ref="trendGraphRef"
          :isTable="false"
          :is-running="true"
          :loading="isFetching"
          :range="runningTrendStore.visibleTimeRange"
          :markers="markers"
          :measurement-group-info="resolvedGroups"
          :realTimeData="realTimeData"
          @marker-change="updateMarker"
          @merge-into-group="mergeGroup"
          @delete-group="deleteGroup"
          @delete-measurement="deleteMeasurement"
          @marker-value-change="handleMarkerValueChange"
          @update-order="updateOrder"
        />
      </div>
      <div class="mt-8px rounded-6px bg-white flex-col min-w-0" :style="{ padding: tableCollapse ? '0px' : '8px 16px 8px 0px' }">
        <MarkerTableArea :is-running="false" :marker-datas="runningTrendStore.isPlaying ? emptyMarkerDatas : markerDatas" @table-collapse="handleTableCollapse" @table-expand="handleTableExpand" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SideTree from './components/tree-side-tree.vue';
import TrendGraphArea from './components/trend-graph-area.vue';
import MarkerTableArea from './components/marker-table-area.vue';
import OperateButtonRow from './components/operate-button-row.vue';
import { storeToRefs } from 'pinia';
import { useUserStore, useConnectionStore } from '@/stores';
import type { GroupState, ChartGroupInput, Measurement, TimeRange, ChartMarker, MeasurementMarkerData } from '@/types/trend';
import type { TrendTemplate, TrendData } from '@/types';
import { useTreeRunningTrendStore } from '@/stores/trend.store';
import { SearchApi } from '@/api';
import dayjs from 'dayjs';

const userStore = useUserStore();
const { canReadWriteSchema } = storeToRefs(userStore);
const currentNode = ref('root');
const storageKey = 'newTreeDataRunningTrendStorage';

const measurementList = ref<Measurement[]>([]); // 所有被添加的测点列表
const measurementMap = new Map(measurementList.value.map((item) => [item.id, item]));
const visibleMeasurementCountMap = ref<Map<string, number>>(new Map()); // 所有可见测点的数量统计
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
const runningTrendStore = useTreeRunningTrendStore();
const markers = ref<ChartMarker[]>(createInitialMarkers());
const markerDatas = ref<MeasurementMarkerData[]>([]);
const emptyMarkerDatas = computed<MeasurementMarkerData[]>(() => []);
const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);
const { requestFn: getTrendTemplate /** loading */ } = useRequest(SearchApi.getTrendTemplate);
const { t } = useI18n();

const { socketInstance, initWebsocket } = useWebsocket('/api/trendData', handleData, false);
const userName = computed(() => userStore.userInfo.name);
const connectionStore = useConnectionStore();
const connectionId = computed(() => connectionStore.connectionInfo.data.id);
const connectionType = computed(() => (connectionStore.connectionIsMaster ? 0 : 1));
const realTimeData = ref<TrendData[]>([]);
const minDataTime = ref(-1);

const trendGraphRef = ref<InstanceType<typeof TrendGraphArea>>();
const isFetching = ref(false);

const measurementSideTree = ref<InstanceType<typeof SideTree> | null>(null);
const sideTreeWidth = ref<number>(256);
const tableCollapse = ref<boolean>(false);

function handleTableCollapse() {
  tableCollapse.value = true;
}

function handleTableExpand() {
  tableCollapse.value = false;
}

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
    addPathToWebSocket(fullPath);
  } else {
    visibleMeasurementCountMap.value.set(fullPath, visibleMeasurementCountMap.value.get(fullPath)! + 1);
  }
  setStorage();
  setTimeout(() => {
    trendGraphRef.value?.scrollToBottom();
  }, 1000);
}

// ========== 操作按钮行所需函数 ==========

function getTemplateList() {
  getTrendTemplate('', '').then((res) => {
    const data = res.data || [];
    templateList.value = data.filter((item: TrendTemplate) => item.type === 'new-tree-running');
  });
}

function handleSaveTemplate(name: string) {
  operateButtonRowRef.value?.setSaveTemplateLoading(true);
  const groupInfoToSave = groups.value.map((group) => ({
    id: group.id,
    members: group.measurementIds.map((measurementId) => measurementMap.get(measurementId)).filter(Boolean) as Measurement[],
  }));
  const data = JSON.stringify({
    type: 'new-tree-running',
    visibleGroupInfo: groupInfoToSave,
    selectedMeasurements: measurementList.value,
  });
  upsertTrendTemplate({
    id: '',
    type: 'new-tree-running',
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
    runningTrendStore.setIsPlaying(true);
    for (const measurementId of visibleMeasurementCountMap.value.keys()) {
      if (realTimeData.value.find((data) => data.path === measurementId)) {
        continue;
      }
      addPathToWebSocket(measurementId);
    }
    setStorage();
  }
}

function init() {
  if (socketInstance.value && socketInstance.value.readyState === 1) {
    socketInstance.value?.send(
      JSON.stringify({
        operate: 'SET_CONNECT',
        connectionId: connectionId.value,
        user: userName.value,
        type: connectionType.value,
      }),
    );
  } else {
    socketInstance.value?.addEventListener('open', () => {
      socketInstance.value?.send(
        JSON.stringify({
          operate: 'SET_CONNECT',
          connectionId: connectionId.value,
          user: userName.value,
          type: connectionType.value,
        }),
      );
    });
  }
}

function handlePlay(val: boolean) {
  if (val) {
    if (!socketInstance.value || socketInstance.value.readyState > 1) {
      initWebsocket(() => {
        socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: measurementList.value.map((m) => m.id) }));
      });
    }
    realTimeData.value.forEach((data) => {
      if (data.timestamps.length > 0) {
        data.values.push('');
        data.timestamps.push(data.timestamps[data.timestamps.length - 1]! + 1);
      }
    });
  } else {
    runningTrendStore.setVisibleTimeRange({ start: runningTrendStore.min, end: dayjs().valueOf() });
  }
  runningTrendStore.setIsPlaying(val);
}

function addPathToWebSocket(path: string) {
  if (socketInstance.value && socketInstance.value.readyState === 1) {
    socketInstance.value.send(JSON.stringify({ operate: 'add', paths: [path] }));
  }
}

function handleData(data: any) {
  // 处理通过 WebSocket 接收到的数据
  // 这里可以根据实际数据结构进行解析和处理
  const jsonData: {
    data: TrendData[];
    operate: string;
  } = JSON.parse(data) || [];
  if (runningTrendStore.isPlaying && jsonData.operate === 'get') {
    const minTime = dayjs().subtract(10, 'minute').valueOf();
    if (realTimeData.value.length === 0) {
      minDataTime.value = dayjs().valueOf();
    }
    jsonData.data.forEach((item) => {
      const index = realTimeData.value.findIndex((f) => f.path === item.path);
      if (index !== -1) {
        const originData = realTimeData.value[index]!;
        const endTimestamp = originData.timestamps[originData.timestamps.length - 1]!;
        const reversedTimestamps = item.timestamps.reverse();
        const reversedValues = item.values.reverse();

        for (const [i, time] of reversedTimestamps.entries()) {
          if (time > endTimestamp) {
            originData.timestamps.push(...reversedTimestamps.slice(i));
            originData.values.push(...reversedValues.slice(i));
            break; // 找到目标位置后立即终止循环
          }
        }

        // 有效的数据索引（10 分钟内的）
        const effectiveIndex = originData.timestamps.findIndex((time) => time >= minTime);
        if (effectiveIndex > 0) {
          originData.timestamps.splice(0, effectiveIndex);
          originData.values.splice(0, effectiveIndex);
        }
        realTimeData.value.splice(index, 1, { ...originData });
      } else {
        const dataItem = {
          path: item.path,
          timestamps: item.timestamps.reverse(),
          values: item.values.reverse(),
        };
        realTimeData.value.push(dataItem);
      }
      const measurementIndex = realTimeData.value.findIndex((f) => f.path === item.path);
      const valueLen = realTimeData.value[measurementIndex]?.values.length;
      if (valueLen && valueLen > 0) {
        const firstTimestamp = realTimeData.value[measurementIndex]?.timestamps[0]!;
        const lastTimestamp = realTimeData.value[measurementIndex]?.timestamps[valueLen - 1]!;
        const averageInterval = Math.abs(lastTimestamp - firstTimestamp) / valueLen;
        runningTrendStore.updateMeasurementAverageInterval(item.path, averageInterval);
      }
    });
    const min = minTime > minDataTime.value ? minTime : minDataTime.value;
    runningTrendStore.setMin(min);
    runningTrendStore.setVisibleTimeRange({ start: min, end: dayjs().valueOf() });
  }
}

function createInitialMarkers(range: TimeRange = runningTrendStore.visibleTimeRange): ChartMarker[] {
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

function handleResetGraphArea() {
  usedColors.value.clear();
  measurementList.value = [];
  measurementMap.clear();
  const temp = groups.value.flatMap((group) => group.measurementIds);
  for (const measurement of temp) {
    deletePathFromWebSocket(measurement);
    trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurement);
  }
  realTimeData.value = [];
  groups.value = [];
  visibleMeasurementCountMap.value.clear();
  markerDatas.value = [];
  operateButtonRowRef.value?.setSelectedTemplateId('');
  setStorage();
}

// ========== 趋势图所需函数 ==========

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
      addPathToWebSocket(payload.measurementPath);
    } else {
      visibleMeasurementCountMap.value.set(payload.measurementPath, visibleMeasurementCountMap.value.get(payload.measurementPath)! + 1);
    }
    setStorage();
  }
}

function deleteMeasurementInfoIfUnused(measurementId: string) {
  if (visibleMeasurementCountMap.value.has(measurementId)) {
    const count = visibleMeasurementCountMap.value.get(measurementId)! - 1;
    if (count <= 0) {
      visibleMeasurementCountMap.value.delete(measurementId);
      trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurementId);
      deletePathFromWebSocket(measurementId);
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

    setStorage();
  }
}

function deletePathFromWebSocket(path: string) {
  if (socketInstance.value && socketInstance.value.readyState === 1) {
    socketInstance.value.send(JSON.stringify({ operate: 'del', paths: [path] }));
    realTimeData.value = realTimeData.value.filter((data) => data.path !== path);
  }
}

function updateMarker(payload: { id: string; timestamp: number }) {
  const range = runningTrendStore.visibleTimeRange;
  const clamped = Math.min(Math.max(payload.timestamp, range.start), range.end);
  markers.value = markers.value.map((marker) => (marker.id === payload.id ? { ...marker, timestamp: clamped } : marker));
}

function handleMarkerValueChange(payload: MeasurementMarkerData[]) {
  markerDatas.value = payload;
}

// ========== 数据缓存相关函数 ==========

function setStorage() {
  const storageData = {
    groups: groups.value,
    measurements: measurementList.value,
    visibleMeasurementCounts: Array.from(visibleMeasurementCountMap.value.entries()),
    selectedTemplateId: operateButtonRowRef.value?.getSelectedTemplateId() || '',
  };
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(storageData));
  } catch (e) {
    console.warn('Failed to save running trend page state to sessionStorage:', e);
  }
}

function restoreData() {
  const storageData = window.sessionStorage.getItem(storageKey);
  if (storageData) {
    try {
      const parsed = JSON.parse(storageData);
      groups.value = parsed.groups;
      measurementList.value = parsed.measurements;
      usedColors.value.clear();
      measurementList.value.forEach((m: Measurement) => {
        usedColors.value.add(m.color);
      });
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
      if (visibleMeasurementCountMap.value.size > 0) {
        runningTrendStore.setIsPlaying(true);
      }
      if (socketInstance.value && socketInstance.value.readyState === 1) {
        socketInstance.value?.send(
          JSON.stringify({
            operate: 'SET_CONNECT',
            connectionId: connectionId.value,
            user: userName.value,
            type: connectionType.value,
          }),
        );
        if (visibleMeasurementCountMap.value.size > 0) {
          socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: measurementList.value.map((m) => m.label) }));
        }
      } else {
        socketInstance.value?.addEventListener('open', () => {
          socketInstance.value?.send(
            JSON.stringify({
              operate: 'SET_CONNECT',
              connectionId: connectionId.value,
              user: userName.value,
              type: connectionType.value,
            }),
          );
          if (visibleMeasurementCountMap.value.size > 0) {
            socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: measurementList.value.map((m) => m.label) }));
          }
        });
      }
      operateButtonRowRef.value?.setSelectedTemplateId(parsed.selectedTemplateId || '');
      setStorage();
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
  window.addEventListener('beforeunload', () => {
    if (socketInstance.value) {
      socketInstance.value.close();
    }
  });
  getTemplateList();
});

onUnmounted(() => {
  if (socketInstance.value) {
    socketInstance.value.close();
  }
});

// ========== 监控函数 ==========

watch(
  () => runningTrendStore.isPlaying,
  (newVal) => {
    if (!newVal) {
      markers.value = createInitialMarkers(runningTrendStore.visibleTimeRange);
    }
  },
  { deep: true, immediate: true },
);

watch(
  () => connectionStore.connectionIsMaster,
  (val, old) => {
    if (val !== old && (val === true || val === false)) {
      if (socketInstance.value) {
        socketInstance.value.close();
      }
      initWebsocket(() => {
        restoreData();
        init();
      });
    }
  },
  {
    immediate: true,
  },
);
</script>
