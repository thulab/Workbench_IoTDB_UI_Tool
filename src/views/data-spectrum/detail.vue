<template>
  <el-container class="data-spectrum-wrapper">
    <el-header class="p-0" style="height: auto">
      <div class="search-form-wrapper" style="margin-bottom: 18px">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
          <div class="m-b-16 flex-align-center" style="height: 36px">
            <base-form-item :label="`${t('spectrum.analysisMethod')}：`" prop="method" :label-width="locale === 'en' ? '132px' : '88px'">
              <template #label>
                {{ t('spectrum.analysisMethod') }}：
                <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
                  <template #content>
                    <p style="color: #131926; font-weight: 300" v-html="t('spectrum.analysisMethodTip', { doc: methodDocLink })"></p>
                  </template>
                  <i-custom-question />
                </el-tooltip>
              </template>
              <el-select v-model="searchFormData.method" id="spectrum-search-method" style="width: 230px" :placeholder="t('spectrum.analysisMethodPlaceholder')">
                <el-option
                  v-for="item in methodOptions"
                  :key="item.functionName"
                  :label="item.name"
                  :value="item.functionName"
                  :id="`spectrum-search-method-${item.functionName}`"
                  :disabled="!item.enable"
                >
                  <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('spectrum.analysisMethodNoneTip')" popper-class="tooltip-box-width" :disabled="item.enable">
                    {{ item.name }}
                  </el-tooltip>
                </el-option>
              </el-select>
            </base-form-item>
            <div class="search-method-params-box" v-if="searchFormData.method && searchFormData.method !== 'custom'">
              <span class="params-title">{{ t('spectrum.paramsTitle') }}</span>
              <template v-if="searchFormData.method === 'FFT'">
                <base-form-item :label="`${t('spectrum.returnResult')}：`" prop="resultType">
                  <el-select v-model="searchFormData.resultType" style="width: 140px" id="spectrum-search-resultType">
                    <el-option v-for="item in resultList" :key="item.value" :label="item.name" :value="item.value" :id="`spectrum-search-resultType-${item.value}`" />
                  </el-select>
                </base-form-item>
                <base-form-item :label="`${t('spectrum.compressParams')}：`" prop="compression" class="m-r-0">
                  <template #label>
                    {{ t('spectrum.compressParams') }}：
                    <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width" :content="t('spectrum.compressParamsTip')"><i-custom-question /></el-tooltip>
                  </template>
                  <el-input
                    v-model="searchFormData.compression"
                    style="width: 190px"
                    :placeholder="t('spectrum.compressParamsPlaceholder')"
                    id="spectrum-search-compression"
                    @change="handleInputCompression"
                  />
                </base-form-item>
              </template>
              <template v-if="searchFormData.method === 'ENVELOPE'">
                <base-form-item :label="`${t('spectrum.modulationFrequency')}：`" prop="frequency">
                  <el-input v-model.number="searchFormData.frequency" style="width: 120px" id="spectrum-search-frequency" @change="handleInputFrequency" />
                </base-form-item>
                <base-form-item :label="`${t('spectrum.expandingFold')}：`" prop="amplification" class="m-r-0">
                  <el-input v-model.number="searchFormData.amplification" style="width: 120px" id="spectrum-search-expandingFold" @change="handleInputAmplification" />
                </base-form-item>
              </template>
            </div>
          </div>
          <div class="flex-justify-between">
            <div v-if="searchFormData.method !== 'custom'">
              <base-form-item :label="`${t('measurement.measurementChoose')}：`" prop="measurement" :label-width="locale === 'en' ? '132px' : '88px'">
                <timeseries-select-single id="spectrum-search-path" v-model="searchFormData.measurement" :selectWidth="230" :itemWidth="200" show-suffix :disabled-path="disabledPath" />
              </base-form-item>
              <base-form-item :label="`${t('common.datetimerange')}：`" prop="datetimerange">
                <el-date-picker
                  v-model="searchFormData.datetimerange"
                  type="datetimerange"
                  range-separator="～"
                  unlink-panels
                  :disabled-date="disabledDate"
                  :shortcuts="shortcutsDaterange"
                  :clearable="false"
                  :prefix-icon="ICustomCalender"
                  :default-time="[new Date(2024, 3, 28, 0, 0, 0), new Date(2024, 3, 28, 23, 59, 59)]"
                  id="spectrum-search-datetimerange"
                />
              </base-form-item>
            </div>
            <div v-if="searchFormData.method === 'custom'">
              <base-form-item :label="`${t('spectrum.sqlInput')}：`" prop="sql" :label-width="locale === 'en' ? '132px' : '88px'">
                <el-button type="primary" link id="spectrum-search-sql" style="text-decoration: underline" @click="handleSql">{{ t('search.sqlInput') }}</el-button>
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
        <el-main class="p-0" style="position: relative">
          <div ref="chartContainer" class="chart-container" :style="`height: ${'calc(100% - 28px);'}`" v-element-size="onResize"></div>
          <div class="flex-align-center">
            <el-button
              type="primary"
              :plain="clickedOperate !== 'cursor'"
              class="cursor-button"
              id="spectrum-cursor"
              style="height: 24px !important"
              :disabled="dataEmpty"
              :class="dataEmpty ? 'disable-cursor' : ''"
              @click="handleClickOperate('cursor')"
            >
              {{ t('spectrum.cursor') }}
            </el-button>
            <div class="chart-operate-box">
              <el-button
                type="primary"
                id="spectrum-harmonicFrequency"
                color="#00B3AA"
                :disabled="disableFrequency"
                :plain="clickedOperate !== 'frequency'"
                :class="disableFrequency ? 'disable-frequency' : ''"
                @click="handleClickOperate('frequency')"
              >
                {{ t('spectrum.harmonicFrequency') }}
              </el-button>
              <el-input-number
                v-model="harmonicFrequency"
                :min="1"
                :max="99"
                step-strictly
                id="spectrum-harmonicFrequency-input"
                :disabled="dataEmpty || drawedStatus.frequency"
                :controls="false"
                :value-on-clear="1"
              />
            </div>
            <div class="chart-operate-box">
              <el-button
                type="primary"
                :plain="clickedOperate !== 'sideband'"
                id="spectrum-sideband"
                color="#6738BD"
                :disabled="disableSideband"
                :class="disableSideband ? 'disable-sideband' : ''"
                @click="handleClickOperate('sideband')"
              >
                {{ t('spectrum.sideband') }}
              </el-button>
              <el-input-number v-model="sideband" :min="1" :max="99" step-strictly id="spectrum-sideband-input" :disabled="dataEmpty || drawedStatus.sideband" :controls="false" :value-on-clear="1" />
            </div>
            <el-button link :class="['cursor-button-clear', 'm-l-8', dataEmpty ? '' : 'svg-button-hover-color']" id="spectrum-cursor-clear" :disabled="dataEmpty" @click="() => handleEmptyOperate()">
              <el-icon size="18" color="#fff"><i-custom-delete /></el-icon>
            </el-button>
          </div>
        </el-main>
        <el-aside :width="isExpand ? '240px' : '24px'" :class="['path-list-wrapper', !isExpand ? 'p-0' : '']" style="display: flex; flex-direction: column">
          <div class="cursor-list-box" v-if="isExpand">
            <h4 class="cursor-list-title">{{ t('spectrum.cursorTitle') }}</h4>
            <auth-container :is-auth="canReadWriteSchemaData" style="flex: 1; background-color: #fff; overflow-y: hidden; display: flex; padding: 12px 0 10px">
              <div class="list-empty-wrapper" v-if="!pointList.length">
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
                        :id="`spectrum-cursor-checkbox-${index}`"
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
                  <p style="display: inline-flex; width: 190px"><text-tooltip :content="`Δf：${Math.abs(Number(pointCheckedData[0].y) - Number(pointCheckedData[1].y))}`" /></p>
                </div>
              </div>
            </auth-container>
          </div>
          <h4 v-if="!isExpand" class="cursor-collapse-title">{{ t('spectrum.cursorTitle') }}</h4>
          <el-icon :class="['expand-icon', !isExpand ? 'collapse-icon' : '']" size="24" @click="isExpand = !isExpand" id="spectrum-point-expand">
            <i-custom-arrow-right-expand />
          </el-icon>
        </el-aside>
      </el-container>
    </el-main>

    <modal-sql v-model:visible="sqlVisible" :sql-value="sqlValue" @handleConfirm="handleConfirmSql" />
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type { FormInstance, SingleOrRange, DateModelType, CheckboxValueType } from 'element-plus';
import dayjs from 'dayjs';
import { debounce, cloneDeep } from 'lodash-es';
import { vElementSize } from '@vueuse/components';
import { SearchApi } from '@/api';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import { getStartAndEnd, today, getOneInterval, getOneIntervalNow } from '@/utils/date';
import { useUserStore } from '@/stores';
import ICustomCalender from '~icons/custom/calender.svg';
import ModalSql from './components/modal-sql.vue';

interface SpectrumMarkPoint {
  name: string;
  value: number | string;
  xAxis: number;
  yAxis: number | string;
  itemStyle: {
    color: string;
    // eslint-disable-next-line no-nested-ternary
    borderColor: string;
    borderWidth: number;
  };
}

interface SpectrumMarkLine {
  name: string;
  xAxis: number;
  label: {
    formatter: string | Function;
    position: string;
    color: string;
  };
  lineStyle: {
    type: string | number[];
    color: string;
  };
}

interface PointData {
  name: string;
  x: number;
  y: number | string;
  disabled: boolean;
  checked: boolean;
}

const { t, locale } = useI18n();
const methodDocLink = computed(
  () =>
    `<a href="https://www.timecho.com/docs/zh/UserGuide/latest/User-Manual/Database-Programming.html#udtf-user-defined-timeseries-generating-function" target="_blank" rel="noopener noreferrer" style="color: #495ad4;"> ${t('common.userManual')}</a>`
);
const userStore = useUserStore();
const { canReadWriteSchemaData } = storeToRefs(userStore);
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;
const isExpand = ref(true);
const methodList = ref<Array<Search.FunctionData>>([]);
const searchFormRef = ref<FormInstance>();
const searchFormData = reactive<{
  measurement: string;
  method: string;
  resultType: string;
  compression: string | number | undefined;
  frequency: string | number | undefined;
  amplification: string | number | undefined;
  datetimerange: [DateModelType, DateModelType];
}>({
  measurement: '',
  method: '',
  resultType: 'abs',
  compression: '',
  frequency: '',
  amplification: 1,
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
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
const resultList = computed<Array<{ name: string; value: string }>>(() => [
  { name: t('spectrum.real'), value: 'real' },
  { name: t('spectrum.imag'), value: 'imag' },
  { name: t('spectrum.abs'), value: 'abs' },
  { name: t('spectrum.angle'), value: 'angle' },
]);
const chartData = reactive<Search.SpectrumData>({
  timestamps: [],
  values: [],
});
const clickedOperate = ref<'cursor' | 'frequency' | 'sideband' | ''>('');
const markPointCount = ref(0);
const markPointData = ref<Array<SpectrumMarkPoint>>([]);
const markLineData = ref<Array<SpectrumMarkLine>>([]);
const pointList = ref<Array<PointData>>([]);
const pointCheckedData = computed(() => pointList.value.filter((item) => item.checked));
const harmonicFrequency = ref<number | undefined>(1);
const frequencyInterval = ref<number | undefined>();
const sideband = ref<number | undefined>(1);
const sidebandData = ref<number[]>([]);
const sqlVisible = ref(false);
const sqlValue = ref('');
const clickedStatus = reactive({
  cursor: false,
  frequency: false,
  sideband: false,
});
const drawedStatus = reactive({
  frequency: false,
  sideband: false,
});
let currentPoint = 0;
const dataEmpty = computed(() => chartData.timestamps.length === 0);
const disableFrequency = computed(() => chartData.timestamps.length === 0 || drawedStatus.frequency);
const disableSideband = computed(() => chartData.timestamps.length === 0 || drawedStatus.sideband);

const xMax = computed(() => chartData.timestamps[chartData.timestamps.length - 1]);

const methodOptions = computed(() => [...methodList.value, { functionName: 'custom', name: t('spectrum.customAnalysis'), enable: true }]);

function disabledPath(item: StorageDevice.MeasurementDataItem) {
  return item.dataType === 'BOOLEAN' || item.dataType === 'TEXT';
}

const seriesData = computed<ECOption>(
  () =>
    ({
      series: [
        {
          type: 'line',
          symbol: 'circle',
          showSymbol: false,
          showAllSymbol: 'auto',
          connectNulls: false,
          symbolSize: 4,
          name: copySearchFormData.measurement,
          data: chartData.values.map((dataItem, index) => [chartData.timestamps[index], dataItem]),
          markPoint: {
            silent: true,
            symbol: 'rect',
            symbolSize: 8,
            label: {
              show: false,
            },
            data: markPointData.value.length ? markPointData.value : [],
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: markLineData.value.length ? markLineData.value : [],
            animation: false,
          },
          lineStyle: {
            width: 2,
            color: '#4992ff',
          },
          itemStyle: {
            color: '#4992ff',
          },
        },
      ],
    }) as unknown as ECOption
);

const chartOptions = computed<ECOption>(() => ({
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
    type: 'value',
    boundaryGap: false,
    show: !dataEmpty.value,
    splitLine: {
      show: false,
    },
    min: 0,
    max: xMax.value,
  },
  yAxis: {
    type: 'value',
    show: !dataEmpty.value,
  },
  animation: true,
  series: seriesData.value.series,
}));

const { requestFn: getUDFFunction } = useRequest(SearchApi.getUDFFunction);
const { requestFn: getFFTData } = useRequest(SearchApi.getFFTData);
const { requestFn: getEnvelopeDemodulationData } = useRequest(SearchApi.getEnvelopeDemodulationData);
const { requestFn: getCustomData } = useRequest(SearchApi.getCustomData);

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

function handleInputCompression(val: string) {
  if (val) {
    if (!/^[1]$|^0.\d+$/.test(`${val}`)) {
      searchFormData.compression = undefined;
    }
  } else {
    searchFormData.compression = undefined;
  }
}

function handleInputFrequency(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      searchFormData.frequency = undefined;
    }
  } else {
    searchFormData.frequency = undefined;
  }
}

function handleInputAmplification(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      searchFormData.amplification = undefined;
    }
  } else {
    searchFormData.amplification = undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleInputHarmonicFrequency(val: string) {
  if (val && !/^\+?[1-9][0-9]{0,1}$/.test(`${val}`)) {
    harmonicFrequency.value = 1;
  } else if (`${val}` === '0') {
    harmonicFrequency.value = 1;
  } else if (`${val}` === '0') {
    harmonicFrequency.value = 1;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleInputSideband(val: string) {
  if (val && !/^\+?[1-9][0-9]{0,1}$/.test(`${val}`)) {
    sideband.value = 1;
  } else if (`${val}` === '0') {
    sideband.value = 1;
  } else if (`${val}` === '0') {
    sideband.value = 1;
  }
}

const setOption = (option: ECOption, noMerge: boolean = false) => {
  if (chartInstance) {
    // 实例存在直接设置
    chartInstance.setOption(option, noMerge);
  } else if (chartContainer.value && chartContainer.value.clientHeight) {
    // 实例不存在，容器存在，容器高度存在
    chartInstance = echarts.init(chartContainer.value, 'dark', {
      // useCoarsePointer: true,
    });
    // 若存在click事件，执行
    chartInstance.on('click', (params) => {
      if (!clickedOperate.value) return;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleClickChart(params);
    });
    chartInstance.on('highlight', (params: any) => {
      if (params.batch && params.batch.length > 0) currentPoint = params?.batch[0].dataIndex;
    });
    // 若存在restore事件，执行
    chartInstance.on('restore', () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleEmptyOperate();
    });
    chartInstance.getZr().on('click', (params) => {
      if (!clickedOperate.value) return;
      if (params.topTarget?.type !== 'Line') return;
      if (currentPoint && chartData.timestamps[currentPoint]) {
        const point = [chartData.timestamps[currentPoint], chartData.values[currentPoint]];
        const param = { componentType: 'series', seriesName: copySearchFormData.measurement, value: point };
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        handleClickChart(param as echarts.ECElementEvent);
      }
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

function handleDealCursor(params: echarts.ECElementEvent) {
  const { seriesName, value } = params as { seriesName: string; value: number[] };
  if (markPointCount.value > 9) {
    ElMessage.warning({
      message: t('spectrum.overTip'),
      grouping: true,
    });
    return;
  }
  const pointIndex = markPointData.value.findIndex((point) => point.name === `${seriesName}_${value[0]}_${value[1]}`);
  if (pointIndex !== -1) return;

  markPointCount.value++;
  const num = markPointCount.value;
  markPointData.value.push({
    name: `${seriesName}_${value[0]}_${value[1]}`,
    value: value[1],
    xAxis: value[0],
    yAxis: value[1],
    itemStyle: {
      color: 'transparent',
      borderColor: '#fff',
      borderWidth: 1,
    },
  });
  pointList.value.push({
    name: `${seriesName}_${value[0]}_${value[1]}`,
    x: value[0],
    y: value[1],
    disabled: false,
    checked: false,
  });
  markLineData.value.push({
    name: `${seriesName}_${value[0]}`,
    xAxis: value[0],
    label: {
      formatter: () => (markPointCount.value === 1 ? 'D' : `D${num}`),
      position: 'insideEndBottom',
      color: '#fff',
    },
    lineStyle: {
      type: [16, 10],
      color: '#DFE1ED',
    },
  });
  setOption(chartOptions.value);
}

function handleDealFrequency(params: echarts.ECElementEvent) {
  const { seriesName, value } = params as { seriesName: string; value: number[] };
  frequencyInterval.value = value[0] as number;
  if (!frequencyInterval.value) return;
  drawedStatus.frequency = true;
  for (let i = 1; i <= harmonicFrequency.value!; i++) {
    if (i * frequencyInterval.value <= xMax.value) {
      const x = i * frequencyInterval.value;
      let y = '';
      const index = chartData.timestamps.findIndex((num) => num === x);
      if (index !== -1) {
        y = chartData.values[index];
      }
      markPointData.value.push({
        name: `${seriesName}_${x}_${y}_frequency`,
        value: y,
        xAxis: x,
        yAxis: y,
        itemStyle: {
          color: 'transparent',
          borderColor: '#28D5CB',
          borderWidth: 1,
        },
      });
      markLineData.value.push({
        name: `${seriesName}_${x}_frequency`,
        xAxis: x,
        label: {
          formatter: `H${i === 1 ? '' : i}`,
          position: 'insideEndBottom',
          color: '#28D5CB',
        },
        lineStyle: {
          type: 'solid',
          color: '#28D5CB',
        },
      });
    }
  }
  setOption(chartOptions.value);
}

function handleDealSideband(params: echarts.ECElementEvent) {
  const { seriesName, value } = params as { seriesName: string; value: number[] };
  if (sidebandData.value.includes(value[0])) return;
  sidebandData.value.push(value[0]);
  drawedStatus.sideband = true;
  if (sidebandData.value.length === 2) {
    const interval = Math.abs(sidebandData.value[0] - sidebandData.value[1]);
    // 左侧
    for (let i = 1; i <= sideband.value!; i++) {
      if (sidebandData.value[0] - i * interval > 0) {
        const leftX = sidebandData.value[0] - i * interval;
        let leftY = '';
        const leftI = chartData.timestamps.findIndex((num) => num === leftX);
        if (leftI !== -1) {
          leftY = chartData.values[leftI];
        }
        markPointData.value.push({
          name: `${seriesName}_${leftX}_${leftY}_sideband`,
          value: leftY,
          xAxis: leftX,
          yAxis: leftY,
          itemStyle: {
            color: 'transparent',
            borderColor: '#AA82F5',
            borderWidth: 1,
          },
        });
        markLineData.value.push({
          name: `${seriesName}_${leftX}_sideband`,
          xAxis: leftX,
          label: {
            formatter: `SL${i}`,
            position: 'insideEndBottom',
            color: '#AA82F5',
          },
          lineStyle: {
            type: 'solid',
            color: '#AA82F5',
          },
        });
      }
    }
    // 当前
    const currentX = sidebandData.value[0];
    let currentY = '';
    const currentI = chartData.timestamps.findIndex((num) => num === currentX);
    if (currentI !== -1) {
      currentY = chartData.values[currentI];
    }
    markPointData.value.push({
      name: `${seriesName}_${currentX}_${currentY}_sideband`,
      value: currentY,
      xAxis: currentX,
      yAxis: currentY,
      itemStyle: {
        color: 'transparent',
        borderColor: '#AA82F5',
        borderWidth: 1,
      },
    });
    markLineData.value.push({
      name: `${seriesName}_${currentX}_sideband`,
      xAxis: currentX,
      label: {
        formatter: 'S',
        position: 'insideEndBottom',
        color: '#AA82F5',
      },
      lineStyle: {
        type: 'solid',
        color: '#AA82F5',
      },
    });
    // 右侧
    for (let i = 1; i <= sideband.value!; i++) {
      if (sidebandData.value[0] + i * interval <= xMax.value) {
        const rightX = sidebandData.value[0] + i * interval;
        let rightY = '';
        const rightI = chartData.timestamps.findIndex((num) => num === rightX);
        if (rightI !== -1) {
          rightY = chartData.values[rightI];
        }
        markPointData.value.push({
          name: `${seriesName}_${rightX}_${rightY}_sideband`,
          value: rightY,
          xAxis: rightX,
          yAxis: rightY,
          itemStyle: {
            color: 'transparent',
            borderColor: '#AA82F5',
            borderWidth: 1,
          },
        });
        markLineData.value.push({
          name: `${seriesName}_${rightX}_sideband`,
          xAxis: rightX,
          label: {
            formatter: `SR${i}`,
            position: 'insideEndBottom',
            color: '#AA82F5',
          },
          lineStyle: {
            type: 'solid',
            color: '#AA82F5',
          },
        });
      }
    }
    setOption(chartOptions.value);
  }
}

function handleClickChart(params: echarts.ECElementEvent) {
  if (params.componentType !== 'series') return;
  if (clickedOperate.value === 'cursor') {
    clickedStatus.cursor = true;
    handleDealCursor(params);
  } else if (clickedOperate.value === 'frequency') {
    if (!harmonicFrequency.value) return;
    clickedStatus.frequency = true;
    if (frequencyInterval.value) return;
    handleDealFrequency(params);
  } else {
    if (!sideband.value) return;
    clickedStatus.sideband = true;
    if (sidebandData.value.length === 2) return;
    handleDealSideband(params);
  }
}

function handleCheckDvalue(val: CheckboxValueType, data: PointData) {
  data.checked = val as boolean;
}

function handleEmptyOperate(type?: 'cursor' | 'frequency' | 'sideband') {
  clickedOperate.value = type || '';
  markPointCount.value = 0;
  pointList.value = [];
  markPointData.value = [];
  markLineData.value = [];
  clickedStatus.cursor = false;
  clickedStatus.frequency = false;
  clickedStatus.sideband = false;
  drawedStatus.frequency = false;
  drawedStatus.sideband = false;
  harmonicFrequency.value = 1;
  sideband.value = 1;
  frequencyInterval.value = undefined;
  sidebandData.value = [];
  setOption(chartOptions.value);
}

function handleClickOperate(type: 'cursor' | 'frequency' | 'sideband') {
  if (clickedOperate.value === type) return;
  clickedOperate.value = type;
  clickedStatus[type] = true;
}

const onResize = debounce(() => {
  if (chartContainer.value) {
    chartInstance?.resize();
  }
}, 50);

function getUdfList() {
  getUDFFunction().then((res) => {
    const data = res.data || [];
    methodList.value = data.filter((item) => item.functionName !== 'ENVELOPE');
  });
}

// 重置
function handleReset() {
  searchFormData.measurement = '';
  searchFormData.method = '';
  searchFormData.resultType = 'abs';
  searchFormData.compression = '';
  searchFormData.frequency = '';
  searchFormData.amplification = 1;
  sqlValue.value = '';
  searchFormData.datetimerange = getOneIntervalNow(7) as [DateModelType, DateModelType];
}

function getFFT() {
  const start = dayjs(copySearchFormData.datetimerange[0]).valueOf();
  const end = dayjs(copySearchFormData.datetimerange[1]).valueOf();
  getFFTData({
    resultType: copySearchFormData.resultType,
    compression: copySearchFormData.compression!,
    measurement: copySearchFormData.measurement,
    startTime: start,
    endTime: end,
  })
    .then((res) => {
      chartData.timestamps = res.data.timestamps || [];
      chartData.values = res.data.values || [];
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      setOption(chartOptions.value, true);
    });
}

function getEnvelope() {
  const start = dayjs(copySearchFormData.datetimerange[0]).valueOf();
  const end = dayjs(copySearchFormData.datetimerange[1]).valueOf();
  getEnvelopeDemodulationData({
    frequency: copySearchFormData.frequency || '',
    amplification: copySearchFormData.amplification || '',
    measurement: copySearchFormData.measurement,
    startTime: start,
    endTime: end,
  })
    .then((res) => {
      chartData.timestamps = res.data.timestamps || [];
      chartData.values = res.data.values || [];
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      setOption(chartOptions.value, true);
    });
}

function getCustom() {
  getCustomData(sqlValue.value)
    .then((res) => {
      chartData.timestamps = res.data.timestamps || [];
      chartData.values = res.data.values || [];
      setOption(chartOptions.value, true);
    })
    .catch(() => {
      chartData.timestamps = [];
      chartData.values = [];
      setOption(chartOptions.value, true);
    });
}

// 查询
function handleSearch() {
  if (!canReadWriteSchemaData.value) return;
  copySearchFormData = cloneDeep(searchFormData);
  handleEmptyOperate();
  if (!copySearchFormData.method) {
    ElMessage.warning({
      message: t('common.searchFormEmpty'),
      grouping: true,
    });
    return;
  }
  if (copySearchFormData.method === 'ENVELOPE') {
    if (!copySearchFormData.measurement) {
      ElMessage.warning({
        message: t('common.searchFormEmpty'),
        grouping: true,
      });
      return;
    }
    getEnvelope();
  } else if (copySearchFormData.method === 'custom') {
    if (!sqlValue.value) {
      ElMessage.warning({
        message: t('common.searchFormEmpty'),
        grouping: true,
      });
      return;
    }
    getCustom();
  } else {
    if (!copySearchFormData.measurement) {
      ElMessage.warning({
        message: t('common.searchFormEmpty'),
        grouping: true,
      });
      return;
    }
    getFFT();
  }
}

function handleSql() {
  sqlVisible.value = true;
}

function handleConfirmSql(val: string) {
  sqlValue.value = val;
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    chartContainer.value = null;
    if (chartInstance) {
      chartInstance.clear();
      chartInstance.dispose();
    }
  });
  getUdfList();
  setOption(chartOptions.value);
});

onUnmounted(() => {
  chartContainer.value = null;
  if (chartInstance) {
    chartInstance.clear();
    chartInstance.dispose();
  }
});

watch(locale, () => {
  nextTick(() => {
    getUdfList();
  });
});
</script>

<style lang="scss" scoped>
.data-spectrum-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 16px 16px 30px;
}

.search-form-wrapper {
  display: flex;

  :deep(.el-form) {
    flex: 1;
  }

  :deep(.el-form-item--default) {
    margin: 0 24px 0 0;
  }
}

.search-method-params-box {
  padding: 4px;
  border-radius: 2px;
  background: #f7f8fc;
  display: flex;
  align-items: center;

  .params-title {
    margin: 0 24px 0 12px;
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #495ad4;
  }
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
  color: #656a85 !important;
  background-color: #f0f1fa !important;
}

.chart-operate-box {
  font-size: 12px;
  font-weight: 400;
  line-height: 12px;
  color: #131926;
  display: flex;
  align-items: center;
  margin: 0 0 0 12px;
  border: 1px solid #dfe1ed;
  height: 24px;
  box-sizing: border-box;

  .el-button {
    padding: 0 6px !important;
    min-width: 40px;
    height: 22px !important;
    border-radius: 0;
    border: none;
  }

  .el-input-number {
    width: 38px;
    height: 22px;

    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      border-radius: 0;
      padding-left: 2px;
      padding-right: 2px;

      &:focus-visible,
      &:hover {
        box-shadow: none !important;
      }
    }

    :deep(.el-input__wrapper.is-focus) {
      box-shadow: none !important;
    }
  }

  :deep(.el-input.is-disabled .el-input__wrapper) {
    background-color: #fff;
  }

  .disable-frequency {
    background: #f0f1fa;
    color: #00b3aa;
  }

  .enable-frequency {
    background-color: #00b3aa !important;
    color: #fff !important;
  }

  .disable-sideband {
    background: #f0f1fa;
    color: #6738bd;
  }

  .enable-sideband {
    background-color: #6738bd !important;
    color: #fff !important;
  }
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

.expand-icon {
  position: absolute;
  bottom: 0;
  left: 16px;
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

.cursor-list-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;

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
      width: 80px;
      height: 80px;
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

.cursor-collapse-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
  color: #495ad4;
  margin: 14px 5px 0;
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
