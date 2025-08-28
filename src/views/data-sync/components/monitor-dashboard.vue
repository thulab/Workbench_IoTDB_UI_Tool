<template>
  <version-container :is-show="showAuthMenu" :versiton-tip="'1.3.0'">
    <template #otherTip>
      <div class="monitor-dashboard-operate-left">
        <el-button link class="monitor-dashboard-close-btn svg-button-hover-color" id="monitor-dashboard-close-btn" @click="handleClose">
          <el-icon size="24" class="m-r-6"><i-custom-close /></el-icon>
          {{ t('common.goback') }}
        </el-button>
        <span class="monitor-dashboard-header-title">{{ t('dataSync.monitorDashboard') }}</span>
      </div>
    </template>
    <el-container class="data-sync-detail-wrapper" v-loading="loading">
      <el-header class="monitor-dashboard-operate-header p-0">
        <div class="flex-align-center">
          <div class="monitor-dashboard-operate-left">
            <el-button link class="monitor-dashboard-close-btn svg-button-hover-color" id="monitor-dashboard-close-btn" @click="handleClose">
              <el-icon size="24" class="m-r-6"><i-custom-close /></el-icon>
              {{ t('common.goback') }}
            </el-button>
            <span class="monitor-dashboard-header-title">{{ t('dataSync.monitorDashboard') }}</span>
          </div>
          <div class="monitor-dashboard-node-box">
            <span class="search-from-label">{{ t('dashboard.node') }}：</span>
            <el-select v-model="monitorNode" :placeholder="t('common.all')" style="width: 256px" @change="handleChangeNode" id="monitor-dashboard-select-node">
              <el-option
                v-for="(item, index) in nodeList"
                :key="`${item.address}(${item.type})_${index}`"
                :value="item.nodeID"
                :id="`monitor-dashboard-select-node-select-${item.nodeID}`"
                :label="item.address ? `${item.address}(${item.type})` : t('common.all')"
              />
            </el-select>
          </div>
        </div>
        <p class="monitor-dashboard-module-details">
          <span class="module-label-text">{{ `${t('dashboard.deadTime')}：` }}</span>
          <span class="module-content-text m-r-16">{{ monitorTime }}</span>
          <el-button link @click="handleRefreshMonitor" id="monitor-dashboard-refresh" class="svg-button-hover-color">
            <el-icon size="24"><i-custom-refresh /></el-icon>
          </el-button>
        </p>
      </el-header>
      <el-main class="p-0">
        <el-scrollbar>
          <div class="monitor-chart-wrapper">
            <div class="monitor-chart-box-2" v-loading="memoryLoading">
              <div class="monitor-chart-container">
                <h4 class="monitor-info-module-title">{{ t('dataSync.memory') }}</h4>
                <data-container :is-empty="isChartEmpty(memoryData)">
                  <div class="chart-container-box">
                    <the-chart :option="memoryDataOptions.data" key="memoryData" ref="memoryChartRef" />
                  </div>
                </data-container>
              </div>
            </div>
            <div class="monitor-chart-box-2" v-loading="p50Loading">
              <div class="monitor-chart-container">
                <h4 class="monitor-info-module-title">{{ t('dataSync.p50') }}</h4>
                <data-container :is-empty="isChartEmpty(p50Data)">
                  <div class="chart-container-box">
                    <the-chart :option="p50DataOptions.data" key="p50Data" ref="p50ChartRef" />
                  </div>
                </data-container>
              </div>
            </div>
            <div class="monitor-chart-box-2" v-loading="p99Loading">
              <div class="monitor-chart-container">
                <h4 class="monitor-info-module-title">{{ t('dataSync.p99') }}</h4>
                <data-container :is-empty="isChartEmpty(p99Data)">
                  <div class="chart-container-box">
                    <the-chart :option="p99DataOptions.data" key="p99Data" ref="p99ChartRef" />
                  </div>
                </data-container>
              </div>
            </div>
            <div class="monitor-chart-box-2" v-loading="remainingTimeLoading">
              <div class="monitor-chart-container">
                <h4 class="monitor-info-module-title">
                  {{ t('dataSync.remainingTime') }}
                  <el-tooltip effect="light" :content="t('dataSync.remainingTimeTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                </h4>
                <data-container :is-empty="remainingTime.remainTime === null">
                  <div class="monitor-info-module-box">
                    <p class="monitor-info-module-text">
                      {{ remainingTime.remainTime }}
                      <span class="monitor-info-module-unit">{{ remainingTime.timeUnit }}</span>
                    </p>
                  </div>
                </data-container>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </el-main>
    </el-container>
  </version-container>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { concat } from 'lodash-es';
import { type ECOption } from '@/plugins/echarts-plugin';
import { iotdbShowAuth } from '@/utils/auth';
import { useConnectionStore } from '@/stores';
import { DashboardApi, DataSyncApi } from '@/api';
import DataContainer from '@/views/dashboard/components/data-container.vue';
import TheChart from '@/components/the-chart.vue';
import type { PipeMonitorData, NodeItem } from '@/types';

const emit = defineEmits<{
  (event: 'handleClose'): void;
}>();

interface RemainingTimeData {
  remainTime: string | null;
  timeUnit: string;
}

const { t } = useI18n();
const memoryChartRef = ref<InstanceType<typeof TheChart>>();
const p50ChartRef = ref<InstanceType<typeof TheChart>>();
const p99ChartRef = ref<InstanceType<typeof TheChart>>();
const connectionStore = useConnectionStore();
const refreshInterval = ref();
const monitorTime = ref();
const clusterType = ref<'master' | 'slave'>('master');
const masterNodes = ref<NodeItem[]>([]);
const slaveNodes = ref<NodeItem[]>([]);
const monitorNode = ref('');
const searchFormData = reactive({
  orderBy: ['type', 'type'],
  asc: ['asc', 'asc'],
});

const remainingTime = reactive<RemainingTimeData>({
  remainTime: null,
  timeUnit: '',
});

const memoryData = ref<PipeMonitorData[]>([]);
const p50Data = ref<PipeMonitorData[]>([]);
const p99Data = ref<PipeMonitorData[]>([]);
const isInit = ref(true);

const nodeList = computed(() => {
  if (clusterType.value === 'slave') {
    return slaveNodes.value;
  }
  return masterNodes.value;
});

const nodeIds = computed(() => nodeList.value.filter((item, index) => index !== 0).map((data) => data.nodeID));

const colorList = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#8AC211'];

const lineColor = computed(() => {
  if (monitorNode.value === '') {
    return colorList;
  }
  const index = nodeIds.value.findIndex((item) => item === monitorNode.value);
  if (index !== -1) {
    return colorList[index % 10];
  }
  return colorList[0];
});

function getLegendSelected(optionData: PipeMonitorData[], chartName: string) {
  let obj: { [key: string]: boolean } = {};
  optionData.forEach((item, index) => {
    if (monitorNode.value === '') {
      if (isInit.value) {
        if (index < 3) {
          obj[item.nodeName] = true;
        } else {
          obj[item.nodeName] = false;
        }
      } else if (chartName === 'memory') {
        obj = memoryChartRef.value!.legendSelected;
      } else if (chartName === 'p50') {
        obj = p50ChartRef.value!.legendSelected;
      } else {
        obj = p99ChartRef.value!.legendSelected;
      }
    } else {
      nodeList.value
        .filter((f, fi) => fi !== 0)
        .forEach((node) => {
          if (item.nodeID === node.nodeID) {
            obj[item.nodeName] = true;
          } else {
            obj[`${node.address}(DataNode)`] = false;
          }
        });
    }
  });
  return obj;
}

const lineChartOptions = (optionData: PipeMonitorData[], dataUnit: string, chartName: string) =>
  ({
    color: lineColor.value,
    useUTC: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      confine: true,
      valueFormatter: (value: number | string) => `${value} ${dataUnit}`,
    },
    grid: {
      left: '3%',
      right: 40,
      bottom: 20,
      containLabel: true,
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      pageIconColor: '#A0A3B8',
      pageIconInactiveColor: '#DFE1ED',
      pageTextStyle: {
        fontSize: 12,
        fontWeight: 300,
        color: '#424561',
      },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 12,
      inactiveColor: '#DFE1ED',
      textStyle: {
        color: '#424561',
        fontSize: 12,
        fontWeight: 300,
      },
      left: monitorNode.value === '' && nodeIds.value.length > 1 ? 20 : 'center',
      data: optionData.map((item) => item.nodeName) || [],
      selected: getLegendSelected(optionData, chartName),
      selectedMode: monitorNode.value === '' && nodeIds.value.length > 1,
    },
    connectNulls: false,
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisTick: {
        show: true,
      },
      axisLabel: {
        color: '#424561',
        fontSize: 12,
        fontWeight: 300,
      },
      minInterval: 1000 * 60 * 60,
      show: optionData.length > 0,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: `{value} ${dataUnit}`,
        color: '#424561',
        fontSize: 12,
        fontWeight: 300,
      },
      axisPointer: {
        snap: true,
      },
      splitLine: {
        lineStyle: {
          color: '#DFE1ED',
          width: 1,
        },
      },
    },
    series: optionData.map((item) => ({
      type: 'line',
      name: item.nodeName,
      lineStyle: {
        width: 2,
      },
      showSymbol: false,
      data: item.used.memoryCost.map((dataItem, index) => [item.used.timestamp[index], dataItem]),
    })),
  }) as unknown as ECOption;

const memoryDataOptions = reactive({
  data: lineChartOptions(memoryData.value, memoryData.value[0]?.unit || '', 'memory'),
});
const p50DataOptions = reactive({
  data: lineChartOptions(p50Data.value, p50Data.value[0]?.unit || '', 'p50'),
});
const p99DataOptions = reactive({
  data: lineChartOptions(p99Data.value, p99Data.value[0]?.unit || '', 'p99'),
});

const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, '1.3.0'));

function isChartEmpty(optionData: PipeMonitorData[]) {
  return optionData.every((item) => item.used.timestamp.length === 0);
}

const { requestFn: getSystemInfo, loading } = useRequest(DashboardApi.getSystemInfo);
const { requestFn: getPipeMemoryCost, loading: memoryLoading } = useRequest(DataSyncApi.getPipeMemoryCost);
const { requestFn: getPipeDelayTrendP50, loading: p50Loading } = useRequest(DataSyncApi.getPipeDelayTrend);
const { requestFn: getPipeDelayTrendP99, loading: p99Loading } = useRequest(DataSyncApi.getPipeDelayTrend);
const { requestFn: getPipeEstimateRemainingTime, loading: remainingTimeLoading } = useRequest(DataSyncApi.getPipeEstimateRemainingTime);

function handleClose() {
  emit('handleClose');
}

function getSystemData() {
  return getSystemInfo(searchFormData.orderBy, searchFormData.asc).then((res) => {
    masterNodes.value = concat(
      [
        {
          nodeID: '',
          address: '',
          type: '',
          status: '',
          version: '',
          physicalMachine: '',
        },
      ],
      res.data.masterNodeInfo.nodes ? res.data.masterNodeInfo.nodes.filter((item) => item.type === 'DataNode') : [],
    );
    if (res.data.slaveNodeInfo) {
      slaveNodes.value = concat(
        [
          {
            nodeID: '',
            address: '',
            type: '',
            status: '',
            version: '',
            physicalMachine: '',
          },
        ],
        res.data.slaveNodeInfo.nodes ? res.data.slaveNodeInfo.nodes.filter((item) => item.type === 'DataNode') : [],
      );
    } else {
      slaveNodes.value = [];
    }
  });
}

function getMemory() {
  return getPipeMemoryCost({
    nodeID: monitorNode.value === '' ? nodeIds.value : [monitorNode.value],
    startTime: dayjs(monitorTime.value).valueOf() - 6 * 60 * 60 * 1000,
    endTime: dayjs(monitorTime.value).valueOf(),
    step: 180,
    isMaster: clusterType.value === 'master',
  })
    .then((res) => {
      const data = res.data || [];
      memoryData.value = data.map((item) => {
        const nodeData = nodeList.value.find((node) => node.nodeID === item.nodeID);
        return { ...item, nodeName: nodeData ? `${nodeData.address}(${nodeData.type})` : `${item.nodeID}(DataNode)` };
      });
      memoryDataOptions.data = lineChartOptions(memoryData.value, memoryData.value[0]?.unit || '', 'memory');
    })
    .catch(() => {
      memoryData.value = [];
    });
}

function getP50() {
  return getPipeDelayTrendP50({
    nodeID: monitorNode.value === '' ? nodeIds.value : [monitorNode.value],
    startTime: dayjs(monitorTime.value).valueOf() - 6 * 60 * 60 * 1000,
    endTime: dayjs(monitorTime.value).valueOf(),
    step: 180,
    isMaster: clusterType.value === 'master',
    quantile: '0.5',
  })
    .then((res) => {
      const data = res.data || [];
      p50Data.value = data.map((item) => {
        const nodeData = nodeList.value.find((node) => node.nodeID === item.nodeID);
        return { ...item, nodeName: nodeData ? `${nodeData.address}(${nodeData.type})` : `${item.nodeID}(DataNode)` };
      });
      p50DataOptions.data = lineChartOptions(p50Data.value, p50Data.value[0]?.unit || '', 'p50');
    })
    .catch(() => {
      p50Data.value = [];
    });
}

function getP99() {
  return getPipeDelayTrendP99({
    nodeID: monitorNode.value === '' ? nodeIds.value : [monitorNode.value],
    startTime: dayjs(monitorTime.value).valueOf() - 6 * 60 * 60 * 1000,
    endTime: dayjs(monitorTime.value).valueOf(),
    step: 180,
    isMaster: clusterType.value === 'master',
    quantile: '0.99',
  })
    .then((res) => {
      const data = res.data || [];
      p99Data.value = data.map((item) => {
        const nodeData = nodeList.value.find((node) => node.nodeID === item.nodeID);
        return { ...item, nodeName: nodeData ? `${nodeData.address}(${nodeData.type})` : `${item.nodeID}(DataNode)` };
      });
      p99DataOptions.data = lineChartOptions(p99Data.value, p99Data.value[0]?.unit || '', 'p99');
    })
    .catch(() => {
      p99Data.value = [];
    });
}

function getRemainingTime() {
  return getPipeEstimateRemainingTime({
    nodeID: monitorNode.value === '' ? nodeIds.value : [monitorNode.value],
    startTime: dayjs(monitorTime.value).valueOf() - 6 * 60 * 60 * 1000,
    endTime: dayjs(monitorTime.value).valueOf(),
    step: 180,
    isMaster: clusterType.value === 'master',
  })
    .then((res) => {
      remainingTime.remainTime = res.data.remainTime || null;
      remainingTime.timeUnit = res.data.timeUnit;
    })
    .catch(() => {
      remainingTime.remainTime = null;
      remainingTime.timeUnit = '';
    });
}

// 获取图表详情
function getInitial() {
  Promise.allSettled([getMemory(), getP50(), getP99(), getRemainingTime()]).then(() => {
    // 重置定时器
    clearTimeout(refreshInterval.value);
    isInit.value = false;
    refreshInterval.value = setTimeout(() => {
      getMonitorData();
    }, 30 * 1000);
  });
}

function getMonitorData() {
  monitorTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  getInitial();
}

function handleChangeNode() {
  clearTimeout(refreshInterval.value);
  isInit.value = true;
  getMonitorData();
}

// 刷新监控
function handleRefreshMonitor() {
  clearTimeout(refreshInterval.value);
  isInit.value = false;
  getMonitorData();
}

onMounted(() => {
  if (!showAuthMenu.value) return;
  isInit.value = true;
  getSystemData().then(() => {
    getMonitorData();
  });
});

watch(
  () => connectionStore.connectionIsMaster,
  (val, old) => {
    if (val !== old && (val === true || val === false)) {
      clusterType.value = val ? 'master' : 'slave';
    }
  },
  {
    immediate: true,
  },
);

onUnmounted(() => {
  clearTimeout(refreshInterval.value);
});
</script>

<style lang="scss">
.monitor-dashboard-operate-left {
  display: flex;
  height: 36px;
  align-items: center;
  border-radius: 2px;
  border: 1px solid #dfe1ed;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #656a85;
  box-sizing: border-box;
  margin-right: 36px;

  .monitor-dashboard-close-btn,
  .monitor-dashboard-header-title {
    min-width: 75px;
    text-align: center;
    padding: 0 6px !important;
  }

  .monitor-dashboard-header-title {
    position: relative;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;

    &::before {
      position: absolute;
      content: '';
      display: block;
      width: 1px;
      height: 26px;
      top: 5px;
      left: 0;
      background-color: #dfe1ed;
    }
  }
}
</style>
<style lang="scss" scoped>
@use '@/views/dashboard/components/monitor-module';

.data-sync-detail-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 16px 16px 14px;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}

.monitor-dashboard-operate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: auto;
  margin-bottom: 16px;

  .monitor-dashboard-node-box {
    display: flex;
    align-items: center;

    .search-from-label {
      font-size: 14px;
      font-weight: 400;
      line-height: 21px;
      color: #424561;
      flex: 0 0 50px;
    }
  }

  .monitor-dashboard-module-details {
    .module-label-text {
      font-size: 12px;
      font-weight: 400;
      line-height: 12px;
      color: #131926;
      margin-right: 4px;
    }

    .module-content-text {
      font-size: 12px;
      font-weight: 400;
      line-height: 12px;
      color: #656a85;
    }
  }
}

.auth-tip-container {
  .monitor-dashboard-operate-left {
    position: absolute;
    top: 26px;
    left: 14px;
  }
}

.monitor-chart-wrapper {
  height: calc(100% - 24px);
}

.monitor-chart-box-2 {
  min-height: 300px;
  height: 50%;
}

.monitor-info-module-title svg {
  vertical-align: top;
}
</style>
