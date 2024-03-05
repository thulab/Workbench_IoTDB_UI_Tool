<template>
  <el-container class="data-spectrum-wrapper">
    <el-header class="p-0" style="height: auto;">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" label-width="88px" size="default" style="flex: 1" inline class="m-b-22">
          <el-row>
            <base-form-item :label="`${t('spectrum.analysisMethod')}：`" prop="unitInterval">
              <el-select v-model="searchFormData.unitInterval" style="width: 80px;" id="spectrum-search-unitInterval">
                <el-option v-for="item in analysisMethodList" :key="item.value" :value="item.value" :label="item.label" :id="`spectrum-search-unitInterval-select-${item.value}`" />
              </el-select>
            </base-form-item>
          </el-row>
          <el-row class="flex-justify-between">
            <div>
              <base-form-item :label="`${t('measurement.measurementChoose')}：`" prop="unitInterval">
                <timeseries-select-single
                  v-model="searchFormData.unitInterval"
                  :selectWidth="235"
                  :itemWidth="200"
                  id="spectrum-search-path"
                  :disabled-path="disabledPath"
                />
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
                  id="spectrum-search-datetimerange"
                />
              </base-form-item>
            </div>
            <el-form-item class="search-form-buttons">
              <el-button @click="handleReset" id="spectrum-search-reset">{{ t('common.reset') }}</el-button>
              <el-button type="primary" @click="handleSearch" id="spectrum-search-search">{{ t('common.query') }}</el-button>
            </el-form-item>
          </el-row>
        </el-form>
      </div>
    </el-header>
    <el-main class="p-0">
      <el-container class="chart-detail-wrapper">
        <el-main class="p-0">
          <div ref="chartContainer" class="chart-container" v-element-size="onResize"></div>
        </el-main>
        <el-aside :width="isExpand ? '240px' : '24px'" :class="['cursor-list-wrapper', !isExpand ? 'p-0' : '']" />
      </el-container>
    </el-main>

  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import dayjs from 'dayjs';
import { debounce } from 'lodash-es';
import { vElementSize } from '@vueuse/components';
import { SearchApi } from '@/api';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';

const { t } = useI18n();
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;
const isExpand = ref(true);
const searchFormRef = ref<FormInstance>();
const searchFormData = reactive({
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  unitInterval: 'auto',
  aggregation: 'last_value',
});
const analysisMethodList = ref<Array<{ label: string, value: string }>>([]);
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
let inited = false;
const pathList = ref<Trend.LineObj[]>([]);
const chartData = ref<Search.TrendData[]>([]);

const legendSelected = computed(() => ({
  show: false,
  selected: pathList.value.reduce((pre, cur) => {
    pre[cur.path] = cur.checked || false;
    return pre;
  }, {} as Record<string, boolean>),
}));

const seriesData = computed<ECOption>(() => ({
  series: chartData.value.map((item) => ({
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

const chartOptions = computed<ECOption>(() => ({
  legend: legendSelected.value,
  useUTC: false,
  tooltip: {
    trigger: 'axis',
    // appendToBody: true,
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
    show: inited ? pathList.value.length > 0 : true,
  },
  yAxis: {
    type: 'value',
  },
  series: seriesData.value.series,
}));

function disabledPath(item: StorageDevice.MeasurementDataItem) {
  return item.dataType === 'TEXT';
}

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

// 查询
function handleSearch() {
  const start = dayjs(searchFormData.datetimerange[0]).valueOf();
  const end = dayjs(searchFormData.datetimerange[1]).valueOf();
  getHistoryTrend({
    paths: pathList.value.map((item) => item.path),
    startTime: start,
    endTime: end,
    groupBy: searchFormData.unitInterval,
    aggregateFun: searchFormData.aggregation,
  }).then((res) => {
    chartData.value = res.data?.normal || [];
    setOption(chartOptions.value, true);
    setOption({
      xAxis: {
        min: start,
        max: end,
      },
    });
  });
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    chartContainer.value = null;
    if (chartInstance) {
      chartInstance.clear();
      chartInstance.dispose();
    }
  });
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

.search-form-wrapper {
  width: 100%;
  display: flex;

  .search-form-buttons {
    align-self: flex-end;
    display: flex;
    flex-wrap: nowrap;
    margin-right: 0;
  }
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

.cursor-list-wrapper{
  margin-left: 16px;
  background-color: #F7F8FC;
  border-radius: 2px;
  box-sizing: border-box;
  padding: 12px 12px 25px;
  position: relative;
  transition: all 0.3s ease;
}

</style>
