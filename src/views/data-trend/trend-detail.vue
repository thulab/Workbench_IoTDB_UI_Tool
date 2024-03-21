<template>
  <el-container class="data-trend-wrapper">
    <el-header class="p-0" style="height: auto">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" :label-width="locale === 'en' ? '' : '88px'" size="default" inline>
          <ul class="search-data-list">
            <li :class="['search-data-type', { 'search-data-active': dataTab === 'running' }]" id="search-data-type-running" @click="handleTrendTab('running')">{{ t('dataTrend.realTrend') }}</li>
            <li :class="['search-data-type', { 'search-data-active': dataTab === 'history' }]" id="search-data-type-history" @click="handleTrendTab('history')">{{ t('dataTrend.historyTrend') }}</li>
          </ul>
          <base-form-item v-show="!isRunningTab" :label="`${t('common.datetimerange')}：`" prop="datetimerange" :rules="requiredRules">
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
          <base-form-item v-show="!isRunningTab" :label="`${t('search.timeInterval')}：`" prop="unitInterval" :rules="requiredRules">
            <el-select v-model="searchFormData.unitInterval" :disabled="isRunningTab" style="width: 120px" id="trend-search-unitInterval">
              <el-option v-for="item in timeUnits" :key="item.value" :value="item.value" :label="item.label" :id="`trend-search-unitInterval-select-${item.value}`" />
            </el-select>
          </base-form-item>
          <base-form-item v-show="!isRunningTab" :label="`${t('search.aggregation')}：`" prop="aggregation" :rules="requiredRules" class="m-r-0">
            <el-select
              v-model="searchFormData.aggregation"
              :disabled="isRunningTab || searchFormData.unitInterval === 'origin'"
              style="width: 130px"
              @change="handleChangeAggregation"
              id="trend-search-aggregation"
            >
              <el-option v-for="item in aggregateFunctions" :key="item.value" :value="item.value" :label="item.label" :id="`trend-search-aggregation-select-${item.value}`" />
            </el-select>
          </base-form-item>
          <div class="play-pause-buttons" v-show="isRunningTab">
            <el-icon size="30" v-if="!isRunningTab" style="cursor: not-allowed"><i-custom-play-disabled /></el-icon>
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
            <el-button :disabled="!canReadWriteSchemaData" @click="handleReset" id="trend-search-reset">{{ t('common.reset') }}</el-button>
          </auth-tooltip>
          <el-tooltip
            placement="top-start"
            effect="light"
            trigger="hover"
            :content="canReadWriteSchemaData ? t('dataTrend.measurementEmptyTip') : t('common.noAuth')"
            :disabled="canReadWriteSchemaData ? searchAbled : false"
            popper-class="tooltip-box-width"
          >
            <el-button :class="[!searchAbled || !canReadWriteSchemaData ? 'hover-btn-disabled' : '']" type="primary" @click="handleSearch" id="trend-search-search">{{ t('common.apply') }}</el-button>
          </el-tooltip>
        </div>
      </div>
      <p class="trend-tip" :style="{ visibility: !isRunningTab ? 'visible' : 'hidden' }">
        <el-icon size="16" style="margin-right: 6px"><i-custom-info-warning /></el-icon>
        <span v-html="t('dataTrend.trendTip', { tip })"></span>
      </p>
    </el-header>
    <el-main class="p-0">
      <el-container class="chart-detail-wrapper">
        <el-main class="p-0" style="position: relative">
          <div ref="chartContainer" class="chart-container" :style="`height: ${isRunningTab ? '100%;' : 'calc(100% - 28px);'}`" v-element-size="onResize"></div>
          <div v-if="!isRunningTab">
            <el-button type="primary" id="trend-cursor" style="height: 24px !important" :disabled="!chartHistoryData.length" @click="clickedCursor = true">{{ t('spectrum.cursor') }}</el-button>
            <el-button link class="cursor-button" id="trend-cursor-clear" :disabled="!chartHistoryData.length || !pointList.length" @click="handleEmptyPoint">
              <el-icon size="18" color="#fff"><i-custom-delete /></el-icon>
            </el-button>
          </div>
        </el-main>
        <el-aside :width="isExpand ? '240px' : '24px'" :class="['path-list-wrapper', !isExpand ? 'p-0' : '']" style="display: flex; flex-direction: column">
          <trend-list
            v-model="pathList"
            v-model:is-expand="isExpand"
            :data-tab="dataTab"
            :aggregation="searchFormData.aggregation"
            :can-read-write-schema-data="canReadWriteSchemaData"
            @handleOperate="handleOperatePath"
            @handleOperateAll="handleOperateAll"
          />
          <div class="cursor-list-box" v-if="isExpand && !isRunningTab">
            <h4 class="cursor-list-title">{{ t('spectrum.cursorTitle') }}</h4>
            <auth-container :is-auth="canReadWriteSchemaData" style="flex: 1; background-color: #fff; overflow-y: hidden; display: flex; padding: 12px 0 10px">
              <div class="list-empty-wrapper" v-if="!historyCursorData.length">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
                <span class="data-empty-text">{{ t('common.noData') }}</span>
              </div>
              <div class="cursor-list-wrapper" v-else>
                <ul class="cursor-list">
                  <li v-for="(item, index) in pointList" :key="item.name" :class="['cursor-item-box']">
                    <div class="cursor-text-box">
                      <el-checkbox
                        v-if="pointList.length !== 1"
                        :checked="item.checked"
                        class="m-r-4"
                        :id="`trend-cursor-checkbox-${index}`"
                        :disabled="pointDisabled(item)"
                        @change="(val) => handleCheckDvalue(val, item)"
                      />
                      {{ pointTitle(index) }}
                    </div>
                    <div class="cursor-point-data" :style="{ marginLeft: pointList.length !== 1 ? '45px' : '25px' }">
                      <p style="display: inline-flex; width: 140px"><text-tooltip :content="`X: ${item.x}`" /></p>
                      <p style="display: inline-flex; width: 140px"><text-tooltip :content="`Y: ${item.y}`" /></p>
                    </div>
                  </li>
                </ul>
                <div v-if="pointCheckedData.length === 2" class="point-dvalue-box">
                  <p style="display: inline-flex; width: 190px"><text-tooltip :content="`ΔX：${Math.abs(pointCheckedData[0].x - pointCheckedData[1].x)}`" /></p>
                  <p style="display: inline-flex; width: 190px"><text-tooltip :content="`Δf：${Math.abs(pointCheckedData[0].y - pointCheckedData[1].y)}`" /></p>
                </div>
              </div>
            </auth-container>
          </div>
        </el-aside>
      </el-container>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { FormInstance, SingleOrRange, DateModelType, CheckboxValueType } from 'element-plus';
import dayjs from 'dayjs';
import { debounce, cloneDeep, difference } from 'lodash-es';
import { vElementSize } from '@vueuse/components';
import { SearchApi } from '@/api';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import { getStartAndEnd, today, getOneInterval, getOneIntervalNow } from '@/utils/date';
import { useUserStore, useConnectionStore } from '@/stores';
import { useWebsocket } from '@/composition-api';
import ICustomCalender from '~icons/custom/calender.svg';
import TrendList from './components/trend-list.vue';

interface TrendMarkPoint {
  name: string;
  value: number;
  xAxis: number;
  yAxis: number;
}

interface TrendMarkLine {
  name: string;
  xAxis: number;
  label: {
    formatter: string | Function;
    position: string;
  };
}

interface PointData {
  name: string;
  x: number;
  y: number;
  disabled: boolean;
  checked: boolean;
}

const { t, locale } = useI18n();
const route = useRoute();
const userStore = useUserStore();
const userName = computed(() => userStore.userInfo.name);
const { canReadWriteSchemaData } = storeToRefs(userStore);
const connectionStore = useConnectionStore();
const connectionId = computed(() => connectionStore.connectionInfo.data.id);
const connectionType = computed(() => (connectionStore.connectionIsMaster ? 0 : 1));
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;
const isExpand = ref(true);
const searchFormRef = ref<FormInstance>();
const tip = ref('<span style="font-weight: 700; color: #495AD4; margin: 0 4px;">2000</span>');
const minDataTime = ref(-1);
const searchFormData = reactive({
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  unitInterval: 'auto',
  aggregation: 'last_value',
});
const shortcutsDaterange = [
  {
    text: t('common.today'),
    value: () => getStartAndEnd(0),
  },
  {
    text: t('common.yesterday'),
    value: () => getOneInterval(1),
  },
  {
    text: t('common.7dayRecend'),
    value: () => getOneIntervalNow(7),
  },
];
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const timeUnits = computed(() => [
  { label: t('common.auto'), value: 'auto', timestamp: 1000 },
  { label: t('common.origin'), value: 'origin', timestamp: 1000 },
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
]);
const aggregateFunctions = computed(() => [
  { label: t('common.lastValue'), value: 'last_value' },
  { label: t('common.maxValue'), value: 'max_value' },
  { label: t('common.minValue'), value: 'min_value' },
  { label: t('common.avg'), value: 'avg' },
]);
const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
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
const historyCursorData = ref<Array<{ path: string; markPoint: Array<TrendMarkPoint>; markLine: Array<TrendMarkLine> }>>([]);
const clickedCursor = ref(false);
const markPointCount = ref(0);
const pointList = ref<Array<PointData>>([]);
const pointCheckedData = computed(() => pointList.value.filter((item) => item.checked));

const legendSelected = computed(() => ({
  show: false,
  selected: pathList.value.reduce(
    (pre, cur) => {
      pre[cur.path] = cur.checked || false;
      return pre;
    },
    {} as Record<string, boolean>
  ),
}));

const seriesData = computed<ECOption>(
  () =>
    ({
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
        markPoint: {
          symbol: 'rect',
          symbolSize: 8,
          itemStyle: {
            color: 'transparent',
            borderColor: '#fff',
            borderWidth: 1,
          },
          label: {
            show: false,
          },
          data: isRunningTab.value || (!isRunningTab.value && !historyCursorData.value.length) ? [] : historyCursorData.value.find((data) => data.path === item.path)?.markPoint,
        },
        markLine: {
          symbol: 'none',
          lineStyle: {
            type: [16, 10],
            color: '#DFE1ED',
          },
          emphasis: {
            lineStyle: {
              type: [16, 10],
            },
          },
          data: isRunningTab.value || (!isRunningTab.value && !historyCursorData.value.length) ? [] : historyCursorData.value.find((data) => data.path === item.path)?.markLine,
          animation: false,
        },
        lineStyle: {
          width: pathList.value.find((data) => data.path === item.path)?.width || 2,
          color: pathList.value.find((data) => data.path === item.path)?.color,
        },
        itemStyle: {
          color: pathList.value.find((data) => data.path === item.path)?.color,
        },
      })),
    }) as unknown as ECOption
);
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
  toolbox: {
    show: !isRunningTab.value,
    feature: {
      dataZoom: {
        title: {
          zoom: '',
          back: '',
        },
        icon: {
          zoom: 'path://M15 9L23 9L23 23L9 23L9 15M13 9L9 9M9 9L5 9M9 13L9 9M9 9L9 5',
          back: 'path://M9,9h14v14H9v-8 M12,12L9,9l3-3',
        },
      },
      restore: {
        title: '',
        icon: 'path://M13 21L15 24C10.0294 24 6 19.9706 6 15C6 12.7036 6.86006 10.6081 8.27564 9.01797M17 9L15 6C19.9706 6 24 10.0294 24 15C24 17.3063 23.1325 19.4101 21.7059 21.0026',
      },
      saveAsImage: {
        title: '',
        icon: 'path://M18,12V7H7v16h11v-5 M24,15H13 M21,18l3-3l-3-3',
      },
    },
  },
  dataZoom: [
    {
      type: 'slider',
      show: isShowZoom.value && isRunningTab.value,
      xAxisIndex: 0,
      height: 20,
      handleSize: 8,
      filterMode: 'none',
      showDetail: false,
      right: 20,
    },
    {
      type: 'slider',
      show: isShowZoom.value && isRunningTab.value,
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

function pointTitle(i: number) {
  if (pointList.value.length === 1) {
    return 'D：';
  }
  return `D${i + 1}：`;
}

function pointDisabled(item: PointData) {
  const flag = pointCheckedData.value.some((data) => data.name === item.name);
  return pointCheckedData.value.length === 2 && !flag;
}

const setOption = (option: ECOption, noMerge: boolean = false) => {
  if (chartInstance) {
    // 实例存在直接设置
    chartInstance.setOption(option, noMerge);
  } else if (chartContainer.value && chartContainer.value.clientHeight) {
    inited = true;
    // 实例不存在，容器存在，容器高度存在
    chartInstance = echarts.init(chartContainer.value, 'dark');
    // 若存在click事件，执行
    chartInstance.on('click', (params) => {
      if (isRunningTab.value || !clickedCursor.value) return;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleClickChart(params);
    });
    // 若存在restore事件，执行
    chartInstance.on('restore', () => {
      if (isRunningTab.value) return;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleEmptyPoint();
      const start = dayjs(searchFormData.datetimerange[0]).valueOf();
      const end = dayjs(searchFormData.datetimerange[1]).valueOf();
      setOption({
        xAxis: {
          min: start,
          max: end,
        },
      });
    });
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

function handleClickChart(params: echarts.ECElementEvent) {
  const { seriesName, value, componentType } = params as { seriesName: string; value: number[]; componentType: string };
  if (componentType !== 'series') return;
  if (markPointCount.value > 9) {
    ElMessage.warning({
      message: t('spectrum.overTip'),
      grouping: true,
    });
    return;
  }
  const index = historyCursorData.value.findIndex((item) => item.path === seriesName);
  markPointCount.value++;
  const num = markPointCount.value;
  if (index === -1) {
    historyCursorData.value.push({
      path: seriesName,
      markPoint: [
        {
          name: `${seriesName}_${value[0]}_${value[1]}`,
          value: value[1],
          xAxis: value[0],
          yAxis: value[1],
        },
      ],
      markLine: [
        {
          name: `${seriesName}_${value[0]}`,
          xAxis: value[0],
          label: {
            formatter: () => (markPointCount.value === 1 ? 'D' : `D${num}`),
            position: 'insideEndBottom',
          },
        },
      ],
    });
    pointList.value.push({
      name: `${seriesName}_${value[0]}_${value[1]}`,
      x: value[0],
      y: value[1],
      disabled: false,
      checked: false,
    });
  } else {
    const { markPoint, markLine } = historyCursorData.value[index];
    const pointIndex = markPoint.findIndex((point) => point.name === `${seriesName}_${value[0]}_${value[1]}`);
    if (pointIndex === -1) {
      markPoint.push({
        name: `${seriesName}_${value[0]}_${value[1]}`,
        value: value[1],
        xAxis: value[0],
        yAxis: value[1],
      });
      pointList.value.push({
        name: `${seriesName}_${value[0]}_${value[1]}`,
        x: value[0],
        y: value[1],
        disabled: false,
        checked: false,
      });
    }
    const lineIndex = markLine.findIndex((line) => line.name === `${seriesName}_${value[0]}`);
    if (lineIndex === -1) {
      markLine.push({
        name: `${seriesName}_${value[0]}`,
        xAxis: value[0],
        label: {
          formatter: () => (markPointCount.value === 1 ? 'D' : `D${num}`),
          position: 'insideEndBottom',
        },
      });
    }
  }
  setOption(chartOptions.value);
}

function handleCheckDvalue(val: CheckboxValueType, data: PointData) {
  data.checked = val as boolean;
}

function handleEmptyPoint() {
  markPointCount.value = 0;
  historyCursorData.value = [];
  pointList.value = [];
  setOption(chartOptions.value);
}

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
    const timeinterval = timeUnits.value.find((time) => time.value === searchFormData.unitInterval)?.timestamp;
    const point = timeinterval ? Math.ceil(timerange / timeinterval) : 0;
    if (point > 2000) {
      ElMessage.warning(t('dataTrend.overTip'));
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
      ElMessage.warning(t('dataTrend.booleanTip'));
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
      ElMessage.warning(t('dataTrend.measurementTip', { measurement: paths }));
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
    data: Search.TrendData[];
    operate: string;
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
      markPointCount.value = 0;
      historyCursorData.value = [];
      pointList.value = [];
      clickedCursor.value = false;
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
    socketInstance.value?.send(
      JSON.stringify({
        operate: 'SET_CONNECT',
        connectionId: connectionId.value,
        user: userName.value,
        type: connectionType.value,
      })
    );
    if (route.query.measurement) {
      socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [route.query.measurement as string] }));
    }
  } else {
    socketInstance.value?.addEventListener('open', () => {
      socketInstance.value?.send(
        JSON.stringify({
          operate: 'SET_CONNECT',
          connectionId: connectionId.value,
          user: userName.value,
          type: connectionType.value,
        })
      );
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
  }
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
.data-trend-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 16px 16px 30px;
}

.search-form-wrapper {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  :deep(.el-form) {
    display: flex;
    align-items: center;

    // height: 30px;
    flex-wrap: wrap;
  }

  :deep(.el-form-item--default) {
    margin: 0 24px 18px 0;
  }
}

.search-data-list {
  display: inline-flex;
  margin: 0 24px 18px 0;
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

.play-pause-buttons {
  height: 30px;
  margin-top: -18px;
}

.search-form-buttons {
  display: inline-flex;
  flex-wrap: nowrap;
  flex: 1;
  justify-content: end;
  margin-bottom: 16px;
}

.hover-btn-disabled,
.hover-btn-disabled:focus {
  color: var(--el-button-disabled-text-color) !important;
  cursor: not-allowed !important;
  background-color: var(--el-button-disabled-bg-color) !important;
  border-color: var(--el-button-disabled-border-color) !important;
}

.trend-tip {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 12px;
  color: #656a85;
  font-weight: 300;
}

.chart-detail-wrapper {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  min-height: 300px;
  overflow: hidden;
}

.path-list-wrapper {
  margin-left: 16px;
  background-color: #f7f8fc;
  border-radius: 2px;
  box-sizing: border-box;
  padding: 12px 12px 28px;
  position: relative;
  transition: all 0.3s ease;
}

.cursor-list-box {
  margin: 16px 0 0;
  height: 244px;
  display: flex;
  flex-direction: column;

  .cursor-list-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
    margin: 0 0 6px;
  }

  .list-empty-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .data-empty-img {
      width: 150px;
      height: 150px;
      margin-bottom: 16px;
    }

    .data-empty-text {
      font-size: 14px;
      color: #131926;
      line-height: 21px;
    }
  }

  .cursor-list-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;

    .cursor-list {
      flex: 1;
      overflow-y: auto;
    }
  }
}

.cursor-text-box {
  display: flex;
  align-items: center;
  margin: 0 0 4px 8px;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #131926;
}

.cursor-point-data {
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
  color: #131926;
}

.point-dvalue-box {
  border-top: 1px dashed #dfe1ed;
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
  color: #131926;
  padding: 4px 0 0;
  margin: 0 8px;
}
</style>
