<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline :disabled="getListLoading">
        <el-form-item label="设备及物理量选择:" prop="device" :error="errorDeviceTip">
          <el-input v-model="searchFormData.device" placeholder="请选择存储组及设备" />
        </el-form-item>
        <el-form-item label="查询时间:" prop="time">
          <div class="search-time-wrapper">
            <ul class="search-time-list">
              <li :class="['search-time-type', {'search-time-active': timeType === 'datetime'}]" @click="handleTimeType('datetime')">时间点</li>
              <li :class="['search-time-type', {'search-time-active': timeType === 'datetimerange'}]" @click="handleTimeType('datetimerange')">时间段</li>
            </ul>
            <div class="search-time-box">
              <el-date-picker
                v-if="timeType === 'datetime'"
                v-model="searchFormData.time"
                type="datetime"
                placeholder="请选择"
                :disabled-date="disabledDate"
                :shortcuts="shortcutsDate"
              />

              <el-date-picker
                v-else
                v-model="searchFormData.datetimerange"
                type="datetimerange"
                range-separator="-"
                :disabled-date="disabledDate"
                :shortcuts="shortcutsDaterange"
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
      <el-descriptions title="查询详情" :column="4">
        <el-descriptions-item label="查询状态:">{{ searchDetailInfos.searchStatus || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间:">{{ searchDetailInfos.searchStartTime }}</el-descriptions-item>
        <el-descriptions-item label="查询耗时:">{{ searchDetailInfos.searchPayTime }}</el-descriptions-item>
        <el-descriptions-item label="查询结果:">{{ searchDetailInfos.searchResult }}</el-descriptions-item>
      </el-descriptions>

      <div class="page-detail-buttons">
        <el-button @click="handleSearch" :disabled="getListLoading">刷新</el-button>
        <el-button @click="handleExport" :disabled="getListLoading"  v-show="searchDetailInfos.searchStatus === 'success' && totalCount > 0">数据导出</el-button>
      </div>
    </div>
    <div style="text-align: right;" class="p-r-10 p-y-10" v-show="searchDetailInfos.searchStatus === 'success' && pagination.totalColumnPage">
      <el-button @click="queryData(pagination.pageNum, pagination.columnNum - 1)" type="success" circle :disabled="pagination.columnNum < 2">
        <template #icon><i-ep-arrow-left-bold /></template>
      </el-button>
      <span class="m-x-10">{{ pagination.columnNum }}/{{ pagination.totalColumnPage }} 列</span>
      <el-button @click="queryData(pagination.pageNum, pagination.columnNum + 1)" type="success" circle :disabled="pagination.columnNum >= pagination.totalColumnPage">
        <template #icon><i-ep-arrow-right-bold /></template>
      </el-button>
    </div>
    <div v-loading="getListLoading">
      <dynamic-table
        v-if="searchDetailInfos.searchStatus === 'success' && totalCount > 0"
        :columns="columns"
        :table-data="tableData"
        :total="totalCount"
        :max-height="maxTableHeight"
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        show-pagination
        @load-data="getListData"
      />
      <div class="table-empty-wrapper" v-if="searchDetailInfos.searchStatus === 'success' && totalCount === 0">
        暂无数据
      </div>
      <div class="table-error-wrapper" v-if="searchDetailInfos.searchStatus === 'error'">
        {{ tableErrorMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import dayjs from 'dayjs';
import { useTableHeight } from '@/composition-api';
import { SearchApi } from '@/api';
import { getStartAndEnd, today, getOneDay, getOneInterval, todayNow } from '@/utils/date';
import { formatTimeseries } from '@/utils/format';
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
const timeType = ref('datetime');
const errorDeviceTip = ref('');
const searchFormData = reactive<Search.GetDataSearchListParams>({
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
]
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
]
const disabledDate = (time: number) => time > today();
const searchDetailInfos = reactive({
  searchStatus: '',
  searchStartTime: '',
  searchPayTime: '',
  searchResult: '',
})
const totalCount = ref(0);
const columns = ref<DynamicTableColumn[]>([]);
const tableData = ref<Record<string, any>[]>([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  columnSize: 100,
  columnNum: 1,
  totalCount: 0,
  totalPage: 0,
  totalColumnPage: 0,
  totalColumnCount: 0,
});
const tableErrorMsg = ref('');
const getListLoading = ref(false);

const { requestFn: getList } = useRequest(SearchApi.getDataSearchList);

function getListData() {
  columns.value = [];
  tableData.value = [];
  tableErrorMsg.value = '';
  totalCount.value = 0;

  const params = {
    pageSize: pagination.pageSize,
    pageNum: pagination.pageNum,
    columnNum: pagination.columnNum,
    columnSize: pagination.columnSize,
  };
  let payData: Record<string, any> = {
    time: '',
    startTime: '',
    endTime: '',
  }
  if (timeType.value === 'datetime') {
    payData.time = searchFormData.time || ''
  } else {
    if (searchFormData.datetimerange && searchFormData.datetimerange.length > 0) {
      payData.startTime = searchFormData.datetimerange[0]
      payData.endTime = searchFormData.datetimerange[1]
    } else {
      payData.startTime = ''
      payData.endTime = ''
    }
  }

  searchDetailInfos.searchStatus = '';
  searchDetailInfos.searchStartTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
  searchDetailInfos.searchPayTime = '';
  searchDetailInfos.searchResult = '';

  getListLoading.value = true;
  getList({
    serverId: props.serverId,
    ...params,
  }, {
    ...payData,
    aggregation: searchFormData.aggregation,
    timeInterval: searchFormData.timeInterval || null,
    unitInterval: searchFormData.unitInterval,
  }).then((res) => {
    searchDetailInfos.searchStatus = 'success';
    // eslint-disable-next-line no-undef
    const list: DynamicTableColumn[] = [];
    res.data.metaDataList.forEach((item: string, index: number) => {
      list.push({
        label: item,
        prop: `t${index}`,
        defaultValue: '——',
        icon: index ? res.data.typeList[index] : 'TIME',
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
    pagination.totalCount = res.data.totalCount;
    pagination.totalPage = res.data.totalPage;
    pagination.totalColumnPage = res.data.totalColumnPage;
    pagination.totalColumnCount = res.data.totalColumnCount;
    searchDetailInfos.searchResult = `${res.data.totalCount}行${res.data.totalColumnCount}列`;
  }).catch(err => {
    searchDetailInfos.searchStatus = 'error';
    tableErrorMsg.value = err.message;
  }).finally(() => {
    getListLoading.value = false;
  });
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.time = undefined;
  searchFormData.datetimerange = undefined;
}

// 查询
function handleSearch() {
  if (!searchFormData.device) {
    errorDeviceTip.value = '请选择物理量后查询';
    return;
  } else {
    errorDeviceTip.value = '';
  }
  getListData();
}

// 列
function queryData(pageNum?: number, columnNum?: number) {
  pagination.pageSize = 10;
  pagination.pageNum = pageNum || 1;
  pagination.columnNum = columnNum || 1;
  pagination.columnSize = 100;
  getListData();
}

// 导出
function handleExport() {}

// 切换查询时间类型
function handleTimeType(type: 'datetime' | 'datetimerange') {
  if (timeType.value === type || getListLoading.value) return;
  timeType.value = type;
  searchFormData.time = undefined;
  searchFormData.datetimerange = undefined;
}

onMounted(() => {
  console.log(getStartAndEnd(0));
  handleReset();
});

</script>

<style lang="scss" scoped>
.search-time-wrapper {
  display: flex;
  align-items: center;

  .search-time-list {
    display: flex;
    margin-right: 12px;

    .search-time-type {
      padding: 0 8px;
      cursor: pointer;
      border-radius: 4px;
    }

    .search-time-active {
      background-color: #eee;
      color: #495ad4;
    }
  }
}

.page-table-details {
  display: flex;
  justify-content: space-between;
  border: 1px solid #eee;
  padding: 12px;

  :deep(.el-descriptions__cell) {
    padding-right: 20px;
  }

  .page-detail-buttons {
    align-self: flex-end;
  }
}

.table-empty-wrapper,
.table-error-wrapper {
  min-height: 200px;
  padding: 16px 12px;
}

</style>
