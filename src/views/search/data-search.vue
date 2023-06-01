<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline :disabled="getListLoading">
        <el-form-item label="测点选择:" prop="path" :error="errorDeviceTip">
          <template #label>
            测点选择:<el-tooltip effect="light" content="仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select v-model="searchFormData.path" :server-id="serverId" :is-show-view-btn="true" />
        </el-form-item>
        <br>
        <el-form-item label="查询时间:" prop="time">
          <div class="search-time-wrapper">
            <ul class="search-time-list">
              <li :class="['search-time-type', { 'search-time-active': timeType === 'datetime' }]" @click="handleTimeType('datetime')">时间点</li>
              <li :class="['search-time-type', { 'search-time-active': timeType === 'datetimerange' }]" @click="handleTimeType('datetimerange')">时间段</li>
            </ul>
            <div class="search-time-box">
              <el-date-picker
                v-if="timeType === 'datetime'"
                v-model="searchFormData.time"
                type="datetime"
                placeholder="请选择"
                :disabled-date="disabledDate"
                :shortcuts="shortcutsDate"
                :clearable="false"
              />

              <el-date-picker
                v-else
                v-model="searchFormData.datetimerange"
                type="datetimerange"
                range-separator="-"
                unlink-panels
                :disabled-date="disabledDate"
                :shortcuts="shortcutsDaterange"
                :clearable="false"
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="采样周期:" prop="timeInterval">
          <el-input-number v-model="searchFormData.timeInterval" style="width: 65px;" :controls="false" placeholder="" :min="1" :step="1" />
          <el-select v-model="searchFormData.unitInterval" style="width: 80px;" placeholder="">
            <el-option v-for="item in timeUnits" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="采样策略:" prop="aggregation">
          <el-select v-model="searchFormData.aggregation" style="width: 120px;" clearable>
            <el-option v-for="item in aggregateFunctions" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="search-form-buttons">
        <el-button @click="handleReset" :disabled="getListLoading">重 置</el-button>
        <el-button type="primary" @click="handleSearch">{{getListLoading ? '取消查询' : '查 询'}}</el-button>
      </div>

    </div>

    <div class="page-table-details">
      <h4 class="page-info-title">查询详情</h4>
      <div class="page-info-box">
        <ul class="run-result-list">
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
        </ul>

        <div class="page-detail-buttons">
          <el-button @click="handleSearch" :disabled="getListLoading">刷新</el-button>
          <el-dropdown class="more-icon m-l-12" :disabled="getListLoading" v-show="searchDetailInfos.status && tableData.length > 0" @command="val => handleCommandDown(val)">
            <el-button class="export-btn">数据导出<el-tooltip effect="light" content="excel格式最大支持下载量为2G，csv无限制，推荐使用csv格式导出" placement="top"><i-custom-question /></el-tooltip></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="csv">以.csv格式导出</el-dropdown-item>
                <el-dropdown-item command="xlsx">以.xlsx格式导出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
      <div class="table-empty-wrapper" v-if="firstLoad" style="background-color: #fff; height: 400px;">
        <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
        <span class="data-empty-text">无数据</span>
      </div>
      <div :loading="getListLoading">
        <div v-if="searchDetailInfos.status">
          <dynamic-table
            :columns="columns"
            :table-data="tableData"
            :height="tableHeight"
            :max-height="tableHeight"
            :show-pagination="false"
          />
          <div class="pagination-container" v-if="tableData.length > 0">
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
          </div>
        </div>
        <div class="table-error-wrapper" v-if="searchDetailInfos.errMsg">
          Msg: {{ searchDetailInfos.errMsg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash-es';
import { useTableHeight } from '@/composition-api';
import { SearchApi } from '@/api';
import {
  getStartAndEnd, today, getOneDay, getOneInterval, todayNow, getOneIntervalNow,
} from '@/utils/date';
import { formatTimeseries } from '@/utils/format';
import DynamicTable from '@/components/dynamic-table.vue';
import { useServerStore } from '@/stores';

const serverStroe = useServerStore();
const serverId = serverStroe.currentServerId;

const { maxTableHeight } = useTableHeight(420);
const searchFormRef = ref<FormInstance>();
const firstLoad = ref(true);
const timeUnits = [
  { label: '毫秒', value: 'ms' },
  { label: '秒', value: 's' },
  { label: '分钟', value: 'm' },
  { label: '小时', value: 'h' },
  { label: '天', value: 'd' },
];
const aggregateFunctions = [
  { label: '最新值', value: 'last_value' },
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max_value' },
  { label: '最小值', value: 'min_value' },
];
const paginationSizerOptions = [
  { label: '10条/页', value: 10 },
  { label: '20条/页', value: 20 },
  { label: '50条/页', value: 50 },
  { label: '100条/页', value: 100 },
];
const currentQueryTime = ref('');
const timeType = ref('datetime');
const errorDeviceTip = ref('');
const searchFormData = reactive({
  path: [] as string[],
  time: todayNow(),
  datetimerange: getStartAndEnd(0) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  timeInterval: undefined,
  unitInterval: 's',
  aggregation: '',
});
let copySearchFormData = cloneDeep(searchFormData);
const shortcutsDate = [
  {
    text: '今天',
    value: () => todayNow(),
  },
  {
    text: '昨天',
    value: () => getOneDay(1),
  },
  {
    text: '7天前',
    value: () => getOneDay(7),
  },
];
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
const getListLoading = ref(false);

const tableHeight = computed(() => (tableData.value.length > 0 ? maxTableHeight.value : maxTableHeight.value + 60));

// 查询结果
const formatSqlInfo = computed(() => function (filed: string) {
  const data: Partial<Search.QueryDataResult> = searchDetailInfos?.value;
  if (filed === 'status') {
    // eslint-disable-next-line no-nested-ternary
    return data.status === undefined ? '' : (data.status ? '查询成功' : '查询失败');
  } if (filed === 'startQueryTime') {
    return currentQueryTime.value;
  } if (filed === 'queryTime') {
    return data.status ? data.queryTime : '';
  }
  return '';
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

const { requestFn: getList } = useRequest(SearchApi.getDataSearchList);
const { requestFn: exportData } = useRequest(SearchApi.exportData);

let controller = new AbortController();

function getListData() {
  if (copySearchFormData.timeInterval && !copySearchFormData.aggregation) {
    ElMessage.error('采样周期填写的情况下请选择采样策略');
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
  getList(serverId, {
    measurements: copySearchFormData.path,
    startTime,
    endTime,
    aggregation: copySearchFormData.aggregation,
    timeInterval: copySearchFormData.timeInterval || undefined,
    unitInterval: copySearchFormData.unitInterval,
    spage: pagination.columnNum,
    ssize: pagination.columnSize,
    size: pagination.pageSize,
    page: pagination.pageNum,
  }, controller).then((res) => {
    // eslint-disable-next-line no-undef
    const list: DynamicTableColumn[] = [];
    res.data.metaDataList?.forEach((item: string, index: number) => {
      list.push({
        label: item,
        prop: `t${index}`,
        defaultValue: '——',
        fixed: index === 0 ? 'left' : undefined,
        formatHeader: formatTimeseries,
      });
    });
    columns.value = list;
    tableData.value = res.data.valueList?.map((item: any[]) => {
      const obj = {} as Record<string, string>;
      item.forEach((childItem, index) => {
        obj[`t${index}`] = childItem;
      });
      return obj;
    });
    hasNext.value = res.data.hasNext;
    pagination.totalColumnPage = res.data.totalColumnPage;
    pagination.totalColumnCount = res.data.totalColumnCount;
    searchDetailInfos.value = res.data;
  }).finally(() => {
    getListLoading.value = false;
  });
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.time = todayNow();
  searchFormData.datetimerange = getStartAndEnd(0) as [DateModelType, DateModelType];
}

// 查询
function handleSearch() {
  if (!searchFormData.path.length) {
    errorDeviceTip.value = '请输入测点名称后进行搜索';
    return;
  }
  errorDeviceTip.value = '';
  if (getListLoading.value) {
    controller.abort();
    return;
  }
  pagination.pageNum = 1;
  copySearchFormData = cloneDeep(searchFormData);
  getListData();
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

function handleClickPage(type: string) {
  if (type === 'first') {
    pagination.pageNum = 1;
  } else if (type === 'prev') {
    pagination.pageNum--;
  } else {
    pagination.pageNum++;
  }
  getListData();
}

function handleChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
  getListData();
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
    spage: pagination.columnNum,
    ssize: pagination.columnSize,
    size: pagination.pageSize,
    page: pagination.pageNum,
  }).then((res) => {
    let url = `/api/file/exportExcelData?serverId=${serverId}&exportId=${res.data}`;
    if (exportType === 'csv') {
      url = `/api/file/exportCSVData?serverId=${serverId}&exportId=${res.data}`;
    }
    console.log(url, 'url');
    window.open(url);
  });
}

// 切换查询时间类型
function handleTimeType(type: 'datetime' | 'datetimerange') {
  if (timeType.value === type || getListLoading.value) return;
  timeType.value = type;
  searchFormData.time = todayNow();
  searchFormData.datetimerange = getStartAndEnd(0) as [DateModelType, DateModelType];
}
// 下载
function handleCommandDown(val: string) {
  if (!copySearchFormData.path.length) {
    errorDeviceTip.value = '请输入测点名称后进行搜索';
    return;
  }
  handleExportData(val);
}

onMounted(() => {
  firstLoad.value = true;
  handleReset();
});

</script>

<style lang="scss" scoped>
.page-container {
  background-color: #fff;
  border-radius: 6px;
  padding: 16px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  .el-button:focus-visible {
    outline: none;
  }
}

.search-form-wrapper{
  display: flex;
  justify-content: space-between;

  .search-form-buttons{
    align-self: flex-end;
    margin-bottom: 18px;
    flex: 0 0 180px;
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

:deep(.el-select-v2__selection){
  flex-wrap: nowrap;
}

.page-table-details {
  padding: 8px 16px;
  border-radius: 2px;
  background: #f7f8fc;

  .page-info-title {
    font-size: 14px;
    line-height: 20px;
    color: #495ad4;
    margin-bottom: 18px;
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

  .export-btn{
    position: relative;

    svg{
      position: absolute;
      right: 4px;
      top: 4px;
    }
  }
}

.pagination-container{
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 24px;

  .btn-prev, .btn-next, .btn-first{
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
