<template>
  <el-container class="data-trend-wrapper">
    <el-header class="p-0" style="height: auto">
      <div class="search-form-wrapper search-form-box">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
          <base-form-item prop="path" :rules="requiredRules" style="width: 100%">
            <template #label>
              {{ t('measurement.measurementChoose') }}：
              <el-tooltip effect="light" :content="t('common.searchTipLimit100')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
            </template>
            <timeseries-select v-model="searchFormData.path" id="trend-search-path" :disabled-path="(item) => item.dataType === 'TEXT'" />
          </base-form-item>
          <base-form-item :label="`${t('common.datetimerange')}：`" prop="datetimerange" :rules="requiredRules">
            <ul class="search-data-list">
              <li :class="['search-data-type', { 'search-data-active': dataTab === 'running' }]" id="search-data-type-running" @click="handleTrendTab('running')">{{ t('dataTrend.realTrend') }}</li>
              <li :class="['search-data-type', { 'search-data-active': dataTab === 'history' }]" id="search-data-type-history" @click="handleTrendTab('history')">{{ t('dataTrend.historyTrend') }}</li>
            </ul>
            <el-date-picker
              v-if="!isRunningTab"
              v-model="searchFormData.datetimerange"
              type="datetimerange"
              range-separator="-"
              unlink-panels
              :disabled-date="disabledDate"
              :shortcuts="shortcutsDaterange"
              :clearable="false"
              :prefix-icon="ICustomCalender"
              :disabled="isRunningTab"
              :default-time="[new Date(2024, 3, 28, 0, 0, 0), new Date(2024, 3, 28, 23, 59, 59)]"
              id="trend-search-datetimerange"
              @change="handleChangeTime"
            />
          </base-form-item>
          <base-form-item v-show="!isRunningTab" :label="`${t('search.timeInterval')}：`" prop="unitInterval" :rules="requiredRules">
            <el-select v-model="searchFormData.unitInterval" :disabled="isRunningTab" style="width: 80px" id="trend-search-unitInterval">
              <el-option v-for="item in timeUnits" :key="item.value" :value="item.value" :label="item.label" :id="`trend-search-unitInterval-select-${item.value}`" />
            </el-select>
          </base-form-item>
          <base-form-item v-show="!isRunningTab" :label="`${t('search.aggregation')}：`" prop="aggregation" :rules="requiredRules">
            <el-select
              v-model="searchFormData.aggregation"
              :disabled="isRunningTab || searchFormData.unitInterval === 'origin'"
              style="width: 80px"
              @change="handleChangeAggregation"
              id="trend-search-aggregation"
            >
              <el-option v-for="item in aggregateFunctions" :key="item.value" :value="item.value" :label="item.label" :id="`trend-search-aggregation-select-${item.value}`" />
            </el-select>
          </base-form-item>
          <div class="play-pause-buttons" v-show="isRunningTab">
            <el-icon size="30" v-if="!isRunningTab" style="cursor: not-allowed"><i-custom-play-disabled /></el-icon>
            <template v-else>
              <!-- <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'"> -->
              <el-button link v-if="!loading" :disabled="!canReadWriteData || !pathList.length" @click="handlePlay(true)" id="trend-search-run">
                <el-icon size="30"><i-custom-play-active /></el-icon>
              </el-button>
              <el-button link v-else :disabled="!canReadWriteData || !pathList.length" @click="handlePlay(false)" id="trend-search-pause">
                <el-icon size="30"><i-custom-pause /></el-icon>
              </el-button>
              <!-- </auth-tooltip> -->
            </template>
          </div>
        </el-form>
        <div class="search-form-buttons">
          <el-button @click="handleReset(true)" id="trend-search-reset">{{ t('common.reset') }}</el-button>
          <el-tooltip placement="top-start" effect="light" trigger="hover" :content="applyTip" :disabled="applyTipDisabled" popper-class="tooltip-box-width">
            <el-button :disabled="!applyTipDisabled" type="primary" @click="handleSearch()" id="trend-search-search">
              {{ t('common.apply') }}
            </el-button>
          </el-tooltip>
          <el-button :disabled="!searchFormData.path.length" @click="handleSaveTemplate" id="trend-search-save-template">{{ t('common.save') }}</el-button>
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
          <div ref="chartContainer" class="chart-container" style="height: calc(100% - 30px)" v-element-size="onResize"></div>
          <div v-if="!isRunningTab" style="margin-top: 2px">
            <el-button
              type="primary"
              id="trend-cursor"
              class="cursor-button"
              style="height: 24px !important"
              :disabled="!chartHistoryData.length"
              :class="!chartHistoryData.length ? 'disable-cursor' : ''"
              :plain="!clickedCursor"
              @click="clickedCursor = !clickedCursor"
            >
              {{ t('spectrum.cursor') }}
            </el-button>
            <el-tooltip effect="light" :content="t('common.clearAll')" placement="top" popper-class="tooltip-box-width">
              <el-button
                link
                :class="['cursor-button-clear', !chartHistoryData.length || !pointList.length ? '' : 'svg-button-hover-color']"
                id="trend-cursor-clear"
                :disabled="!chartHistoryData.length || !pointList.length"
                @click="handleEmptyPoint"
              >
                <el-icon size="18" color="#fff"><i-custom-delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </el-main>
        <el-aside :width="isExpand ? '240px' : '24px'" :class="['path-list-wrapper', !isExpand ? 'p-0' : '']">
          <el-tabs v-model="activeNameSide" stretch class="tabs-nav-aside" v-if="isExpand">
            <el-tab-pane :label="t('dataTrend.trendAttribute')" name="path">
              <trend-list v-model="pathList" :data-tab="dataTab" :aggregation="searchFormData.aggregation" @handleOperate="handleOperatePath" @handleOperateAll="handleOperateAll" />
            </el-tab-pane>
            <el-tab-pane :label="t('dataTrend.pointAttribute')" name="point" v-if="!isRunningTab">
              <point-list-tab :point-list="pointList" :point-line-data="pointLineData" :path-list="pathList" :point-checked-data="pointCheckedData" @handleDelPoint="handleDelPoint" />
            </el-tab-pane>
            <el-tab-pane :label="t('dataTrend.commonTemplates')" name="template">
              <template-list-tab ref="templateListRef" @handle-operate="handleOperateTemplate" />
            </el-tab-pane>
          </el-tabs>
          <h4 class="collapse-title" v-if="!isExpand">{{ t(tabLabel) }}</h4>
          <el-icon :class="['expand-icon', !isExpand ? 'collapse-icon' : '']" size="24" @click="handleExpand" id="trend-path-expand">
            <i-custom-arrow-right-expand />
          </el-icon>
        </el-aside>
      </el-container>
    </el-main>

    <modal-template v-model:visible="templateVisible" :name-list="nameList" :save-loading="saveTemplateLoading" @handleSave="handleSaveSuccess" />

    <modal-template-rename v-model:visible="renameVisible" :old-name="renameData.name" :name-list="nameList" :save-loading="saveTemplateLoading" @handleSave="handleRenameSuccess" />
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
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
import PointListTab from './components/point-list-tab.vue';
import TemplateListTab from './components/template-list-tab.vue';
import ModalTemplate from './components/modal-template.vue';
import ModalTemplateRename from './components/modal-template-rename.vue';

interface PointData {
  name: string;
  label: string;
  x: number;
  y: number;
  disabled: boolean;
  checked: boolean;
  group: number;
  order: number;
}

interface MarkPointLine {
  path: string;
  name: string;
  value: number;
  xAxis: number;
  yAxis: number;
  label: {
    formatter: string | Function;
    position: string;
    offset: number[];
  };
  group: number;
  order: number;
}
const predefineColors = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#8AC211'];

const tabList = [
  { name: 'path', label: 'dataTrend.trendAttribute' },
  { name: 'point', label: 'dataTrend.pointAttribute' },
  { name: 'template', label: 'dataTrend.commonTemplates' },
];

const { t } = useI18n();
const route = useRoute();
const userStore = useUserStore();
const userName = computed(() => userStore.userInfo.name);
const { canReadWriteData } = storeToRefs(userStore);
const connectionStore = useConnectionStore();
const connectionId = computed(() => connectionStore.connectionInfo.data.id);
const connectionType = computed(() => (connectionStore.connectionIsMaster ? 0 : 1));
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;
const isExpand = ref(true);
const searchFormRef = ref<FormInstance>();
const tip = ref('<span style="font-weight: 700; color: #495AD4; margin: 0 4px;">2000</span>');
const minDataTime = ref(-1);
const searchFormData = reactive<{
  path: string[];
  datetimerange: [DateModelType, DateModelType];
  unitInterval: string;
  aggregation: string;
}>({
  path: [],
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  unitInterval: 'auto',
  aggregation: 'last_value',
});
let copySearchFormData = cloneDeep(searchFormData);
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
    trigger: 'blur',
  },
]);
let inited = false;
let currentPoint = 0;
const dataTab = ref<'running' | 'history'>('running');
const pathList = ref<Trend.LineObj[]>([]);
const loading = ref(true);
const isRunningTab = computed(() => dataTab.value === 'running');
const checkedData = computed(() => pathList.value.filter((item) => item.checked));
// 实时数据
const chartData = ref<Search.TrendData[]>([]);
// 历史数据
const chartHistoryData = ref<Search.TrendData[]>([]);
// 当前数据
const currentData = computed(() => (isRunningTab.value ? chartData.value : chartHistoryData.value));
const pointLineData = ref<Array<MarkPointLine>>([]);
const clickedCursor = ref(false);
const markPointCount = ref(0);
const pointList = ref<Array<PointData>>([]);
const templateVisible = ref(false);
const renameVisible = ref(false);
const renameData = reactive<{
  id: number | string;
  name: string;
  type: string;
  template: string;
}>({
  id: '',
  name: '',
  type: '',
  template: '',
});
const saveTemplateLoading = ref(false);
const activeNameSide = ref('path');
const tabLabel = ref('dataTrend.trendAttribute');
const templateListRef = ref<InstanceType<typeof TemplateListTab>>();
const nameList = computed(() => templateListRef.value?.templateList.map((item) => item.name) || []);

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
          animation: false,
          data:
            isRunningTab.value || (!isRunningTab.value && !pointLineData.value.length)
              ? []
              : pointLineData.value.filter((data) => data.path === item.path)?.map((point) => ({ path: point.path, name: point.name, value: point.value, xAxis: point.xAxis, yAxis: point.yAxis })),
        },
        markLine: {
          symbol: 'none',
          lineStyle: {
            type: [16, 10],
            color: '#DFE1ED',
          },
          data:
            isRunningTab.value || (!isRunningTab.value && !pointLineData.value.length)
              ? []
              : pointLineData.value.filter((data) => data.path === item.path)?.map((line) => ({ path: line.path, name: line.name, xAxis: line.xAxis, label: line.label })),
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
    feature: {
      dataZoom: {
        title: {
          zoom: '放大',
          back: '撤销',
        },
        icon: {
          zoom: 'path://M15 9L23 9L23 23L9 23L9 15M13 9L9 9M9 9L5 9M9 13L9 9M9 9L9 5',
          back: 'path://M9,9h14v14H9v-8 M12,12L9,9l3-3',
        },
      },
      restore: {
        title: '还原',
        icon: 'path://M13 21L15 24C10.0294 24 6 19.9706 6 15C6 12.7036 6.86006 10.6081 8.27564 9.01797M17 9L15 6C19.9706 6 24 10.0294 24 15C24 17.3063 23.1325 19.4101 21.7059 21.0026',
      },
      saveAsImage: {
        title: '导出',
        icon: 'path://M18,12V7H7v16h11v-5 M24,15H13 M21,18l3-3l-3-3',
      },
    },
  },
  grid: {
    left: 20,
    right: 60,
    bottom: 20,
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
    scale: true,
  },
  animation: !isRunningTab.value,
  series: seriesData.value.series,
}));

const { requestFn: getHistoryTrend } = useRequest(SearchApi.getHistoryTrend);
const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);

const applyTip = computed(() => {
  if (!canReadWriteData.value) {
    return t('common.dataAuth');
  }
  if (searchFormData.path.length === 0) {
    return t('dataTrend.measurementEmptyTip');
  }
  if (searchFormData.path.length > 10) {
    return t('dataTrend.overMeasurementTip');
  }
  return '';
});

const applyTipDisabled = computed(() => {
  if (canReadWriteData.value && searchFormData.path.length > 0 && searchFormData.path.length <= 10) {
    return true;
  }
  return false;
});

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
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      // handleEmptyPoint();
      if (!isRunningTab.value) {
        const start = dayjs(copySearchFormData.datetimerange[0]).valueOf();
        const end = dayjs(copySearchFormData.datetimerange[1]).valueOf();
        setOption({
          xAxis: {
            min: start,
            max: end,
          },
        });
      } else {
        const minTime = dayjs().subtract(10, 'minute').valueOf();
        if (chartData.value.length === 0) {
          minDataTime.value = dayjs().valueOf();
        }
        const min = minTime > minDataTime.value ? minTime : minDataTime.value;
        setOption({
          xAxis: {
            min,
          },
        });
      }
      setOption(chartOptions.value);
    });
    chartInstance.on('highlight', (params: any) => {
      if (params.batch && params.batch.length > 0) {
        currentPoint = currentData.value[params?.batch[0].seriesIndex]?.timestamps[params?.batch[0].dataIndex];
      }
    });
    chartInstance.getZr().on('click', (params) => {
      if (!clickedCursor.value) return;
      if (params.target && !params.topTarget) {
        return;
      }
      // 点击到点上
      if ((params.target as unknown as any)?.z === 3 || (params.target as unknown as any)?.z === 5) {
        return;
      }
      if (params.topTarget && params.topTarget.type !== 'Line') return;
      const findPoints: Array<[number, string, string]> = [];
      currentData.value.forEach((item) => {
        const i = item.timestamps.findIndex((f) => f === currentPoint);
        if (i !== -1) {
          findPoints.push([currentPoint, item.values[i], item.path]);
        }
      });
      if (findPoints.length > 0) {
        const point = [findPoints[0][0], findPoints[0][1]];
        const param = { componentType: 'series', seriesName: findPoints[0][2], value: point };
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        handleClickChart(param as echarts.ECElementEvent, findPoints);
      }
    });
    // 初次加载，设置notMerge为true
    chartInstance.setOption(option, true);
    chartInstance.setOption({
      xAxis: {
        show: inited ? pathList.value.length > 0 : true,
      },
    });
  } else {
    // 容器高度有问题时，延迟加载
    nextTick(() => {
      setOption(option);
    });
  }
};

function handleAddPoint(points: Array<[number, string, string]>, num: number) {
  points.forEach((item, pointIndex) => {
    const [pointX, pointY, pointPath] = item;
    pointLineData.value.push({
      path: pointPath,
      name: `${pointPath}_${pointX}_point_line`,
      value: pointY as unknown as number,
      xAxis: pointX,
      yAxis: pointY as unknown as number,
      label: {
        formatter: `D${num}-${pointIndex + 1}`,
        position: 'end',
        offset: [0, (pointIndex + 1) * 10],
      },
      group: num,
      order: pointIndex + 1,
    });
    pointList.value.push({
      name: `${pointPath}_${pointX}_${pointY as unknown as number}`,
      label: `D${num}-${pointIndex + 1}`,
      x: pointX,
      y: pointY as unknown as number,
      disabled: false,
      checked: false,
      group: num,
      order: pointIndex + 1,
    });
  });
}

function handleClickChart(params: echarts.ECElementEvent, points?: Array<[number, string, string]>) {
  const { seriesName, value, componentType } = params as { seriesName: string; value: number[] | number; componentType: string };
  if (componentType !== 'series' && componentType !== 'markLine' && componentType !== 'markPoint') return;
  let index = -1;
  if (componentType === 'series') {
    index = pointLineData.value.findIndex((data) => data.path === seriesName && data.xAxis === (value as number[])[0]);
  } else if (componentType === 'markPoint') {
    index = pointLineData.value.findIndex((data) => data.path === (params.data as unknown as any)?.path && data.value === (value as number));
  } else {
    // 'markLine'
    index = pointLineData.value.findIndex((data) => data.path === (params.data as unknown as any)?.path && data.xAxis === (value as number));
  }
  if (index !== -1) {
    // markPointCount.value--;
    // pointList.value.splice(index, 1);
    // pointLineData.value.splice(index, 1);
    // pointLineData.value.forEach((item, i) => {
    //   if (i >= index) {
    //     item.label = {
    //       formatter: () => (markPointCount.value === 1 ? 'D' : `D${i + 1}`),
    //       position: 'end',
    //     };
    //   }
    // });
    // setOption(chartOptions.value);
    return;
  }
  if (markPointCount.value > 9) {
    ElMessage.warning({
      message: t('dataTrend.pointOverTip'),
      grouping: true,
    });
    return;
  }
  markPointCount.value++;
  const num = markPointCount.value;
  if (!points || points.length === 0) {
    const data: Array<[number, string, string]> = [[(value as number[])[0], `${(value as number[])[1]}`, seriesName]];
    handleAddPoint(data, num);
  } else {
    handleAddPoint(points, num);
  }
  setOption(chartOptions.value);
}

function handleDelPoint(data: PointData, index: number) {
  const pointXSameList = pointList.value.filter((f) => f.x === data.x);
  if (pointXSameList.length === 1) {
    markPointCount.value--;
    pointList.value.splice(index, 1);
    pointList.value.forEach((item, i) => {
      if (i >= index) {
        item.group--;
        item.label = `D${item.group}-${item.order}`;
      }
    });
    pointLineData.value.splice(index, 1);
    pointLineData.value.forEach((item, i) => {
      if (i >= index) {
        item.group--;
        item.label = {
          formatter: () => `D${item.group}-${item.order}`,
          position: 'end',
          offset: [0, item.order * 10],
        };
      }
    });
  } else {
    pointList.value.splice(index, 1);
    pointLineData.value.splice(index, 1);
    pointXSameList.forEach((item) => {
      const fIndex = pointList.value.findIndex((f) => f.x === item.x && f.y === item.y);
      const fData = pointList.value[fIndex];
      const lData = pointLineData.value[fIndex];
      if (fIndex >= index) {
        fData.order--;
        lData.order--;
        pointList.value.splice(fIndex, 1, { ...fData, label: `D${fData.group}-${fData.order}`, order: fData.order });
        pointLineData.value.splice(fIndex, 1, { ...lData, label: { formatter: () => `D${lData.group}-${lData.order}`, position: 'end', offset: [0, lData.order * 10] }, order: lData.order });
      }
    });
  }
  setOption(chartOptions.value);
}

function handleEmptyPoint() {
  markPointCount.value = 0;
  pointLineData.value = [];
  pointList.value = [];
  clickedCursor.value = false;
  setOption(chartOptions.value);
}

const onResize = debounce(() => {
  if (chartContainer.value) {
    chartInstance?.resize();
  }
}, 50);

// 重置
function handleReset(force?: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  socketInstance.value?.send(JSON.stringify({ operate: 'del', paths: [...searchFormData.path] }));
  if (force) {
    searchFormData.path = [];
  }
  searchFormData.datetimerange = getOneIntervalNow(7) as [DateModelType, DateModelType];
  searchFormData.unitInterval = 'auto';
  searchFormData.aggregation = 'last_value';
  chartData.value = [];
  markPointCount.value = 0;
  pointLineData.value = [];
  pointList.value = [];
  clickedCursor.value = false;
  chartHistoryData.value.length = 0;
  pathList.value = [];
  copySearchFormData = cloneDeep(searchFormData);
  setOption(chartOptions.value, true);
}

function handleChangeAggregation(val: string) {
  if (val === 'last_value') {
    pathList.value.forEach((item) => {
      item.disabled = false;
    });
  }
}

function handleChangeTime(value: [DateModelType, DateModelType]) {
  const start = dayjs(value[0]).valueOf();
  const end = dayjs(value[1]).valueOf();
  if (start >= end) {
    ElMessage.warning({
      message: t('dataTrend.timeTip'),
      grouping: true,
    });
  }
}

function handleExpand() {
  isExpand.value = !isExpand.value;
  tabLabel.value = tabList.find((item) => item.name === activeNameSide.value)?.label || 'dataTrend.trendAttribute';
}

function dealSearchPath() {
  copySearchFormData = cloneDeep(searchFormData);
  const allCurrentPaths = pathList.value.map((item) => item.path);
  const addPaths = difference(copySearchFormData.path, allCurrentPaths);
  const deletePaths = difference(allCurrentPaths, copySearchFormData.path);
  deletePaths.forEach((item) => {
    const index = pathList.value.findIndex((data) => data.path === item);
    if (index !== -1) {
      pathList.value.splice(index, 1);
    }
  });
  if (deletePaths.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    socketInstance.value?.send(JSON.stringify({ operate: 'del', paths: [...deletePaths] }));
    deletePaths.forEach((deleteItem) => {
      const index = chartData.value.findIndex((data) => data.path === deleteItem);
      if (index !== -1) {
        chartData.value.splice(index, 1);
      }
    });
  }
  const existedColor = pathList.value.map((item) => item.color);
  const diffArr = difference(predefineColors, existedColor);
  addPaths.forEach((item, index) => {
    pathList.value.push({
      path: item,
      color: diffArr[index] || predefineColors[index],
      width: 2,
      checked: true,
      disabled: false,
    });
  });

  if (isRunningTab.value) {
    loading.value = true;
    if (addPaths.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [...addPaths] }));
    }
  }
}

// 查询
function handleSearch(unforce?: boolean) {
  if (!searchFormData.path.length) return;
  if (isRunningTab.value) {
    if (!unforce) {
      dealSearchPath();
    } else {
      copySearchFormData = cloneDeep(searchFormData);
    }
    setOption(chartOptions.value, true);
    return;
  }
  const timerange = dayjs(searchFormData.datetimerange[1]).valueOf() - dayjs(searchFormData.datetimerange[0]).valueOf();
  if (searchFormData.unitInterval !== 'auto' && searchFormData.unitInterval !== 'origin') {
    const timeinterval = timeUnits.value.find((time) => time.value === searchFormData.unitInterval)?.timestamp;
    const point = timeinterval ? Math.ceil(timerange / timeinterval) : 0;
    if (point > 2000) {
      ElMessage.warning({ message: t('dataTrend.overTip'), grouping: true });
      searchFormData.unitInterval = 'auto';
    }
  }
  const start = dayjs(searchFormData.datetimerange[0]).valueOf();
  const end = dayjs(searchFormData.datetimerange[1]).valueOf();
  if (start >= end) {
    ElMessage.warning({
      message: t('dataTrend.timeTip'),
      grouping: true,
    });
    return;
  }
  if (!unforce) {
    dealSearchPath();
  } else {
    copySearchFormData = cloneDeep(searchFormData);
  }
  getHistoryTrend({
    paths: copySearchFormData.path,
    startTime: start,
    endTime: end,
    groupBy: copySearchFormData.unitInterval,
    aggregateFun: copySearchFormData.aggregation,
  }).then((res) => {
    chartHistoryData.value = res.data?.normal || [];
    const abnormals = res.data?.abnormal || [];
    const currentAll = pathList.value.filter((f) => f.disabled).map((item) => item.path);
    const differents = difference(abnormals, currentAll);
    if (differents.length) {
      ElMessage.warning({ message: t('dataTrend.booleanTip'), grouping: true });
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
      ElMessage.warning({ message: t('dataTrend.measurementTip', { measurement: paths }), grouping: true });
    }
    if (!chartHistoryData.value.length) {
      ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
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
function handleTrendTab(type: 'running' | 'history', unforce?: boolean) {
  if (dataTab.value === type && !unforce) return;
  dataTab.value = type;
  if (!canReadWriteData.value) return;
  nextTick(() => {
    if (type === 'history') {
      loading.value = false;
      chartData.value.forEach((item) => {
        item.timestamps = [];
        item.values = [];
      });
      markPointCount.value = 0;
      pointLineData.value = [];
      pointList.value = [];
      clickedCursor.value = false;
      chartHistoryData.value.length = 0;
      if (!unforce) {
        setOption(chartOptions.value, true);
        // handleReset();
      }
      handleSearch();
    } else {
      minDataTime.value = dayjs().valueOf();
      pathList.value.forEach((item) => {
        item.disabled = false;
      });
      if (!unforce) {
        chartData.value = [];
        setOption(chartOptions.value, true);
      }
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
      if (pathList.value.length === 0) {
        pointList.value = [];
        markPointCount.value = 0;
        clickedCursor.value = false;
        pointLineData.value = [];
      }
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

function handleSaveTemplate() {
  if (!searchFormData.path.length) return;
  saveTemplateLoading.value = false;
  templateVisible.value = true;
}

// 模板操作
function handleOperateTemplate(val: string, data: Search.TrendTemplate) {
  if (val === 'rename') {
    renameData.id = +data.id!;
    renameData.name = data.name;
    renameData.type = data.type;
    renameData.template = data.template;
    saveTemplateLoading.value = false;
    renameVisible.value = true;
  } else {
    const templateData = JSON.parse(data.template);
    searchFormData.path = templateData.path;
    searchFormData.aggregation = templateData.aggregation;
    searchFormData.datetimerange = templateData.datetimerange;
    searchFormData.unitInterval = templateData.unitInterval;
    pathList.value = [];
    nextTick(() => {
      pathList.value = templateData.pathList.map((item: Trend.LineObj) => ({ ...item }));
      handleTrendTab(templateData.type, true);
    });
  }
}

function handleSaveSuccess(name: string) {
  saveTemplateLoading.value = true;
  const data = JSON.stringify({
    ...searchFormData,
    datetimerange: [dayjs(searchFormData.datetimerange[0]).valueOf(), dayjs(searchFormData.datetimerange[1]).valueOf()],
    type: dataTab.value,
    pathList: pathList.value,
  });
  upsertTrendTemplate({
    id: '',
    type: dataTab.value,
    name,
    template: data,
  })
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      templateVisible.value = false;
      templateListRef.value?.getQueryList();
    })
    .finally(() => {
      saveTemplateLoading.value = false;
    });
}

function handleRenameSuccess(name: string) {
  saveTemplateLoading.value = true;
  upsertTrendTemplate({
    id: renameData.id,
    type: renameData.type,
    name,
    template: renameData.template,
  })
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      renameVisible.value = false;
      templateListRef.value?.getQueryList();
    })
    .finally(() => {
      saveTemplateLoading.value = false;
    });
}

function init() {
  if (socketInstance.value && socketInstance.value.readyState === 1) {
    socketInstance.value?.send(
      JSON.stringify({
        operate: 'SET_CONNECT',
        connectionId: connectionId.value,
        user: userName.value,
        type: connectionType.value,
      })
    );
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
    });
  }
  setOption(chartOptions.value);
}

function setStorage() {
  sessionStorage.setItem(
    'dataTrendStorage',
    JSON.stringify({
      ...copySearchFormData,
      dataTab: dataTab.value,
      pathList: pathList.value,
      pointLineData: pointLineData.value,
      markPointCount: markPointCount.value,
      pointList: pointList.value,
      activeNameSide: activeNameSide.value,
    })
  );
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    // eslint-disable-next-line no-underscore-dangle
    if (!window.__isReload__) {
      setStorage();
    } else {
      sessionStorage.setItem('dataTrendStorage', '');
    }
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
      if (!canReadWriteData.value) {
        if (route.query.measurement) {
          searchFormData.path = [route.query.measurement as string];
        }
        setOption(chartOptions.value);
        return;
      }
      initWebsocket(() => {
        if (route.query.measurement) {
          searchFormData.path = [route.query.measurement as string];
          pathList.value.push({
            path: route.query.measurement as string,
            color: '#4992ff',
            width: 2,
            checked: true,
          });
          if (socketInstance.value && socketInstance.value.readyState === 1) {
            socketInstance.value?.send(
              JSON.stringify({
                operate: 'SET_CONNECT',
                connectionId: connectionId.value,
                user: userName.value,
                type: connectionType.value,
              })
            );
            socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [route.query.measurement as string] }));
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
              socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [route.query.measurement as string] }));
            });
          }
          setOption(chartOptions.value);
          return;
        }
        if (sessionStorage.getItem('dataTrendStorage')) {
          const storageData = JSON.parse(sessionStorage.getItem('dataTrendStorage') as string);
          searchFormData.path = storageData.path;
          searchFormData.datetimerange = storageData.datetimerange;
          searchFormData.unitInterval = storageData.unitInterval;
          searchFormData.aggregation = storageData.aggregation;
          dataTab.value = storageData.dataTab;
          pathList.value = storageData.pathList;
          pointLineData.value = storageData.pointLineData.map((item: MarkPointLine) => ({
            ...item,
            label: {
              formatter: () => `D${item.group}-${item.order}`,
              position: 'end',
              offset: [0, item.order * 10],
            },
          }));
          markPointCount.value = storageData.markPointCount;
          pointList.value = storageData.pointList;
          activeNameSide.value = storageData.activeNameSide;
          loading.value = dataTab.value === 'running';
          if (socketInstance.value && socketInstance.value.readyState === 1) {
            socketInstance.value?.send(
              JSON.stringify({
                operate: 'SET_CONNECT',
                connectionId: connectionId.value,
                user: userName.value,
                type: connectionType.value,
              })
            );
            if (dataTab.value === 'running' && searchFormData.path.length) {
              socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [...searchFormData.path] }));
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
              if (dataTab.value === 'running' && searchFormData.path.length) {
                socketInstance.value?.send(JSON.stringify({ operate: 'add', paths: [...searchFormData.path] }));
              }
            });
          }
          setOption(chartOptions.value, true);
          handleSearch(false);
          return;
        }
        init();
      });
    }
  },
  {
    immediate: true,
  }
);

onBeforeUnmount(() => {
  setStorage();
});

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

.search-form-box {
  :deep(.el-form) {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
}

.search-data-list {
  display: inline-flex;
  margin: 0 16px 0 0;
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

.cursor-button {
  border: none;
}

.disable-cursor {
  color: #495ad4 !important;
  background-color: #f0f1fa !important;
}

.path-list-wrapper {
  margin-left: 16px;
  padding: 14px 16px 0;
  background-color: #f7f8fc;
  border-radius: 2px;
  box-sizing: border-box;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.tabs-nav-aside {
  flex: 1;
  width: 100%;
  overflow-y: hidden;
  height: calc(100% - 28px);

  :deep(.el-tabs__header) {
    margin: 0;
    font-size: 14px;
    line-height: 21px;
    font-weight: 400;
  }

  :deep(.el-tabs__item) {
    padding: 0 !important;
    height: 24px !important;
  }

  :deep(.el-tabs__active-bar) {
    border-radius: 2px 2px 0 0;
  }

  :deep(.el-tabs__content) {
    width: 100%;
    padding-top: 16px;
    height: calc(100% - 40px);
  }

  .el-tab-pane {
    height: 100%;
    overflow-y: auto;
  }
}

.collapse-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
  color: #495ad4;
  margin: 14px 5px 0;
  flex: 1;
}

.expand-icon {
  // position: absolute;
  // bottom: 0;
  // left: 16px;
  cursor: pointer;
  color: #a0a3b8;

  &:hover {
    color: #495ad4;
  }

  &.collapse-icon {
    left: 0;
    transform: rotate(-180deg);
  }
}
</style>

<style lang="scss">
.side-list-box {
  border-radius: 2px;
  background: #fff;
  overflow-y: auto;
  height: 100%;
}
</style>
