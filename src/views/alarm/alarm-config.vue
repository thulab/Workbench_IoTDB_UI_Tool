<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
        <base-form-item :label="`${t('alarm.alarmName')}：`" prop="alarmName">
          <el-input v-model="searchFormData.alarmName" :placeholder="t('alarm.alarmNamePlaceholder')" style="width: 172px;" id="alarm-config-search-name" />
        </base-form-item>
        <base-form-item prop="measurements">
          <template #label>
            {{t('alarm.alarmMeasurement')}}：<el-tooltip effect="light" :content="t('common.searchAllTipLimit100')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select v-model="searchFormData.measurements" filter-system :is-show-view-btn="true" :placeholder="t('alarm.alarmMeasurementPlaceholder')" :viewText="t('dataTrend.choosedMeasurement')" id="alarm-config-search-measurements" />
        </base-form-item>
        <base-form-item prop="alarmLevel">
          <template #label>
            {{t('alarm.alarmLevel')}}：<el-tooltip effect="light" :content="t('alarm.alarmLevelTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
          </template>
          <el-select v-model="searchFormData.alarmLevel" :style="{ color: getLevelColor() }" class="level-select-box" style="width: 80px;" id="alarm-config-search-level">
            <template #prefix>
              <el-icon v-if="searchFormData.alarmLevel" :style="{ color: getLevelColor() }" size="20"><i-custom-alarm-level /></el-icon>
            </template>
            <el-option v-for="item in levelOptions" :key="item.value" :value="item.value" :label="item.name" :id="`alarm-config-search-level-select-${item.value}`">
              <span v-if="item.value" style="display: flex; align-items: center;">
                <el-icon size="20" :style="{ color: item?.paramMap?.color }"><i-custom-alarm-level /></el-icon>
                <span :style="{ color: item?.paramMap?.color }">{{ item.name }}</span>
              </span>
              <span v-else style="margin-left: 18px;">{{ item.name }}</span>
            </el-option>
          </el-select>
        </base-form-item>
        <base-form-item :label="`${t('common.status')}：`" prop="status" class="m-r-0">
          <el-select v-model="searchFormData.status" style="width: 80px;" id="alarm-config-search-status">
            <el-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" :id="`alarm-config-search-status-select-${item.value}`" />
          </el-select>
        </base-form-item>
        <el-row>
          <base-form-item :label="`${t('common.createTime')}：`" prop="createtimerange">
            <el-date-picker
              v-model="searchFormData.createtimerange"
              type="datetimerange"
              range-separator="～"
              unlink-panels
              :disabled-date="disabledDate"
              :shortcuts="shortcutsDaterange"
              :prefix-icon="ICustomCalender"
              id="alarm-config-search-datetimerange-create"
            />
          </base-form-item>
          <base-form-item :label="`${t('common.updateTime')}：`" prop="updatetimerange">
            <el-date-picker
              v-model="searchFormData.updatetimerange"
              type="datetimerange"
              range-separator="～"
              unlink-panels
              :disabled-date="disabledDate"
              :shortcuts="shortcutsDaterange"
              :prefix-icon="ICustomCalender"
              id="alarm-config-search-datetimerange-update"
            />
          </base-form-item>
          <div class="search-form-buttons">
            <auth-tooltip :is-disabled="canUsePipe">
              <el-button @click="handleReset" :disabled="!canUsePipe" id="alarm-config-search-reset">{{ t('common.reset') }}</el-button>
            </auth-tooltip>
            <auth-tooltip :is-disabled="canUsePipe">
              <el-button type="primary" :disabled="!canUsePipe" @click="handleSearch" id="alarm-config-search-search">{{ t('common.query') }}</el-button>
            </auth-tooltip>
          </div>
        </el-row>
      </el-form>
    </div>

    <div class="page-table-details">
      <div class="page-table-title-box">
        <h4 class="page-table-title">{{ t('alarm.alarmConfig') }}</h4>
        <div class="operate-buttons">
          <auth-tooltip :is-disabled="canUsePipe">
            <el-button type="primary" :disabled="!canUsePipe" @click="handleAdd" id="alarm-config-add">{{ t('alarm.newAlarm') }}</el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canUsePipe">
            <el-button :disabled="!multipleSelection.length || !canUsePipe" type="primary" @click="handleDel('batch', null)" id="alarm-config-batch-del">{{ t('common.batchDelete') }}</el-button>
          </auth-tooltip>
        </div>
      </div>
      <auth-container :is-auth="canUsePipe" style="height: 100%;">
        <div class="page-table-box">
          <el-table
            :data="tableData.list"
            v-loading="loading"
            style="width: 100%;"
            :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            tooltip-effect="light"
            ref="tableRef"
            :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
            :default-sort="{ prop: 'createTime', order: 'descending' }"
            @selection-change="handleSelectionChange"
            @sort-change="handleSortChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column :label="t('alarm.alarmMeasurement')" prop="measurement" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.alarmName')" prop="alarmName" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.alarmLevel')" prop="alarmLevel" sortable="custom" width="120" align="center">
              <template #default="{ row }">
                <span v-if="row.alarmLevel" style="display: flex; align-items: center; justify-content: center; margin-left: -20px;">
                  <el-icon size="20" :style="{ color: getLevelColor(row) }"><i-custom-alarm-level /></el-icon>
                  {{ getOptionField(row.alarmLevel, enumStore.alarmLevelEnum) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.createTime')" prop="createTime" sortable="custom" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column :label="t('common.updateTime')" prop="updateTime" sortable="custom" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.alarmDesc')" prop="alarmDesc" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column :label="t('alarm.alarmRules')" prop="alarmRules" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column :label="t('common.status')" prop="status" min-width="90" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                {{ getOptionField(row.status, statusOptions, 'value', 'label') }}
              </template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="140" align="center" fixed="right">
              <template #default="{ row }">
                <div>
                  <el-button v-if="row.status !== 3" type="primary" link size="small" @click="handleStatus(row)" :id="`alarm-config-table-${row.measurement}-status`">{{ row.status === 1 ? t('common.disabled') : t('common.enable') }}</el-button>
                  <el-button :disabled="row.status === 3" type="primary" :style="{ 'margin-left': row.status !== 3 ? '12px' : '40px' }" link size="small" @click="handleEdit(row)" :id="`alarm-config-table-${row.measurement}-edit`">{{ t('common.edit') }}</el-button>
                  <el-button type="primary" link size="small" @click="handleDel('row', row)" :id="`alarm-config-table-${row.measurement}-del`">{{ t('common.delete') }}</el-button>
                </div>
              </template>
            </el-table-column>
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
        </div>
      </auth-container>
    </div>

    <modal-config
      v-model:visible="editVisible"
      :alarm-config-id="alarmConfigId"
      :edit-type="editType"
      @handleSave="handleSaveConfig"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  FormInstance, DateModelType, ElTable,
} from 'element-plus';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import { getOptionField } from '@/utils/format';
import { AlarmApi } from '@/api';
import { useEnumStore, useUserStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ICustomCalender from '~icons/custom/calender.svg';
import ModalConfig from './components/modal-config.vue';

const { t } = useI18n();
const enumStore = useEnumStore();
const route = useRoute();
const userStore = useUserStore();
const {
  canUsePipe,
} = storeToRefs(userStore);

const { maxTableHeight } = useTableHeight(320);
const searchFormRef = ref<FormInstance>();
const tableRef = ref<InstanceType<typeof ElTable>>();
const levelOptions = [{ name: t('common.all'), value: '', paramMap: { color: '#424561', icon: '' } }, ...enumStore.alarmLevelEnum];
const statusOptions = [
  { label: t('common.all'), value: '' },
  { label: t('common.enable'), value: 1 },
  { label: t('common.disabled'), value: 2 },
  { label: t('common.expire'), value: 3 },
];
const searchFormData = reactive({
  orderBy: '',
  asc: '',
  alarmName: '',
  measurements: (route.query.measurement ? [route.query.measurement] : []) as string[],
  createtimerange: null as unknown as [DateModelType, DateModelType],
  updatetimerange: null as unknown as [DateModelType, DateModelType],
  alarmLevel: '',
  status: '',
  createStartTime: null as unknown as DateModelType,
  createEndTime: null as unknown as DateModelType,
  updateStartTime: null as unknown as DateModelType,
  updateEndTime: null as unknown as DateModelType,
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
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const multipleSelection = ref<Alarm.QueryConfigResult[]>([]);
const editVisible = ref(false);
const editType = ref('add');
const alarmConfigId = ref();

const getLevelColor = computed(() => function (data?: Alarm.QueryConfigResult) {
  if (!data) {
    if (searchFormData.alarmLevel) {
      const res = levelOptions.find((f) => f.value === searchFormData.alarmLevel);
      return res?.paramMap?.color;
    }
    return '#424561';
  }
  const res = levelOptions.find((f) => f.value === data.alarmLevel);
  return res?.paramMap?.color;
});

const { requestFn: getAlarmConfigList, data: tableData, loading } = useRequest(AlarmApi.getAlarmConfigList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});
const { requestFn: deleteAlarmConfig } = useRequest(AlarmApi.deleteAlarmConfig);
const { requestFn: updateAlarmConfigStatus } = useRequest(AlarmApi.updateAlarmConfigStatus);

function getListData() {
  getAlarmConfigList({
    ...pagination,
    ...searchFormData,
    createStartTime: searchFormData.createtimerange ? dayjs(searchFormData.createtimerange[0]).valueOf() : null,
    createEndTime: searchFormData.createtimerange ? dayjs(searchFormData.createtimerange[1]).valueOf() : null,
    updateStartTime: searchFormData.updatetimerange ? dayjs(searchFormData.updatetimerange[0]).valueOf() : null,
    updateEndTime: searchFormData.updatetimerange ? dayjs(searchFormData.updatetimerange[1]).valueOf() : null,
  }).then((res) => {
    totalCount.value = res.data.totalCount;
  });
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.measurements = [];
}

// 查询
function handleSearch() {
  pagination.pageNum = 1;
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

function handleSelectionChange(vals: Alarm.QueryConfigResult[]) {
  multipleSelection.value = vals;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleSortChange({ column, prop, order }:SortMethod<Alarm.QueryConfigResult>) {
  const lastOrderBy = searchFormData.orderBy;
  const lastAsc = searchFormData.asc;
  searchFormData.asc = order === 'ascending' ? 'asc' : 'desc';
  searchFormData.orderBy = prop;
  if (!order) {
    tableRef.value?.sort(lastOrderBy, lastAsc === 'asc' ? 'descending' : 'ascending');
    return;
  }
  handleSearch();
}

function handleStatus(row: Alarm.QueryConfigResult) {
  const { status } = row;
  updateAlarmConfigStatus(row.alarmConfigId, status === 1 ? 2 : 1).then(() => {
    ElMessage.success(t('common.statusSuccess'));
    row.status = status === 1 ? 2 : 1;
  });
}

function handleAdd() {
  editType.value = 'add';
  alarmConfigId.value = undefined;
  editVisible.value = true;
}

function handleEdit(row: Alarm.QueryConfigResult) {
  editType.value = 'edit';
  alarmConfigId.value = row.alarmConfigId;
  editVisible.value = true;
}

function handleDel(type: string, data: Alarm.QueryConfigResult | null) {
  ElMessageBox.confirm(type === 'batch' ? t('alarm.batchDelete') : t('alarm.singleDelete'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'alarm-config-del-confirm',
    cancelButtonClass: 'alarm-config-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      let alarmConfigIds = [];
      if (type === 'batch') {
        alarmConfigIds = multipleSelection.value?.map((i) => i.alarmConfigId);
      } else {
        alarmConfigIds = data?.alarmConfigId ? [data.alarmConfigId] : [];
      }
      deleteAlarmConfig(alarmConfigIds).then((res) => {
        if (res.code === 0) {
          ElMessage.success(t('common.deleteSuccess'));
          handleSearch();
        }
      });
    });
}

function handleSaveConfig() {
  handleReset();
  handleSearch();
}

onMounted(() => {
  handleReset();
  searchFormData.asc = 'desc';
  searchFormData.orderBy = 'createTime';
  searchFormData.measurements = (route.query.measurement ? [route.query.measurement] : []) as string[];
  if (!canUsePipe.value) return;
  handleSearch();
});

watch(
  () => canUsePipe.value,
  (val) => {
    if (val) {
      handleSearch();
    }
  },
  {
    immediate: true,
  },
);

</script>

<style lang="scss" scoped>

.page-container{
  display: flex;
  flex-direction: column;
}

.search-form-wrapper{
  width: 100%;

  .search-form-buttons{
    margin-bottom: 18px;
    display: inline-flex;
    flex-wrap: nowrap;
    flex: 1;
    justify-content: end;
  }

  :deep(.el-form-item) {
    margin-right: 22px;
  }
}

:deep(.el-select-v2__selection){
  flex-wrap: nowrap;
}

.level-select-box{
  :deep(.el-input__inner) {
    color: unset;
  }
}

.page-table-title-box{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;

  .page-table-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}

.page-table-details{
  display: flex;
  flex-direction: column;
  flex: 1;
}
</style>
