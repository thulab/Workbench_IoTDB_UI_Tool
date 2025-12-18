<template>
  <div class="running-trend-page-container">
    <div class="database-list-wrapper">
      <TableSideTree
        namespace="running"
        @updateSelectedMeasurements="(list) => handleSelectedMeasurementsUpdate({ selectedMeasurements: list })"
        @deleteMeasurement="handleDeleteMeasurement"
        @doubleClickMeasurement="createGroup"
      />
    </div>
    <div class="trend-details-wrapper">
      <TrendGraphArea
        :is-running="true"
        :loading="isFetching"
        :range="visibleRange"
        :markers="markers"
        :measurement-group-info="resolvedGroups"
        :needFetchGroupsId="needFetchGroupsId"
        :templateList="templateList"
        :realTimeData="realTimeData"
        @marker-change="updateMarker"
        @global-time-change="handleGlobalTimeChange"
        @merge-into-group="mergeGroup"
        @delete-group="deleteGroup"
        @delete-measurement="deleteMeasurement"
        @running-play="handlePlay(true)"
        @running-pause="handlePlay(false)"
      />
      <MarkerTableArea :is-running="true" :marker-datas="markerDatas" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import TableSideTree from './components/table-side-tree.vue';
import TrendGraphArea from './components/trend-graph-area.vue';
import MarkerTableArea from './components/marker-table-area.vue';
import type { TimeRange, GroupState, ChartGroupInput, Measurement, ChartMarker, MeasurementMarkerData } from '@/types/trend';
import type { TrendTemplate, SelectedMeasurement, TrendData } from '@/types';
import { useUserStore, useConnectionStore } from '@/stores';
import { useTableRunningTrendStore } from '@/stores/trend';
import { formatSelectedMeasurement } from '@/utils/format';
import dayjs from 'dayjs';

const runningTrendStore = useTableRunningTrendStore();

const globalTimeRange = ref<TimeRange>({
  start: Date.now() - 12 * 3600 * 1000,
  end: Date.now(),
});
const visibleRange = ref<TimeRange>({ ...globalTimeRange.value });
const pendingRange = ref<TimeRange>({ ...globalTimeRange.value });
const isFetching = ref(false);
// let fetchTimer: ReturnType<typeof setTimeout> | null = null;

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
// const visibleMeasurementsSet = computed<Measurement[]>(() => {
//   return measurementList.value.filter((item) => visibleMeasurementCountMap.value.has(item.id));
// });
const needFetchGroupsId = ref<string[]>([]);
const templateList = ref<TrendTemplate[]>([]);

const markers = ref<ChartMarker[]>(createInitialMarkers(globalTimeRange.value));
const markerDatas = ref<MeasurementMarkerData[]>([]);

const { socketInstance, initWebsocket } = useWebsocket('/api/relational/trendData', handleData, false);
const userStore = useUserStore();
const userName = computed(() => userStore.userInfo.name);
const connectionStore = useConnectionStore();
const connectionId = computed(() => connectionStore.connectionInfo.data.id);
const connectionType = computed(() => (connectionStore.connectionIsMaster ? 0 : 1));
const loading = ref(true);
const realTimeData = ref<TrendData[]>([]);
const minDataTime = ref(-1);

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

function handleSelectedMeasurementsUpdate(payload: { selectedMeasurements: SelectedMeasurement[] }) {
  const newMeasurements = payload.selectedMeasurements.filter((item) => {
    return !measurementList.value.find((m) => m.id === `${item.database}.${item.tableName}.${item.device?.map((d) => d.value).join('.')}.${item.measurement}`);
  });
  measurementList.value.push(
    ...newMeasurements.map((item) => {
      let deviceName = '';
      for (const curTag of item.device ?? []) {
        deviceName += `${curTag.value}.`;
      }
      if (deviceName.endsWith('.')) {
        deviceName = deviceName.slice(0, -1);
      }

      // random color
      const color = `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;

      const label = `${item.database}.${item.tableName}.${deviceName}.${item.measurement}`;
      return {
        id: label,
        label,
        color,
        details: item,
        values: [],
      } as unknown as Measurement;
    }),
  );
  measurementMap.clear();
  measurementList.value.forEach((item) => {
    measurementMap.set(item.id, item);
  });
}

function handleDeleteMeasurement(fullpath: string) {
  measurementList.value = measurementList.value.filter((item) => {
    return item.label !== fullpath;
  });
  measurementMap.clear();
  measurementList.value.forEach((item) => {
    measurementMap.set(item.id, item);
  });
}

function createGroup(fullpath: string) {
  const groupId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  groups.value.push({
    id: groupId,
    measurementIds: [fullpath],
  });
  console.log('current groups:', groups.value);
  if (!visibleMeasurementCountMap.value.has(fullpath)) {
    visibleMeasurementCountMap.value.set(fullpath, 1);
    // needFetchMeasurementsId.value.push(fullpath);
    addPathToWebSocket(fullpath);
  } else {
    visibleMeasurementCountMap.value.set(fullpath, visibleMeasurementCountMap.value.get(fullpath)! + 1);
  }
  // needFetchGroupsId.value = [];
  // needFetchGroupsId.value.push(groupId);

  setStorage();
}

function mergeGroup(payload: { groupId: string; measurementPath: string }) {
  const group = groups.value.find((g) => g.id === payload.groupId);
  if (group && !group.measurementIds.includes(payload.measurementPath)) {
    group.measurementIds.push(payload.measurementPath);
    if (!visibleMeasurementCountMap.value.has(payload.measurementPath)) {
      visibleMeasurementCountMap.value.set(payload.measurementPath, 1);
      // needFetchMeasurementsId.value.push(payload.measurementPath);
      addPathToWebSocket(payload.measurementPath);
    } else {
      visibleMeasurementCountMap.value.set(payload.measurementPath, visibleMeasurementCountMap.value.get(payload.measurementPath)! + 1);
    }
    // needFetchGroupsId.value = [];
    // needFetchGroupsId.value.push(payload.groupId);
    setStorage();
  }
  console.log('current groups:', groups.value);
}

function deleteGroup(payload: { groupId: string }) {
  const group = groups.value.find((g) => g.id === payload.groupId);
  if (group) {
    group.measurementIds.forEach((measurementId) => {
      if (visibleMeasurementCountMap.value.has(measurementId)) {
        const count = visibleMeasurementCountMap.value.get(measurementId)! - 1;
        if (count <= 0) {
          visibleMeasurementCountMap.value.delete(measurementId);
          // needDeleteMeasurementsId.value.push(measurementId);
          // trendGraphRef.value?.deleteMeasurementMarkerDataByName(measurementId);
          deletePathFromWebSocket(measurementId);
        } else {
          visibleMeasurementCountMap.value.set(measurementId, count);
        }
      }
    });
  }
  groups.value = groups.value.filter((g) => g.id !== payload.groupId);
  // needFetchGroupsId.value = [];

  setStorage();
}

function deleteMeasurement(payload: { groupId: string; measurementPath: string }) {
  const group = groups.value.find((g) => g.id === payload.groupId);
  if (group) {
    group.measurementIds = group.measurementIds.filter((id) => id !== payload.measurementPath);
    if (visibleMeasurementCountMap.value.has(payload.measurementPath)) {
      const count = visibleMeasurementCountMap.value.get(payload.measurementPath)! - 1;
      if (count <= 0) {
        visibleMeasurementCountMap.value.delete(payload.measurementPath);
        // needDeleteMeasurementsId.value.push(payload.measurementPath);
        // trendGraphRef.value?.deleteMeasurementMarkerDataByName(payload.measurementPath);
        deletePathFromWebSocket(payload.measurementPath);
      } else {
        visibleMeasurementCountMap.value.set(payload.measurementPath, count);
      }
    }
    // needFetchGroupsId.value = [];
    // needFetchGroupsId.value.push(payload.groupId);

    setStorage();
  }
}

// function updateRange(range: TimeRange) {
//   const nextRange = {
//     start: Math.max(range.start, globalTimeRange.value.start),
//     end: Math.min(range.end, globalTimeRange.value.end),
//   }
//   pendingRange.value = nextRange
//   triggerSimulatedFetch(nextRange)
// }

// function triggerSimulatedFetch(nextRange: TimeRange) {
//   isFetching.value = true
//   if (fetchTimer) {
//     clearTimeout(fetchTimer)
//   }
//   fetchTimer = setTimeout(() => {
//     markers.value = createInitialMarkers(nextRange)
//     visibleRange.value = nextRange
//     isFetching.value = false
//     fetchTimer = null
//   }, 650)
// }

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
  }
}

function handleData(data: any) {
  // 处理通过 WebSocket 接收到的数据
  // 这里可以根据实际数据结构进行解析和处理
  const jsonData: {
    data: TrendData[];
    operate: string;
  } = JSON.parse(data) || [];
  if (loading.value && jsonData.operate === 'get') {
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
    });
    const min = minTime > minDataTime.value ? minTime : minDataTime.value;
    runningTrendStore.setMin(min);
    // setOption({
    //   legend: legendSelected.value,
    //   series: seriesData.value.series,
    //   xAxis: { min, show: true },
    // });
    console.log('realTimeData:', realTimeData.value);
    console.log('min:', min);
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
  }
  loading.value = val;
}

function init() {
  if (socketInstance.value && socketInstance.value.readyState === 1) {
    console.log('init() send SET_CONNECT 1');
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
      console.log('init() send SET_CONNECT 2');
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
  // setOption(chartOptions.value);
}

function setStorage() {
  const storageData = {
    // globalTimeRange: trendStore.globalTimeRange,
    // visibleRange: trendStore.visibleTimeRange,
    // pendingRange: trendStore.pendingTimeRange,
    groups: groups.value,
    measurements: measurementList.value,
    // markers: markers.value,
    visibleMeasurementCounts: Array.from(visibleMeasurementCountMap.value.entries()),
  };
  window.sessionStorage.setItem('newTableDataRunningTrendStorage', JSON.stringify(storageData));
}

function restoreData() {
  const storageData = window.sessionStorage.getItem('newTableDataRunningTrendStorage');
  if (storageData) {
    try {
      const parsed = JSON.parse(storageData);
      // trendStore.setGlobalTimeRange(parsed.globalTimeRange);
      // trendStore.setVisibleTimeRange(parsed.visibleRange);
      // trendStore.setPendingTimeRange(parsed.pendingRange);
      // trendGraphRef.value?.setSelectedDateTime([trendStore.globalTimeRange.start, trendStore.globalTimeRange.end]);
      groups.value = parsed.groups;
      measurementList.value = parsed.measurements;
      // markers.value = parsed.markers?.length ? parsed.markers : createInitialMarkers(trendStore.globalTimeRange);
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
        loading.value = true;
      }
      if (socketInstance.value && socketInstance.value.readyState === 1) {
        console.log('restoreData() send SET_CONNECT 1');
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
          console.log('restoreData() send SET_CONNECT 2');
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

      // needFetchGroupsId.value = [];
      // needFetchMeasurementsId.value = [];
      // needDeleteMeasurementsId.value = [];

      // nextTick(() => {
      //   trendGraphRef.value?.restoreChartData();
      //   timelineAreaRef.value?.restoreData();
      // });
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
});

onUnmounted(() => {
  if (socketInstance.value) {
    socketInstance.value.close();
  }
});

watch(
  globalTimeRange,
  (newVal) => {
    pendingRange.value = { ...newVal };
    visibleRange.value = { ...newVal };
  },
  { deep: true },
);

watch(
  () => connectionStore.connectionIsMaster,
  (val, old) => {
    if (val !== old && (val === true || val === false)) {
      if (socketInstance.value) {
        socketInstance.value.close();
      }
      // if (!canReadWriteData.value) {
      //   //setOption(chartOptions.value);
      //   return;
      // }
      initWebsocket(() => {
        restoreData();
        // if (window.sessionStorage.getItem('tableDataTrendStorage')) {
        //   const storageData = JSON.parse(window.sessionStorage.getItem('tableDataTrendStorage') as string);
        //   searchFormData.database = storageData.database;
        //   searchFormData.table = storageData.table;
        //   searchFormData.selectedMeasurement = storageData.selectedMeasurement || [];
        //   if (searchFormData.selectedMeasurement?.length) {
        //     searchFormData.datetimerange = storageData.datetimerange;
        //     searchFormData.unitInterval = storageData.unitInterval;
        //     searchFormData.aggregation = storageData.aggregation;
        //     dataTab.value = storageData.dataTab;
        //     pathList.value = storageData.pathList;
        //     pointLineData.value = storageData.pointLineData.map((item: MarkPointLine) => ({
        //       ...item,
        //       label: {
        //         formatter: () => `D${item.group}-${item.order}`,
        //         position: 'end',
        //         offset: [0, item.order * 10],
        //       },
        //     }));
        //     markPointCount.value = storageData.markPointCount;
        //     pointList.value = storageData.pointList;
        //     activeNameSide.value = storageData.activeNameSide;
        //     loading.value = dataTab.value === 'running';
        //   }
        //   if (socketInstance.value && socketInstance.value.readyState === 1) {
        //     socketInstance.value?.send(
        //       JSON.stringify({
        //         operate: 'SET_CONNECT',
        //         connectionId: connectionId.value,
        //         user: userName.value,
        //         type: connectionType.value,
        //       }),
        //     );
        //     if (searchFormData.selectedMeasurement.length) {
        //       socketInstance.value?.send(buildParams('add', searchFormData.selectedMeasurement));
        //     }
        //   } else {
        //     socketInstance.value?.addEventListener('open', () => {
        //       socketInstance.value?.send(
        //         JSON.stringify({
        //           operate: 'SET_CONNECT',
        //           connectionId: connectionId.value,
        //           user: userName.value,
        //           type: connectionType.value,
        //         }),
        //       );
        //       if (searchFormData.selectedMeasurement.length) {
        //         socketInstance.value?.send(buildParams('add', searchFormData.selectedMeasurement));
        //       }
        //     });
        //   }
        //   setOption(chartOptions.value, true);
        //   handleSearch(false);
        //   return;
        // }
        init();
      });
    }
  },
  {
    immediate: true,
  },
);
</script>

<style>
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

.running-trend-page-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
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
