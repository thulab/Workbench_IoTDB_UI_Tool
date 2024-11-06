<template>
  <div class="database-detail-wrapper">
    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px)">
        <text-tooltip :content="currentDatabase" />
      </div>
      {{ t('measurement.info') }}
    </h4>
    <div class="database-info-box" v-loading="infoLoading">
      <ul class="database-info-list">
        <li class="database-info-item" id="device-total-li">
          <!-- <el-icon size="24"><i-custom-device-num /></el-icon> -->
          <span class="database-info-item-label" id="device-total-span">{{ t('measurement.deviceNum') }}：</span>
          {{ canReadWriteSchemaByPath ? databaseInfos?.deviceCount || 0 : t('common.noAuth') }}
        </li>
        <li class="database-info-item" id="measurement-total-li">
          <!-- <el-icon size="24"><i-custom-measure-num /></el-icon> -->
          <span class="database-info-item-label" id="measurement-total-span">{{ t('measurement.measurementNum') }}：</span>
          {{ canReadWriteSchemaByPath ? databaseInfos?.measurementCount || 0 : t('common.noAuth') }}
        </li>
      </ul>

      <auth-tooltip :is-disabled="canManageDatabase || currentDatabase === 'root' || currentDatabase === 'root.__system'" :content="'common.databaseAuth'">
        <el-button
          plain
          class="el-button-delete"
          :disabled="!currentDatabase || currentDatabase === 'root' || currentDatabase === 'root.__system' || !canManageDatabase"
          @click="handleDelDatabase"
          id="mesaurement-top-delete-databse"
        >
          {{ t('common.delete') }}
        </el-button>
      </auth-tooltip>
    </div>

    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px)">
        <text-tooltip :content="currentDatabase" />
      </div>
      {{ t('measurement.list') }}
    </h4>
    <div class="search-form-container">
      <div class="search-form-box">
        <el-input v-model="searchKeyword" :placeholder="searchPlaceholder" @keyup.enter="handleRefresh" id="mesaurement-search" style="width: 340px">
          <template #prefix>
            <i-custom-search-icon class="remote-select-search-icon" @click="handleRefresh" />
          </template>
          <template #prepend>
            <el-select v-model="searchType" style="width: 88px" placeholder="" id="measurement-search-type" class="measurement-search-type-select">
              <el-option :label="t('measurement.measurementName2')" value="name" id="measurement-search-type-name" />
              <el-option :label="t('measurement.measurementDescription2')" value="description" id="measurement-search-type-description" />
            </el-select>
          </template>
        </el-input>
      </div>

      <div class="search-form-buttons">
        <auth-tooltip :is-disabled="canWriteSchemaByPath" :content="'common.schemaAuthAnother'">
          <el-button type="primary" :disabled="!currentDatabase || currentDatabase === 'root.__system' || !canWriteSchemaByPath" @click="handleAddMeasure" id="mesaurement-add">
            {{ t('common.create') }}
          </el-button>
        </auth-tooltip>
        <auth-tooltip :is-disabled="canWriteSchema" :content="'common.schemaAuthAnother'">
          <el-button class="m-l-16" :disabled="!currentDatabase || currentDatabase === 'root.__system' || !canWriteSchema" @click="handleImport" id="mesaurement-import">
            {{ t('common.import') }}
          </el-button>
        </auth-tooltip>
        <auth-tooltip :is-disabled="canReadWriteSchemaByPath" :content="'common.schemaAuth'">
          <el-dropdown class="m-x-16" :disabled="!currentDatabase || !(totalCount > 0) || !canReadWriteSchemaByPath" @command="(val) => handleCommandDown(val)" id="mesaurement-download-dropdown">
            <el-button :class="[locale === 'en' ? 'export-button' : 'export-spacing-button']" :disabled="!currentDatabase || !(totalCount > 0) || !canReadWriteSchemaByPath" id="mesaurement-download">
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
        <auth-tooltip :is-disabled="canWriteSchemaByPath" :content="'common.schemaAuthAnother'">
          <el-button
            :disabled="!currentDatabase || multipleSelection.length === 0 || !canWriteSchemaByPath || selectSystemDatabase"
            type="primary"
            @click="handleDelRow('batch', null)"
            id="mesaurement-batch-del"
          >
            {{ t('common.batchDelete') }}
          </el-button>
        </auth-tooltip>
        <auth-tooltip :is-disabled="canReadWriteDataByPath" :content="'common.dataAuth'">
          <el-button
            :disabled="!currentDatabase || !canReadWriteDataByPath"
            link
            @click="handleRefresh"
            id="mesaurement-refresh"
            :class="!currentDatabase || !canReadWriteDataByPath ? '' : 'svg-button-hover-color'"
          >
            <i-custom-refresh style="width: 24px; height: 24px" />
          </el-button>
        </auth-tooltip>
        <auth-tooltip :is-disabled="canReadWriteSchemaByPath" :content="'common.schemaAuth'">
          <el-button
            link
            :class="[canReadWriteSchemaByPath ? 'svg-button-hover-color' : '', 'm-l-4']"
            :disabled="!canReadWriteSchemaByPath"
            ref="colButtonRef"
            id="measurement-column-filter"
            v-click-outside="handleClickOutside"
          >
            <i-custom-filter style="width: 24px; height: 24px" />
          </el-button>
        </auth-tooltip>
        <el-popover
          placement="bottom"
          :width="156"
          popper-class="col-filter-popover-box"
          ref="colPopoverRef"
          :virtual-ref="colButtonRef"
          trigger="click"
          virtual-triggering
          @before-enter="handleBeforeEnter"
        >
          <el-checkbox-group v-model="checkedCols" @change="handleChangeCol" class="column-box">
            <el-checkbox
              v-for="item in allColumns"
              :key="item.prop"
              class="column-item flex-align-center"
              :value="item.prop"
              :id="`measurement-column-checkbox-${item.prop}`"
              :disabled="item.prop === 'timeseries'"
            >
              {{ t(item.label) }}
            </el-checkbox>
          </el-checkbox-group>
          <div class="filter-operate-box flex-justify-between">
            <el-checkbox
              v-model="isCheckAll"
              :indeterminate="isIndeterminate"
              :label="t('common.allChoose')"
              @change="handleCheckedAll"
              class="filter-operate-checkbox-all"
              id="measurement-column-checkbox-all"
            />
            <div class="filter-operate-buttons">
              <el-button @click="handleResetCol" id="measurement-column-checkbox-reset">{{ t('common.reset') }}</el-button>
              <el-button @click="handleConfirmCol" type="primary" class="m-l-8" id="measurement-column-checkbox-confirm">{{ t('common.confirm') }}</el-button>
            </div>
          </div>
        </el-popover>
      </div>
    </div>
    <auth-container :is-auth="canReadWriteSchemaByPath" :content="'common.schemaAuth'" style="flex: 1; overflow: auto">
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
          <el-table-column
            v-for="(column, index) in columnList"
            :label="t(column.label)"
            :key="`${column.prop}_${index}_column`"
            :prop="column.prop"
            :min-width="column.width"
            align="center"
            :show-overflow-tooltip="column.prop !== 'description'"
          >
            <template #default="{ row }">
              <template v-if="column.prop === 'timeseries'">{{ `${row.deviceName}.${row.timeseries}` }}</template>
              <div class="row-description-box" v-else-if="column.prop === 'alias'">
                <div class="row-description-text">
                  <text-tooltip :content="row.alias || ''" />
                </div>
                <div v-if="row.viewType !== 'VIEW'" class="edit-box flex-align-center" @click="handleEditAlias(row)">
                  <i-custom-edit-normal class="edit-icon" />
                  <i-custom-edit-active class="edit-icon-active" />
                </div>
              </div>
              <div class="row-description-box" v-else-if="column.prop === 'description'">
                <div class="row-description-text">
                  <text-tooltip :content="row.description || ''" />
                </div>
                <div v-if="row.viewType !== 'VIEW'" class="edit-box flex-align-center" @click="handleEditDescription(row)">
                  <i-custom-edit-normal class="edit-icon" />
                  <i-custom-edit-active class="edit-icon-active" />
                </div>
              </div>
              <div class="row-description-box" v-else-if="column.prop === 'tags'">
                <el-button link type="primary" @click="handleTagDetail(row)">{{ t('common.detail') }}</el-button>
              </div>
              <template v-else-if="column.prop === 'viewType'">
                {{ row.viewType === 'VIEW' ? `${pageText}` : t('measurement.baseMeasurement') }}
              </template>
              <template v-else-if="column.prop === 'isAligned'">
                {{ typeof row.isAligned === 'boolean' ? (row.isAligned ? t('measurement.deviceAlignMeasurement') : t('measurement.undeviceAlignMeasurement')) : '-' }}
              </template>
              <template v-else>
                {{ row[column.prop] }}
              </template>
            </template>
          </el-table-column>
          <el-table-column :label="t('common.operation')" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleRowData(row)" :id="`mesaurement-table-${row.deviceName}.${row.timeseries}-data`">{{ t('page.data') }}</el-button>
              <el-tooltip
                v-if="appType === 1"
                placement="top-start"
                effect="light"
                trigger="hover"
                :content="t('measurement.goAlarmTip')"
                :disabled="row.dataType !== 'TEXT'"
                popper-class="tooltip-box-width"
              >
                <el-button
                  type="primary"
                  link
                  size="small"
                  :disabled="currentDatabase === 'root.__system' || row.dataType === 'TEXT'"
                  @click="handleRowAlarm(row)"
                  :id="`mesaurement-table-${row.deviceName}.${row.timeseries}-alarm`"
                >
                  {{ t('page.alarm') }}
                </el-button>
              </el-tooltip>
              <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('measurement.goTrendTip')" :disabled="row.dataType !== 'TEXT'" popper-class="tooltip-box-width">
                <el-button
                  type="primary"
                  link
                  size="small"
                  :disabled="currentDatabase === 'root.__system' || row.dataType === 'TEXT'"
                  @click="handleRowTrend(row)"
                  :id="`mesaurement-table-${row.deviceName}.${row.timeseries}-trend`"
                >
                  {{ t('page.trend') }}
                </el-button>
              </el-tooltip>
              <auth-tooltip :is-disabled="rowCanWriteSchemaByPath(`${row.deviceName}.${row.timeseries}`)" :content="'common.schemaAuthAnother'">
                <el-button
                  type="primary"
                  link
                  size="small"
                  :disabled="currentDatabase === 'root.__system' || row.deviceName.startsWith('root.__system.') || !rowCanWriteSchemaByPath(`${row.deviceName}.${row.timeseries}`)"
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

    <modal-measurement v-model:visible="measurementVisible" :device-name="currentDatabase" @handleSave="handleSaveMeasurement" />

    <modal-import v-model:visible="importVisible" @handle-close="handleImportClose" />

    <modal-description v-model:visible="descriptionVisible" :measurement="editMeasurement" :description="editDescription" @handleSave="getListData" />

    <modal-alias v-model:visible="aliasVisible" :measurement="editMeasurement" :description="editAlias" @handleSave="getListData" />

    <modal-tag v-model:visible="tagVisible" :measurement="editMeasurement" :description="editTags" />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { cloneDeep } from 'lodash-es';
import { useTableHeight } from '@/composition-api';
import { type CheckboxValueType, ClickOutside as vClickOutside } from 'element-plus';
import { StorageApi } from '@/api';
import { useUserStore } from '@/stores';
import { getPathAuthList } from '@/utils/auth';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalMeasurement from './modal-measurement.vue';
import ModalImport from './modal-import.vue';
import ModalDescription from './modal-description.vue';
import ModalAlias from './modal-alias.vue';
import ModalTag from './modal-tag.vue';

const props = defineProps<{
  currentDatabase: string;
  currentSearchText: string;
  currentNodeType: string;
}>();

const emit = defineEmits<{
  (event: 'handleReload'): void;
  (event: 'handleDelete', payload: StorageDevice.TreeEventPayload): void;
  (event: 'handleSaveMeasurement', path: string): void;
}>();

const { t, locale } = useI18n();
const appType = Number(import.meta.env.VITE_APP_TYPE);
const pageText = appType === 1 ? t('measurement.calculateMeasurement') : t('measurement.viewMeasurement');
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { canManageDatabase, canWriteSchema, userAllEntityPrivileges, userAllPathPrivileges } = storeToRefs(userStore);

const { maxTableHeight } = useTableHeight(370);
const searchKeyword = ref((route.query.measurement as string) || '');
const databaseInfos = ref<StorageDevice.DatabaseInfo>({
  groupName: '',
  deviceCount: 0,
  measurementCount: 0,
});
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const multipleSelection = ref<StorageDevice.MeasurementItem[]>([]);
const measurementVisible = ref(false);
const importVisible = ref(false);
const descriptionVisible = ref(false);
const aliasVisible = ref(false);
const tagVisible = ref(false);
const editMeasurement = ref('');
const editDescription = ref('');
const editAlias = ref('');
const editTags = ref('');
const searchType = ref('name');
const searchPlaceholder = computed(() => (searchType.value === 'name' ? t('calculate.namePlaceholder') : t('calculate.descPlaceholder')));

const colButtonRef = ref();
const colPopoverRef = ref();
const allColumns = ref<Array<{ label: string; prop: string; width: number }>>([
  { label: 'measurement.measurementName', prop: 'timeseries', width: 240 },
  { label: 'measurement.alias', prop: 'alias', width: 140 },
  { label: 'measurement.measurementDescription', prop: 'description', width: 160 },
  { label: 'measurement.tag', prop: 'tags', width: 120 },
  { label: 'measurement.dataType', prop: 'dataType', width: 140 },
  { label: 'measurement.measurementType', prop: 'viewType', width: 200 },
  { label: 'measurement.deviceAlign', prop: 'isAligned', width: 200 },
  { label: 'measurement.encoding', prop: 'encoding', width: 140 },
  { label: 'measurement.compression', prop: 'compression', width: 140 },
  { label: 'measurement.lastValue', prop: 'value', width: 140 },
  { label: 'measurement.lastValueTime', prop: 'valueTime', width: 200 },
]);
const isCheckAll = ref(false);
const checkedCols = ref<string[]>(['timeseries', 'description', 'dataType']);
let copyCheckedCols = cloneDeep(checkedCols.value);
const isIndeterminate = ref(true);
const columnList = ref<Array<{ label: string; prop: string; width: number }>>([
  { label: 'measurement.measurementName', prop: 'timeseries', width: 240 },
  { label: 'measurement.measurementDescription', prop: 'description', width: 160 },
  { label: 'measurement.dataType', prop: 'dataType', width: 140 },
]);

const selectSystemDatabase = computed(() => {
  if (!multipleSelection.value || multipleSelection.value.length === 0) return false;
  return multipleSelection.value.some((item) => item.deviceName.startsWith('root.__system.'));
});
const canReadWriteDataByPath = computed(() => {
  if (userAllEntityPrivileges.value.includes('READ_DATA') || userAllEntityPrivileges.value.includes('WRITE_DATA')) return true;
  if (!props.currentDatabase) return false;
  const authList = getPathAuthList(props.currentDatabase, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('READ_DATA') || authList.includes('WRITE_DATA');
  }
  return false;
});

const canWriteSchemaByPath = computed(() => {
  if (userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  if (!props.currentDatabase) return false;
  const authList = getPathAuthList(props.currentDatabase, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('WRITE_SCHEMA');
  }
  return false;
});

const canReadWriteSchemaByPath = computed(() => {
  if (userAllEntityPrivileges.value.includes('READ_SCHEMA') || userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  if (!props.currentDatabase) return false;
  const authList = getPathAuthList(props.currentDatabase, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('READ_SCHEMA') || authList.includes('WRITE_SCHEMA');
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

function rowReadWriteDataByPath(path: string) {
  if (userAllEntityPrivileges.value.includes('READ_DATA') || userAllEntityPrivileges.value.includes('WRITE_DATA')) return true;
  const authList = getPathAuthList(path, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('READ_DATA') || authList.includes('WRITE_DATA');
  }
  return false;
}

const { requestFn: deleteDatabase } = useRequest(StorageApi.deleteDatabase);
const { requestFn: deletePaths } = useRequest(StorageApi.deletePaths);
const { requestFn: getDatabaseInfo, loading: infoLoading } = useRequest(StorageApi.getDatabaseInfo);
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

function isSelectabled() {
  if (props.currentDatabase === 'root.__system') {
    return false;
  }
  return true;
}

function handleChangeCol(vals: CheckboxValueType[]) {
  const checkedLength = vals.length;
  isCheckAll.value = checkedLength === allColumns.value.length;
  isIndeterminate.value = checkedLength > 0 && checkedLength < allColumns.value.length;
}

function handleCheckedAll(val: CheckboxValueType) {
  checkedCols.value = val ? allColumns.value.map((item) => item.prop) : ['timeseries'];
  isIndeterminate.value = !val;
}

function handleBeforeEnter() {
  checkedCols.value = cloneDeep(copyCheckedCols);
  const checkedLength = checkedCols.value.length;
  isCheckAll.value = checkedLength === allColumns.value.length;
  isIndeterminate.value = checkedLength > 0 && checkedLength < allColumns.value.length;
}

function handleClickOutside() {
  unref(colPopoverRef).popperRef?.delayHide?.();
}

function handleResetCol() {
  checkedCols.value = ['timeseries'];
  isIndeterminate.value = true;
  isCheckAll.value = false;
}

function handleConfirmCol() {
  colPopoverRef.value.hide();
  copyCheckedCols = cloneDeep(checkedCols.value);
  columnList.value = allColumns.value.filter((item) => checkedCols.value.includes(item.prop));
  localStorage.setItem('measurementCols', checkedCols.value.join(','));
}

// 列表接口
function getListData() {
  getMeasurementsInfosByFuzzy({
    dataBaseOrDevice: 'database',
    pathName: props.currentDatabase,
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
      const authTimeseries = tableData.value.measurements.filter((f) => rowReadWriteDataByPath(`${f.deviceName}.${f.timeseries}`)).map((d) => `${d.deviceName}.${d.timeseries}`);
      getBatchLastValue(timeseriesList, viewTypeList).then((newRes) => {
        if (newRes.data.values.length || newRes.data.timestamps.length) {
          tableData.value.measurements.forEach((item, index) => {
            item.value = authTimeseries.includes(`${item.deviceName}.${item.timeseries}`) ? newRes.data.values[index] || '-' : t('common.noAuth');
            item.valueTime = authTimeseries.includes(`${item.deviceName}.${item.timeseries}`) ? newRes.data.timestamps[index] || '-' : t('common.noAuth');
          });
        }
      });
    }
  });
}

// 存储组详细信息
function getDatabaseDetail(data: string) {
  getDatabaseInfo(data).then((res) => {
    if (res?.code === 0) {
      databaseInfos.value = res.data;
    }
  });
}

// 删除数据库
function handleDelDatabase() {
  ElMessageBox.confirm(t('measurement.deleteMeasurementTip'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-databse-confirm',
    cancelButtonClass: 'del-databse-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    if (props.currentNodeType === 'DataBase') {
      deleteDatabase(props.currentDatabase).then(() => {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        emit('handleDelete', { path: props.currentDatabase, type: 'DATABASE' });
      });
    } else {
      deletePaths(props.currentDatabase, props.currentNodeType).then(() => {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        emit('handleDelete', { path: props.currentDatabase, type: 'DATABASE' });
      });
    }
  });
}

// 查询
function handleRefresh() {
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
    pathName: props.currentDatabase,
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
  ElMessageBox.confirm(type === 'batch' ? `${t('measurement.deleteMeasurementBatch')}` : `${t('measurement.deleteMeasurementSingle')}`, t('common.notice'), {
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
    deleteMeasurements(measurementList).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      measurementList.forEach((item) => {
        emit('handleDelete', { path: item, type: 'MEASUREMENT' });
      });
      getDatabaseDetail(props.currentDatabase);
      handleRefresh();
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
function handleSaveMeasurement(path: string) {
  emit('handleSaveMeasurement', path);
  getDatabaseDetail(props.currentDatabase);
  handleRefresh();
}

// 导入物理量
function handleImportClose(reload: boolean) {
  if (reload) {
    emit('handleReload');
    getDatabaseDetail(props.currentDatabase);
    handleRefresh();
  }
}

function handleEditAlias(row: StorageDevice.MeasurementItem) {
  editMeasurement.value = `${row.deviceName}.${row.timeseries}`;
  editAlias.value = row.alias || '';
  aliasVisible.value = true;
}
function handleTagDetail(row: StorageDevice.MeasurementItem) {
  editMeasurement.value = `${row.deviceName}.${row.timeseries}`;
  editTags.value = row.tags || '';
  tagVisible.value = true;
}

function handleEditDescription(row: StorageDevice.MeasurementItem) {
  editMeasurement.value = `${row.deviceName}.${row.timeseries}`;
  editDescription.value = row.description || '';
  descriptionVisible.value = true;
}

onMounted(() => {
  const defaultCols = localStorage.getItem('measurementCols');
  if (!defaultCols) {
    isCheckAll.value = false;
    checkedCols.value = ['timeseries', 'description', 'dataType'];
    isIndeterminate.value = true;
    columnList.value = [
      { label: 'measurement.measurementName', prop: 'timeseries', width: 240 },
      { label: 'measurement.measurementDescription', prop: 'description', width: 160 },
      { label: 'measurement.dataType', prop: 'dataType', width: 140 },
    ];
  } else {
    const defaultColsArray = defaultCols.split(',');
    checkedCols.value = defaultColsArray;
    const checkedLength = defaultColsArray.length;
    isCheckAll.value = checkedLength === allColumns.value.length;
    isIndeterminate.value = checkedLength > 0 && checkedLength < allColumns.value.length;
    columnList.value = allColumns.value.filter((item) => checkedCols.value.includes(item.prop));
  }
  copyCheckedCols = cloneDeep(checkedCols.value);
  searchKeyword.value = (props.currentSearchText || route.query.measurement || '') as string;
});

watch(
  () => props.currentDatabase && canReadWriteSchemaByPath.value,
  (val) => {
    if (val) {
      searchType.value = 'name';
      searchKeyword.value = (props.currentSearchText || route.query.measurement || '') as string;
      getDatabaseDetail(props.currentDatabase);
      handleRefresh();
    }
  },
  {
    immediate: true,
  }
);
watch(
  () => props.currentSearchText && canReadWriteSchemaByPath.value,
  (val, oldValue) => {
    if (val !== oldValue) {
      searchType.value = 'name';
      searchKeyword.value = (props.currentSearchText || '') as string;
      getDatabaseDetail(props.currentDatabase);
      handleRefresh();
    }
  },
  {
    immediate: true,
  }
);
</script>
<style lang="scss" scoped>
.database-detail-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.database-info-box {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
}

.database-info-list {
  flex: 1;
}

.database-info-item {
  font-size: 12px;
  line-height: 1.2;
  color: #656a85;
  margin: 0 36px 0 0;
  display: inline-flex;
  align-items: center;

  &:last-child {
    margin-right: 0;
  }

  .database-info-item-label {
    color: #131926;
    position: relative;
    margin-right: 4px;
    white-space: nowrap;
  }
}

.info-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
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

  .measurement-search-type-select {
    :deep(.el-select__wrapper) {
      text-align: center;
    }
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

.column-box {
  font-size: 12px;
  line-height: 18px;
  color: #424561;
  font-weight: 400;
  margin-left: 8px;

  :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
    font-weight: 700;
  }
}

.filter-operate-box {
  padding: 6px 0 0;
  border-top: 1px dashed #dfe1ed;
}

.filter-operate-checkbox-all {
  :deep(.el-checkbox__label) {
    padding-left: 4px;
    font-size: 12px !important;
    line-height: 12px !important;
    font-weight: 400;
  }
}

.filter-operate-buttons {
  :deep(.el-button) {
    height: 20px !important;
    min-width: 36px !important;
    padding-left: 2px !important;
    padding-right: 2px !important;
    font-size: 12px !important;
    line-height: 12px !important;
    font-weight: 400;
  }
}
</style>

<style lang="scss">
.col-filter-popover-box {
  padding: 8px !important;

  &:lang(en) {
    width: 220px !important;
  }
}
</style>
