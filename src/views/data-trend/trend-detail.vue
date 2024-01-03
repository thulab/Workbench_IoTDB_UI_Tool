<template>
  <el-container class="data-trend-wrapper">
    <el-header class="p-0" style="height: auto;">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" label-width="88px" size="default" inline class="m-b-22">
          <ul class="search-data-list">
            <li :class="['search-data-type', { 'search-data-active': dataTab === 'running' }]" id="search-data-type-running" @click="handleTrendTab('running')">实时趋势</li>
            <li :class="['search-data-type', { 'search-data-active': dataTab === 'history' }]" id="search-data-type-history" @click="handleTrendTab('history')">历史趋势</li>
          </ul>
          <base-form-item v-show="!isRunningTab" label="时间范围：" prop="datetimerange" :rules="requiredRules">
            <el-date-picker
              v-model="searchFormData.datetimerange"
              type="datetimerange"
              range-separator="～"
              unlink-panels
              :disabled-date="disabledDate"
              :shortcuts="shortcutsDaterange"
              :clearable="false"
              :prefix-icon="ICustomCalender"
              :disabled="isRunningTab"
              id="trend-search-datetimerange"
            />
          </base-form-item>
          <base-form-item v-show="!isRunningTab" label="采样周期：" prop="unitInterval" :rules="requiredRules">
            <el-select v-model="searchFormData.unitInterval" :disabled="isRunningTab" style="width: 80px;" id="trend-search-unitInterval">
              <el-option v-for="item in timeUnits" :key="item.value" :value="item.value" :label="item.label" />
            </el-select>
          </base-form-item>
          <base-form-item v-show="!isRunningTab" label="采样策略：" prop="aggregation" :rules="requiredRules" class="m-r-0">
            <el-select v-model="searchFormData.aggregation" :disabled="isRunningTab || searchFormData.unitInterval === 'origin'" style="width: 80px;" @change="handleChangeAggregation" id="trend-search-aggregation">
              <el-option v-for="item in aggregateFunctions" :key="item.value" :value="item.value" :label="item.label" />
            </el-select>
          </base-form-item>
          <div class="play-pause-buttons" v-show="isRunningTab">
            <el-icon size="30" v-if="!isRunningTab" style="cursor: not-allowed;"><i-custom-play-disabled /></el-icon>
            <template v-else>
              <auth-tooltip :is-disabled="canReadWriteSchemaData">
                <el-button link v-if="!loading" :disabled="!canReadWriteSchemaData" @click="handlePlay(true)" id="trend-search-run">
                  <el-icon size="30"><i-custom-play-active /></el-icon>
                </el-button>
                <el-button link v-else :disabled="!canReadWriteSchemaData" @click="handlePlay(false)" id="trend-search-pause">
                  <el-icon size="30"><i-custom-pause /></el-icon>
                </el-button>
              </auth-tooltip>
            </template>
          </div>
        </el-form>
        <div class="search-form-buttons" :style="{ visibility: !isRunningTab ? 'visible' : 'hidden' }">
          <auth-tooltip :is-disabled="canReadWriteSchemaData">
            <el-button :disabled="!canReadWriteSchemaData" @click="handleReset" id="trend-search-reset">重置</el-button>
          </auth-tooltip>
          <el-tooltip
            placement="top-start"
            effect="light"
            trigger="hover"
            :content="canReadWriteSchemaData ? '请先添加测点并选中' : '暂无权限'"
            :disabled="canReadWriteSchemaData ? searchAbled : false"
            popper-class="tooltip-box-width"
          >
            <el-button :class="[(!searchAbled || !canReadWriteSchemaData) ? 'hover-btn-disabled' : '']" type="primary" @click="handleSearch" id="trend-search-search">应用</el-button>
          </el-tooltip>
        </div>
      </div>
      <p class="trend-tip" :style="{ visibility: !isRunningTab ? 'visible' : 'hidden' }"><el-icon size="16" style="margin-right: 6px;"><i-custom-info-warning /></el-icon>最大绘制<span style="font-weight: 700; color: #495AD4; margin: 0 4px;">2000</span>个点，超出后系统将自动调整</p>
    </el-header>
    <el-main class="p-0">
      <el-container class="chart-detail-wrapper">
        <el-main class="p-0">
          <div ref="chartContainer" class="chart-container" v-element-size="onResize"></div>
        </el-main>
        <el-aside :width="isExpand ? '240px' : '24px'" :class="['path-list-wrapper', !isExpand ? 'p-0' : '']">
          <trend-list
            v-model="pathList"
            v-model:is-expand="isExpand"
            :data-tab="dataTab"
            :aggregation="searchFormData.aggregation"
            :can-read-write-schema-data="canReadWriteSchemaData"
            @handleOperate="handleOperatePath"
            @handleOperateAll="handleOperateAll"
          />
        </el-aside>
      </el-container>
    </el-main>

  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import dayjs from 'dayjs';
import {
  debounce, cloneDeep, difference,
} from 'lodash-es';
import { vElementSize } from '@vueuse/components';
import { SearchApi } from '@/api';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import { useUserStore, useConnectionStore } from '@/stores';
import { useWebsocket } from '@/composition-api';
import ICustomCalender from '~icons/custom/calender.svg';
import TrendList from './components/trend-list.vue';

const route = useRoute();
const userStore = useUserStore();
const userName = computed(() => userStore.userInfo.name);
const {
  canReadWriteSchemaData,
} = storeToRefs(userStore);
const connectionStore = useConnectionStore();
const connectionId = computed(() => connectionStore.connectionInfo.data.id);
const connectionType = computed(() => (connectionStore.connectionIsMaster ? 0 : 1));
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;
const isExpand = ref(true);
const searchFormRef = ref<FormInstance>();

const minDataTime = ref(-1);
const searchFormData = reactive({
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  unitInterval: 'auto',
  aggregation: 'last_value',
});
const shortcutsDaterange = [
  {
    text: '今天',
    value: () => getStartAndEnd(0),
  },
  {
    text: '昨天',
    value: () => getOneInterval(1),
  },
  {
    text: '最近7天',
    value: () => getOneIntervalNow(7),
  },
];
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const timeUnits = [
  { label: '自动', value: 'auto', timestamp: 1000 },
  { label: '原始值', value: 'origin', timestamp: 1000 },
  { label: '1s', value: '1s', timestamp: 1000 },
  { label: '1min', value: '1m', timestamp: 60000 },
  { label: '5min', value: '5m', timestamp: 300000 },
  { label: '10min', value: '10m', timestamp: 600000 },
  { label: '30min', value: '30m', timestamp: 1800000 },
  { label: '1h', value: '1h', timestamp: 3600000 },
  { label: '8h', value: '8h', timestamp: 28800000 },
  { label: '1d', value: '1d', timestamp: 86400000 },
  { label: '1w', value: '1w', timestamp: 604800000 },
  { label: '1m', value: '1mo', timestamp: 2592000000 },
];
const aggregateFunctions = [
  { label: '最新值', value: 'last_value' },
  { label: '最大值', value: 'max_value' },
  { label: '最小值', value: 'min_value' },
  { label: '平均值', value: 'avg' },
];
const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['change'],
  },
]);
let inited = false;
const dataTab = ref<'running' | 'history'>('running');
const pathList = ref<Trend.LineObj[]>([]);
const loading = ref(true);
const isRunningTab = computed(() => dataTab.value === 'running');
const searchAbled = computed(() => pathList.value.length > 0 && pathList.value.filter((item) => item.checked).length > 0);
const checkedData = computed(() => pathList.value.filter((item) => item.checked));
// 实时数据
const chartData = ref<Search.TrendData[]>([]);
// 历史数据
const chartHistoryData = ref<Search.TrendData[]>([]);
const copyCheckData = ref<Trend.LineObj[]>([]);
// 当前数据
const currentData = computed(() => (isRunningTab.value ? chartData.value : chartHistoryData.value));

const legendSelected = computed(() => ({
  show: false,
  selected: pathList.value.reduce((pre, cur) => {
    pre[cur.path] = cur.checked || false;
    return pre;
  }, {} as Record<string, boolean>),
}));

const seriesData = computed<ECOption>(() => ({
  series: currentData.value.map((item) => ({
    type: 'line',
    symbol: 'circle',
    showSymbol: false,
    showAllSymbol: 'auto',
    connectNulls: false,
    symbolSize: (pathList.value.find((data) => data.path === item.path)?.width || 2) + 2,
    name: item.path,
    data: item.values.map((dataItem, index) => [item.timestamps[index], dataItem]),
    // emphasis: {
    //   focus: 'series',
    // },
    lineStyle: {
      width: pathList.value.find((data) => data.path === item.path)?.width || 2,
      color: pathList.value.find((data) => data.path === item.path)?.color,
    },
    itemStyle: {
      color: pathList.value.find((data) => data.path === item.path)?.color,
    },
  })),
}));
const isShowZoom = computed(() => pathList.value.length > 0);

const chartOptions = computed<ECOption>(() => ({
  legend: legendSelected.value,
  useUTC: false,
  tooltip: {
    trigger: 'axis',
    // appendToBody: true,
    formatter: (params) => {
      let res = '';
      const paramsData = params as unknown as Array<Record<string, any>>;
      const circle = '<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:';
      checkedData.value.forEach((item) => {
        const data = paramsData.find((f) => f.seriesName === item.path);
        res += `<div style="margin: 10px 0 0;">${circle}${item.color}"></span><span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${data ? data.seriesName : item.path}</span><span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${data ? data.data[1] : null}</span></div>`;
      });
      return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${paramsData[0].axisValueLabel}</div>${res}`;
    },
  },
  dataZoom: [
    {
      type: 'slider',
      show: isShowZoom.value,
      xAxisIndex: 0,
      height: 20,
      handleSize: 8,
      filterMode: 'none',
      showDetail: false,
      right: 20,
    },
    {
      type: 'slider',
      show: isShowZoom.value,
      yAxisIndex: 0,
      width: 20,
      handleSize: 8,
      filterMode: 'none',
      showDetail: false,
      right: 28,
    },
  ],
  grid: {
    left: 20,
    right: 60,
    bottom: 48,
    containLabel: true,
  },
  connectNulls: false,
  xAxis: {
    type: 'time',
    boundaryGap: false,
    show: inited ? pathList.value.length > 0 : true,
  },
  yAxis: {
    type: 'value',
  },
  animation: !isRunningTab.value,
  series: seriesData.value.series,
}));

const { requestFn: getHistoryTrend } = useRequest(SearchApi.getHistoryTrend);

const setOption = (option:ECOption, noMerge: boolean = false) => {
  if (chartInstance) {
    // 实例存在直接设置
    chartInstance.setOption(option, noMerge);
  } else if (chartContainer.value && chartContainer.value.clientHeight) {
    inited = true;
    // 实例不存在，容器存在，容器高度存在
    chartInstance = echarts.init(chartContainer.value, 'dark');
    // 初次加载，设置notMerge为true
    chartInstance.setOption(option, true);
    chartInstance.setOption({
      xAxis: {
        show: false,
      },
    });
  } else {
    // 容器高度有问题时，延迟加载
    nextTick(() => {
      setOption(option);
    });
  }
};

const onResize = debounce(() => {
  if (chartContainer.value) {
    chartInstance?.resize();
  }
}, 50);

// 重置
function handleReset() {
  searchFormData.datetimerange = getOneIntervalNow(7) as [DateModelType, DateModelType];
  searchFormData.unitInterval = 'auto';
  searchFormData.aggregation = 'last_value';
}

function handleChangeAggregation(val: string) {
  if (val === 'last_value') {
    pathList.value.forEach((item) => {
      item.disabled = false;
    });
  }
}

// 查询
function handleSearch() {
  if (!canReadWriteSchemaData.value) return;
  if (!checkedData.value.length) return;
  const timerange = dayjs(searchFormData.datetimerange[1]).valueOf() - dayjs(searchFormData.datetimerange[0]).valueOf();
  if (searchFormData.unitInterval !== 'auto' && searchFormData.unitInterval !== 'origin') {
    const timeinterval = timeUnits.find((time) => time.value === searchFormData.unitInterval)?.timestamp;
    const point = timeinterval ? Math.ceil(timerange / timeinterval) : 0;
    if (point > 2000) {
      ElMessage.warning('超过最大画图点数，已为您自动调整后展示');
      searchFormData.unitInterval = 'auto';
    }
  }
  const start = dayjs(searchFormData.datetimerange[0]).valueOf();
  const end = dayjs(searchFormData.datetimerange[1]).valueOf();
  getHistoryTrend({
    paths: pathList.value.map((item) => item.path),
    startTime: start,
    endTime: end,
    groupBy: searchFormData.unitInterval,
    aggregateFun: searchFormData.aggregation,
  }).then((res) => {
    chartHistoryData.value = res.data?.normal || [];
    const abnormals = res.data?.abnormal || [];
    const currentAll = pathList.value.filter((f) => f.disabled).map((item) => item.path);
    const differents = difference(abnormals, currentAll);
    if (differents.length) {
      ElMessage.warning('boolean类型仅支持最新值计算，请修改采样策略后查看趋势');
    }
    pathList.value.forEach((item) => {
      if (res.data.abnormal.includes(item.path)) {
        item.disabled = true;
        item.checked = false;
      } else {
        item.disabled = false;
      }
    });
    const overPath = res.data?.changeAuto || [];
    if (overPath.length) {
      const paths = overPath.join(',');
      ElMessage.warning(`${paths}测点超过最大画图点数，已为您自动调整后展示`);
    }
    setOption(chartOptions.value, true);
    setOption({
      xAxis: {
        min: start,
        max: end,
      },
    });
  });
}

function handleData(data: any) {
  const jsonData: {
    data: Search.TrendData[],
    operate: string,
  } = JSON.parse(data) || [];
  if (loading.value && jsonData.operate === 'get') {
    const minTime = dayjs().subtract(10, 'minute').valueOf();
    if (chartData.value.length === 0) {
      minDataTime.value = dayjs().valueOf();
    }
    jsonData.data.forEach((item) => {
      const index = chartData.value.findIndex((f) => f.path === item.path);
      if (index !== -1) {
        const originData = chartData.value[index];
        originData.timestamps.push(...item.timestamps);
        originData.values.push(...item.values);
        // 有效的数据索引（10 分钟内的）
        const effectiveIndex = originData.timestamps.findIndex((time) => time >= minTime);
        if (effectiveIndex > 0) {
          originData.timestamps.splice(0, effectiveIndex);
          originData.values.splice(0, effectiveIndex);
        }
        chartData.value.splice(index, 1, { ...originData });
      } else {
        const dataItem = {
          path: item.path,
          timestamps: item.timestamps,
          values: item.values,
        };
        chartData.value.push(dataItem);
      }
    });
    const min = minTime > minDataTime.value ? minTime : minDataTime.value;
    setOption({
      legend: legendSelected.value,
      series: seriesData.value.series,
      xAxis: { min, show: true },
      dataZoom: [
        {
          type: 'slider',
          show: isShowZoom.value,
          xAxisIndex: 0,
          height: 20,
          handleSize: 8,
          filterMode: 'empty',
          showDetail: false,
          right: 20,
        },
        {
          type: 'slider',
          show: isShowZoom.value,
          yAxisIndex: 0,
          width: 20,
          handleSize: 8,
          filterMode: 'empty',
          showDetail: false,
          right: 28,
        },
      ],
    });
  }
}

const { socketInstance, initWebsocket } = useWebsocket('/api/trendData', handleData, false);

function handlePlay(val: boolean) {
  if (val) {
    if (!socketInstance.value || socketInstance.value.readyState > 1) {
      initWebsocket(() => {
        const paths = chartData.value.map((data) => data.path);
        socketInstance.value?.send(JSON.stringify({ operate: 'add', paths }));
      });
    }
    chartData.value.forEach((data) => {
      if (data.timestamps.length > 0) {
        data.values.push('');
        data.timestamps.push(data.timestamps[data.timestamps.length - 1] + 1);
      }
    });
  }
  loading.value = val;
}

// 切换数据类型
function handleTrendTab(type: 'running' | 'history') {
  if (dataTab.value === type) return;
  dataTab.value = type;
  nextTick(() => {
    if (type === 'history') {
      copyCheckData.value = cloneDeep(checkedData.value);
      loading.value = false;
      chartData.value.forEach((item) => {
        item.timestamps = [];
        item.values = [];
      });
      chartHistoryData.value.length = 0;
      setOption(chartOptions.value, true);
      handleReset();
      handleSearch();
    } else {
      minDataTime.value = dayjs().valueOf();
      pathList.value.forEach((item) => {
        item.disabled = false;
      });
      const currentChecked = chartData.value.map((item) => item.path);
      const cloneChecked = pathList.value.map((item) => item.path);
      const del = difference(currentChecked, cloneChecked);
      const add = difference(cloneChecked, currentChecked);
      loading.value = true;
      if (add.length > 0) {
        socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [...add] }));
      }
      if (del.length > 0) {
        socketInstance.value?.send(JSON.stringify({ operate: 'del', paths: [...del] }));
        del.forEach((deleteItem) => {
          const index = chartData.value.findIndex((data) => data.path === deleteItem);
          if (index !== -1) {
            chartData.value.splice(index, 1);
          }
        });
      }
      setOption(chartOptions.value, true);
    }
  });
}

function handleOperatePath(type: 'add' | 'del' | 'detail', path: string) {
  if (type === 'detail') {
    setOption({ legend: legendSelected.value, series: seriesData.value.series });
    return;
  }
  if (dataTab.value === 'running') {
    if (type === 'add') {
      socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [path] }));
    } else if (type === 'del') {
      socketInstance.value?.send(JSON.stringify({ operate: 'del', paths: [path] }));
      const index = chartData.value.findIndex((data) => data.path === path);
      const historyIndex = chartHistoryData.value.findIndex((data) => data.path === path);
      if (index !== -1) {
        chartData.value.splice(index, 1);
        setOption(chartOptions.value, true);
        const minTime = dayjs().subtract(10, 'minute').valueOf();
        setOption({ xAxis: { min: minTime } });
      }
      if (historyIndex !== -1) {
        chartHistoryData.value.splice(historyIndex, 1);
      }
    }
  } else {
    if (type === 'del') {
      const historyIndex = chartHistoryData.value.findIndex((data) => data.path === path);
      if (historyIndex !== -1) {
        chartHistoryData.value.splice(historyIndex, 1);
        if (checkedData.value.length === 0) {
          setOption(chartOptions.value, true);
        }
      }
    }
    handleSearch();
  }
}

function handleOperateAll() {
  setOption({ legend: legendSelected.value, series: seriesData.value.series });
}

function init() {
  if (route.query.measurement) {
    pathList.value.push({
      path: route.query.measurement as string,
      color: '#4992ff',
      width: 2,
      checked: true,
    });
  }
  if (socketInstance.value && socketInstance.value.readyState === 1) {
    socketInstance.value?.send(JSON.stringify({
      operate: 'SET_CONNECT', connectionId: connectionId.value, user: userName.value, type: connectionType.value,
    }));
    if (route.query.measurement) {
      socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [route.query.measurement as string] }));
    }
  } else {
    socketInstance.value?.addEventListener('open', () => {
      socketInstance.value?.send(JSON.stringify({
        operate: 'SET_CONNECT', connectionId: connectionId.value, user: userName.value, type: connectionType.value,
      }));
      if (route.query.measurement) {
        socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [route.query.measurement as string] }));
      }
    });
  }
  setOption(chartOptions.value);
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    chartContainer.value = null;
    if (chartInstance) {
      chartInstance.clear();
      chartInstance.dispose();
    }
    if (socketInstance.value) {
      socketInstance.value.close();
    }
  });
});

watch(
  () => connectionStore.connectionIsMaster,
  (val, old) => {
    if (val !== old && (val === true || val === false)) {
      if (socketInstance.value) {
        socketInstance.value.close();
      }
      initWebsocket(() => {
        init();
      });
    }
  },
  {
    immediate: true,
  },
);

onUnmounted(() => {
  chartContainer.value = null;
  if (chartInstance) {
    chartInstance.clear();
    chartInstance.dispose();
  }
  if (socketInstance.value) {
    socketInstance.value.close();
  }
});
</script>

<style lang="scss" scoped>
.data-trend-wrapper{
  border-radius: 6px;
  background: #FFF;
  box-sizing: border-box;
  padding: 26px 16px 16px 30px;
}

.search-form-wrapper{
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  :deep(.el-form) {
    display: flex;
    align-items: center;
    height: 30px;
  }

  :deep(.el-form-item--default) {
    margin: 0 24px 0 0;
  }
}

.search-data-list {
  display: inline-flex;
  margin-right: 24px;
  border-radius: 12px;
  background-color: #f0f1fa;
  padding: 4px;

  .search-data-type {
    padding: 3px 12px 3px 8px;
    cursor: pointer;
    border-radius: 12px;
    background-color: transparent;
    font-size: 12px;
    line-height: 12px;
    font-weight: 300;
    color: #656a85;
    white-space: nowrap;
  }

  .search-data-active {
    background-color: #495ad4;
    color: #fff;
    padding: 3px 12px;
  }
}

.play-pause-buttons{
  height: 30px;
}

.search-form-buttons{
  display: inline-flex;
  flex-wrap: nowrap;
  flex: 1;
  justify-content: end;
  margin-bottom: 16px;
}

.hover-btn-disabled, .hover-btn-disabled:focus{
  color: var(--el-button-disabled-text-color) !important;
  cursor: not-allowed !important;
  background-color: var(--el-button-disabled-bg-color) !important;
  border-color: var(--el-button-disabled-border-color) !important;
}

.trend-tip{
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 12px;
  color: #656A85;
  font-weight: 300;
}

.chart-detail-wrapper{
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  min-height: 300px;
  height: 100%;
  overflow: hidden;
}

.path-list-wrapper{
  margin-left: 16px;
  background-color: #F7F8FC;
  border-radius: 2px;
  box-sizing: border-box;
  padding: 12px 12px 25px;
  position: relative;
  transition: all 0.3s ease;
}

</style>
