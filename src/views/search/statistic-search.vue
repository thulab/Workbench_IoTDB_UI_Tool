<template>
  <el-container class="page-container">
    <el-header class="search-form-wrapper p-0" style="height: auto">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline :disabled="getListLoading">
        <base-form-item prop="path" :rules="requiredRules">
          <template #label>
            {{ t('measurement.measurementChoose') }}：
            <el-tooltip effect="light" :content="t('common.searchTipLimit100')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select v-model="searchFormData.path" :disabled-path="(item) => ['TEXT', 'BOOLEAN'].includes(item.dataType)" id="statistic-search-path" />
        </base-form-item>
        <base-form-item :label="`${t('search.searchTime')}：`" prop="datetimerange" class="form-item-last">
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
            id="statistic-search-datetimerange"
          />
        </base-form-item>
      </el-form>
      <div class="search-form-buttons">
        <el-button @click="handleReset" :disabled="getListLoading" id="statistic-search-reset">{{ t('common.reset') }}</el-button>
        <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
          <el-button :disabled="searchFormData.path.length === 0 || !canReadWriteData" type="primary" @click="handleSearch" id="statistic-search-search">
            {{ getListLoading ? t('common.cancel') : t('common.query') }}
          </el-button>
        </auth-tooltip>
      </div>
    </el-header>

    <el-main class="page-table-details">
      <div class="page-info-box">
        <h4 class="page-info-title">{{ t('common.searchDetail') }}</h4>
        <div class="page-detail-buttons">
          <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
            <el-dropdown class="m-r-16" :disabled="getListLoading || tableData.length === 0 || !canReadWriteData" @command="(val) => handleCommandDown(val)" id="statistic-search-download-dropdown">
              <el-button
                :class="[locale === 'en' ? 'export-button' : 'export-spacing-button']"
                id="statistic-search-download"
                :disabled="getListLoading || tableData.length === 0 || !canReadWriteData"
              >
                {{ t('common.export') }}
                <el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv" id="statistic-search-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                  <el-dropdown-item command="xlsx" id="statistic-search-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
            <el-button
              link
              @click="handleSearch"
              :disabled="getListLoading || searchFormData.path.length === 0 || !canReadWriteData"
              id="statistic-search-refresh"
              :class="getListLoading || searchFormData.path.length === 0 || !canReadWriteData ? '' : 'svg-button-hover-color'"
            >
              <i-custom-refresh style="width: 24px; height: 24px" />
            </el-button>
          </auth-tooltip>
        </div>
      </div>

      <auth-container :is-auth="canReadWriteData" style="height: 100%" :content="'common.dataAuth'">
        <el-table
          :data="tableData"
          v-loading="getListLoading"
          style="width: 100%"
          :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
          :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
          tooltip-effect="light"
          ref="tableRef"
          :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
        >
          <el-table-column :label="t('measurement.measurementName')" prop="measurement" min-width="240" align="center" show-overflow-tooltip />
          <el-table-column :label="t('common.minValue')" prop="minValue" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column :label="t('common.minValueTime')" prop="minTime" min-width="180" align="center" show-overflow-tooltip />
          <el-table-column :label="t('common.maxValue')" prop="maxValue" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column :label="t('common.maxValueTime')" prop="maxTime" min-width="190" align="center" show-overflow-tooltip />
          <el-table-column :label="t('common.avg')" prop="avgValue" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column v-if="showAuthCol" :label="t('common.std')" prop="stddev" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column v-if="showAuthCol" :label="t('common.variance')" prop="variance" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column :label="t('common.total')" prop="sumValue" min-width="160" align="center" show-overflow-tooltip />
          <template #empty>
            <div class="table-empty-wrapper">
              <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
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
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import { storeToRefs } from 'pinia';
import { SearchApi } from '@/api';
import { useTableHeight } from '@/composition-api';
import { getStartAndEnd, today, getOneInterval, getOneIntervalNow, formatDate } from '@/utils/date';
import { iotdbShowAuth } from '@/utils/auth';
import { useUserStore, useConnectionStore } from '@/stores';
import ICustomCalender from '~icons/custom/calender.svg';

const { t, locale } = useI18n();
const userStore = useUserStore();
const connectionStore = useConnectionStore();
const { canReadWriteData } = storeToRefs(userStore);
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
const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: 'blur',
  },
]);
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const getListLoading = ref(false);
const timestamp = ref(0);
const tableData = ref<Array<Search.StatisticSearchMinMaxObj & Search.StatisticSearchAvgSumObj>>([]);
const minMaxList = ref<Search.StatisticSearchMinMaxObj[]>([]);
const avgSumList = ref<Search.StatisticSearchAvgSumObj[]>([]);
const tableErrorMessage = ref<string[]>([]);
const totalCount = computed(() => copySearchFormData.path.length);

const searchPaginationPath = computed(() => copySearchFormData.path.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as string[]);

const showAuthCol = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, '1.3.3'));

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
  })
    .then((res) => {
      minMaxList.value = res.data.data || [];
      if (res.data.message) {
        tableErrorMessage.value.push(res.data.message);
      }
    })
    .catch(() => {
      minMaxList.value = [];
    });
}

function getAvgSumData() {
  return getAvgSum({
    measurements: searchPaginationPath.value,
    startTime: formatDate(copySearchFormData.datetimerange[0] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    endTime: formatDate(copySearchFormData.datetimerange[1] as number | string, 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    timestamp: timestamp.value,
  })
    .then((res) => {
      avgSumList.value = res.data.data || [];
      if (res.data.message) {
        tableErrorMessage.value.push(res.data.message);
      }
    })
    .catch(() => {
      avgSumList.value = [];
    });
}

function getListData() {
  getListLoading.value = true;
  tableErrorMessage.value = [];
  Promise.allSettled([getMinMaxData(), getAvgSumData()]).then(() => {
    tableData.value = minMaxList.value.map((item, index) => ({
      measurement: item.measurement,
      minValue: item.minValue || '-',
      minTime: item.minTime || '-',
      maxValue: item.maxValue || '-',
      maxTime: item.maxTime || '-',
      avgValue: avgSumList.value[index].avgValue || '-',
      sumValue: avgSumList.value[index].sumValue || '-',
      stddev: avgSumList.value[index].stddev || '-',
      variance: avgSumList.value[index].variance || '-',
    }));
    if (tableErrorMessage.value.length) {
      ElMessage.error({ message: tableErrorMessage.value[0], grouping: true });
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
      stddev: item.stddev || '-',
      variance: item.variance || '-',
    }));
    getListLoading.value = false;
  });
}

// 重置
function handleReset() {
  searchFormData.path = [];
  searchFormData.datetimerange = getOneIntervalNow(7) as [DateModelType, DateModelType];
  copySearchFormData.path = searchFormData.path;
  copySearchFormData.datetimerange = searchFormData.datetimerange;
  timestamp.value = Number(new Date());
  tableData.value = [];
  minMaxList.value = [];
  avgSumList.value = [];
  tableErrorMessage.value = [];
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

function setStorage() {
  sessionStorage.setItem(
    'statisticSearchStorage',
    JSON.stringify({
      ...copySearchFormData,
    })
  );
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    // eslint-disable-next-line no-underscore-dangle
    if (!window.__isReload__) {
      setStorage();
    } else {
      sessionStorage.setItem('statisticSearchStorage', '');
    }
  });
});

onBeforeUnmount(() => {
  setStorage();
});

watch(
  () => canReadWriteData.value,
  (val) => {
    if (val) {
      if (sessionStorage.getItem('statisticSearchStorage')) {
        if (sessionStorage.getItem('statisticSearchStorage')) {
          const searchData = JSON.parse(sessionStorage.getItem('statisticSearchStorage') as string);
          searchFormData.path = searchData.path;
          searchFormData.datetimerange = searchData.datetimerange;
          if (searchFormData.path.length === 0) return;
          handleSearch();
          return;
        }
      }
    }
    handleReset();
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
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
}
</style>
