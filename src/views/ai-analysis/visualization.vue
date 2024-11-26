<template>
  <coming-soon-container :is-show="locale !== 'en'">
    <active-container :is-show="connectionIsActive">
      <el-container class="visualization-wrapper">
        <el-header class="p-0 p-l-30 p-r-16" style="height: auto">
          <div class="search-form-box" style="margin-bottom: 18px">
            <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
              <div class="m-b-16 flex-align-center" style="height: 36px">
                <base-form-item :label="`${t('aiAnalysis.business')}：`" prop="type" :label-width="locale === 'en' ? '' : '96px'" :rules="requiredRules">
                  <el-radio-group v-model="searchFormData.type" id="business-type" @change="handleChangeType">
                    <el-radio :value="0" id="business-type-0">{{ t('aiAnalysis.forecast') }}</el-radio>
                    <el-radio :value="1" id="business-type-1">{{ t('aiAnalysis.anomalyDetection') }}</el-radio>
                    <el-radio :value="2" id="business-type-2">{{ t('aiAnalysis.custom') }}</el-radio>
                  </el-radio-group>
                </base-form-item>
                <base-form-item
                  v-if="searchFormData.type !== 2"
                  :label="`${t('aiAnalysis.modelSelect')}：`"
                  prop="method"
                  class="m-r-12"
                  :label-width="locale === 'en' ? '' : '96px'"
                  :rules="requiredRules"
                >
                  <el-select v-model="searchFormData.method" id="search-method" style="width: 230px" :placeholder="t('common.selectPlaceholder')">
                    <el-option
                      v-for="item in modelOptions"
                      :key="item.modelId"
                      :label="item.modelId.indexOf('_') === 0 ? item.modelId.slice(1) : item.modelId"
                      :value="item.modelId"
                      :id="`search-method-${item.modelId}`"
                    />
                  </el-select>
                </base-form-item>
                <el-button v-if="searchFormData.type !== 2" link :disabled="!enableAINode" @click="$router.push({ name: 'ModelManagement' })">
                  <el-icon :size="24"><i-custom-edit /></el-icon>
                </el-button>
                <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('aiAnalysis.docTip')" popper-class="tooltip-box-width">
                  <el-button link class="m-l-4" @click="handleDoc" id="user-path-doc">
                    <el-icon size="24"><i-custom-model-doc /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
              <div class="search-form-row-box">
                <div v-if="searchFormData.type !== 2">
                  <base-form-item prop="measurement" :label-width="locale === 'en' ? '' : '96px'" :rules="requiredRules">
                    <template #label>
                      {{ t('measurement.measurementChoose') }}：
                      <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
                        <template #content>
                          {{ t('common.searchTipLimit100') }}
                        </template>
                        <i-custom-question />
                      </el-tooltip>
                    </template>
                    <timeseries-select-single
                      id="search-path"
                      v-model="searchFormData.measurement"
                      :selectWidth="230"
                      :itemWidth="200"
                      show-suffix
                      :disabled-path="disabledPath"
                      @handle-change-path="handleChangePath"
                    />
                  </base-form-item>
                  <template v-if="searchFormData.type === 0">
                    <base-form-item :label="`${t('aiAnalysis.forecastStart')}：`" :rules="requiredRules">
                      <el-date-picker v-model="searchFormData.forecastStart" type="datetime" :prefix-icon="ICustomCalender" id="search-datetime" :clearable="false" style="width: 164px" />
                    </base-form-item>
                    <base-form-item :label="`${t('aiAnalysis.forecastData')}：`">
                      <span style="font-size: 12px; color: #131926; font-weight: 300">{{ t('aiAnalysis.forecast96') }}</span>
                    </base-form-item>
                  </template>
                  <template v-else-if="searchFormData.type === 1">
                    <base-form-item :label="`${t('aiAnalysis.detectionTime')}：`" prop="datetimerange" :rules="requiredRules">
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
                        id="search-datetimerange"
                      />
                    </base-form-item>
                    <base-form-item :label="`${t('aiAnalysis.anomalyRatio')}：`" v-if="searchFormData.method === '_Stray'" class="m-r-0">
                      <template #label>
                        {{ t('aiAnalysis.anomalyRatio') }}：
                        <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
                          <template #content>
                            {{ t('aiAnalysis.anomalyRatioTip') }}
                          </template>
                          <i-custom-question />
                        </el-tooltip>
                      </template>
                      <el-input-number v-model="searchFormData.anomalyRatio" :min="1" :max="99" :controls="false" :placeholder="t('aiAnalysis.pleaseInputPercent')" style="width: 104px" />
                      %
                    </base-form-item>
                  </template>
                </div>
                <div v-else>
                  <base-form-item label="SQL：" prop="sql" class="el-form-item-not-mandatory">
                    <el-button type="primary" :disabled="!enableAINode" link id="search-sql" style="text-decoration: underline" @click="handleSql">{{ t('search.sqlInput') }}</el-button>
                  </base-form-item>
                </div>
                <div class="search-form-buttons">
                  <el-button @click="handleReset" :disabled="!enableAINode" id="search-reset">{{ t('common.reset') }}</el-button>
                  <el-tooltip placement="top-start" effect="light" trigger="hover" :content="applyTip" :disabled="canQuery" popper-class="tooltip-box-width">
                    <el-button :disabled="!canQuery" type="primary" @click="handleSearch()" id="search-search">
                      {{ t('common.query') }}
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </el-form>
          </div>
        </el-header>
        <auth-container :is-auth="canUseModel && canReadWriteData && enableAINode" :content="enableAINode ? 'common.dataAndModelAuth' : 'aiAnalysis.enableTip'" style="height: 100%; width: 100%">
          <el-main class="p-0 position-relative" style="height: 100%">
            <el-container class="position-absolute p-x-16" style="height: 100%; width: 100%; z-index: 1000" v-if="searchFormData.type === 2">
              <el-main class="page-table-details">
                <div class="page-info-box">
                  <span></span>
                  <div class="search-form-buttons">
                    <el-dropdown class="more-icon m-l-12" :disabled="!canReadWriteData || !canQuery" @command="(val) => handleCommandDown(val)" id="visualization-save-dropdown">
                      <el-button :class="[locale === 'en' ? 'export-button' : 'export-spacing-button']" id="visualization-download" :disabled="!canReadWriteData">
                        {{ saveText }}
                        <el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="csv" id="visualization-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                          <el-dropdown-item command="xlsx" id="visualization-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                          <el-dropdown-item v-if="canWrithBack" command="saveToIoTDB" id="visualization-saveToIoTDB">{{ t('aiAnalysis.saveToIoTDB') }}</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
                <div v-loading="false">
                  <dynamic-table
                    :columns="columns"
                    :table-data="tableDataPagination"
                    :height="maxCustomTableHeight"
                    :max-height="maxCustomTableHeight"
                    v-model:current-page="pagination.pageNum"
                    v-model:page-size="pagination.pageSize"
                    :total="tableData.length"
                    :show-pagination="true"
                  />
                </div>
              </el-main>
            </el-container>
            <el-container class="p-0 position-absolute" style="height: 100%; width: 100%" :style="{ opacity: searchFormData.type === 2 ? 0 : 1 }">
              <!--
              <el-header class="p-0">
                <h4 class="info-title">
                  <span v-if="searchFormData.type !== 2">
                    <span class="m-r-4">{{ searchFormData.measurement }}</span>
                    {{ t('aiAnalysis.forecastResult') }}
                  </span>
                  <span v-else></span>
                  <div class="search-form-buttons p-r-8">
                    <el-dropdown class="more-icon m-l-12" :disabled="!canReadWriteData || !canQuery" @command="(val) => handleCommandDown(val)" id="visualization-save-dropdown">
                      <el-button :class="[locale === 'en' ? 'export-button' : 'export-spacing-button']" id="visualization-download" :disabled="!canReadWriteData">
                        {{ searchFormData.type === 0 ? t('common.save') : t('common.export') }}
                        <el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="csv" id="visualization-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                          <el-dropdown-item command="xlsx" id="visualization-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                          <el-dropdown-item v-if="searchFormData.type === 0" command="saveToIoTDB" id="visualization-saveToIoTDB">{{ t('aiAnalysis.saveToIoTDB') }}</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </h4>
              </el-header>
              -->
              <el-main class="chart-detail-wrapper">
                <el-container style="height: 100%">
                  <el-main class="p-0" style="position: relative">
                    <div ref="chartContainer" class="chart-container" :style="`height: ${'calc(100% );'}`" v-element-size="onResize"></div>
                  </el-main>
                  <el-aside
                    width="352px"
                    class="p-x-16 m-l-16 position-relative p-t-8"
                    style="display: flex; flex-direction: column; background-color: #f7f8fc; padding-bottom: 10px !important; overflow: hidden"
                  >
                    <div class="flex-justify-between p-b-4">
                      <span class="detail-total">{{ t('aiAnalysis.total', { total: sortedData.length }) }}</span>
                      <el-dropdown class="more-icon m-r-8" :disabled="!canReadWriteData || !canQuery" @command="(val) => handleCommandDown(val)" id="visualization-save-dropdown">
                        <el-button link type="primary" class="export-button" id="visualization-download" :disabled="!canReadWriteData || !allTableData.length">
                          {{ t('spectrum.download') }}
                          <el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="csv" id="visualization-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                            <el-dropdown-item command="xlsx" id="visualization-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                            <el-dropdown-item v-if="searchFormData.type === 0" command="saveToIoTDB" id="visualization-saveToIoTDB">{{ t('aiAnalysis.saveToIoTDB') }}</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                    <el-dropdown v-if="copySearchFormData.type === 1" placement="bottom" class="filter-btn" @command="(val) => handleFilter(val)">
                      <el-button link id="filter-btn">
                        <i-custom-filter style="width: 24px; height: 24px" />
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="all">{{ t('aiAnalysis.all') }}</el-dropdown-item>
                          <el-dropdown-item command="normal">{{ t('aiAnalysis.normalValue') }}</el-dropdown-item>
                          <el-dropdown-item command="anomaly">{{ t('aiAnalysis.anomalyValue') }}</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>

                    <el-table height="100%" :data="paginatedData" @sort-change="handleSortChange" :cell-style="handleCellStyle">
                      <el-table-column
                        prop="time"
                        :label="t('aiAnalysis.time')"
                        sortable="custom"
                        :sort-orders="['ascending', 'descending']"
                        :formatter="formatterTime"
                        show-overflow-tooltip
                        width="170"
                      />
                      <el-table-column prop="value" :label="copySearchFormData.type === 0 ? t('aiAnalysis.forecastValue') : copySearchFormData.measurement" show-overflow-tooltip width="150">
                        <template #header="{ column }">
                          <span class="flex-header"><text-tooltip :content="column.label" /></span>
                        </template>
                        <template #default="{ row }">
                          <!-- 保留 4 位小数 -->
                          <span>{{ parseFloat(Number(row.value).toFixed(4)) }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                    <div class="detail-pager">
                      <el-pagination :page-size="pageSize" v-model:current-page="currentPage" size="small" :background="true" :pager-count="5" layout="prev, pager, next" :total="sortedData.length" />
                    </div>
                  </el-aside>
                </el-container>
              </el-main>
            </el-container>
          </el-main>
        </auth-container>
        <modal-sql v-model:visible="sqlVisible" :sql-value="sqlValue" @handleConfirm="handleConfirmSql" />

        <modal-write-back
          v-model:visible="writeBackVisible"
          :old-name="copySearchFormData.measurement"
          :name-list="[copySearchFormData.measurement]"
          :save-loading="writeBackLoading"
          @handleSave="handleWriteBackSuccess"
        />
      </el-container>
    </active-container>
  </coming-soon-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import dayjs from 'dayjs';
import { debounce, cloneDeep } from 'lodash-es';
import { vElementSize } from '@vueuse/components';
import { AIAnalysisApi } from '@/api';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import { today, getOneIntervalNow, todayNow, formatDate } from '@/utils/date';
import { useUserStore, useConnectionStore } from '@/stores';
import { parse } from 'yaml';
import ICustomCalender from '~icons/custom/calender.svg';
import ModalSql from './components/modal-sql.vue';
import ModalWriteBack from './components/modal-write-back.vue';

const { t, locale } = useI18n();

const userStore = useUserStore();
const { canReadWriteData, canWriteData, canUseModel } = storeToRefs(userStore);
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;
const modelList = ref<Array<AIAnalysis.Model>>([]);

// const tip = '<span style="color:#495AD4;font-weight: 700;"> 2000 </span>';

const connectionStore = useConnectionStore();
const connectionIsActive = computed(() => typeof connectionStore.connectionIsActive === 'boolean');
const { enableAINode } = storeToRefs(connectionStore);
let defaultMethod = 'Timer';

const searchFormRef = ref<FormInstance>();
const searchFormData = reactive<{
  type: 0 | 1 | 2;
  measurement: string;
  measurementType: string;
  method: string;
  datetimerange: [DateModelType, DateModelType];
  forecastStart: DateModelType;
  anomalyRatio: number | undefined;
  orderBy: string;
}>({
  type: 0,
  measurement: '',
  measurementType: '',
  method: defaultMethod,
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  forecastStart: todayNow() as DateModelType,
  anomalyRatio: 1,
  orderBy: 'ascending',
});
let copySearchFormData = cloneDeep(searchFormData);
const { shortcutsDaterange } = useShortcutsDate();

const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();

const saveText = computed(() => (searchFormData.type === 0 ? t('common.save') : t('common.export')));
const canWrithBack = computed(() => searchFormData.type === 0 && canWriteData.value);
const rawData = ref<AIAnalysis.SearchDataItem[]>([]);
const analysisData = ref<AIAnalysis.SearchDataItem[]>([]);
const allTableData = ref<AIAnalysis.SearchDataItem[]>([]);

const minValue = ref(0);

const currentPage = ref(1);

const { maxTableHeight } = useTableHeight(390);

const { maxTableHeight: maxCustomTableHeight } = useTableHeight(324);

const pageSize = computed(() => Math.floor(maxTableHeight.value / 40));
const filterCondition = ref('all');

const valueShow = (item: AIAnalysis.SearchDataItem) => {
  if (copySearchFormData.type === 0) return true;
  if (filterCondition.value === 'all') {
    return true;
  }
  if (filterCondition.value === 'anomaly') {
    return item.isAnomaly;
  }
  return !item.isAnomaly;
};
const sortedData = computed(() => {
  const data = [...allTableData.value].filter((item) => valueShow(item));
  return data.sort((a, b) => (searchFormData.orderBy === 'ascending' ? a.time - b.time : b.time - a.time));
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return sortedData.value.slice(start, end);
});

const columns = ref<DynamicTableColumn[]>([]);
const tableData = ref<Record<string, any>[]>([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  columnSize: 100,
  columnNum: 1,
  totalColumnPage: 0,
  totalColumnCount: 0,
});
const getListLoading = ref(false);
const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

const sqlVisible = ref(false);
const sqlValue = ref('');

const requiredRules = ref([
  {
    required: true,
    message: '',
    trigger: 'blur',
  },
]);
let currentPoint: number | undefined = 0;
const currentPointValue = ref(0);
const writeBackVisible = ref(false);

const writeBackLoading = ref(false);
const dataEmpty = computed(() => allTableData.value.length === 0);
const notComplete = computed(() => {
  if (searchFormData.type === 0 && (!searchFormData.method || !searchFormData.measurement || !searchFormData.forecastStart)) {
    return true;
  }
  if (searchFormData.type === 1 && (!searchFormData.method || !searchFormData.measurement || !searchFormData.datetimerange)) {
    return true;
  }
  if (searchFormData.type === 2 && !sqlValue.value) {
    return true;
  }
  return false;
});

const applyTip = computed(() => {
  if (!canReadWriteData.value || !canUseModel.value) {
    return t('common.dataAndModelAuth');
  }
  if (notComplete.value) {
    return t('spectrum.applyTip');
  }
  return '';
});

const canQuery = computed(() => {
  if (canReadWriteData.value && canUseModel.value && !notComplete.value && enableAINode.value) {
    return true;
  }
  return false;
});

const modelOptions = computed(() => {
  switch (searchFormData.type) {
    case 0:
      return modelList.value.filter((item) => item.modelId === 'Timer').concat(modelList.value.filter((item) => item.modelTypeValue === 'BUILT_IN_FORECAST'));
    case 1:
      return modelList.value.filter((item) => item.modelTypeValue === 'BUILT_IN_ANOMALY_DETECTION').reverse();
    case 2:
      return modelList.value.filter((item) => item.modelTypeValue === 'USER_DEFINED' && item.modelId !== 'Timer');
    default:
      return [];
  }
});

const allowedTypes = computed(() => {
  let result: string[] = ['INT32', 'INT64', 'FLOAT', 'DOUBLE'];
  const current = modelOptions.value.find((item) => item.modelId === searchFormData.method);
  if (current && current.configs) {
    let output = '';
    current.configs.split(']').forEach((line) => {
      if (line) {
        output += `${line.replace(':[', ': [')}]\n`;
      }
    });
    const data = parse(output);
    if (data && data.inputDataType && data.inputDataType.length) {
      result = data.inputDataType;
    }
  }
  return result;
});

function disabledPath(item: StorageDevice.MeasurementDataItem) {
  return allowedTypes.value.indexOf(item.dataType) === -1;
}

const anomalyPoints = computed(() => {
  const data: AIAnalysis.SearchDataItem[] = [];
  analysisData.value.forEach((element, index) => {
    if (element.value === '1') {
      data.push({
        time: element.time,
        value: rawData.value[index].value,
      });
    }
  });
  return data;
});

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
          name: t('aiAnalysis.rawValue'),
          data: rawData.value.map((dataItem) => [dataItem.time, dataItem.value]),
          lineStyle: {
            width: 2,
            color: '#4B94FE',
          },
          itemStyle: {
            color: '#4B94FE',
          },
          z: 1,
        },
        {
          type: copySearchFormData.type === 0 ? 'line' : 'scatter',
          symbol: 'circle',
          showSymbol: false,
          showAllSymbol: 'auto',
          connectNulls: false,
          symbolSize: 4,
          name: copySearchFormData.type === 0 ? t('aiAnalysis.forecastValue') : t('aiAnalysis.anomalyPoint'),
          data: copySearchFormData.type === 0 ? analysisData.value.map((dataItem) => [dataItem.time, dataItem.value]) : anomalyPoints.value.map((dataItem) => [dataItem.time, dataItem.value]),
          lineStyle: {
            width: 2,
            color: copySearchFormData.type === 0 ? '#FF6E76' : '#D43030',
          },
          itemStyle: {
            color: copySearchFormData.type === 0 ? '#FF6E76' : '#D43030',
          },
          markLine: {
            symbol: 'none',
            lineStyle: {
              type: [16, 10],
              color: copySearchFormData.type === 0 ? '#FF6E76' : '#D43030',
            },
            data:
              copySearchFormData.type === 0
                ? []
                : anomalyPoints.value.map((line) => [
                    {
                      coord: [line.time, minValue.value],
                    },
                    {
                      coord: [line.time, line.value],
                    },
                  ]),
            animation: false,
          },
          z: 2,
        },
      ],
    }) as unknown as ECOption
);

const chartOptions = computed<ECOption>(() => ({
  tooltip: {
    trigger: 'axis',
    // appendToBody: true,
    formatter: (params) => {
      const paramsData = params as unknown as Array<Record<string, any>>;
      const x = `<div style="margin: 10px 0 0;"><span style="font-size:14px;color:#666;font-weight:900;"></span><span style="font-size:14px;color:#666;font-weight:400;">${formatDate(paramsData[0].value[0])}</span></div>`;
      const circle = `<div><span style="display:inline-block;margin-right:10px;border-radius:10px;width:10px;height:10px;background-color: ${paramsData[paramsData.length - 1].color}"></span><span style="font-size:14px;color:#666;font-weight:400;line-height:1;">${paramsData[paramsData.length - 1].value[1]}</span></div>`;
      return `${x}${circle}`;
    },
  },
  legend: {
    data: allTableData.value.length > 0 ? [t('aiAnalysis.rawValue'), copySearchFormData.type === 0 ? t('aiAnalysis.forecastValue') : t('aiAnalysis.anomalyPoint')] : [],
  },
  toolbox: {
    show: true,
    feature: {
      dataZoom: {
        title: {
          zoom: t('common.zoom'),
          back: t('common.revoke'),
        },
        icon: {
          zoom: 'path://M15 9L23 9L23 23L9 23L9 15M13 9L9 9M9 9L5 9M9 13L9 9M9 9L9 5',
          back: 'path://M9,9h14v14H9v-8 M12,12L9,9l3-3',
        },
      },
      restore: {
        title: t('common.restore'),
        icon: 'path://M13 21L15 24C10.0294 24 6 19.9706 6 15C6 12.7036 6.86006 10.6081 8.27564 9.01797M17 9L15 6C19.9706 6 24 10.0294 24 15C24 17.3063 23.1325 19.4101 21.7059 21.0026',
      },
      saveAsImage: {
        title: t('common.export'),
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
    show: !dataEmpty.value,
    splitLine: {
      show: false,
    },
  },
  yAxis: {
    type: 'value',
    show: !dataEmpty.value,
    scale: true,
  },
  animation: true,
  series: seriesData.value.series,
}));

const { requestFn: getModels } = useRequest(AIAnalysisApi.getModels);
const { requestFn: search } = useRequest(AIAnalysisApi.search);
const { requestFn: writeBack } = useRequest(AIAnalysisApi.writeBack);
const { requestFn: getExportId } = useRequest(AIAnalysisApi.getExportId);
const { requestFn: getCustomData, data: customData } = useRequest(AIAnalysisApi.getCustomData);
const { requestFn: getCustomExportId } = useRequest(AIAnalysisApi.getCustomExportId);

const formatterTime = (row: AIAnalysis.SearchDataItem) => formatDate(row.time);

function handleChangeType(val: string | number | boolean | undefined) {
  if (val === 0 && modelOptions.value.find((item) => item.modelId === 'Timer')) {
    searchFormData.method = 'Timer';
  } else if (modelOptions.value.length > 0) {
    searchFormData.method = modelOptions.value[0].modelId;
  } else {
    searchFormData.method = '';
  }
}

function handleChangePath(val: string, data: StorageDevice.MeasurementDataItem[]) {
  const current = data.find((f) => f.timeseries === val);
  searchFormData.measurementType = current?.dataType || '';
}

const timeout = ref<number>();

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
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleClickChart(params);
    });
    chartInstance.on('highlight', (params: any) => {
      currentPoint = undefined;
      if (params.batch && params.batch.length > 0) {
        params.batch.forEach((item: any) => {
          if (item.seriesIndex === 1 && item.dataIndex !== undefined) {
            currentPoint = item.dataIndex;
          }
        });
      }
    });
    // 若存在restore事件，执行
    chartInstance.on('restore', () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      // handleEmptyOperate();
      setOption(chartOptions.value);
    });
    chartInstance.getZr().on('click', (params) => {
      if (params.target && !params.topTarget) {
        return;
      }
      // 点击到点上
      if ((params.target as unknown as any)?.z === 3 || (params.target as unknown as any)?.z === 5) {
        return;
      }
      if (params.topTarget && params.topTarget.type !== 'Line') return;
      if ((currentPoint || currentPoint === 0) && allTableData.value[currentPoint]) {
        const point = allTableData.value[currentPoint];
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        handleDeal(point);
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
    if (timeout.value) clearTimeout(timeout.value);
    // 避免卡死
    timeout.value = setTimeout(() => {
      nextTick(() => {
        setOption(option);
      });
    }, 10) as unknown as number;
  }
};

function handleDeal(point: AIAnalysis.SearchDataItem | undefined) {
  if (!point) return;
  const index = sortedData.value.findIndex((data) => data.time === point.time);
  currentPointValue.value = point.time;
  currentPage.value = Math.ceil((index + 1) / pageSize.value);
}

function handleClickChart(params: echarts.ECElementEvent) {
  if (params.componentType !== 'series' && params.componentType !== 'markLine' && params.componentType !== 'markPoint') return;
  const { value, componentType } = params as { seriesName: string; value: number[] | number; componentType: string };
  if (componentType === 'series') {
    handleDeal(sortedData.value.find((data) => data.time === (value as number[])[0]));
  } else if (componentType === 'markLine') {
    const [time] = (params?.data as any)?.coord || [];
    if (time) {
      handleDeal(sortedData.value.find((data) => data.time === (time as unknown as number)));
    }
  } else {
    handleDeal(sortedData.value.find((data) => data.time === value));
  }
}

const onResize = debounce(() => {
  if (chartContainer.value) {
    chartInstance?.resize();
  }
}, 50);

function getModelList() {
  if (!canUseModel.value) {
    defaultMethod = '';
    searchFormData.method = defaultMethod;
    return;
  }
  getModels('')
    .then((res) => {
      modelList.value = res.data || [];
      if (modelList.value.some((m) => m.modelId === 'Timer')) {
        defaultMethod = 'Timer';
      } else {
        defaultMethod = modelList.value.filter((item) => item.modelTypeValue === 'BUILT_IN_FORECAST')[0].modelId || '';
        searchFormData.method = defaultMethod;
      }
    })
    .catch(() => {
      defaultMethod = '';
      searchFormData.method = defaultMethod;
    });
}

// 重置
function handleReset() {
  searchFormData.type = 0;
  searchFormData.measurement = '';
  searchFormData.method = '';
  searchFormData.measurementType = '';
  searchFormData.method = defaultMethod;
  searchFormData.datetimerange = getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType];
  searchFormData.forecastStart = todayNow() as DateModelType;
  searchFormData.anomalyRatio = 1;
  searchFormData.orderBy = 'ascending';
  sqlValue.value = '';
  copySearchFormData = cloneDeep(searchFormData);
  allTableData.value = [];
  rawData.value = [];
  analysisData.value = [];
  tableData.value = [];
  setOption(chartOptions.value, true);
}

function getCustom() {
  columns.value = [];
  tableData.value = [];
  getCustomData(sqlValue.value)
    .then((res) => {
      const list: DynamicTableColumn[] = [];
      if (res.data?.outputs?.length > 0) {
        res.data?.outputs?.forEach((item: AIAnalysis.CustomItem, index: number) => {
          list.push({
            label: item.name,
            prop: `t${index}`,
            defaultValue: '-',
            fixed: index === 0 ? 'left' : undefined,
            sortable: false,
            // formatHeader: formatTimeseries,
          });
        });
        columns.value = list;
        const dataList: Record<string, any>[] = [];
        if (res.data.outputs?.length > 0) {
          res.data?.outputs[0].value.forEach((item, index) => {
            const obj = {} as Record<string, string>;
            res.data?.outputs.forEach((column, columnindex) => {
              obj[`t${columnindex}`] = column.value[index];
            });
            dataList.push(obj);
          });
        }
        tableData.value = dataList;
      } else {
        ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
      }
    })
    .finally(() => {
      getListLoading.value = false;
    });
}

// 查询
function handleSearch() {
  if (!canReadWriteData.value) return;
  searchFormData.orderBy = 'ascending';
  copySearchFormData = cloneDeep(searchFormData);
  filterCondition.value = 'all';
  currentPoint = undefined;
  currentPointValue.value = 0;
  currentPage.value = 1;
  allTableData.value = [];
  analysisData.value = [];
  rawData.value = [];
  if (searchFormData.type !== 2) {
    const query: AIAnalysis.SearchCondition = {
      modelType: searchFormData.type === 0 ? 'BUILT_IN_FORECAST' : 'BUILT_IN_ANOMALY_DETECTION',
      modelId: searchFormData.method,
      measurement: searchFormData.measurement,
      startTime: searchFormData.type === 0 ? dayjs(searchFormData.forecastStart).valueOf() : dayjs(searchFormData.datetimerange[0]).valueOf(),
      endTime: searchFormData.type === 1 ? dayjs(searchFormData.datetimerange[1]).valueOf() : undefined,
      exceptionPercent: searchFormData.method === '_Stray' && searchFormData.anomalyRatio ? searchFormData.anomalyRatio! / 100 : undefined,
    };
    search(query)
      .then((res) => {
        if ((!res.data.raw || res.data.raw.length === 0) && (!res.data.analysis || res.data.analysis.length === 0)) {
          ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
          setOption(chartOptions.value, true);
          return;
        }
        rawData.value = res.data.raw;
        analysisData.value = res.data.analysis;
        if (searchFormData.type === 0) {
          allTableData.value = [...res.data.analysis];
        } else {
          allTableData.value = res.data.raw;
          analysisData.value.forEach((element, index) => {
            if (element.value === '1') {
              allTableData.value[index].isAnomaly = true;
            }
          });
        }
        const anomalyData = allTableData.value.filter((item) => item.isAnomaly);
        if (anomalyData.length > 0) {
          const minTimePoint = anomalyData.reduce((min, current) => {
            return current.time < min.time ? current : min;
          });
          if (minTimePoint) {
            handleDeal(minTimePoint);
          }
        }
        minValue.value = Math.min(...rawData.value.map((item) => Number(item.value)));
        if (!allTableData.value.length) {
          ElMessage.warning({ message: t('dataTrend.noDataTip'), grouping: true });
        }
        setOption(chartOptions.value, true);
      })
      .catch(() => {
        currentPointValue.value = 0;
        currentPage.value = 1;
        rawData.value = [];
        analysisData.value = [];
        allTableData.value = [];
        setOption(chartOptions.value, true);
      });
  } else {
    getCustom();
  }
}

function handleWriteBackSuccess(name: string) {
  writeBackLoading.value = true;
  const data = {
    modelType: copySearchFormData.type === 0 ? 'BUILT_IN_FORECAST' : 'BUILT_IN_ANOMALY_DETECTION',
    measurement: name,
    dataType: copySearchFormData.measurementType,
    raw: rawData.value,
    analysis: analysisData.value,
  };
  writeBack(data)
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      writeBackVisible.value = false;
    })
    .finally(() => {
      writeBackLoading.value = false;
    });
}

// 导出
function handleExportData(exportType: string) {
  if (allTableData.value.length === 0 && tableData.value.length === 0) return;
  if (copySearchFormData.type !== 2) {
    const data = {
      modelType: copySearchFormData.type === 0 ? 'BUILT_IN_FORECAST' : 'BUILT_IN_ANOMALY_DETECTION',
      measurement: copySearchFormData.measurement,
      dataType: copySearchFormData.measurementType,
      raw: rawData.value,
      analysis: analysisData.value,
    };
    getExportId(data).then((res) => {
      const url = `/api/file/export${exportType !== 'csv' ? 'Excel' : ''}Analysis?exportId=${res.data}`;
      window.open(url);
    });
  } else {
    getCustomExportId(customData.value).then((res) => {
      const url = `/api/file/export${exportType !== 'csv' ? 'Excel' : ''}AnalysisCustomize?exportId=${res.data}`;
      window.open(url);
    });
  }
}

// 下载
function handleCommandDown(val: string) {
  if (val === 'saveToIoTDB') {
    writeBackVisible.value = true;
  } else {
    handleExportData(val);
  }
}

function handleSql() {
  sqlVisible.value = true;
}

function handleConfirmSql(val: string) {
  sqlValue.value = val;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleSortChange({ column, prop, order }: SortMethod<AIAnalysis.SearchDataItem>) {
  searchFormData.orderBy = order;
}
/**
 * Returns styles for a cell in the table. If the cell is in the second column
 * and the row is marked as an anomaly, the text color is set to red.
 *
 * @param {Object} param0 - Information about the cell
 * @param {AIAnalysis.SearchDataItem} param0.row - The row in the table
 * @param {number} param0.columnIndex - The index of the column
 * @returns {Object} - Styles to apply to the cell
 */
function handleCellStyle({ row, columnIndex }: { row: AIAnalysis.SearchDataItem; columnIndex: number }) {
  if (columnIndex === 1) {
    if (row.isAnomaly) {
      return { color: 'red' };
    }
  }
  if (row.time === currentPointValue.value) {
    return { color: '#495AD4', fontWeight: '700' };
  }
  return {};
}
function handleFilter(val: string) {
  currentPage.value = 1;
  filterCondition.value = val;
}

function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://www.timecho.com/docs/UserGuide/latest/User-Manual/AINode_timecho.html');
  } else {
    window.open('https://www.timecho.com/docs/zh/UserGuide/latest/User-Manual/AINode_timecho.html#%E4%BD%BF%E7%94%A8%E5%86%85%E7%BD%AE%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86');
  }
}

function setStorage() {
  sessionStorage.setItem(
    'aiVisualizationStorage',
    JSON.stringify({
      ...copySearchFormData,
      sqlValue: sqlValue.value,
      currentPoint,
    })
  );
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    // eslint-disable-next-line no-underscore-dangle
    if (!window.__isReload__) {
      setStorage();
    } else {
      sessionStorage.setItem('dataSpectrumStorage', '');
    }
    chartContainer.value = null;
    if (chartInstance) {
      chartInstance.clear();
      chartInstance.dispose();
    }
  });
  getModelList();
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
    if (canReadWriteData.value && canUseModel.value && enableAINode.value) {
      getModelList();
      setOption(chartOptions.value);
    }
  });
});

watch(
  () => canReadWriteData.value && canUseModel.value && enableAINode.value,
  (val) => {
    setOption(chartOptions.value);
    if (val) {
      getModelList();
      if (sessionStorage.getItem('aiVisualizationStorage')) {
        const storageData = JSON.parse(sessionStorage.getItem('aiVisualizationStorage') as string);
        searchFormData.measurement = storageData.measurement;
        searchFormData.type = storageData.type;
        searchFormData.method = storageData.method;
        searchFormData.measurementType = storageData.measurementType;
        searchFormData.anomalyRatio = storageData.anomalyRatio;
        searchFormData.forecastStart = storageData.forecastStart;
        searchFormData.datetimerange = storageData.datetimerange;
        searchFormData.orderBy = storageData.orderBy;
        sqlValue.value = storageData.sqlValue;
        currentPoint = storageData.currentPoint;
        if (canQuery.value) {
          handleSearch();
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
.visualization-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 0 16px;
}

.search-form-box {
  display: flex;

  :deep(.el-form) {
    flex: 1;
  }

  :deep(.el-form-item--default) {
    margin: 0 24px 0 0;
  }

  .search-form-row-box {
    display: flex;
    justify-content: space-between;
  }
}

.search-form-buttons {
  margin-left: 12px;
  display: inline-flex;
  flex-wrap: nowrap;
  align-self: end;
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

.search-data-list {
  display: inline-flex;
  margin: 0 8px 0 0;
  border-radius: 12px;
  background-color: #fff;
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

.chart-detail-wrapper {
  width: 100%;
  padding: 8px 16px 0 30px;
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

.collapse-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
  color: #495ad4;
  margin: 14px 5px 0;
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

.info-title {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
  padding: 0 10px 6px 30px;
  border-bottom: 1px solid #dfe1ed;
}

.detail-pager {
  padding-top: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.detail-total {
  font-size: 12px;
  font-weight: 700;
  color: #495ad4;
}

.flex-header {
  display: flex;
  max-width: 100%;
}

.filter-btn {
  position: absolute;
  z-index: 2;
  right: 14px;
  top: 46px;
}

.page-table-details {
  padding: 8px 16px;
  border-radius: 2px;
  background: #f7f8fc;
  display: flex;
  flex: 1;
  flex-direction: column;

  .page-info-title {
    display: flex;
    font-size: 14px;
    line-height: 20px;
    color: #495ad4;

    .run-result-tip {
      align-self: flex-end;
      margin: 0 0 0 12px;
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #808080;
      font-weight: 400;

      svg {
        color: #ccc;
        margin-right: 4px;
      }
    }
  }

  .page-info-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
}

.el-pagination--small {
  --el-pagination-button-width-small: 20px;
  --el-pagination-button-height-small: 20px;

  :deep(.btn-prev),
  :deep(.btn-next),
  :deep(.el-pager li) {
    margin: 0 2px !important;
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
