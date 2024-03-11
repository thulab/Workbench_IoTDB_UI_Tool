<template>
  <el-container class="data-spectrum-wrapper">
    <el-header class="p-0" style="height: auto;">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" class="m-b-18" inline>
          <div class="m-b-28 flex">
            <base-form-item :label="`${t('spectrum.analysisMethod')}：`" prop="method" :rules="requiredRules">
              <template #label>
                {{t('spectrum.analysisMethod')}}：<el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
                  <template #content>
                    <p style="color: #131926;font-weight: 300;" v-html="t('spectrum.analysisMethodTip', { doc: methodDocLink })"></p>
                  </template>
                  <i-custom-question />
                </el-tooltip>
              </template>
              <el-select v-model="searchFormData.method" popper-class="center-select" id="spectrum-search-method" style="width: 200px;">
                <el-option
                  v-for="item in methodList"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
                  :id="`spectrum-search-method-${item.value}`"
                >
                  <el-tooltip
                    placement="top-start"
                    effect="light"
                    trigger="hover"
                    :content="t('common.noAuth')"
                    popper-class="tooltip-box-width"
                  >
                    {{ item.name }}
                  </el-tooltip>
                </el-option>
              </el-select>
            </base-form-item>
            <div class="search-method-params-box">
              <span class="params-title">{{ t('spectrum.paramsTitle') }}</span>
              <template v-if="!true">
                <base-form-item :label="`${t('spectrum.returnResult')}：`" prop="result">
                  <el-select v-model="searchFormData.result" style="width: 80px;" id="spectrum-search-result">
                    <el-option
                      v-for="item in resultList"
                      :key="item.value"
                      :label="item.name"
                      :value="item.value"
                      :id="`spectrum-search-result-${item.value}`"
                    />
                  </el-select>
                </base-form-item>
                <base-form-item :label="`${t('spectrum.compressParams')}：`" prop="compressParams" class="m-r-0">
                  <template #label>
                    {{t('spectrum.compressParams')}}：<el-tooltip effect="light" placement="top" popper-class="tooltip-box-width" :content="t('spectrum.compressParamsTip')"><i-custom-question /></el-tooltip>
                  </template>
                  <el-input v-model="searchFormData.compressParams" style="width: 120px;" :placeholder="t('spectrum.compressParamsPlaceholder')" id="spectrum-search-compress" />
                </base-form-item>
              </template>
              <template v-if="true">
                <base-form-item :label="`${t('spectrum.modulationFrequency')}：`" prop="modulationFrequency" class="m-r-0">
                  <el-input v-model.number="searchFormData.modulationFrequency" style="width: 120px;" id="spectrum-search-frequency" @input="handleInputFrequency" />
                </base-form-item>
              </template>
            </div>
          </div>
          <div class="flex-justify-between">
            <div>
              <base-form-item :label="`${t('measurement.measurementChoose')}：`" prop="path" :rules="requiredRules">
                <timeseries-select-single
                  id="spectrum-search-path"
                  v-model="searchFormData.path"
                  :selectWidth="200"
                  :itemWidth="160"
                  show-suffix
                />
              </base-form-item>
              <base-form-item :label="`${t('common.datetimerange')}：`" prop="datetimerange" :rules="requiredRules">
                <el-date-picker
                  v-model="searchFormData.datetimerange"
                  type="datetimerange"
                  range-separator="～"
                  unlink-panels
                  :disabled-date="disabledDate"
                  :shortcuts="shortcutsDaterange"
                  :clearable="false"
                  :prefix-icon="ICustomCalender"
                  id="spectrum-search-datetimerange"
                />
              </base-form-item>
            </div>
            <div>
              <base-form-item :label="`${t('spectrum.sqlInput')}：`" prop="path" :rules="requiredRules">
                <el-button type="primary" link id="spectrum-search-sql" @click="handleSql">{{ t('search.sqlInput') }}</el-button>
              </base-form-item>
            </div>
            <div class="search-form-buttons">
              <el-button @click="handleReset" id="spectrum-search-reset">{{ t('common.reset') }}</el-button>
              <el-button type="primary" @click="handleSearch" id="spectrum-search-search">{{ t('common.apply') }}</el-button>
            </div>
          </div>
        </el-form>
      </div>
    </el-header>
    <el-main class="p-0">
      <el-container class="chart-detail-wrapper">
        <el-main class="p-0" style="position: relative;">
          <div ref="chartContainer" class="chart-container" :style="`height: ${'calc(100% - 28px);'}`" v-element-size="onResize"></div>
          <div class="flex-align-center">
            <el-button type="primary" id="spectrum-cursor" style="height: 24px !important;" :disabled="!chartData.length" @click="clickedCursor = true;">{{ t('spectrum.cursor') }}</el-button>
            <div class="chart-operate-box">
              <span>{{ t('spectrum.harmonicFrequency') }}</span>
              <el-input v-model.number="harmonicFrequency" @input="handleInputHarmonicFrequency" id="spectrum-harmonicFrequency-input" style="width: 40px;height: 24px !important;" />
            </div>
            <div class="chart-operate-box">
              <span>{{ t('spectrum.sideband') }}</span>
              <el-input v-model.number="sideband" @input="handleInputSideband" id="spectrum-sideband-input" style="width: 40px;height: 24px !important;" />
            </div>
            <el-button link class="cursor-button m-l-8" id="spectrum-cursor-clear" :disabled="!chartData.length || !pointList.length" @click="handleEmptyPoint"><el-icon size="18" color="#fff"><i-custom-delete /></el-icon></el-button>
          </div>
        </el-main>
        <el-aside :width="isExpand ? '240px' : '24px'" :class="['path-list-wrapper', !isExpand ? 'p-0' : '']" style="display: flex; flex-direction: column;">
          <div class="cursor-list-box" v-if="isExpand">
            <h4 class="cursor-list-title">{{ t('spectrum.cursorTitle') }}</h4>
            <auth-container :is-auth="canReadWriteSchemaData" style="flex: 1; background-color: #fff; overflow-y: hidden; display: flex; padding: 12px 0 10px;">
              <div class="list-empty-wrapper" v-if="!cursorData.length">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">{{ t('common.noData') }}</span>
              </div>
              <div class="cursor-list-wrapper" v-else>
                <ul class="cursor-list">
                  <li v-for="(item, index) in pointList" :key="item.name" :class="['cursor-item-box']">
                    <div class="cursor-text-box">
                      <el-checkbox v-if="pointList.length !== 1" :checked="item.checked" class="m-r-4" :id="`spectrum-cursor-checkbox-${index}`" :disabled="pointDisabled(item)" @change="val => handleCheckDvalue(val, item)" />
                      {{ pointTitle(index) }}
                    </div>
                    <div class="cursor-point-data" :style="{ marginLeft: pointList.length !== 1 ? '45px' : '25px' }">
                      <p style="display: inline-flex; width: 140px;"><text-tooltip :content="`X: ${item.x}`" /></p>
                      <p style="display: inline-flex; width: 140px;"><text-tooltip :content="`Y: ${item.y}`" /></p>
                    </div>
                  </li>
                </ul>
                <div v-if="pointCheckedData.length === 2" class="point-dvalue-box">
                  <p style="display: inline-flex; width: 190px;"><text-tooltip :content="`ΔX：${Math.abs(pointCheckedData[0].x - pointCheckedData[1].x)}`" /></p>
                  <p style="display: inline-flex; width: 190px;"><text-tooltip :content="`Δf：${Math.abs(pointCheckedData[0].y - pointCheckedData[1].y)}`" /></p>
                </div>
              </div>
            </auth-container>
          </div>
          <h4 v-if="!isExpand" class="cursor-collapse-title">{{ t('spectrum.cursorTitle') }}</h4>
          <el-icon :class="['expand-icon', !isExpand ? 'collapse-icon' : '']" size="24" @click="isExpand = !isExpand;" id="spectrum-point-expand">
            <i-custom-arrow-right-expand />
          </el-icon>
        </el-aside>
      </el-container>
    </el-main>

    <modal-sql
      v-model:visible="sqlVisible"
    />
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type {
  FormInstance, SingleOrRange, DateModelType, CheckboxValueType,
} from 'element-plus';
import dayjs from 'dayjs';
import {
  debounce,
} from 'lodash-es';
import { vElementSize } from '@vueuse/components';
// import { SearchApi } from '@/api';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import { useUserStore } from '@/stores';
import ICustomCalender from '~icons/custom/calender.svg';
import ModalSql from './components/modal-sql.vue';

interface TrendMarkPoint {
  name: string,
  value: number,
  xAxis: number,
  yAxis: number,
}

interface TrendMarkLine {
  name: string,
  xAxis: number,
  label: {
    formatter: string | Function,
    position: string,
  };
}

interface PointData {
  name: string,
  x: number,
  y: number,
  disabled: boolean,
  checked: boolean,
}

const { t } = useI18n();
const methodDocLink = computed(() => `<a href="https://www.timecho.com/docs/zh/UserGuide/latest/User-Manual/Database-Programming.html#udtf-user-defined-timeseries-generating-function" target="_blank" rel="noopener noreferrer" style="color: #495ad4;"> ${t('common.userManual')}</a>`);
const userStore = useUserStore();
const {
  canReadWriteSchemaData,
} = storeToRefs(userStore);
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;
const isExpand = ref(true);
const searchFormRef = ref<FormInstance>();
const searchFormData = reactive<{
  path: string,
  method: string,
  result: string,
  compressParams: string,
  modulationFrequency?: string | number,
  datetimerange: [DateModelType, DateModelType],
}>({
  path: '',
  method: '',
  result: '',
  compressParams: '',
  modulationFrequency: '',
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
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
const methodList = ref<Array<{ name: string, value: string }>>([]);
const resultList = ref<Array<{ name: string, value: string }>>([]);
const requiredRules = ref([
  {
    required: true,
    message: t('common.formRuleEmpty'),
    trigger: ['change'],
  },
]);
let inited = false;
const chartData = ref<Search.TrendData[]>([]);
const cursorData = ref<Array<{ path: string, markPoint: Array<TrendMarkPoint>, markLine: Array<TrendMarkLine> }>>([]);
const clickedCursor = ref(false);
const markPointCount = ref(0);
const pointList = ref<Array<PointData>>([]);
const pointDvalueList = ref<Array<{ x: number, y: number }>>([]);
const pointCheckedData = computed(() => pointList.value.filter((item) => item.checked));
const harmonicFrequency = ref<number | undefined>(1);
const sideband = ref<number | undefined>(1);
const sqlVisible = ref(false);

const seriesData = computed<ECOption>(() => ({
  series: chartData.value.map((item) => ({
    type: 'line',
    symbol: 'circle',
    showSymbol: false,
    showAllSymbol: 'auto',
    connectNulls: false,
    symbolSize: 4,
    name: item.path,
    data: item.values.map((dataItem, index) => [item.timestamps[index], dataItem]),
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
      data: !cursorData.value.length ? [] : cursorData.value.find((data) => data.path === item.path)?.markPoint,
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
      data: !cursorData.value.length ? [] : cursorData.value.find((data) => data.path === item.path)?.markLine,
      animation: false,
    },
    lineStyle: {
      width: 2,
      color: '#4992ff',
    },
    itemStyle: {
      color: '#4992ff',
    },
  })),
}) as unknown as ECOption);

const chartOptions = computed<ECOption>(() => ({
  useUTC: false,
  tooltip: {
    trigger: 'axis',
    // appendToBody: true,
  },
  toolbox: {
    show: true,
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
    show: !inited,
  },
  yAxis: {
    type: 'value',
  },
  animation: true,
  series: seriesData.value.series,
}));

// const { requestFn: getHistoryTrend } = useRequest(SearchApi.getHistoryTrend);

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

function handleInputFrequency(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      searchFormData.modulationFrequency = undefined;
    }
  } else {
    searchFormData.modulationFrequency = undefined;
  }
}

function handleInputHarmonicFrequency(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      harmonicFrequency.value = 1;
    }
  } else {
    harmonicFrequency.value = 1;
  }
}

function handleInputSideband(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      sideband.value = 1;
    }
  } else {
    sideband.value = 1;
  }
}

const setOption = (option:ECOption, noMerge: boolean = false) => {
  if (chartInstance) {
    // 实例存在直接设置
    chartInstance.setOption(option, noMerge);
  } else if (chartContainer.value && chartContainer.value.clientHeight) {
    inited = true;
    // 实例不存在，容器存在，容器高度存在
    chartInstance = echarts.init(chartContainer.value, 'dark');
    // 若存在click事件，执行
    chartInstance.on('click', (params) => {
      if (!clickedCursor.value) return;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleClickChart(params);
    });
    // 若存在restore事件，执行
    chartInstance.on('restore', () => {
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
  const { seriesName, value, componentType } = params as { seriesName: string, value: number[], componentType: string };
  if (componentType !== 'series') return;
  if (markPointCount.value > 9) {
    ElMessage.warning({
      message: t('spectrum.overTip'),
      grouping: true,
    });
    return;
  }
  const index = cursorData.value.findIndex((item) => item.path === seriesName);
  markPointCount.value++;
  const num = markPointCount.value;
  if (index === -1) {
    cursorData.value.push({
      path: seriesName,
      markPoint: [{
        name: `${seriesName}_${value[0]}_${value[1]}`,
        value: value[1],
        xAxis: value[0],
        yAxis: value[1],
      }],
      markLine: [{
        name: `${seriesName}_${value[0]}`,
        xAxis: value[0],
        label: {
          formatter: () => (markPointCount.value === 1 ? 'D' : `D${num}`),
          position: 'insideEndBottom',
        },
      }],
    });
    pointList.value.push({
      name: `${seriesName}_${value[0]}_${value[1]}`,
      x: value[0],
      y: value[1],
      disabled: false,
      checked: false,
    });
  } else {
    const { markPoint, markLine } = cursorData.value[index];
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
  cursorData.value = [];
  pointList.value = [];
  pointDvalueList.value = [];
  setOption(chartOptions.value);
}

const onResize = debounce(() => {
  if (chartContainer.value) {
    chartInstance?.resize();
  }
}, 50);

// 重置
function handleReset() {
  searchFormData.method = '';
  searchFormData.datetimerange = getOneIntervalNow(7) as [DateModelType, DateModelType];
}

// 查询
function handleSearch() {
  if (!canReadWriteSchemaData.value) return;
  const start = dayjs(searchFormData.datetimerange[0]).valueOf();
  const end = dayjs(searchFormData.datetimerange[1]).valueOf();
  // getHistoryTrend({
  //   paths: searchFormData.path,
  //   startTime: start,
  //   endTime: end,
  //   groupBy: searchFormData.unitInterval,
  //   aggregateFun: searchFormData.aggregation,
  // }).then((res) => {
  chartData.value = [];
  setOption(chartOptions.value, true);
  setOption({
    xAxis: {
      min: start,
      max: end,
    },
  });
  // });
}

function handleSql() {
  sqlVisible.value = true;
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    chartContainer.value = null;
    if (chartInstance) {
      chartInstance.clear();
      chartInstance.dispose();
    }
  });
  setOption(chartOptions.value);
});

onUnmounted(() => {
  chartContainer.value = null;
  if (chartInstance) {
    chartInstance.clear();
    chartInstance.dispose();
  }
});
</script>

<style lang="scss" scoped>
.data-spectrum-wrapper{
  border-radius: 6px;
  background: #FFF;
  box-sizing: border-box;
  padding: 26px 16px 16px 30px;
}

.search-form-wrapper{
  display: flex;

  :deep(.el-form) {
    flex: 1;
  }

  :deep(.el-form-item--default) {
    margin: 0 24px 0 0;
  }
}

.search-method-params-box{
  padding: 4px;
  border-radius: 2px;
  background: #F7F8FC;
  display: flex;
  align-items: center;

  .params-title{
    margin: 0 24px 0 12px;
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #495AD4;
  }
}

.chart-detail-wrapper{
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  min-height: 300px;
  overflow: hidden;
}

.chart-operate-box{
  font-size: 12px;
  font-weight: 400;
  line-height: 12px;
  color: #131926;
  display: flex;
  align-items: center;
  margin: 0 0 0 12px;

  span{
    margin: 0 4px 0 0;
  }
}

.path-list-wrapper{
  margin-left: 16px;
  background-color: #F7F8FC;
  border-radius: 2px;
  box-sizing: border-box;
  padding: 12px 12px 28px;
  position: relative;
  transition: all 0.3s ease;
}

.expand-icon{
  position: absolute;
  bottom: 0;
  left: 16px;
  cursor: pointer;
  color: #A0A3B8;

  &:hover{
    color: #495AD4;
  }

  &.collapse-icon{
    left: 0;
    transform: rotate(-180deg);
  }
}

.cursor-list-box{
  flex: 1;
  display: flex;
  flex-direction: column;

  .cursor-list-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
    margin: 0 0 6px;
  }

  .list-empty-wrapper{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .data-empty-img{
      width: 150px;
      height: 150px;
      margin-bottom: 16px;
    }

    .data-empty-text{
      font-size: 14px;
      color: #131926;
      line-height: 21px;
    }
  }

  .cursor-list-wrapper{
    display: flex;
    flex-direction: column;
    flex: 1;

    .cursor-list{
      flex: 1;
      overflow-y: auto;
    }
  }
}

.cursor-collapse-title{
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
  color: #495AD4;
  margin: 14px 5px 0;
}

.cursor-text-box{
  display: flex;
  align-items: center;
  margin: 0 0 4px 8px;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #131926;
}

.cursor-point-data{
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
  color: #131926;
}

.point-dvalue-box{
  border-top: 1px dashed #DFE1ED;
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
  color: #131926;
  padding: 4px 0 0;
  margin: 0 8px;
}
</style>
