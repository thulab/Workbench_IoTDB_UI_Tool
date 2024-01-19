<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" label-width="78px" size="default" inline :disabled="getListLoading">
        <base-form-item label="测点选择：" prop="path" class="m-r-40">
          <template #label>
            测点选择：<el-tooltip effect="light" :content="t('common.searchTipLimit100')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select v-model="searchFormData.path" :is-show-view-btn="true" :is-boolean-text-disabled="true" id="statistic-search-path" />
        </base-form-item>
        <base-form-item label="查询时间：" prop="datetimerange" style="margin-right: 0;">
          <el-date-picker
            v-model="searchFormData.datetimerange"
            type="datetimerange"
            range-separator="～"
            unlink-panels
            :disabled-date="disabledDate"
            :shortcuts="shortcutsDaterange"
            :clearable="false"
            :prefix-icon="ICustomCalender"
            id="statistic-search-datetimerange"
          />
        </base-form-item>
      </el-form>
      <div class="search-form-buttons">
        <auth-tooltip :is-disabled="canReadWriteData">
          <el-button @click="handleReset" :disabled="getListLoading || !canReadWriteData" id="statistic-search-reset">{{ t('common.reset') }}</el-button>
        </auth-tooltip>
        <auth-tooltip :is-disabled="canReadWriteData">
          <el-button :disabled="searchFormData.path.length === 0 || !canReadWriteData" type="primary" @click="handleSearch" id="statistic-search-search">{{getListLoading ? '取消查询' : t('common.query') }}</el-button>
        </auth-tooltip>
      </div>
    </div>

    <div class="page-table-details">
      <div class="page-info-box">
        <h4 class="page-info-title">{{ t('common.searchDetail') }}</h4>
        <div class="page-detail-buttons">
          <auth-tooltip :is-disabled="canReadWriteData">
            <el-dropdown class="m-r-16" :disabled="getListLoading || tableData.length === 0 || !canReadWriteData" @command="val => handleCommandDown(val)" id="statistic-search-download-dropdown">
              <el-button class="export-btn" id="statistic-search-download" :disabled="getListLoading || tableData.length === 0 || !canReadWriteData">{{ t('common.export') }}<el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv" id="statistic-search-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                  <el-dropdown-item command="xlsx" id="statistic-search-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canReadWriteData">
            <el-button link @click="handleSearch" :disabled="getListLoading || searchFormData.path.length === 0 || !canReadWriteData" id="statistic-search-refresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
          </auth-tooltip>
        </div>
      </div>

      <auth-container :is-auth="canReadWriteData" style="height: 100%;">
        <el-table
          :data="tableData"
          v-loading="getListLoading"
          style="width: 100%;"
          :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
          :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
          tooltip-effect="light"
          ref="tableRef"
          :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
        >
          <el-table-column label="测点名称" prop="measurement" min-width="240" align="center" show-overflow-tooltip />
          <el-table-column label="最小值" prop="minValue" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column label="最小值时间" prop="minTime" min-width="180" align="center" show-overflow-tooltip />
          <el-table-column label="最大值" prop="maxValue" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column label="最大值时间" prop="maxTime" min-width="180" align="center" show-overflow-tooltip />
          <el-table-column label="平均值" prop="avgValue" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column label="总和" prop="sumValue" min-width="160" align="center" show-overflow-tooltip />
          <template #empty>
            <div class="table-empty-wrapper">
              <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
              <span class="data-empty-text">{{ t('common.noData') }}</span>
            </div>
          </template>
        </el-table>

        <el-pagination
          v-if="totalCount > 0"
          v-model:currentPage="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          class="m-t-20"
          layout="prev, pager, next, sizes, jumper"
          background
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          @size-change="onChangePageSize"
          @current-change="onChangePage"
        />
      </auth-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import { storeToRefs } from 'pinia';
import { SearchApi } from '@/api';
import { useTableHeight } from '@/composition-api';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow, formatDate,
} from '@/utils/date';
import { useUserStore } from '@/stores';
import ICustomCalender from '~icons/custom/calender.svg';

const { t } = useI18n();
const userStore = useUserStore();
const {
  canReadWriteData,
} = storeToRefs(userStore);
const { maxTableHeight } = useTableHeight(280);

const searchFormRef = ref<FormInstance>();
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const searchFormData = reactive({
  path: [] as string[],
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
});
const copySearchFormData = reactive({
  path: [] as string[],
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
});
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
const getListLoading = ref(false);
const timestamp = ref(0);
const tableData = ref<Array<Search.StatisticSearchMinMaxObj & Search.StatisticSearchAvgSumObj>>([]);
const minMaxList = ref<Search.StatisticSearchMinMaxObj[]>([]);
const avgSumList = ref<Search.StatisticSearchAvgSumObj[]>([]);
const tableErrorMessage = ref<string[]>([]);
const totalCount = computed(() => copySearchFormData.path.length);

const searchPaginationPath = computed(() => copySearchFormData.path.slice(
  ((pagination.pageNum || 1) - 1) * pagination.pageSize,
  (pagination.pageNum || 1) * pagination.pageSize,
) as string[]);

const { requestFn: getMinMax } = useRequest(SearchApi.getStatisticSearchMinMax);
const { requestFn: getAvgSum } = useRequest(SearchApi.getStatisticSearchAvgSum);
const { requestFn: getStatisticData } = useRequest(SearchApi.getStatisticData);
const { requestFn: exportStatisticData } = useRequest(SearchApi.exportStatisticData);

function getMinMaxData() {
  return getMinMax({
    measurements: searchPaginationPath.value,
    startTime: formatDate(copySearchFormData.datetimerange[0] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    endTime: formatDate(copySearchFormData.datetimerange[1] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    timestamp: timestamp.value,
  }).then((res) => {
    minMaxList.value = res.data.data || [];
    if (res.data.message) {
      tableErrorMessage.value.push(res.data.message);
    }
  });
}

function getAvgSumData() {
  return getAvgSum({
    measurements: searchPaginationPath.value,
    startTime: formatDate(copySearchFormData.datetimerange[0] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    endTime: formatDate(copySearchFormData.datetimerange[1] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    timestamp: timestamp.value,
  }).then((res) => {
    avgSumList.value = res.data.data || [];
    if (res.data.message) {
      tableErrorMessage.value.push(res.data.message);
    }
  });
}

function getListData() {
  tableData.value = [];
  minMaxList.value = [];
  avgSumList.value = [];
  tableErrorMessage.value = [];
  getListLoading.value = true;
  Promise.allSettled([
    getMinMaxData(),
    getAvgSumData(),
  ]).then(() => {
    tableData.value = minMaxList.value.map((item, index) => ({
      measurement: item.measurement,
      minValue: item.minValue || '-',
      minTime: item.minTime || '-',
      maxValue: item.maxValue || '-',
      maxTime: item.maxTime || '-',
      avgValue: avgSumList.value[index].avgValue || '-',
      sumValue: avgSumList.value[index].sumValue || '-',
    }));
    if (tableErrorMessage.value.length) {
      ElMessage.error(tableErrorMessage.value[0]);
    }
    getListLoading.value = false;
  });
}

// 批量查询列表数据
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getListDataBatch() {
  getListLoading.value = true;
  getStatisticData({
    measurements: searchPaginationPath.value,
    startTime: formatDate(copySearchFormData.datetimerange[0] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    endTime: formatDate(copySearchFormData.datetimerange[1] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    timestamp: timestamp.value,
  }).then((res) => {
    tableData.value = res.data?.map((item) => ({
      measurement: item.measurement,
      minValue: item.minValue || '-',
      minTime: item.minTime || '-',
      maxValue: item.maxValue || '-',
      maxTime: item.maxTime || '-',
      avgValue: item.avgValue || '-',
      sumValue: item.sumValue || '-',
    }));
    getListLoading.value = false;
  });
}

// 重置
function handleReset() {
  searchFormData.path = [];
  searchFormData.datetimerange = getOneIntervalNow(7) as [DateModelType, DateModelType];
}

// 查询
function handleSearch() {
  if (getListLoading.value) return;
  pagination.pageNum = 1;
  copySearchFormData.path = searchFormData.path;
  copySearchFormData.datetimerange = searchFormData.datetimerange;
  timestamp.value = Number(new Date());
  getListData();
  // getListDataBatch();
}

function onChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
  getListData();
  // getListDataBatch();
}

function onChangePage(page: number) {
  pagination.pageNum = page;
  getListData();
  // getListDataBatch();
}

// 下载
function handleCommandDown(val: string) {
  exportStatisticData({
    measurements: copySearchFormData.path,
    startTime: formatDate(copySearchFormData.datetimerange[0] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    endTime: formatDate(copySearchFormData.datetimerange[1] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    timestamp: timestamp.value,
  }).then((res) => {
    let url = `/api/file/exportExcelStatistics?exportId=${res.data}`;
    if (val === 'csv') {
      url = `/api/file/exportCSVStatistics?exportId=${res.data}`;
    }
    window.open(url);
  });
}

onMounted(() => {
  handleReset();
});

</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;

  .el-button:focus-visible {
    outline: none;
  }
}

.search-form-wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  height: 50px;
}

.page-table-details {
  padding: 16px 16px 10px;
  border-radius: 2px;
  background: #f7f8fc;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;

  .page-info-title {
    font-size: 14px;
    line-height: 21px;
    color: #495ad4;
    font-weight: 700;
  }

  .page-info-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .export-btn{
    position: relative;

    svg{
      position: absolute;
      right: 4px;
      top: 2px;
    }
  }
}
</style>
