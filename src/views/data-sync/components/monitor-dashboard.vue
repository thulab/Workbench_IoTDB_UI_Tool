<template>
  <version-container :is-show="showAuthMenu" :versiton-tip="'1.3.0'">
    <el-container class="data-sync-detail-wrapper">
      <el-header class="monitor-dashboard-operate-header p-0">
        <div class="flex-align-center">
          <div class="monitor-dashboard-operate-left">
            <el-button link class="monitor-dashboard-close-btn" id="monitor-dashboard-close-btn" @click="handleClose"><el-icon size="24" class="m-r-6"><i-custom-close /></el-icon>返回</el-button>
            <span class="monitor-dashboard-header-title">状态监控</span>
          </div>
          <div class="monitor-dashboard-node-box">
            <span class="search-from-label">节点：</span>
            <el-select v-model="monitorNode" placeholder="全部" style="width: 256px;" @change="handleChangeNode" id="monitor-dashboard-select-node">
              <el-option v-for="(item, index) in nodeList" :key="`${item.address}(${item.type})_${index}`" :value="item.nodeID" :label="item.address ? `${item.address}(${item.type})` : '全部'" />
            </el-select>
          </div>
        </div>
        <p class="monitor-dashboard-module-details">
          <span class="module-label-text">数据截止：</span>
          <span class="module-content-text m-r-16">{{ monitorTime }}</span>
          <el-button link @click="handleRefreshMonitor" id="monitor-dashboard-refresh"><el-icon size="24"><i-custom-refresh /></el-icon></el-button>
        </p>
      </el-header>
      <el-main class="p-0">
        <el-scrollbar>
          <div class="monitor-chart-wrapper">
            <div class="monitor-chart-box-2" v-loading="memoryLoading">
              <div class="monitor-chart-container">
                <h4 class="monitor-info-module-title">内存</h4>
                <data-container :is-empty="false">
                  <div class="chart-container-box">
                    <the-chart :option="memoryDataOptions" key="memoryData" />
                  </div>
                </data-container>
              </div>
            </div>
            <div class="monitor-chart-box-2" v-loading="p50Loading">
              <div class="monitor-chart-container">
                <h4 class="monitor-info-module-title">P50延迟</h4>
                <data-container :is-empty="false">
                  <div class="chart-container-box">
                    <the-chart :option="memoryDataOptions" key="p50Data" />
                  </div>
                </data-container>
              </div>
            </div>
            <div class="monitor-chart-box-2" v-loading="p99Loading">
              <div class="monitor-chart-container">
                <h4 class="monitor-info-module-title">P99延迟</h4>
                <data-container :is-empty="false">
                  <div class="chart-container-box">
                    <the-chart :option="memoryDataOptions" key="p99Data" />
                  </div>
                </data-container>
              </div>
            </div>
            <div class="monitor-chart-box-2" v-loading="remainingTimeLoading">
              <div class="monitor-chart-container">
                <h4 class="monitor-info-module-title">预估剩余时间<el-tooltip effect="light" content="当前时间可能存在误差，仅供参考" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></h4>
                <data-container :is-empty="false">
                  <div class="monitor-info-module-box">
                    <p class="monitor-info-module-text">{{ remainingTime.dataCount }}<span class="monitor-info-module-unit">{{ remainingTime.valueUnit }}</span></p>
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
import { type ECOption } from '@/plugins/echarts-plugin';
import { iotdbShowAuth } from '@/utils/auth';
import { useConnectionStore } from '@/stores';

const emit = defineEmits<{
  (event: 'handleClose'): void;
}>();

interface RemainingTimeData {
  dataCount: number | null;
  valueUnit: string;
}

interface LineChartData {
}

const connectionStore = useConnectionStore();
const refreshInterval = ref();
const monitorTime = ref();
const monitorNode = ref('');
const currentNodeType = ref('');
const nodeList = ref<Dashboard.NodeItem[]>([]);
const memoryLoading = ref(false);
const p50Loading = ref(false);
const p99Loading = ref(false);
const remainingTimeLoading = ref(false);

const remainingTime = reactive<RemainingTimeData>({
  dataCount: null,
  valueUnit: '分钟',
});

const memoryData = reactive<LineChartData>({
});

function handleClose() {
  emit('handleClose');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lineChartOptions = (optionData: LineChartData) => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },
  grid: {
    left: 10,
    right: 40,
    top: 20,
    bottom: 20,
    containLabel: true,
  },
  legend: {
    type: 'scroll',
    orient: 'horizontal',
    data: [],
    selected: {},
    left: 20,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value} W',
    },
    axisPointer: {
      snap: true,
    },
  },
  series: [],
} as ECOption);

const memoryDataOptions = computed(() => lineChartOptions(memoryData));
const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, '1.3.0'));

function getMonitorData() {
  monitorTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
}

// 刷新监控
function handleRefreshMonitor() {
  clearTimeout(refreshInterval.value);
  getMonitorData();
}

function handleChangeNode(val: string) {
  if (!val) {
    currentNodeType.value = '';
  } else {
    const current = nodeList.value.find((f) => f.nodeID === val);
    if (current) {
      currentNodeType.value = current.type;
    } else {
      monitorNode.value = '';
      currentNodeType.value = '';
    }
  }
  handleRefreshMonitor();
}

onUnmounted(() => {
  clearTimeout(refreshInterval.value);
});
</script>

<style lang="scss" scoped>
@import '@/views/dashboard/components/monitor-module';

.data-sync-detail-wrapper{
  border-radius: 6px;
  background: #FFF;
  box-sizing: border-box;
  padding: 26px 16px 16px 14px;
}

.monitor-dashboard-operate-header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: auto;
  margin-bottom: 16px;

  .monitor-dashboard-operate-left{
    display: flex;
    height: 36px;
    align-items: center;
    border-radius:2px;
    border: 1px solid #DFE1ED;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #656A85;
    box-sizing: border-box;
    margin-right: 36px;

    .monitor-dashboard-close-btn, .monitor-dashboard-header-title{
      width: 75px;
      text-align: center;
    }

    .monitor-dashboard-header-title{
      position: relative;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;

      &::before{
        position: absolute;
        content: '';
        display: block;
        width: 1px;
        height: 26px;
        top: 5px;
        left: 0;
        background-color: #DFE1ED;
      }
    }
  }

  .monitor-dashboard-node-box{
    display: flex;
    align-items: center;

    .search-from-label{
      font-size: 14px;
      font-weight: 400;
      line-height: 21px;
      color: #424561;
      flex: 0 0 50px;
    }
  }

  .monitor-dashboard-module-details{
    .module-label-text{
      font-size: 12px;
      font-weight: 400;
      line-height: 12px;
      color: #131926;
      margin-right: 4px;
    }

    .module-content-text{
      font-size: 12px;
      font-weight: 400;
      line-height: 12px;
      color: #656A85;
    }
  }
}

.monitor-chart-box-2{
  height: 300px;
}

.monitor-info-module-title svg{
  vertical-align: top;
}
</style>
