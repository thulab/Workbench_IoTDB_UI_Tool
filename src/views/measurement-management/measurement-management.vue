<template>
  <div class="storage-page-container">
    <div class="storage-list-wrapper">
      <storage-side
        ref="storageSideRef"
        :can-read-write-schema="canReadWriteSchema"
        :can-manage-database="canManageDatabase"
        @handleAddStorage="storageVisible = true"
        @handleSelectStorage="(val) => (currentStorage = val)"
      />
    </div>

    <div class="storage-details-wrapper">
      <h4 class="storage-info-title">{{ t('measurement.databaseInfo') }}</h4>
      <div class="page-info-box">
        <ul class="storage-info-list">
          <li class="storage-info-item" id="database-name-li">
            <el-icon size="24"><i-custom-storage-num /></el-icon>
            <span class="storage-info-item-label" id="database-name-span">{{ t('measurement.databaseName') }}：</span>
            <text-tooltip :content="canReadWriteSchema ? currentStorage : '-'" />
          </li>
          <li class="storage-info-item storage-info-item-ttl" id="ttl-li">
            <el-icon size="24"><i-custom-time /></el-icon>
            <span class="storage-info-item-label m-r-8" id="ttl-span">
              {{ t('measurement.databaseTTL') }}：
              <el-tooltip effect="light" :content="t('measurement.databaseTTLTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question class="ttl-tip" /></el-tooltip>
            </span>
            <template v-if="!canReadWriteSchema">-</template>
            <template v-else>
              <span v-if="!editTTL">{{ storageInfos?.ttl ? storageInfos.ttl + getTtlTimeUnit(storageInfos.ttlUnit, ttlUnitOptions) : '∞' }}</span>
              <div v-if="currentStorage && editTTL" class="edit-ttl-box">
                <el-input v-model="editTTLModel" min="0" max="9007199254740992" class="ttl-input" style="width: 180px" id="mesaurement-edit-ttl">
                  <template #append>
                    <el-select v-model="editTTLUnitModel" class="ttl-input unit" clearable placeholder=" " style="width: 100px" id="mesaurement-edit-ttlunit">
                      <el-option :label="t('common.milliSecond')" value="millisecond" id="mesaurement-ttl-ms" />
                      <el-option :label="t('common.second')" value="second" id="mesaurement-ttl-s" />
                      <el-option :label="t('common.minute')" value="minute" id="mesaurement-ttl-m" />
                      <el-option :label="t('common.hour')" value="hour" id="mesaurement-ttl-h" />
                      <el-option :label="t('common.day')" value="day" id="mesaurement-ttl-d" />
                    </el-select>
                  </template>
                </el-input>
                <el-button class="m-l-12" plain @click="editTTL = false" id="mesaurement-ttl-cancel">{{ t('common.cancel') }}</el-button>
                <el-button type="primary" @click="handleConfirmEditTTL" id="mesaurement-ttl-confirm">{{ t('common.confirm') }}</el-button>
              </div>
              <auth-tooltip :is-disabled="canWriteSchemaByPath">
                <el-button link v-if="currentStorage && !editTTL" :disabled="!canWriteSchemaByPath" class="m-l-12" @click="handleEditTTL" id="mesaurement-ttl-edit-button"><i-custom-edit /></el-button>
              </auth-tooltip>
            </template>
          </li>
          <br />
          <li class="storage-info-item" id="device-total-li">
            <el-icon size="24"><i-custom-device-num /></el-icon>
            <span class="storage-info-item-label" id="device-total-span">{{ t('measurement.deviceNum') }}：</span>
            {{ canReadWriteSchema ? storageInfos?.deviceCount || 0 : '-' }}
          </li>
          <li class="storage-info-item" id="measurement-total-li">
            <el-icon size="24"><i-custom-measure-num /></el-icon>
            <span class="storage-info-item-label" id="measurement-total-span">{{ t('measurement.measurementNum') }}：</span>
            {{ canReadWriteSchema ? storageInfos?.measurementCount || 0 : '-' }}
          </li>
          <!-- eslint-disable-next-line vue/max-len -->
          <!-- <li class="storage-info-item" id="data-total-li"><el-icon size="24"><i-custom-total-num /></el-icon><span class="storage-info-item-label" id="data-total-span">{{ t('measurement.totalNum') }}：</span>{{ canReadWriteSchema ? (!storageInfos?.dataCount || storageInfos?.dataCount < 0 ? 0 : storageInfos?.dataCount) : '-'}}</li> -->
        </ul>

        <div class="page-detail-buttons">
          <auth-tooltip :is-disabled="canManageDatabase">
            <el-button
              plain
              class="el-button-delete"
              :disabled="!currentStorage || currentStorage === 'root.__system' || !canManageDatabase"
              @click="handleDelStorage"
              id="mesaurement-top-delete-databse"
            >
              {{ t('common.delete') }}
            </el-button>
          </auth-tooltip>
        </div>
      </div>

      <h4 class="storage-info-title">{{ t('measurement.measurementList') }}</h4>
      <div class="search-form-container">
        <div class="search-form-box">
          <el-input v-model="searchKeyword" :placeholder="searchPlaceholder" @keyup.enter="handleRefresh" id="mesaurement-search" style="width: 340px">
            <template #prefix>
              <i-custom-search-icon class="remote-select-search-icon" @click="handleRefresh" />
            </template>
            <template #prepend>
              <el-select v-model="searchType" style="width: 160px" placeholder="" id="measurement-search-type">
                <el-option :label="t('measurement.measurementName')" value="name" id="measurement-search-type-name" />
                <el-option :label="t('measurement.measurementDescription')" value="description" id="measurement-search-type-description" />
              </el-select>
            </template>
          </el-input>
        </div>

        <div class="search-form-buttons">
          <auth-tooltip :is-disabled="canWriteSchemaByParentPath">
            <el-button type="primary" :disabled="!currentStorage || currentStorage === 'root.__system' || !canWriteSchemaByParentPath" @click="handleAddMeasure" id="mesaurement-add">
              {{ t('common.create') }}
            </el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canWriteSchemaByParentPath">
            <el-button class="m-l-16" :disabled="!currentStorage || currentStorage === 'root.__system' || !canWriteSchemaByParentPath" @click="handleImport" id="mesaurement-import">
              {{ t('common.import') }}
            </el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canReadWriteSchema">
            <el-dropdown class="m-x-16" :disabled="!currentStorage || !(totalCount > 0) || !canReadWriteSchema" @command="(val) => handleCommandDown(val)" id="mesaurement-download-dropdown">
              <el-button class="export-button" :disabled="!currentStorage || !(totalCount > 0) || !canReadWriteSchema" id="mesaurement-download">
                {{ t('common.export') }}
                <el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question class="export-tip" /></el-tooltip>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv" id="mesaurement-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                  <el-dropdown-item command="xlsx" id="mesaurement-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canWriteSchema">
            <el-button :disabled="!currentStorage || multipleSelection.length === 0 || !canWriteSchema" type="primary" @click="handleDelRow('batch', null)" id="mesaurement-batch-del">
              {{ t('common.batchDelete') }}
            </el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canReadWriteSchema">
            <el-button :disabled="!currentStorage || !canReadWriteSchema" link @click="handleRefresh" id="mesaurement-refresh"><i-custom-refresh style="width: 24px; height: 24px" /></el-button>
          </auth-tooltip>
        </div>
      </div>
      <auth-container :is-auth="canReadWriteSchema" style="height: calc(100% - 222px)">
        <div class="storage-table-box">
          <el-table
            :data="tableData.measurements"
            v-loading="loading"
            style="width: 100%"
            :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            tooltip-effect="light"
            ref="tableRef"
            :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" :selectable="isSelectabled" />
            <el-table-column :label="t('measurement.deviceName')" prop="deviceName" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column :label="t('measurement.measurementName')" prop="timeseries" width="160" align="center" show-overflow-tooltip />
            <el-table-column :label="t('measurement.measurementDescription')" prop="alias" width="200" align="center">
              <template #default="{ row }">
                <div class="row-description-box">
                  <div class="row-description-text">
                    <text-tooltip :content="row.description || ''" />
                  </div>
                  <div v-if="row.viewType !== 'VIEW'" class="edit-box flex-align-center" @click="handleEditDescription(row)">
                    <i-custom-edit-normal class="edit-icon" />
                    <i-custom-edit-active class="edit-icon-active" />
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('measurement.dataType')" prop="dataType" width="140" align="center" show-overflow-tooltip />
            <el-table-column :label="t('measurement.measurementType')" prop="viewType" width="200" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.viewType === 'VIEW' ? `${pageText}` : t('measurement.baseMeasurement') }}
              </template>
            </el-table-column>
            <el-table-column :label="t('measurement.encoding')" prop="encoding" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column :label="t('measurement.compression')" prop="compression" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column :label="t('measurement.lastValue')" prop="value" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column :label="t('measurement.lastValueTime')" prop="valueTime" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column :label="t('common.operation')" width="240" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleRowData(row)" :id="`mesaurement-table-${row.deviceName}.${row.timeseries}-data`">{{ t('page.data') }}</el-button>
                <el-button
                  type="primary"
                  v-if="appType === 1"
                  link
                  size="small"
                  :disabled="currentStorage === 'root.__system'"
                  @click="handleRowAlarm(row)"
                  :id="`mesaurement-table-${row.deviceName}.${row.timeseries}-alarm`"
                >
                  {{ t('page.alarm') }}
                </el-button>
                <el-button
                  type="primary"
                  link
                  size="small"
                  :disabled="currentStorage === 'root.__system' || row.dataType === 'TEXT'"
                  @click="handleRowTrend(row)"
                  :id="`mesaurement-table-${row.deviceName}.${row.timeseries}-trend`"
                >
                  {{ t('page.trend') }}
                </el-button>
                <auth-tooltip :is-disabled="rowCanWriteSchemaByPath(`${row.deviceName}.${row.timeseries}`)">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    :disabled="currentStorage === 'root.__system' || !rowCanWriteSchemaByPath(`${row.deviceName}.${row.timeseries}`)"
                    @click="handleDelRow('row', row)"
                    :id="`mesaurement-table-${row.deviceName}.${row.timeseries}-del`"
                  >
                    {{ t('common.delete') }}
                  </el-button>
                </auth-tooltip>
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
            class="m-t-20 measurement-table-pagination"
            popper-class="measurement-table-pagination-popper"
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

    <modal-storage v-model:visible="storageVisible" :can-write-schema="canWriteSchema" @handleSave="handleSaveStorage" />

    <modal-measurement v-model:visible="measurementVisible" :group-name="currentStorage" @handleSave="handleSaveMeasurement" />

    <modal-import v-model:visible="importVisible" @handle-close="handleImportClose" />

    <modal-description v-model:visible="descriptionVisible" :measurement="editMeasurement" :description="editDescription" @handleSave="getListData" />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useTableHeight } from '@/composition-api';
import { StorageApi } from '@/api';
import { useUserStore } from '@/stores';
import { getPathAuthList, getParentPathAuthList } from '@/utils/auth';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import StorageSide from './components/storage-side.vue';
import ModalStorage from './components/modal-storage.vue';
import ModalMeasurement from './components/modal-measurement.vue';
import ModalImport from './components/modal-import.vue';
import ModalDescription from './components/modal-description.vue';

const { t } = useI18n();
const appType = Number(import.meta.env.VITE_APP_TYPE);
const pageText = appType === 1 ? t('measurement.calculateMeasurement') : t('measurement.viewMeasurement');
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { canManageDatabase, canWriteSchema, canReadWriteSchema, userAllEntityPrivileges, userAllPathPrivileges } = storeToRefs(userStore);

const ttlUnitOptions = [
  { label: t('common.milliSecond'), value: 'millisecond' },
  { label: t('common.second'), value: 'second' },
  { label: t('common.minute'), value: 'minute' },
  { label: t('common.hour'), value: 'hour' },
  { label: t('common.day'), value: 'day' },
];

const { maxTableHeight } = useTableHeight(400);
const storageSideRef = ref<InstanceType<typeof StorageSide>>();
const currentStorage = ref('');
const searchKeyword = ref((route.query.measurement as string) || '');
const storageInfos = ref<StorageDevice.GetStorageGroupsInfoResponse>({
  groupName: '',
  ttl: undefined,
  ttlUnit: undefined,
  deviceCount: 0,
  measurementCount: 0,
  dataCount: 0,
});
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const multipleSelection = ref<StorageDevice.MeasurementItem[]>([]);
const editTTL = ref(false);
const editTTLModel = ref();
const editTTLUnitModel = ref('day');
const storageVisible = ref(false);
const measurementVisible = ref(false);
const importVisible = ref(false);
const descriptionVisible = ref(false);
const editMeasurement = ref('');
const editDescription = ref('');
const searchType = ref('name');
const searchPlaceholder = computed(() => (searchType.value === 'name' ? t('calculate.namePlaceholder') : t('calculate.descPlaceholder')));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const canReadWriteSchemaByPath = computed(() => {
  if (userAllEntityPrivileges.value.includes('READ_SCHEMA') || userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  if (!currentStorage.value) return false;
  const authList = getPathAuthList(currentStorage.value, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('READ_SCHEMA') || authList.includes('WRITE_SCHEMA');
  }
  return false;
});

const canWriteSchemaByPath = computed(() => {
  if (userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  if (!currentStorage.value) return false;
  const authList = getPathAuthList(currentStorage.value, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('WRITE_SCHEMA');
  }
  return false;
});

const canWriteSchemaByParentPath = computed(() => {
  if (userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  if (!currentStorage.value) return false;
  const authList = getParentPathAuthList(currentStorage.value, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('WRITE_SCHEMA');
  }
  return false;
});

function rowCanWriteSchemaByPath(path: string) {
  if (userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  const authList = getPathAuthList(path, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('WRITE_SCHEMA');
  }
  return false;
}

const { requestFn: deleteStorageGroups } = useRequest(StorageApi.deleteStorageGroups);
const { requestFn: getStorageGroupsInfo } = useRequest(StorageApi.getStorageGroupsInfo);
const { requestFn: upsertDatabaseTTL } = useRequest(StorageApi.upsertDatabaseTTL);
const {
  requestFn: getMeasurementsInfosByFuzzy,
  data: tableData,
  loading,
} = useRequest(StorageApi.getMeasurementsInfosByFuzzy, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    measurements: [],
  },
});
const { requestFn: getBatchLastValue } = useRequest(StorageApi.getBatchLastValue);
const { requestFn: deleteMeasurements } = useRequest(StorageApi.deleteMeasurements);
const { requestFn: exportMeasurementData } = useRequest(StorageApi.exportMeasurementData);

const getTtlTimeUnit = (val: string | undefined, options: Array<{ label: string; value: string }>) => {
  if (!val) return '';
  const data = options.find((f) => f.value === val);
  return data ? data.label : '';
};

function isSelectabled() {
  if (currentStorage.value === 'root.__system') {
    return false;
  }
  return true;
}

// 列表接口
function getListData() {
  getMeasurementsInfosByFuzzy({
    dataBaseOrDevice: 'database',
    pathName: currentStorage.value,
    keyword: searchKeyword.value,
    type: searchType.value,
    ...pagination,
  }).then((res) => {
    totalCount.value = res.data.totalCount;
    if (tableData.value.measurements?.length) {
      const timeseriesList: string[] = [];
      const viewTypeList: string[] = [];
      tableData.value.measurements.forEach((item) => {
        timeseriesList.push(`${item.deviceName}.${item.timeseries}`);
        viewTypeList.push(item.viewType || 'BASE');
      });
      getBatchLastValue(timeseriesList, viewTypeList).then((newRes) => {
        if (newRes.data.values.length || newRes.data.timestamps.length) {
          tableData.value.measurements.forEach((item, index) => {
            item.value = newRes.data.values[index] || '-';
            item.valueTime = newRes.data.timestamps[index] || '-';
          });
        }
      });
    }
  });
}

// 存储组详细信息
function getStorageInfo(data: string) {
  getStorageGroupsInfo(data).then((res) => {
    if (res?.code === 0) {
      storageInfos.value = res.data;
    }
  });
}

// 删除数据库
function handleDelStorage() {
  ElMessageBox.confirm(t('measurement.deleteMeasurementTip'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-databse-confirm',
    cancelButtonClass: 'del-databse-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    deleteStorageGroups(currentStorage.value).then((res) => {
      if (res.code === 0) {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        storageSideRef.value?.getStorageList();
      }
    });
  });
}

// 保存数据库
function handleSaveStorage() {
  storageSideRef.value?.getStorageList();
}

// 查询
function handleRefresh() {
  if (!canReadWriteSchema.value) return;
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

// 导出
function handleExportData(exportType: string) {
  exportMeasurementData({
    pathName: currentStorage.value,
    keyword: searchKeyword.value,
    type: searchType.value,
    ...pagination,
  }).then((res) => {
    let url = `/api/file/exportExcelMeasurementData?exportId=${res.data}`;
    if (exportType === 'csv') {
      url = `/api/file/exportCSVMeasurementData?exportId=${res.data}`;
    }
    window.open(url);
  });
}

// 下载
function handleCommandDown(val: string) {
  handleExportData(val);
}

// 新增测点
function handleAddMeasure() {
  measurementVisible.value = true;
}

// 导入
function handleImport() {
  importVisible.value = true;
}

// 删除行
function handleDelRow(type: string, row: StorageDevice.MeasurementItem | null) {
  ElMessageBox.confirm(type === 'batch' ? `${t('measurement.deleteMeasurementBatch')}？` : `${t('measurement.deleteMeasurementSingle')}？`, t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'mesaurement-table-del-confirm',
    cancelButtonClass: 'mesaurement-table-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    let measurementList = [];
    if (type === 'batch') {
      measurementList = multipleSelection.value?.map((i) => `${i.deviceName}.${i.timeseries}`);
    } else {
      measurementList = row?.timeseries ? [`${row.deviceName}.${row.timeseries}`] : [];
    }
    deleteMeasurements(measurementList).then((res) => {
      if (res.code === 0) {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        getStorageInfo(currentStorage.value);
        handleRefresh();
      }
    });
  });
}

function handleRowData(row: StorageDevice.MeasurementItem) {
  router.push({
    name: 'DataSearch',
    query: {
      measurement: `${row.deviceName}.${row.timeseries}`,
    },
  });
}

function handleRowAlarm(row: StorageDevice.MeasurementItem) {
  router.push({
    name: 'AlarmConfig',
    query: {
      measurement: `${row.deviceName}.${row.timeseries}`,
    },
  });
}

function handleRowTrend(row: StorageDevice.MeasurementItem) {
  router.push({
    name: 'TrendDetail',
    query: {
      measurement: `${row.deviceName}.${row.timeseries}`,
    },
  });
}

function handleSelectionChange(vals: StorageDevice.MeasurementItem[]) {
  multipleSelection.value = vals;
}

// 保存物理量
function handleSaveMeasurement() {
  getStorageInfo(currentStorage.value);
  handleRefresh();
}

// 导入物理量
function handleImportClose(reload: boolean) {
  if (reload) {
    storageSideRef.value?.getStorageList(false, currentStorage.value);
  }
}

function handleEditTTL() {
  editTTL.value = true;
  editTTLModel.value = storageInfos.value?.ttl;
  editTTLUnitModel.value = storageInfos.value?.ttlUnit || 'day';
}

function handleConfirmEditTTL() {
  if (editTTLModel.value && !/^[1-9]\d*$/.test(editTTLModel.value)) {
    ElMessage.error({ message: t('measurement.databaseTTLRule'), grouping: true });
    return;
  }
  if (editTTLModel.value && +editTTLModel.value > 9007199254740992) {
    ElMessage.error({ message: t('measurement.databaseTTLSaveMaxRule'), grouping: true });
    return;
  }
  if ((editTTLModel.value && !editTTLUnitModel.value) || (!editTTLModel.value && editTTLUnitModel.value)) {
    ElMessage.error({ message: t('measurement.databaseTTLSaveUnitRule'), grouping: true });
    return;
  }
  const reqObj = {
    groupName: storageInfos.value.groupName,
    ttl: !editTTLModel.value ? undefined : +editTTLModel.value,
    ttlUnit: editTTLUnitModel.value || undefined,
  };
  upsertDatabaseTTL({ ...reqObj }).then((res) => {
    if (res.code === 0) {
      ElMessage.success({ message: `${t('common.updateSuccess')}！`, grouping: true });
      editTTL.value = false;
      getStorageInfo(storageInfos.value.groupName);
    }
  });
}

function handleEditDescription(row: StorageDevice.MeasurementItem) {
  editMeasurement.value = `${row.deviceName}.${row.timeseries}`;
  editDescription.value = row.description || '';
  descriptionVisible.value = true;
}

onMounted(() => {
  searchKeyword.value = (route.query.measurement || '') as string;
});

watch(
  () => currentStorage.value,
  (val, old) => {
    if (val !== old) {
      searchType.value = 'name';
      if (!val) {
        storageInfos.value = {
          groupName: '',
          ttl: undefined,
          ttlUnit: undefined,
          deviceCount: 0,
          measurementCount: 0,
          dataCount: 0,
        };
      } else {
        if (!old) {
          searchKeyword.value = (route.query.measurement || '') as string;
        } else {
          searchKeyword.value = '';
        }
        getStorageInfo(val);
        handleRefresh();
      }
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.storage-page-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.storage-list-wrapper {
  width: 240px;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.storage-details-wrapper {
  width: calc(100% - 256px);
  margin-left: 256px;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }

  .page-info-box {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
  }

  .storage-info-list {
    flex: 1;
  }

  .storage-info-item {
    font-size: 12px;
    line-height: 1.2;
    color: #656a85;
    margin: 0 20px 6px 0;
    display: inline-flex;
    align-items: center;
    width: 160px;

    .storage-info-item-label {
      color: #131926;
      position: relative;
      margin-right: 4px;
      white-space: nowrap;

      .ttl-tip {
        position: absolute;
        right: -2px;
        top: -4px;
      }
    }
  }

  .storage-info-item-ttl {
    width: 480px;
  }
}

.storage-info-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: #495ad4;
  padding: 14px 0 6px 16px;
  border-bottom: 1px solid #dfe1ed;
}

.search-form-container {
  display: flex;
  justify-content: space-between;
  padding: 16px;

  .search-form-box {
    display: flex;
    align-items: center;
  }
}

.storage-table-box {
  margin: 0 16px 16px;
  padding: 16px;
  background-color: #f7f8fc;
}

:deep(.el-select-v2__selection) {
  flex-wrap: nowrap;
}

.batch-operate {
  background: #f0f1fa;
  padding: 6px 16px;
  margin: 0 16px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
}

.select-tip-box {
  display: flex;
  align-items: center;
}

.row-description-box {
  display: flex;
  align-items: center;
  justify-content: center;

  .row-description-text {
    max-width: 120px;
    display: flex;
  }

  .edit-box {
    flex: 0 0 16px;
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    .edit-icon-active {
      display: none;
    }

    &:hover {
      .edit-icon {
        display: none;
      }

      .edit-icon-active {
        display: block;
      }
    }
  }
}
</style>
