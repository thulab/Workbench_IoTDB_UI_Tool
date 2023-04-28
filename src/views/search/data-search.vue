<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline :disabled="getListLoading">
        <el-form-item label="测点选择:" prop="device" :error="errorDeviceTip">
          <div style="display: flex;">
            <el-input v-model="searchFormData.device" readonly placeholder="请选择测点" />
            <el-button type="primary" class="m-l-12">选择</el-button>
          </div>
        </el-form-item>
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
          <el-select v-model="searchFormData.aggregation" style="width: 120px;" placeholder="">
            <el-option v-for="item in aggregateFunctions" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleReset" :disabled="getListLoading">重 置</el-button>
          <el-button type="primary" @click="handleSearch" :disabled="getListLoading">{{getListLoading ? '取消查询' : '查 询'}}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-table-details">
      <h4 class="page-info-title">查询详情</h4>
      <div class="page-info-box">
        <ul class="run-result-list">
          <li class="run-result-item">查询状态：{{ formatSqlInfo('status') }}</li>
          <li class="run-result-item">开始时间：{{ formatSqlInfo('startQueryTime') }}</li>
          <li class="run-result-item">查询耗时：{{ formatSqlInfo('queryTime') }}</li>
        </ul>

        <div class="page-detail-buttons">
          <el-button @click="handleSearch" :disabled="getListLoading">刷新</el-button>
          <el-dropdown class="more-icon m-l-12" :disabled="getListLoading" v-show="searchDetailInfos.status && totalCount > 0" @command="val => handleCommandDown(val)">
            <el-button><i-ep-download />数据导出</el-button><el-tooltip effect="light" content="excel格式导出时若数据量过大容易出现错误，推荐使用csv格式导出" placement="top"><i-ep-question-filled /></el-tooltip>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="csv">以.csv格式导出</el-dropdown-item>
                <el-dropdown-item command="excel">以.excel格式导出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div style="text-align: right;" class="p-r-10 p-y-10" v-show="searchDetailInfos.status && pagination.totalColumnPage">
        <el-button @click="queryData(pagination.columnNum - 1)" type="success" circle :disabled="pagination.columnNum < 2">
          <template #icon><i-ep-arrow-left-bold /></template>
        </el-button>
        <span class="m-x-10">{{ pagination.columnNum }}/{{ pagination.totalColumnPage }} 列</span>
        <el-button @click="queryData(pagination.columnNum + 1)" type="success" circle :disabled="pagination.columnNum >= pagination.totalColumnPage">
          <template #icon><i-ep-arrow-right-bold /></template>
        </el-button>
      </div>
      <div :loading="getListLoading">
        <dynamic-table
          v-if="searchDetailInfos.status && totalCount > 0"
          :columns="columns"
          :table-data="tableDataPagination"
          :total="totalCount"
          :max-height="maxTableHeight"
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          show-pagination
        />
        <div class="table-empty-wrapper" v-if="searchDetailInfos.status && totalCount === 0">
          暂无数据
        </div>
        <div class="table-error-wrapper" v-if="searchDetailInfos.errMsg">
          {{ searchDetailInfos.errMsg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import dayjs from 'dayjs';
import { useTableHeight } from '@/composition-api';
import { SearchApi } from '@/api';
import {
  getStartAndEnd, today, getOneDay, getOneInterval, todayNow,
} from '@/utils/date';
import { formatTimeseries } from '@/utils/format';
import { handleExport } from '@/utils/export';
import DynamicTable from '@/components/dynamic-table.vue';

const props = defineProps<{
  serverId: string;
}>();

const { maxTableHeight } = useTableHeight(400);
const searchFormRef = ref<FormInstance>();
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
const currentQueryTime = ref('');
const timeType = ref('datetime');
const errorDeviceTip = ref('');
const searchFormData = reactive({
  device: '',
  time: todayNow(),
  datetimerange: getStartAndEnd(0),
  timeInterval: undefined,
  unitInterval: 'h',
  aggregation: 'last_value',
});
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
    value: () => getStartAndEnd(1),
  },
  {
    text: '最近7天',
    value: () => getOneInterval(7),
  },
];
const disabledDate = (time: number) => time > today();

const searchDetailInfos = ref<Partial<Search.QueryDataResult>>({});
const totalCount = ref(0);
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

const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

const { requestFn: getList } = useRequest(SearchApi.getDataSearchList);
const { requestFn: exportData } = useRequest(SearchApi.exportData);

function getListData() {
  columns.value = [];
  tableData.value = [];
  totalCount.value = 0;

  let startTime = 0;
  let endTime = 0;
  if (timeType.value === 'datetime') {
    startTime = dayjs(searchFormData.time).valueOf();
    endTime = dayjs(searchFormData.time).valueOf();
  } else {
    startTime = dayjs(searchFormData.datetimerange[0]).valueOf();
    endTime = dayjs(searchFormData.datetimerange[1]).valueOf();
  }

  searchDetailInfos.value.status = undefined;
  searchDetailInfos.value.queryTime = '';
  currentQueryTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  getListLoading.value = true;
  getList(props.serverId, {
    measurementList: searchFormData.device.split(','),
    startTime,
    endTime,
    aggregation: searchFormData.aggregation,
    timeInterval: searchFormData.timeInterval || undefined,
    unitInterval: searchFormData.unitInterval,
    spage: pagination.columnNum,
    ssize: pagination.columnSize,
  }).then((res) => {
    // eslint-disable-next-line no-undef
    const list: DynamicTableColumn[] = [];
    res.data.metaDataList.forEach((item: string, index: number) => {
      list.push({
        label: item,
        prop: `t${index}`,
        defaultValue: '——',
        fixed: index === 0 ? 'left' : undefined,
        formatHeader: formatTimeseries,
      });
    });
    columns.value = list;
    tableData.value = res.data.valueList.map((item: any[]) => {
      const obj = {} as Record<string, string>;
      item.forEach((childItem, index) => {
        obj[`t${index}`] = childItem;
      });
      return obj;
    });
    totalCount.value = res.data.totalCount;
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
  searchFormData.datetimerange = getStartAndEnd(0);
}

// 查询
function handleSearch() {
  if (!searchFormData.device) {
    errorDeviceTip.value = '请选择物理量后查询';
    return;
  }
  errorDeviceTip.value = '';
  getListData();
}

// 列
function queryData(columnNum?: number) {
  pagination.pageSize = 10;
  pagination.pageNum = 1;
  pagination.columnNum = columnNum || 1;
  pagination.columnSize = 100;
  getListData();
}

// 导出
function handleExportData() {
  let startTime = 0;
  let endTime = 0;
  if (timeType.value === 'datetime') {
    startTime = dayjs(searchFormData.time).valueOf();
    endTime = dayjs(searchFormData.time).valueOf();
  } else {
    startTime = dayjs(searchFormData.datetimerange[0]).valueOf();
    endTime = dayjs(searchFormData.datetimerange[1]).valueOf();
  }
  exportData(props.serverId, {
    measurementList: searchFormData.device.split(','),
    startTime,
    endTime,
    aggregation: searchFormData.aggregation,
    timeInterval: searchFormData.timeInterval || undefined,
    unitInterval: searchFormData.unitInterval,
    spage: pagination.columnNum,
    ssize: pagination.columnSize,
  }).then((res) => {
    if (res) {
      ElMessage.success('导出成功');
      handleExport(res, 'export.CSV');
    } else {
      ElMessage.info('导出未完成');
    }
  }).catch((err) => {
    ElMessage.error(err.message);
  });
}

// 切换查询时间类型
function handleTimeType(type: 'datetime' | 'datetimerange') {
  if (timeType.value === type || getListLoading.value) return;
  timeType.value = type;
  searchFormData.time = todayNow();
  searchFormData.datetimerange = getStartAndEnd(0);
}
// 下载
function handleCommandDown(val: string) {
  if (!searchFormData.device) {
    errorDeviceTip.value = '请选择物理量后查询';
    return;
  }
  if (val === 'csv') {
    handleExportData();
  } else {
    // TODO excel
  }
}

onMounted(() => {
  handleReset();
});

</script>

<style lang="scss" scoped>
.page-container {
  .el-button:focus-visible {
    outline: none;
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
  }

  .run-result-list {
    display: flex;

    .run-result-item {
      font-size: 12px;
      line-height: 12px;
      color: #131926;
      margin-right: 30px;
    }
  }
}

.table-empty-wrapper,
.table-error-wrapper {
  min-height: 200px;
  padding: 16px 12px;
}

</style>
