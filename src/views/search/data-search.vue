<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" style="flex: 1" ref="searchFormRef" label-position="left" :label-width="locale === 'en' ? '156px' : '88px'" size="default" inline>
        <el-row>
          <base-form-item prop="path" class="m-r-20">
            <template #label>
              {{ t('measurement.measurementChoose') }}：
              <el-tooltip effect="light" :content="t('common.searchTipLimit100')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
            </template>
            <timeseries-select v-model="searchFormData.path" :is-show-view-btn="true" :disabled="getListLoading" id="data-search-path" />
          </base-form-item>
          <el-form-item :label="`${t('search.searchTime')}：`" prop="time" style="margin-right: 0">
            <div class="search-time-wrapper">
              <ul class="search-time-list">
                <li :class="['search-time-type', { 'search-time-active': timeType === 'datetime' }]" id="data-search-type-datetime" @click="handleTimeType('datetime')">{{ t('search.datetime') }}</li>
                <li :class="['search-time-type', { 'search-time-active': timeType === 'datetimerange' }]" id="data-search-type-datetimerange" @click="handleTimeType('datetimerange')">
                  {{ t('search.datetimerange') }}
                </li>
              </ul>
              <el-input type="hidden" />
              <el-date-picker
                v-if="timeType === 'datetime'"
                v-model="searchFormData.time"
                type="datetime"
                :placeholder="t('common.selectPlaceholder')"
                :disabled-date="disabledDate"
                :shortcuts="shortcutsDate"
                :clearable="false"
                :prefix-icon="ICustomCalender"
                id="data-search-datetime"
                :disabled="getListLoading"
              />
              <el-date-picker
                v-else
                v-model="searchFormData.datetimerange"
                type="datetimerange"
                range-separator="～"
                unlink-panels
                :disabled-date="disabledDate"
                :shortcuts="shortcutsDaterange"
                :clearable="false"
                :prefix-icon="ICustomCalender"
                id="data-search-datetimerange"
                :disabled="getListLoading"
              />
            </div>
          </el-form-item>
        </el-row>
        <el-row class="flex-justify-between">
          <div>
            <el-form-item prop="timeInterval" class="m-r-20">
              <template #label>
                {{ t('search.timeInterval') }}：
                <el-tooltip effect="light" :content="t('search.inputNumberPlaceholder')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
              </template>
              <el-input type="hidden" />
              <el-input v-model.number="searchFormData.timeInterval" style="width: 160px" placeholder="" @input="handleInputInterval" id="data-search-timeInterval" :disabled="getListLoading">
                <template #append>
                  <el-select v-model="searchFormData.unitInterval" style="width: 80px" placeholder="" id="data-search-unitInterval" :disabled="getListLoading">
                    <el-option v-for="item in timeUnits" :key="item.value" :value="item.value" :label="item.label" :id="`data-search-unitInterval-select-${item.value}`" />
                  </el-select>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item :label="`${t('search.aggregation')}：`" prop="aggregation">
              <el-input type="hidden" />
              <el-select v-model="searchFormData.aggregation" style="width: 120px" clearable id="data-search-aggregation" :disabled="getListLoading">
                <el-option v-for="item in aggregateFunctions" :key="item.value" :value="item.value" :label="item.label" :id="`data-search-aggregation-select-${item.value}`" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item class="search-form-buttons">
            <auth-tooltip :is-disabled="canReadWriteData">
              <el-button @click="handleReset" :disabled="getListLoading || !canReadWriteData" id="data-search-reset">{{ t('common.reset') }}</el-button>
            </auth-tooltip>
            <auth-tooltip :is-disabled="canReadWriteData">
              <el-button type="primary" :disabled="!canReadWriteData" @click="handleSearch" id="data-search-search">{{ getListLoading ? '取消查询' : t('common.query') }}</el-button>
            </auth-tooltip>
          </el-form-item>
        </el-row>
      </el-form>
    </div>

    <div class="page-table-details">
      <div class="page-info-box">
        <!-- <ul class="run-result-list">
          <li class="run-result-item">
            <i-custom-query-success v-if="searchDetailInfos.status === true" />
            <i-custom-query-error v-else-if="searchDetailInfos.status === false" />
            <i-custom-query-status v-else />
            查询状态：
            <span v-if="getListLoading" :style="{ color: '#656A85' }">查询中</span>
            <span v-else :style="{ color: searchDetailInfos !== undefined ? searchDetailInfos.status ? '#44C795' : '#D43030' : '#656A85' }">{{ formatSqlInfo('status') }}</span>
          </li>
          <li class="run-result-item"><i-custom-query-start-time />开始时间：{{ formatSqlInfo('startQueryTime') }}</li>
          <li class="run-result-item"><i-custom-query-time />查询耗时：{{ formatSqlInfo('queryTime') }}</li>
        </ul> -->
        <h4 class="page-info-title">
          {{ t('common.searchDetail') }}
          <span class="run-result-tip">
            <i-custom-info-warning />
            {{ t('search.export1000Tip') }}
          </span>
        </h4>
        <div class="page-detail-buttons">
          <auth-tooltip :is-disabled="canReadWriteData">
            <el-button @click="handleSearch" :disabled="getListLoading || !canReadWriteData" id="data-search-refresh">{{ t('common.refresh') }}</el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canReadWriteData">
            <el-button class="m-l-12" :disabled="!canReadWriteData || getListLoading" @click="handleImport" id="data-search-import">{{ t('common.import') }}</el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canReadWriteData">
            <el-dropdown
              class="more-icon m-l-12"
              :disabled="getListLoading || !canReadWriteData"
              v-show="searchDetailInfos.status"
              @command="(val) => handleCommandDown(val)"
              id="data-search-download-dropdown"
            >
              <el-button class="export-button" id="data-search-download" :disabled="!canReadWriteData">
                {{ t('common.export') }}
                <el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv" id="data-search-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                  <el-dropdown-item command="xlsx" id="data-search-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </auth-tooltip>
        </div>
      </div>

      <!-- <div style="text-align: right;" class="p-r-10 p-y-10" v-show="searchDetailInfos.status && pagination.totalColumnPage">
        <el-button @click="queryData(pagination.columnNum - 1)" type="success" circle :disabled="pagination.columnNum < 2">
          <template #icon><i-ep-arrow-left-bold /></template>
        </el-button>
        <span class="m-x-10">{{ pagination.columnNum }}/{{ pagination.totalColumnPage }} 列</span>
        <el-button @click="queryData(pagination.columnNum + 1)" type="success" circle :disabled="pagination.columnNum >= pagination.totalColumnPage">
          <template #icon><i-ep-arrow-right-bold /></template>
        </el-button>
      </div> -->
      <!-- <div class="table-empty-wrapper" v-if="firstLoad" style="background-color: #fff;">
        <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
        <span class="data-empty-text">{{ t('common.noData') }}</span>
      </div> -->
      <auth-container :is-auth="canReadWriteData" style="height: 100%">
        <div v-loading="getListLoading">
          <div v-if="searchDetailInfos.status">
            <dynamic-table
              :columns="columns"
              :table-data="tableDataPagination"
              :height="maxTableHeight"
              :max-height="maxTableHeight"
              v-model:current-page="pagination.pageNum"
              v-model:page-size="pagination.pageSize"
              :total="tableData.length"
              :show-pagination="true"
              :default-sort="defaultSort"
              @handleSortChange="handleSortChange"
            />
            <!-- <div class="pagination-container" v-if="tableData.length > 0">
            <el-button plain class="btn-page btn-first" @click="handleClickPage('first')" :disabled="pagination.pageNum === 1">第一页</el-button>
            <el-button type="primary" class="btn-page btn-prev" @click="handleClickPage('prev')" :disabled="pagination.pageNum === 1">上一页</el-button>
            <el-button type="primary" class="btn-page btn-next" @click="handleClickPage('next')" :disabled="!hasNext">下一页</el-button>
            <el-select v-model="pagination.pageSize" @change="handleChangePageSize" style="width: 100px;">
              <el-option
                v-for="item in paginationSizerOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div> -->
          </div>
          <div class="table-error-wrapper" v-if="searchDetailInfos.errMsg">Msg: {{ searchDetailInfos.errMsg }}</div>
        </div>
      </auth-container>
    </div>

    <modal-import v-model:visible="importVisible" @handle-close="handleImportClose" />
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, SingleOrRange, DateModelType, Sort } from 'element-plus';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { cloneDeep } from 'lodash-es';
import { useTableHeight } from '@/composition-api';
import { SearchApi } from '@/api';
import { getStartAndEnd, today, getOneDay, getOneInterval, todayNow, getOneIntervalNow } from '@/utils/date';
import { useUserStore } from '@/stores';
import DynamicTable from '@/components/dynamic-table.vue';
import ICustomCalender from '~icons/custom/calender.svg';
import ModalImport from './components/modal-import.vue';

const { t, locale } = useI18n();
const route = useRoute();
const userStore = useUserStore();
const { canReadWriteData } = storeToRefs(userStore);
const { maxTableHeight } = useTableHeight(330);

const searchFormRef = ref<FormInstance>();
const firstLoad = ref(true);
const timeUnits = [
  { label: t('common.milliSecond'), value: 'ms' },
  { label: t('common.second'), value: 's' },
  { label: t('common.minuteAll'), value: 'm' },
  { label: t('common.hour'), value: 'h' },
  { label: t('common.day'), value: 'd' },
];
const aggregateFunctions = [
  { label: t('common.lastValue'), value: 'last_value' },
  { label: t('common.avg'), value: 'avg' },
  { label: t('common.maxValue'), value: 'max_value' },
  { label: t('common.minValue'), value: 'min_value' },
];

const currentQueryTime = ref('');
const timeType = ref('datetimerange');
// const errorDeviceTip = ref('');
const searchFormData = reactive({
  path: [] as string[],
  time: todayNow(),
  datetimerange: [new Date('1970-1-1').getTime(), todayNow()] as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  timeInterval: undefined as number | undefined,
  unitInterval: 's',
  aggregation: '',
  asc: 'asc',
});
let copySearchFormData = cloneDeep(searchFormData);
const shortcutsDate = [
  {
    text: t('common.today'),
    value: () => todayNow(),
  },
  {
    text: t('common.yesterday'),
    value: () => getOneDay(1),
  },
  {
    text: t('common.7dayAgo'),
    value: () => getOneDay(7),
  },
];
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

const searchDetailInfos = ref<Partial<Search.QueryDataResult>>({});
const hasNext = ref(false);
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
const importVisible = ref(false);
// const tableHeight = computed(() => (tableData.value.length > 0 ? maxTableHeight.value : maxTableHeight.value ));

const getListLoading = ref(false);
const defaultSort = ref<Sort>({ prop: 't0', order: 'descending' });

// // 查询结果
// const formatSqlInfo = computed(() => function (filed: string) {
//   const data: Partial<Search.QueryDataResult> = searchDetailInfos?.value;
//   if (filed === 'status') {
//     // eslint-disable-next-line no-nested-ternary
//     return data.status === undefined ? '' : (data.status ? '查询成功' : '查询失败');
//   } if (filed === 'startQueryTime') {
//     return currentQueryTime.value;
//   } if (filed === 'queryTime') {
//     return data.status ? data.queryTime : '';
//   }
//   return '';
// });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

const { requestFn: getList } = useRequest(SearchApi.getDataSearchList);
const { requestFn: exportData } = useRequest(SearchApi.exportData);

let controller = new AbortController();

function getListData() {
  if (copySearchFormData.timeInterval && !copySearchFormData.aggregation) {
    ElMessage.error(t('search.aggregationPlaceholder'));
    return;
  }
  firstLoad.value = false;
  columns.value = [];
  tableData.value = [];

  let startTime = 0;
  let endTime = 0;
  if (timeType.value === 'datetime') {
    startTime = dayjs(copySearchFormData.time).valueOf();
    endTime = startTime + 1000;
  } else {
    startTime = dayjs(copySearchFormData.datetimerange[0]).valueOf();
    endTime = dayjs(copySearchFormData.datetimerange[1]).valueOf();
  }

  searchDetailInfos.value.status = undefined;
  searchDetailInfos.value.queryTime = '';
  currentQueryTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  getListLoading.value = true;
  controller = new AbortController();
  getList(
    {
      measurements: copySearchFormData.path,
      startTime,
      endTime,
      aggregation: copySearchFormData.aggregation,
      timeInterval: copySearchFormData.timeInterval || undefined,
      unitInterval: copySearchFormData.unitInterval,
      asc: copySearchFormData.asc,
      spage: pagination.columnNum,
      ssize: pagination.columnSize,
      size: 1000,
      page: pagination.pageNum,
    },
    controller
  )
    .then((res) => {
      // eslint-disable-next-line no-undef
      const list: DynamicTableColumn[] = [];
      res.data?.metaDataList?.forEach((item: string, index: number) => {
        list.push({
          label: item,
          prop: `t${index}`,
          defaultValue: '-',
          fixed: index === 0 ? 'left' : undefined,
          sortable: index === 0 ? 'custom' : false,
          // formatHeader: formatTimeseries,
        });
      });
      columns.value = list;
      tableData.value = res.data?.valueList?.map((item: any[]) => {
        const obj = {} as Record<string, string>;
        item.forEach((childItem, index) => {
          obj[`t${index}`] = childItem;
        });
        return obj;
      });
      hasNext.value = res.data?.hasNext;
      pagination.totalColumnPage = res.data?.totalColumnPage;
      pagination.totalColumnCount = res.data?.totalColumnCount;
      searchDetailInfos.value = res.data || {};
      defaultSort.value = { prop: 't0', order: copySearchFormData.asc === 'asc' ? 'ascending' : 'descending' };
    })
    .finally(() => {
      getListLoading.value = false;
    });
}

function handleSortChange(data: { column: any; prop: string; order: any }) {
  searchFormData.asc = data.order === 'ascending' ? 'asc' : 'desc';
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  handleSearch();
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.time = todayNow();
  searchFormData.unitInterval = 's';
  searchFormData.datetimerange = ['1970-01-01 00:00:00', todayNow()] as [DateModelType, DateModelType];
  searchFormData.asc = 'desc';
}

// 查询
function handleSearch() {
  // if (!searchFormData.path.length) {
  //   errorDeviceTip.value = '请输入测点名称后进行搜索';
  //   return;
  // }
  // errorDeviceTip.value = '';
  if (getListLoading.value) {
    controller.abort();
    return;
  }
  pagination.pageNum = 1;
  copySearchFormData = cloneDeep(searchFormData);
  getListData();
}

function handleInputInterval(val: string) {
  if (val) {
    if (!/^\+?[1-9][0-9]*$/.test(`${val}`)) {
      searchFormData.timeInterval = undefined;
    } else if (+val > 100000000) {
      searchFormData.timeInterval = 100000000;
    }
  } else {
    searchFormData.timeInterval = undefined;
  }
}

// 列
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function queryData(columnNum?: number) {
  pagination.pageSize = 10;
  pagination.pageNum = 1;
  pagination.columnNum = columnNum || 1;
  pagination.columnSize = 100;
  getListData();
}

// function handleClickPage(type: string) {
//   if (type === 'first') {
//     pagination.pageNum = 1;
//   } else if (type === 'prev') {
//     pagination.pageNum--;
//   } else {
//     pagination.pageNum++;
//   }
//   getListData();
// }

// function handleChangePageSize(val: number) {
//   pagination.pageSize = val;
//   pagination.pageNum = 1;
//   getListData();
// }

// 导入
function handleImport() {
  importVisible.value = true;
}

// 导入物理量
function handleImportClose(reload: boolean) {
  if (reload) {
    handleSearch();
  }
}

// 导出
function handleExportData(exportType: string) {
  let startTime = 0;
  let endTime = 0;
  if (timeType.value === 'datetime') {
    startTime = dayjs(copySearchFormData.time).valueOf();
    endTime = startTime + 1000;
  } else {
    startTime = dayjs(copySearchFormData.datetimerange[0]).valueOf();
    endTime = dayjs(copySearchFormData.datetimerange[1]).valueOf();
  }
  exportData({
    measurements: copySearchFormData.path,
    startTime,
    endTime,
    aggregation: copySearchFormData.aggregation,
    timeInterval: copySearchFormData.timeInterval || undefined,
    unitInterval: copySearchFormData.unitInterval,
    asc: copySearchFormData.asc,
    spage: pagination.columnNum,
    ssize: pagination.columnSize,
    size: pagination.pageSize,
    page: pagination.pageNum,
  }).then((res) => {
    let url = `/api/file/exportExcelData?exportId=${res.data}`;
    if (exportType === 'csv') {
      url = `/api/file/exportCSVData?exportId=${res.data}`;
    }
    window.open(url);
  });
}

// 切换查询时间类型
function handleTimeType(type: 'datetime' | 'datetimerange') {
  if (timeType.value === type || getListLoading.value) return;
  timeType.value = type;
  searchFormData.time = todayNow();
  searchFormData.datetimerange = ['1970-01-01 00:00:00', todayNow()] as [DateModelType, DateModelType];
}
// 下载
function handleCommandDown(val: string) {
  // if (!copySearchFormData.path.length) {
  //   errorDeviceTip.value = '请输入测点名称后进行搜索';
  //   return;
  // }
  handleExportData(val);
}

// onMounted(() => {
//   if (!canReadWriteData.value) return;
//   firstLoad.value = true;
//   handleReset();
//   if (route.query.measurement) {
//     searchFormData.path = [route.query.measurement] as string[];
//     handleSearch();
//   } else {
//     handleSearch();
//   }
// });

watch(
  () => canReadWriteData.value,
  (val) => {
    if (val) {
      firstLoad.value = true;
      handleReset();
      if (route.query.measurement) {
        searchFormData.path = [route.query.measurement] as string[];
        handleSearch();
      } else {
        handleSearch();
      }
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.page-container {
  background-color: #fff;
  border-radius: 6px;
  padding: 16px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .el-button:focus-visible {
    outline: none;
  }
}

.search-form-wrapper {
  display: flex;
  width: 100%;

  .search-form-buttons {
    align-self: flex-end;
    display: flex;
    flex-wrap: nowrap;
    margin-right: 0;
  }
}

.search-time-wrapper {
  display: flex;
  align-items: center;

  .search-time-list {
    display: flex;
    margin-right: 12px;
    border-radius: 12px;
    background-color: #f0f1fa;
    padding: 4px;

    .search-time-type {
      padding: 3px 9px;
      cursor: pointer;
      border-radius: 12px;
      background-color: transparent;
      font-size: 12px;
      line-height: 12px;
      color: #656a85;
    }

    .search-time-active {
      background-color: #495ad4;
      color: #fff;
    }
  }
}

.table-empty-wrapper {
  flex: 1;
}

:deep(.el-select-v2__selection) {
  flex-wrap: nowrap;
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
    margin-bottom: 18px;

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
    margin-bottom: 16px;
  }

  .run-result-list {
    display: flex;

    .run-result-item {
      font-size: 12px;
      line-height: 12px;
      color: #131926;
      margin-right: 30px;
      display: flex;
      align-items: center;
    }
  }
}

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 24px;

  .btn-prev,
  .btn-next,
  .btn-first {
    margin: 0 8px 0 0;
    padding: 6px 4px;
    min-width: 56px;
  }
}

.table-error-wrapper {
  min-height: 200px;
  padding: 16px 24px;
  font-size: 12px;
  font-weight: 300;
  line-height: 24px;
  color: #424561;
}
</style>
