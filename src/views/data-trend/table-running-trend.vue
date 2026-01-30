<template>
  <div class="flex flex-row h-full w-full relative">
    <div :style="{ width: sideTreeWidth + 'px' }" class="rounded-6px bg-white flex-shrink-0 relative">
      <div style="position: absolute; left: 0; right: 0">
        <TableSideTree
          ref="sideTreeRef"
          namespace="running"
          @updateSelectedMeasurements="(list) => handleSelectedMeasurementsUpdate({ selectedMeasurements: list })"
          @deleteMeasurement="handleDeleteMeasurement"
          @doubleClickMeasurement="createGroup"
          @resetMeasurement="handleResetMeasurement"
        />
      </div>
      <div style="height: 100%; width: 4px; background-color: transparent; position: absolute; right: -2px; cursor: ew-resize" @pointerdown="(e) => onSliderPointerDown(e)"></div>
    </div>
    <div class="ml-8px flex flex-1 flex-col min-w-0">
      <div class="p-[0px_16px_8px] rounded-6px bg-white flex flex-col min-w-0" :style="{ height: tableCollapse ? 'calc(100% - 26px)' : 'calc(100% - 116px)' }">
        <OperateButtonRow
          ref="operateButtonRowRef"
          :isTable="true"
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
          :isTable="true"
          :is-running="true"
          :loading="isFetching"
          :range="runningTrendStore.visibleTimeRange"
          :markers="markers"
          :measurement-group-info="resolvedGroups"
          :needFetchGroupsId="needFetchGroupsId"
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
        <MarkerTableArea :is-running="true" :marker-datas="runningTrendStore.isPlaying ? emptyMarkerDatas : markerDatas" @table-collapse="handleTableCollapse" @table-expand="handleTableExpand" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import TableSideTree from './components/table-side-tree.vue';
import TrendGraphArea from './components/trend-graph-area.vue';
import MarkerTableArea from './components/marker-table-area.vue';
import OperateButtonRow from './components/operate-button-row.vue';
import type { TimeRange, GroupState, ChartGroupInput, Measurement, ChartMarker, MeasurementMarkerData } from '@/types/trend';
import type { TrendTemplate, SelectedMeasurement, TrendData } from '@/types';
import { useUserStore, useConnectionStore } from '@/stores';
import { useTableRunningTrendStore } from '@/stores/trend.store';
import { formatSelectedMeasurement } from '@/utils/format';
import dayjs from 'dayjs';
import { SearchApi } from '@/api';

const runningTrendStore = useTableRunningTrendStore();

const isFetching = ref(false);

const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);
const { requestFn: getTrendTemplate /** loading */ } = useRequest(SearchApi.getTrendTemplate);

const { t } = useI18n();

const sideTreeRef = ref<InstanceType<typeof TableSideTree>>();
const trendGraphRef = ref<InstanceType<typeof TrendGraphArea>>();
const operateButtonRowRef = ref<InstanceType<typeof OperateButtonRow>>();
const measurementList = ref<Measurement[]>([]); // 所有左侧测点
const measurementMap = new Map(measurementList.value.map((item) => [item.id, item]));
const groups = ref<GroupState[]>([]); // 测点的分组信息
const resolvedGroups = computed<ChartGroupInput[]>(() =>
  groups.value.map((group) => ({
    id: group.id,
    members: group.measurementIds.map((measurementId) => measurementMap.get(measurementId)).filter(Boolean) as typeof measurementList.value,
  })),
);
const visibleMeasurementCountMap = ref<Map<string, number>>(new Map());

const needFetchGroupsId = ref<string[]>([]);
const templateList = ref<TrendTemplate[]>([]);

const usedColors = ref<Set<string>>(new Set());
const predefineColors = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#8AC211'];

const markers = ref<ChartMarker[]>(createInitialMarkers());
const markerDatas = ref<MeasurementMarkerData[]>([]);
const emptyMarkerDatas = computed<MeasurementMarkerData[]>(() => []);

const { socketInstance, initWebsocket } = useWebsocket('/api/relational/trendData', handleData, false);
const userStore = useUserStore();
const userName = computed(() => userStore.userInfo.name);
const connectionStore = useConnectionStore();
const connectionId = computed(() => connectionStore.connectionInfo.data.id);
const connectionType = computed(() => (connectionStore.connectionIsMaster ? 0 : 1));
const realTimeData = ref<TrendData[]>([]);
const minDataTime = ref(-1);

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
  const startWidth = sideTreeRef.value?.$el.offsetWidth || 256;

  function onPointerMove(e: PointerEvent) {
    const deltaX = e.clientX - startX;
    const newWidth = Math.min(Math.max(200, startWidth + deltaX), 600);
    if (sideTreeRef.value) {
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

function updateMarker(payload: { id: string; timestamp: number }) {
  const range = runningTrendStore.visibleTimeRange;
  const clamped = Math.min(Math.max(payload.timestamp, range.start), range.end);
  markers.value = markers.value.map((marker) => (marker.id === payload.id ? { ...marker, timestamp: clamped } : marker));
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

function handleMarkerValueChange(payload: MeasurementMarkerData[]) {
  markerDatas.value = payload;
}

function handleResetMeasurement() {
  measurementList.value = [];
  measurementMap.clear();
  usedColors.value.clear();
  handleResetGraphArea();
}

function handleResetGraphArea() {
  const temp = groups.value.flatMap((group) => group.measurementIds);
  for (const measurement of temp) {
    deletePathFromWebSocket(measurement);
    trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurement);
  }
  realTimeData.value = [];
  groups.value = [];
  visibleMeasurementCountMap.value.clear();
  needFetchGroupsId.value = [];
  markerDatas.value = [];
  operateButtonRowRef.value?.setSelectedTemplateId('');
  setStorage();
}

function getTemplateList() {
  getTrendTemplate('', '').then((res) => {
    const data = res.data || [];
    templateList.value = data.filter((item: TrendTemplate) => item.type === 'new-table-running');
  });
}

function handleSaveTemplate(name: string) {
  operateButtonRowRef.value?.setSaveTemplateLoading(true);
  const groupInfoToSave = groups.value.map((group) => ({
    id: group.id,
    members: group.measurementIds.map((measurementId) => measurementMap.get(measurementId)).filter(Boolean) as Measurement[],
  }));
  const data = JSON.stringify({
    type: 'new-table-running',
    visibleGroupInfo: groupInfoToSave,
    selectedMeasurements: measurementList.value,
  });
  upsertTrendTemplate({
    id: '',
    type: 'new-table-running',
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

    sideTreeRef.value?.restoreSelectedMeasurements(convertMeasurementListToSelectedMeasurements(measurementList.value));
    runningTrendStore.setIsPlaying(true);
    for (const measurementId of visibleMeasurementCountMap.value.keys()) {
      if (realTimeData.value.find((data) => convertPath(data.path) === measurementId)) {
        continue;
      }
      addPathToWebSocket(measurementId);
    }
    setStorage();
  }
}

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
  for (const group of groups.value) {
    group.measurementIds = group.measurementIds.filter((id) => {
      return id !== fullpath;
    });
    if (group.measurementIds.length === 0) {
      groups.value = groups.value.filter((g) => g.id !== group.id);
    }
  }
  trendGraphRef.value?.deleteMeasurementMarkerDataByName(fullpath);
  deletePathFromWebSocket(fullpath);
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
    addPathToWebSocket(fullpath);
  } else {
    visibleMeasurementCountMap.value.set(fullpath, visibleMeasurementCountMap.value.get(fullpath)! + 1);
  }
  setStorage();
  setTimeout(() => {
    trendGraphRef.value?.scrollToBottom();
  }, 1000);
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
      addPathToWebSocket(payload.measurementPath);
    } else {
      visibleMeasurementCountMap.value.set(payload.measurementPath, visibleMeasurementCountMap.value.get(payload.measurementPath)! + 1);
    }
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
          trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurementId);
          deletePathFromWebSocket(measurementId);
        } else {
          visibleMeasurementCountMap.value.set(measurementId, count);
        }
      }
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

    if (visibleMeasurementCountMap.value.has(payload.measurementPath)) {
      const count = visibleMeasurementCountMap.value.get(payload.measurementPath)! - 1;
      if (count <= 0) {
        visibleMeasurementCountMap.value.delete(payload.measurementPath);
        trendGraphRef.value?.deleteMeasurementMarkerDataByName(payload.measurementPath);
        deletePathFromWebSocket(payload.measurementPath);
      } else {
        visibleMeasurementCountMap.value.set(payload.measurementPath, count);
      }
    }

    setStorage();
  }
}

const buildParams = (operate: string, measurements: SelectedMeasurement[]) => {
  return JSON.stringify({
    operate,
    fields: measurements.map((item) => ({ value: item.condition, variable: item.measurement, path: formatSelectedMeasurement(item), database: item.database, tableName: item.tableName })),
  });
};

function addPathToWebSocket(path: string) {
  if (socketInstance.value && socketInstance.value.readyState === 1) {
    socketInstance.value.send(
      buildParams(
        'add',
        resolvedGroups.value
          .flatMap((group) => group.members)
          .filter((member) => member.id === path)
          .map((member) => member.details as SelectedMeasurement),
      ),
    );
  }
}

function deletePathFromWebSocket(path: string) {
  if (socketInstance.value && socketInstance.value.readyState === 1) {
    socketInstance.value.send(
      buildParams(
        'del',
        measurementList.value.filter((member) => member.id === path).map((member) => member.details as SelectedMeasurement),
      ),
    );
    realTimeData.value = realTimeData.value.filter((data) => convertPath(data.path) !== path);
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
        runningTrendStore.updateMeasurementAverageInterval(convertPath(item.path), averageInterval);
      }
    });
    const min = minTime > minDataTime.value ? minTime : minDataTime.value;
    runningTrendStore.setMin(min);
    runningTrendStore.setVisibleTimeRange({ start: min, end: dayjs().valueOf() });
  }
}

function handlePlay(val: boolean) {
  if (val) {
    if (!socketInstance.value || socketInstance.value.readyState > 1) {
      initWebsocket(() => {
        const paths = realTimeData.value.map((data) => data.path);
        const allCurrentPaths = resolvedGroups.value.flatMap((group) => group.members).map((member) => member.details as SelectedMeasurement);
        socketInstance.value?.send(
          buildParams(
            'add',
            allCurrentPaths.filter((item) => paths.includes(formatSelectedMeasurement(item))),
          ),
        );
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

function setStorage() {
  const storageData = {
    groups: groups.value,
    measurements: measurementList.value,
    visibleMeasurementCounts: Array.from(visibleMeasurementCountMap.value.entries()),
    selectedTemplateId: operateButtonRowRef.value?.getSelectedTemplateId() || '',
  };
  try {
    window.sessionStorage.setItem('newTableDataRunningTrendStorage', JSON.stringify(storageData));
  } catch (e) {
    console.warn('Failed to save running trend page state to sessionStorage:', e);
  }
}

function restoreData() {
  const storageData = window.sessionStorage.getItem('newTableDataRunningTrendStorage');
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
          socketInstance.value?.send(
            buildParams(
              'add',
              measurementList.value.filter((member) => visibleMeasurementCountMap.value.has(member.id)).map((member) => member.details as SelectedMeasurement),
            ),
          );
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
            socketInstance.value?.send(
              buildParams(
                'add',
                measurementList.value.filter((member) => visibleMeasurementCountMap.value.has(member.id)).map((member) => member.details as SelectedMeasurement),
              ),
            );
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

onMounted(() => {
  if (window.sessionStorage.getItem('newTableDataRunningTrendStorage')) {
    restoreData();
  } else {
    window.sessionStorage.setItem('newTableDataRunningTrendStorage', '');
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
