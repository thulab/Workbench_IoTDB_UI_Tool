<template>
  <el-container class="data-spectrum-wrapper">
    <el-header class="p-0" style="height: auto">
      <div class="search-form-box" style="margin-bottom: 18px">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
          <div class="m-b-16 flex-align-center" style="height: 36px">
            <base-form-item :label="`${t('spectrum.analysisMethod')}：`" prop="method" :label-width="locale === 'en' ? '140px' : '96px'" :rules="requiredRules">
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
                  <el-select v-model="searchFormData.resultType" style="width: 80px" id="spectrum-search-resultType">
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
                    style="width: 120px"
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
              <base-form-item prop="measurement" :label-width="locale === 'en' ? '140px' : '96px'" :rules="requiredRules">
                <template #label>
                  {{ t('measurement.measurementChoose') }}：
                  <el-tooltip effect="light" :content="t('common.searchTipLimit100')" placement="top" popper-class="tooltip-box-width">
                    <i-custom-question />
                  </el-tooltip>
                </template>
                <timeseries-select-single id="spectrum-search-path" v-model="searchFormData.measurement" :selectWidth="230" :itemWidth="200" show-suffix :disabled-path="disabledPath" />
              </base-form-item>
              <base-form-item :label="`${t('common.datetimerange')}：`" prop="datetimerange" :rules="requiredRules">
                <el-date-picker
                  v-model="searchFormData.datetimerange"
                  type="datetimerange"
                  range-separator="-"
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
              <base-form-item :label="`${t('spectrum.sqlInput')}：`" prop="sql" :label-width="locale === 'en' ? '140px' : '96px'" class="el-form-item-not-mandatory">
                <el-button type="primary" link id="spectrum-search-sql" style="text-decoration: underline" @click="handleSql">{{ t('search.sqlInput') }}</el-button>
              </base-form-item>
            </div>
            <div class="search-form-buttons">
              <el-button @click="handleReset" id="spectrum-search-reset">{{ t('common.reset') }}</el-button>
              <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
                <el-button type="primary" :disabled="!canReadWriteData" @click="handleSearch()" id="spectrum-search-search">{{ t('common.apply') }}</el-button>
              </auth-tooltip>
            </div>
          </div>
        </el-form>
      </div>
    </el-header>
    <el-main class="p-0">
      <el-container class="chart-detail-wrapper">
        <el-main class="p-0" style="position: relative">
          <div ref="chartContainer" class="chart-container" :style="`height: ${'calc(100% - 30px);'}`" v-element-size="onResize"></div>
          <div class="flex-align-center" style="margin-top: 2px">
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
            <el-tooltip effect="light" :content="t('common.clearAll')" placement="top" popper-class="tooltip-box-width">
              <el-button link :class="['cursor-button-clear', 'm-l-8', dataEmpty ? '' : 'svg-button-hover-color']" id="spectrum-cursor-clear" :disabled="dataEmpty" @click="() => handleEmptyOperate()">
                <el-icon size="18" color="#fff"><i-custom-delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </el-main>
        <el-aside :width="isExpand ? '240px' : '24px'" :class="['path-list-wrapper', !isExpand ? 'p-0' : '']" style="display: flex; flex-direction: column">
          <div class="cursor-list-box" v-if="isExpand">
            <h4 class="cursor-list-title">{{ t('spectrum.cursorTitle') }}</h4>
            <div style="flex: 1; background-color: #fff; overflow-y: hidden; display: flex; padding: 12px 0 10px">
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
                    <div class="cursor-point-data">
                      <p style="display: inline-flex; width: 140px"><text-tooltip :content="`X: ${item.x}`" /></p>
                      <p style="display: inline-flex; width: 140px"><text-tooltip :content="`Y: ${item.y}`" /></p>
                    </div>
                    <el-icon size="14" class="delete-icon" @click="handleDelPoint(item, index)" :id="`cursor-${index}-del`"><i-custom-close-circle /></el-icon>
                  </li>
                </ul>
                <div v-if="pointCheckedData.length === 2" class="point-dvalue-box">
                  <p style="display: inline-flex; width: 190px"><text-tooltip :content="`ΔX：${Math.abs(pointCheckedData[0].x - pointCheckedData[1].x)}`" /></p>
                  <p style="display: inline-flex; width: 190px"><text-tooltip :content="`ΔY：${Math.abs(Number(pointCheckedData[0].y) - Number(pointCheckedData[1].y))}`" /></p>
                </div>
              </div>
            </div>
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

interface PointData {
  name: string;
  x: number;
  y: number | string;
  disabled: boolean;
  checked: boolean;
}

interface MarkPointLine {
  path: string;
  type: string;
  name: string;
  value: number;
  xAxis: number;
  yAxis: number;
  itemStyle: {
    color: string;
    // eslint-disable-next-line no-nested-ternary
    borderColor: string;
    borderWidth: number;
  };
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

const { t, locale } = useI18n();
const methodDocLink = computed(
  () =>
    `<a href="https://www.timecho.com/docs/zh/UserGuide/latest/User-Manual/Database-Programming.html#udtf-user-defined-timeseries-generating-function" target="_blank" rel="noopener noreferrer" style="color: #495ad4;"> ${t('common.userManual')}</a>`
);
const userStore = useUserStore();
const { canReadWriteData } = storeToRefs(userStore);
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
const pointLineData = ref<Array<MarkPointLine>>([]);
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
const requiredRules = ref([
  {
    required: true,
    message: '',
    trigger: ['change'],
  },
]);
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
            animation: false,
            data: pointLineData.value.length
              ? pointLineData.value.map((point) => ({ path: point.path, name: point.name, value: point.value, xAxis: point.xAxis, yAxis: point.yAxis, itemStyle: point.itemStyle, type: point.type }))
              : [],
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: pointLineData.value.length
              ? pointLineData.value.map((line) => ({ path: line.path, name: line.name, xAxis: line.xAxis, label: line.label, lineStyle: line.lineStyle, type: line.type }))
              : [],
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
    scale: true,
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
    // eslint-disable-next-line no-dupe-else-if
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
    // eslint-disable-next-line no-dupe-else-if
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
      // handleEmptyOperate();
      setOption(chartOptions.value);
    });
    chartInstance.getZr().on('click', (params) => {
      if (!clickedOperate.value) return;
      if (params.target && !params.topTarget) {
        return;
      }
      // 点击到点上
      if ((params.target as unknown as any)?.z === 3 || (params.target as unknown as any)?.z === 5) {
        return;
      }
      if (params.topTarget && params.topTarget.type !== 'Line') return;
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
  // eslint-disable-next-line prefer-const
  const { seriesName, value, componentType } = params as { seriesName: string; value: number[] | number; componentType: string };
  let index = -1;
  // let pointName = '';
  if (componentType === 'series') {
    index = pointLineData.value.findIndex((data) => data.path === seriesName && data.xAxis === (value as number[])[0] && data.type === 'cursor');
    // pointName = `${seriesName}_${(value as number[])[0]}`;
  } else if (componentType === 'markPoint') {
    index = pointLineData.value.findIndex((data) => data.path === (params.data as unknown as any).path && data.value === value && data.type === 'cursor');
    // pointName = `${(params.data as unknown as any).path}_${value}`;
  } else {
    // 'markLine'
    index = pointLineData.value.findIndex((data) => data.path === (params.data as unknown as any).path && data.xAxis === value && data.type === 'cursor');
    // pointName = `${(params.data as unknown as any).path}_${value}`;
  }

  if (index !== -1) {
    // markPointCount.value--;
    // pointLineData.value.splice(index, 1);
    // pointLineData.value
    //   .filter((f) => f.type === 'cursor')
    //   .forEach((item, i) => {
    //     if (i >= index) {
    //       item.label = {
    //         formatter: () => (markPointCount.value === 1 ? 'D' : `D${i + 1}`),
    //         position: 'end',
    //         color: '#fff',
    //       };
    //     }
    //   });
    // const pointIndex = pointList.value.findIndex((point) => point.name === pointName);
    // if (pointIndex !== -1) {
    //   pointList.value.splice(pointIndex, 1);
    // }
    // setOption(chartOptions.value);
    return;
  }
  if (markPointCount.value > 9) {
    ElMessage.warning({
      message: t('spectrum.overTip'),
      grouping: true,
    });
    return;
  }
  markPointCount.value++;
  const num = markPointCount.value;
  pointLineData.value.push({
    path: seriesName,
    type: 'cursor',
    name: `${seriesName}_${(value as number[])[0]}_point_line`,
    value: (value as number[])[1],
    xAxis: (value as number[])[0],
    yAxis: (value as number[])[1],
    itemStyle: {
      color: 'transparent',
      borderColor: '#fff',
      borderWidth: 1,
    },
    label: {
      formatter: () => (markPointCount.value === 1 ? 'D' : `D${num}`),
      position: 'end',
      color: '#fff',
    },
    lineStyle: {
      type: [16, 10],
      color: '#DFE1ED',
    },
  });
  pointList.value.push({
    name: `${seriesName}_${(value as number[])[0]}`,
    x: (value as number[])[0],
    y: (value as number[])[1],
    disabled: false,
    checked: false,
  });
  setOption(chartOptions.value);
}

function handleDelPoint(data: PointData, index: number) {
  pointList.value.splice(index, 1);
  markPointCount.value--;
  const pointIndex = pointLineData.value.findIndex((point) => point.name === `${data.name}_point_line` && point.type === 'cursor');
  if (pointIndex !== -1) {
    pointLineData.value.splice(pointIndex, 1);
  }
  pointLineData.value
    .filter((f) => f.type === 'cursor')
    .forEach((item, i) => {
      if (i >= index) {
        item.label = {
          formatter: () => (markPointCount.value === 1 ? 'D' : `D${i + 1}`),
          position: 'end',
          color: '#fff',
        };
      }
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
      pointLineData.value.push({
        path: seriesName,
        type: 'frequency',
        name: `${seriesName}_${x}_frequency`,
        value: y as unknown as number,
        xAxis: x,
        yAxis: y as unknown as number,
        itemStyle: {
          color: 'transparent',
          borderColor: '#28D5CB',
          borderWidth: 1,
        },
        label: {
          formatter: `H${i === 1 ? '' : i}`,
          position: 'end',
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
        pointLineData.value.push({
          path: seriesName,
          type: 'sideband',
          name: `${seriesName}_${leftX}_sideband`,
          value: leftY as unknown as number,
          xAxis: leftX,
          yAxis: leftY as unknown as number,
          itemStyle: {
            color: 'transparent',
            borderColor: '#AA82F5',
            borderWidth: 1,
          },
          label: {
            formatter: `SL${i}`,
            position: 'end',
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
    pointLineData.value.push({
      path: seriesName,
      type: 'sideband',
      name: `${seriesName}_${currentX}_sideband`,
      value: currentY as unknown as number,
      xAxis: currentX,
      yAxis: currentY as unknown as number,
      itemStyle: {
        color: 'transparent',
        borderColor: '#AA82F5',
        borderWidth: 1,
      },
      label: {
        formatter: 'S',
        position: 'end',
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
        pointLineData.value.push({
          path: seriesName,
          type: 'sideband',
          name: `${seriesName}_${rightX}_sideband`,
          value: rightY as unknown as number,
          xAxis: rightX,
          yAxis: rightY as unknown as number,
          itemStyle: {
            color: 'transparent',
            borderColor: '#AA82F5',
            borderWidth: 1,
          },
          label: {
            formatter: `SR${i}`,
            position: 'end',
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
  if (clickedOperate.value === 'cursor') {
    if (params.componentType !== 'series' && params.componentType !== 'markLine' && params.componentType !== 'markPoint') return;
    clickedStatus.cursor = true;
    handleDealCursor(params);
  } else if (clickedOperate.value === 'frequency') {
    if (params.componentType !== 'series') return;
    if (!harmonicFrequency.value) return;
    clickedStatus.frequency = true;
    if (frequencyInterval.value) return;
    handleDealFrequency(params);
  } else {
    if (params.componentType !== 'series') return;
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
  pointLineData.value = [];
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
  if (clickedOperate.value === type) {
    clickedOperate.value = '';
    clickedStatus[type] = false;
    return;
  }
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
function handleSearch(unforce?: boolean) {
  if (!canReadWriteData.value) return;
  copySearchFormData = cloneDeep(searchFormData);
  if (!unforce) {
    handleEmptyOperate();
  }
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

function setStorage() {
  sessionStorage.setItem(
    'dataSpectrumStorage',
    JSON.stringify({
      ...copySearchFormData,
      clickedOperate: clickedOperate.value,
      markPointCount: markPointCount.value,
      pointLineData: pointLineData.value,
      pointList: pointList.value,
      harmonicFrequency: harmonicFrequency.value,
      frequencyInterval: frequencyInterval.value,
      sideband: sideband.value,
      sidebandData: sidebandData.value,
      sqlValue: sqlValue.value,
      clickedStatus: { ...clickedStatus },
      drawedStatus: { ...drawedStatus },
      currentPoint,
    })
  );
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    setStorage();
    chartContainer.value = null;
    if (chartInstance) {
      chartInstance.clear();
      chartInstance.dispose();
    }
  });
  getUdfList();
});

onBeforeUnmount(() => {
  setStorage();
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

watch(
  () => canReadWriteData.value,
  (val) => {
    setOption(chartOptions.value);
    if (val) {
      if (sessionStorage.getItem('dataSpectrumStorage')) {
        const storageData = JSON.parse(sessionStorage.getItem('dataSpectrumStorage') as string);
        searchFormData.measurement = storageData.measurement;
        if (searchFormData.measurement) {
          searchFormData.method = storageData.method;
          searchFormData.resultType = storageData.resultType;
          searchFormData.compression = storageData.compression;
          searchFormData.frequency = storageData.frequency;
          searchFormData.amplification = storageData.amplification;
          searchFormData.datetimerange = storageData.datetimerange;
          markPointCount.value = storageData.markPointCount;
          const cursorData = storageData.pointLineData
            .filter((f: MarkPointLine) => f.type === 'cursor')
            .map((item: MarkPointLine, index: number) => {
              return {
                ...item,
                label: {
                  formatter: () => (markPointCount.value === 1 ? 'D' : `D${index + 1}`),
                  position: 'end',
                  color: '#fff',
                },
              };
            });
          const otherData = storageData.pointLineData.filter((f: MarkPointLine) => f.type !== 'cursor');
          pointLineData.value = [...cursorData, ...otherData];
          pointList.value = storageData.pointList;
          harmonicFrequency.value = storageData.harmonicFrequency;
          frequencyInterval.value = storageData.frequencyInterval;
          sqlValue.value = storageData.sqlValue;
          sideband.value = storageData.sideband;
          clickedStatus.cursor = false;
          clickedStatus.frequency = storageData.clickedStatus.frequency;
          drawedStatus.frequency = storageData.drawedStatus.frequency;
          clickedOperate.value = '';
          if (storageData.sidebandData.length < 2) {
            clickedStatus.sideband = false;
            drawedStatus.sideband = false;
            sidebandData.value = [];
          } else {
            clickedStatus.sideband = storageData.clickedStatus.sideband;
            drawedStatus.sideband = storageData.drawedStatus.sideband;
            sidebandData.value = storageData.sidebandData;
          }
          currentPoint = storageData.currentPoint;
          handleSearch(true);
        }
      }
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.data-spectrum-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 16px 16px 30px;
}

.search-form-box {
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
  color: #495ad4 !important;
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
    background: #f0f1fa !important;
    color: #00b3aa !important;
  }

  .enable-frequency {
    background-color: #00b3aa !important;
    color: #fff !important;
  }

  .disable-sideband {
    background: #f0f1fa !important;
    color: #6738bd !important;
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

.cursor-item-box {
  display: flex;
  align-items: flex-start;
  position: relative;

  .delete-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 4px;
    display: none;
    cursor: pointer;
  }

  &:hover .delete-icon {
    display: block;
  }
}

.cursor-text-box {
  display: flex;
  align-items: center;
  margin: 0 0 4px 8px;
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
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
