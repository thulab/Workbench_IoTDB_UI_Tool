<template>
  <el-container class="page-container">
    <el-header class="search-form-wrapper search-form-box p-0" style="height: auto">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
        <base-form-item :label="`${t('alarm.alarmName')}：`" prop="alarmName">
          <el-input v-model="searchFormData.alarmName" :placeholder="t('alarm.alarmNamePlaceholder')" style="width: 172px" id="alarm-record-search-name" />
        </base-form-item>
        <base-form-item prop="measurements">
          <template #label>
            {{ t('alarm.alarmMeasurement') }}：
            <el-tooltip effect="light" :content="t('common.searchAllTipLimit100')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select
            v-model="searchFormData.measurements"
            filter-system
            :is-show-view-btn="true"
            :placeholder="t('alarm.alarmMeasurementPlaceholder')"
            :viewText="t('dataTrend.choosedMeasurement')"
            id="alarm-record-search-measurements"
          />
        </base-form-item>
        <base-form-item prop="alarmLevel">
          <template #label>
            {{ t('alarm.alarmLevel') }}：
            <el-tooltip effect="light" :content="t('alarm.alarmLevelTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
          </template>
          <el-select v-model="searchFormData.alarmLevel" :style="{ color: getLevelColor() }" class="level-select-box" style="width: 90px" id="alarm-record-search-level">
            <template #prefix>
              <el-icon v-if="searchFormData.alarmLevel" :style="{ color: getLevelColor() }" size="20"><i-custom-alarm-level /></el-icon>
            </template>
            <el-option v-for="item in levelOptions" :key="item.value" :value="item.value" :label="item.name" :id="`alarm-record-search-level-select-${item.value}`">
              <span v-if="item.value" style="display: flex; align-items: center">
                <el-icon size="20" :style="{ color: item?.paramMap?.color }"><i-custom-alarm-level /></el-icon>
                <span :style="{ color: item?.paramMap?.color }">{{ item.name }}</span>
              </span>
              <span v-else style="margin-left: 18px">{{ item.name }}</span>
            </el-option>
          </el-select>
        </base-form-item>
        <base-form-item :label="`${t('alarm.alarmTime')}：`" prop="createtimerange">
          <el-date-picker
            v-model="searchFormData.createtimerange"
            type="datetimerange"
            range-separator="-"
            unlink-panels
            :disabled-date="disabledDate"
            :shortcuts="shortcutsDaterange"
            :prefix-icon="ICustomCalender"
            :default-time="[new Date(2024, 3, 28, 0, 0, 0), new Date(2024, 3, 28, 23, 59, 59)]"
            id="alarm-record-search-time"
          />
        </base-form-item>
        <base-form-item :label="`${t('alarm.newStatus')}：`" prop="status">
          <el-switch v-model="searchFormData.status" :active-value="1" :inactive-value="0" style="--el-switch-on-color: #44c795; --el-switch-off-color: #dfe1ed" id="alarm-record-search-status" />
        </base-form-item>
      </el-form>
      <div class="search-form-buttons">
        <el-button @click="handleReset" id="alarm-record-search-reset">{{ t('common.reset') }}</el-button>
        <auth-tooltip :is-disabled="canUsePipe" :content="'common.pipeAuth'">
          <el-button type="primary" :disabled="!canUsePipe" @click="handleSearch" id="alarm-record-search-search">{{ t('common.query') }}</el-button>
        </auth-tooltip>
      </div>
    </el-header>

    <el-main class="page-table-details">
      <div class="page-table-title-box">
        <h4 class="page-table-title">{{ t('alarm.alarmRecord') }}</h4>
        <div class="operate-buttons">
          <auth-tooltip :is-disabled="canUsePipe" :content="'common.pipeAuth'">
            <el-dropdown class="m-r-12" :disabled="!totalCount || !canUsePipe" @command="(val) => handleCommandDown(val)" id="alarm-record-download-dropdown">
              <el-button type="primary" class="export-button" :disabled="!totalCount || !canUsePipe" id="alarm-record-download">
                {{ t('common.export') }}
                <el-tooltip effect="light" :content="t('common.exportTipAll')" placement="top" popper-class="tooltip-box-width"><i-custom-question-white /></el-tooltip>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv" id="alarm-record-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                  <el-dropdown-item command="xlsx" id="alarm-record-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </auth-tooltip>
          <!-- <el-button :disabled="!multipleSelection.length" type="primary" @click="handleDel('batch', null)">{{ t('common.batchDelete') }}</el-button> -->
        </div>
      </div>
      <auth-container :is-auth="canUsePipe" :content="'common.pipeAuth'" style="height: 100%">
        <div class="page-table-box">
          <el-table
            :data="tableData.list"
            v-loading="loading"
            style="width: 100%"
            :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            tooltip-effect="light"
            ref="tableRef"
            :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
            :default-sort="{ prop: 'createTime', order: 'descending' }"
            @selection-change="handleSelectionChange"
            @sort-change="handleSortChange"
          >
            <!-- <el-table-column type="selection" width="55" /> -->
            <el-table-column :label="t('alarm.alarmName')" prop="alarmName" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.alarmLevel')" prop="alarmLevel" sortable="custom" min-width="120" align="center">
              <template #default="{ row }">
                <span v-if="row.alarmLevel" style="display: flex; align-items: center; justify-content: center; margin-left: -20px">
                  <el-icon size="20" :style="{ color: getLevelColor(row) }"><i-custom-alarm-level /></el-icon>
                  {{ getOptionField(row.alarmLevel, enumStore.alarmLevelEnum) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="t('alarm.alarmMeasurement')" prop="measurement" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.alarmValue')" prop="alarmValue" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.alarmTime')" prop="createTime" sortable="custom" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.alarmDesc')" prop="alarmDesc" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.whetherConfirm')" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button v-if="!row.hasRead" type="primary" link size="small" @click="handleStatus(row)" :id="`alarm-record-table-${row.measurement}-confirm`">{{ t('common.ack') }}</el-button>
                <div v-else class="operate-confirm-box">
                  <el-icon size="16" class="p-x-5"><i-custom-success-green /></el-icon>
                  {{ t('common.acked') }}
                </div>
                <!-- <el-button type="primary" link size="small" @click="handleDel('row', row)">{{ t('common.delete') }}</el-button> -->
              </template>
            </el-table-column>
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
        </div>
      </auth-container>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance, DateModelType, ElTable } from 'element-plus';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { getStartAndEnd, today, getOneInterval, getOneIntervalNow } from '@/utils/date';
import { getOptionField } from '@/utils/format';
import { AlarmApi } from '@/api';
import { useEnumStore, useUserStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ICustomCalender from '~icons/custom/calender.svg';

const enumStore = useEnumStore();
const { t, locale } = useI18n();
const { maxTableHeight } = useTableHeight(320);
const searchFormRef = ref<FormInstance>();
const tableRef = ref<InstanceType<typeof ElTable>>();
const levelOptions = computed(() => [{ name: t('common.all'), value: '', paramMap: { color: '#424561', icon: '' } }, ...enumStore.alarmLevelEnum]);
const userStore = useUserStore();
const { canUsePipe } = storeToRefs(userStore);
const searchFormData = reactive({
  orderBy: '',
  asc: '',
  alarmName: '',
  measurements: [] as string[],
  createtimerange: null as unknown as [DateModelType, DateModelType],
  alarmLevel: '',
  status: 0,
  createStartTime: null as unknown as DateModelType,
  createEndTime: null as unknown as DateModelType,
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
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const multipleSelection = ref<Alarm.QueryRecordResult[]>([]);

const getLevelColor = (data?: Alarm.QueryRecordResult) => {
  if (!data) {
    if (searchFormData.alarmLevel) {
      const res = levelOptions.value.find((f) => f.value === searchFormData.alarmLevel);
      return res?.paramMap?.color;
    }
    return '#424561';
  }
  const res = levelOptions.value.find((f) => f.value === data.alarmLevel);
  return res?.paramMap?.color;
};

const {
  requestFn: getAlarmRecordList,
  data: tableData,
  loading,
} = useRequest(AlarmApi.getAlarmRecordList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});
const { requestFn: deleteAlarmRecord } = useRequest(AlarmApi.deleteAlarmRecord);
const { requestFn: exportAlarmRecord } = useRequest(AlarmApi.exportAlarmRecord);
const { requestFn: updateAlarmRecordStatus } = useRequest(AlarmApi.updateAlarmRecordStatus);

function getListData() {
  getAlarmRecordList({
    ...copySearchFormData,
    ...pagination,
    createStartTime: copySearchFormData.createtimerange ? dayjs(copySearchFormData.createtimerange[0]).valueOf() : null,
    createEndTime: copySearchFormData.createtimerange ? dayjs(copySearchFormData.createtimerange[1]).valueOf() : null,
  }).then((res) => {
    if (res.code === 0) {
      totalCount.value = res.data.totalCount;
    }
  });
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.status = 0;
  searchFormData.measurements = [];
  copySearchFormData = cloneDeep(searchFormData);
  tableData.value.list = [];
  totalCount.value = 0;
}

// 查询
function handleSearch() {
  pagination.pageNum = 1;
  copySearchFormData = cloneDeep(searchFormData);
  getListData();
}

function onChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
  getListData();
}

function onChangePage(page: number) {
  pagination.pageNum = page;
  getListData();
}

function handleSelectionChange(vals: Alarm.QueryRecordResult[]) {
  multipleSelection.value = vals;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleSortChange({ column, prop, order }: SortMethod<Alarm.QueryRecordResult>) {
  const lastOrderBy = searchFormData.orderBy;
  const lastAsc = searchFormData.asc;
  searchFormData.asc = order === 'ascending' ? 'asc' : 'desc';
  searchFormData.orderBy = prop;
  copySearchFormData = cloneDeep(searchFormData);
  if (!order) {
    tableRef.value?.sort(lastOrderBy, lastAsc === 'asc' ? 'descending' : 'ascending');
    return;
  }
  handleSearch();
}

// 导出
function handleCommandDown(val: string) {
  exportAlarmRecord({
    ...copySearchFormData,
    ...pagination,
    createStartTime: copySearchFormData.createtimerange ? dayjs(copySearchFormData.createtimerange[0]).valueOf() : null,
    createEndTime: copySearchFormData.createtimerange ? dayjs(copySearchFormData.createtimerange[1]).valueOf() : null,
  }).then((res) => {
    if (res) {
      let url = `/api/file/exportExcelAlarmRecordData?exportId=${res.data}`;
      if (val === 'csv') {
        url = `/api/file/exportCSVAlarmRecordData?exportId=${res.data}`;
      }
      window.open(url);
    }
  });
}

function handleStatus(row: Alarm.QueryRecordResult) {
  updateAlarmRecordStatus(row.alarmTraceId).then(() => {
    ElMessage.success({ message: t('alarm.read'), grouping: true });
    // handleSearch();
    copySearchFormData = cloneDeep(searchFormData);
    getListData();
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleDel(type: string, data: Alarm.QueryRecordResult | null) {
  ElMessageBox.confirm(type === 'batch' ? t('alarm.batchDeleteRecord') : t('alarm.singleDeleteRecord'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'alarm-record-del-confirm',
    cancelButtonClass: 'alarm-record-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    let alarmRecordIds = [];
    if (type === 'batch') {
      alarmRecordIds = multipleSelection.value?.map((i) => i.alarmRecordId);
    } else {
      alarmRecordIds = data?.alarmRecordId ? [data.alarmRecordId] : [];
    }
    deleteAlarmRecord(alarmRecordIds).then((res) => {
      if (res.code === 0) {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        handleSearch();
      }
    });
  });
}

watch(
  () => canUsePipe.value,
  (val) => {
    handleReset();
    searchFormData.asc = 'desc';
    searchFormData.orderBy = 'createTime';
    if (val) {
      handleSearch();
    }
  },
  {
    immediate: true,
  }
);

watch(locale, () => {
  nextTick(() => {
    if (!canUsePipe.value) return;
    handleSearch();
  });
});
</script>

<style lang="scss" scoped>
.search-form-box {
  width: 100%;

  // :deep(.el-form-item) {
  //   margin-right: 36px !important;
  // }

  :deep(.el-switch) {
    height: 28px;
  }

  :deep(.el-switch__core) {
    width: 64px;
    height: 28px;
    border-radius: 14px;
  }

  :deep(.el-switch__action) {
    width: 24px;
    height: 24px;
  }

  :deep(.el-switch.is-checked .el-switch__core .el-switch__action) {
    left: calc(100% - 24px);
  }
}

:deep(.el-select-v2__selection) {
  flex-wrap: nowrap;
}

.level-select-box {
  :deep(.el-input__inner) {
    color: unset;
  }
}

.page-table-title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;

  .page-table-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }
}

.page-table-details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.operate-confirm-box {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #44c795;
}
</style>
