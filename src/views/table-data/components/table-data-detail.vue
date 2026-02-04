<template>
  <el-container class="page-container">
    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px); align-items: center">
        <i-custom-field class="m-r-8" />
        <text-tooltip :content="`${currentNode?.nodeName}`" />
      </div>
      <span class="m-l-8">{{ t('dataManage.data') }}</span>
    </h4>
    <el-header class="search-form-wrapper p-0" style="height: auto; margin-top: 8px">
      <div style="display: flex; align-items: center; width: 100%">
        <div style="flex: 1">
          <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline class="el-form-wrapper">
            <div style="display: flex; align-items: center">
              <base-form-item prop="path" :label="`${t('dataManage.columnName')}：`">
                <columns-select
                  v-model="searchFormData.columns"
                  :disabled-select="getListLoading"
                  :placeholder="t('dataManage.selectColumnPlaceholder')"
                  :view-text="t('dataManage.columnsSelected')"
                  :current-node="currentNode"
                  :select-width="220"
                  id="data-search-path"
                  @handle-change-path="handleChangePath"
                />
              </base-form-item>
              <el-form-item :label="`${t('search.searchTime')}：`" prop="time">
                <div class="search-time-wrapper">
                  <el-date-picker
                    v-model="searchFormData.datetimerange"
                    type="datetimerange"
                    range-separator="-"
                    unlink-panels
                    :disabled-date="disabledDate"
                    :shortcuts="shortcutsDaterange"
                    :clearable="false"
                    :prefix-icon="ICustomCalender"
                    :start-placeholder="t('search.startTime')"
                    :end-placeholder="t('search.endTime')"
                    id="data-search-datetimerange"
                    :disabled="getListLoading"
                  />
                </div>
              </el-form-item>
            </div>
          </el-form>
        </div>
        <div class="search-form-buttons">
          <el-button @click="handleReset(true)" :disabled="getListLoading" id="data-search-reset">{{ t('common.reset') }}</el-button>
          <el-button type="primary" @click="handleSearch" id="data-search-search">{{ getListLoading ? t('common.cancelQuery') : t('common.query') }}</el-button>
        </div>
      </div>
    </el-header>

    <el-main class="page-table-details">
      <div class="page-info-box">
        <h4 class="page-info-title">
          {{ t('common.searchDetail') }}
          <span class="run-result-tip">
            <i-custom-info-warning />
            {{ t('search.export1000RowTip') }}
          </span>
        </h4>
        <div class="page-detail-buttons">
          <template v-if="isInformationSchemaDatabase">
            <el-tooltip effect="light" :content="t('common.systemTableViewOnly')" placement="top" :disabled="false">
              <span>
                <el-button type="primary" :disabled="true" @click="handleInsert" id="data-search-search">
                  {{ t('dataManage.dataInsert') }}
                </el-button>
              </span>
            </el-tooltip>

            <el-tooltip effect="light" :content="t('common.systemTableViewOnly')" placement="top" :disabled="false">
              <span>
                <el-button class="m-l-16" :disabled="true" @click="handleImport" id="table-data-import">
                  {{ t('common.import') }}
                </el-button>
              </span>
            </el-tooltip>
          </template>
          <template v-else>
            <auth-tooltip :is-disabled="canInsertData" content="dataManage.needInsertPrivilege">
              <span>
                <el-button type="primary" :disabled="!canInsertData" @click="handleInsert" id="data-search-search">
                  {{ t('dataManage.dataInsert') }}
                </el-button>
              </span>
            </auth-tooltip>

            <auth-tooltip :is-disabled="canInsertData" content="dataManage.needInsertPrivilege">
              <span>
                <el-button class="m-l-16" :disabled="!canInsertData" @click="handleImport" id="table-data-import">
                  {{ t('common.import') }}
                </el-button>
              </span>
            </auth-tooltip>
          </template>
          <el-dropdown class="m-x-16" @command="(val) => handleCommandDown(val)" id="mesaurement-download-dropdown">
            <el-button :class="[locale === 'en' ? 'export-button' : 'export-spacing-button']" id="mesaurement-download">
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
          <template v-if="isInformationSchemaDatabase">
            <el-tooltip effect="light" :content="t('common.systemTableViewOnly')" placement="top" :disabled="false">
              <span>
                <el-button type="primary" :disabled="true" id="data-search-search">
                  {{ t('common.batchDelete') }}
                </el-button>
              </span>
            </el-tooltip>
          </template>
          <template v-else>
            <auth-tooltip :is-disabled="canDeleteDataPermission" :content="'dataManage.needDeleteDataPrivilege'">
              <span>
                <el-button type="primary" :disabled="!canDeleteDataPermission || selectedRows.length === 0" @click="handleBatchDelete" id="data-search-search">
                  {{ t('common.batchDelete') }}
                </el-button>
              </span>
            </auth-tooltip>
          </template>
        </div>
      </div>

      <auth-container :is-auth="canViewData" style="height: 100%" :content="'common.needQueryDataPermission'">
        <div v-loading="getListLoading">
          <dynamic-edit-table
            class="dynamic-edit-table"
            ref="dynamicEditTableRef"
            :show-select="true"
            :columns="columns"
            :current-node="currentNode"
            :table-data="tableDataPagination"
            :height="reactiveTableHeight.value"
            :max-height="reactiveTableHeight.value"
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :total="tableData.length"
            :can-delete="!isInformationSchemaDatabase && canDeleteDataPermission"
            :show-pagination="true"
            :cannot-delete-tip="isInformationSchemaDatabase ? t('common.systemTableViewOnly') : t('dataManage.needDeleteDataPrivilege')"
            @selected-change="handleSelectChange"
            @delete-row="handleDeleteRow"
            @save-row="handleSave"
          />
          <div class="table-error-wrapper" v-if="searchDetailInfos.errMsg">Msg: {{ searchDetailInfos.errMsg }}</div>
        </div>
      </auth-container>
    </el-main>
    <sql-preview ref="sqlPreviewRef" style="margin: 8px 0 0; background-color: #fff" />

    <modal-import-data v-model:visible="importVisible" :current-node="currentNode" @handle-close="handleImportClose" />
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { cloneDeep } from 'lodash-es';
import { useTableHeight, useShortcutsDate } from '@/composition-api';
import { TableDataApi, IoTDBApi } from '@/api';
import { todayNow, formatDate } from '@/utils/date';
import { useUserStore, useDbStore, useConnectionStore } from '@/stores';
import DynamicEditTable from '@/components/dynamic-edit-table.vue';
import SqlPreview from '@/components/sql-preview.vue';
import ICustomCalender from '~icons/custom/calender.svg';
import ColumnsSelect from './columns-select.vue';
import ModalImportData from './modal-import-data.vue';
import type { TableTreeNodeData, QueryDataResult, DeleteCondition, DeleteTableDataReq, InsertTableDataReq } from '@/types';

const props = defineProps<{
  currentNode: TableTreeNodeData;
}>();

const sqlPreviewRef = ref<InstanceType<typeof SqlPreview>>();
const dynamicEditTableRef = ref<InstanceType<typeof DynamicEditTable>>();

const { t, locale } = useI18n();
const route = useRoute();
const userStore = useUserStore();
const connectionStore = useConnectionStore();
const { isTableModel } = storeToRefs(connectionStore);
const { canReadWriteData, canWriteData } = storeToRefs(userStore);
const { getDatabases } = useDbStore();

const screenWidth = ref(window.innerWidth);
window.addEventListener('resize', () => {
  screenWidth.value = window.innerWidth;
});
const reactiveTableHeight = computed(() => {
  if (screenWidth.value < 1440) {
    if (tableData.value.length < 10) {
      return useTableHeight(361).maxTableHeight;
    } else {
      return useTableHeight(355).maxTableHeight;
    }
  } else {
    if (tableData.value.length < 10) {
      return useTableHeight(353).maxTableHeight;
    } else {
      return useTableHeight(347).maxTableHeight;
    }
  }
});

const canQueryData = computed(() => {
  if (isTableModel.value) {
    return userStore.hasTableModelPrivilege('SELECT', props.currentNode.database!, props.currentNode.nodeName);
  }
  return canReadWriteData.value;
});

const canViewData = computed(() => isInformationSchemaDatabase.value || canQueryData.value);

const canInsertData = computed(() => {
  if (isTableModel.value) {
    return userStore.hasTableModelPrivilege('INSERT', props.currentNode.database!, props.currentNode.nodeName);
  }
  return canWriteData.value;
});

const canDeleteDataPermission = computed(() => {
  if (isTableModel.value) {
    return userStore.hasTableModelPrivilege('DELETE', props.currentNode.database!, props.currentNode.nodeName);
  }
  return canWriteData.value;
});

const searchFormRef = ref<FormInstance>();
const firstLoad = ref(true);

const currentQueryTime = ref('');
// const errorDeviceTip = ref('');
const searchFormData = reactive({
  columns: [] as string[],
  time: todayNow(),
  datetimerange: [],
  // asc: 'asc',
});

const copySearchFormData = ref<any>(cloneDeep(searchFormData));

const { shortcutsDaterange } = useShortcutsDate();

const disabledDate = (time: number) => time < new Date('1970-1-1').getTime();

const searchDetailInfos = ref<Partial<QueryDataResult>>({});
const hasNext = ref(false);
const columns = ref<globalThis.DynamicTableColumn[]>([]);
const columnTypes = ref<string[]>([]);
const tableData = ref<Record<string, any>[]>([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  columnSize: 100,
  columnNum: 1,
  totalColumnPage: 0,
  totalColumnCount: 0,
});

const selectedRows = ref<Record<string, any>[]>([]);
const importVisible = ref(false);

const getListLoading = ref(false);

const columnsSelected = ref<string[]>([]);

const isInformationSchemaDatabase = computed(() => props.currentNode?.database === 'information_schema');

const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize));

function handleAppendSql(sql: string) {
  sqlPreviewRef.value?.appendSql(sql);
}

const { requestFn: getList } = useRequest(TableDataApi.getTableData);
const { requestFn: deleteTableData } = useRequest(TableDataApi.deleteTableData);
const { requestFn: insertTableData } = useRequest(TableDataApi.insertTableData);
const { requestFn: exportTableDataId } = useRequest(IoTDBApi.exportTableDataId);

let controller = new AbortController();

function getListData() {
  if (!canViewData.value) return;
  firstLoad.value = false;
  columns.value = [];
  tableData.value = [];

  const startTime = copySearchFormData.value?.datetimerange?.length === 2 ? dayjs(copySearchFormData.value.datetimerange[0]).valueOf() : undefined;
  const endTime = copySearchFormData.value?.datetimerange?.length === 2 ? dayjs(copySearchFormData.value.datetimerange[1]).valueOf() : undefined;

  searchDetailInfos.value.status = undefined;
  searchDetailInfos.value.queryTime = '';
  currentQueryTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  getListLoading.value = true;
  controller = new AbortController();
  getList(
    {
      database: props.currentNode.database!,
      tableName: props.currentNode.nodeName,
      columnNames:
        copySearchFormData.value.columns && copySearchFormData.value.columns.length > 0
          ? ['time', ...copySearchFormData.value.columns]
          : [...(props.currentNode.children?.map((item) => item.nodeName) || [])],
      startTime,
      endTime,
      size: 1000,
      page: pagination.pageNum,
    },
    controller,
  )
    .then((res) => {
      const list: globalThis.DynamicTableColumn[] = [];
      res.data?.value.metaDataList?.forEach((item: string, index: number) => {
        list.push({
          label: item,
          prop: item,
          defaultValue: '-',
          fixed: index === 0 ? 'left' : undefined,
          sortable: false,
          formatContent: (value: any) => {
            if (index === 0 && item === 'time') {
              return formatDate(Number(value));
            }
            return value;
          },
          // formatHeader: formatTimeseries,
        });
      });
      columns.value = list;
      tableData.value = res.data?.value.valueList?.map((item: any[]) => {
        const obj = {} as Record<string, string>;
        item.forEach((childItem, index) => {
          obj[list[index]!.prop] = childItem;
        });
        return obj;
      });
      columnTypes.value = res.data?.value.metaDataTypeList ? res.data?.value.metaDataTypeList : [];
      hasNext.value = res.data?.value.hasNext;
      searchDetailInfos.value = res.data.value || {};
      handleAppendSql(res.data.sql);
    })
    .finally(() => {
      getListLoading.value = false;
    });
}

function handleChangePath(columnsVal: string[]) {
  columnsSelected.value = columnsVal;
  searchFormData.columns = columnsVal;
  if (firstLoad.value && canViewData.value) {
    getListData();
  }
}

// 导入
function handleImport() {
  importVisible.value = true;
}

// 导出
function handleExportData(exportType: string) {
  const startTime = copySearchFormData.value?.datetimerange?.length === 2 ? dayjs(copySearchFormData.value.datetimerange[0]).valueOf() : undefined;
  const endTime = copySearchFormData.value?.datetimerange?.length === 2 ? dayjs(copySearchFormData.value.datetimerange[1]).valueOf() : undefined;

  exportTableDataId({
    database: props.currentNode.database!,
    tableName: props.currentNode.nodeName,
    columnNames:
      copySearchFormData.value.columns && copySearchFormData.value.columns.length > 0
        ? ['time', ...copySearchFormData.value.columns]
        : [...(props.currentNode.children?.map((item) => item.nodeName) || [])],
    startTime,
    endTime,
    size: 1000,
    page: pagination.pageNum,
  }).then((res) => {
    let url = `/api/file/exportExcelTableDataTable?exportId=${res.data}`;
    if (exportType === 'csv') {
      url = `/api/file/exportCsvTableDataTable?exportId=${res.data}`;
    }
    window.open(url);
  });
}

// 下载
function handleCommandDown(val: string) {
  handleExportData(val);
}

// 重置
function handleReset(force?: boolean) {
  searchFormData.columns = [];
  searchFormData.time = todayNow();
  searchFormData.datetimerange = [];
  pagination.pageNum = 1;

  if (force) {
    copySearchFormData.value = cloneDeep(searchFormData);
    getListLoading.value = false;
    window.sessionStorage.setItem('dataSearchStorage', '');

    if (canViewData.value) {
      getListData();
    }
  }
}

// 查询
function handleSearch() {
  // if (!searchFormData.path.length) {
  //   errorDeviceTip.value = '请输入测点名称后进行搜索';
  //   return;
  // }
  // errorDeviceTip.value = '';
  if (!canViewData.value) return;
  if (getListLoading.value) {
    controller.abort();
    return;
  }
  pagination.pageNum = 1;
  copySearchFormData.value = cloneDeep(searchFormData);
  getListData();
}

// 导入物理量
function handleImportClose(reload: boolean) {
  if (reload) {
    handleSearch();
  }
}

const allTagsColumns = computed(() => {
  const tagsColumns = props.currentNode.children?.filter((item) => item.nodeType === 'TAG').map((item) => item.nodeName) || [];
  return tagsColumns;
});

function getTags(row: Record<string, any>): Record<string, string> {
  const tagsColumns = allTagsColumns.value;
  if (!tagsColumns || tagsColumns.length === 0) {
    return {};
  }
  const copyRow = cloneDeep(row);
  Object.keys(row).forEach((key) => {
    if (!tagsColumns.includes(key)) {
      delete copyRow[key];
    }
  });
  return copyRow;
}

function deleteData(rows: Record<string, any>[]) {
  const deleteConditions: DeleteCondition[] = rows.map((row) => ({
    tags: getTags(row),
    time: row.time as unknown as number,
  }));
  // 处理删除数据逻辑
  const data = {
    database: props.currentNode.database!,
    tableName: props.currentNode.nodeName,
    conditions: deleteConditions,
  } as DeleteTableDataReq;
  deleteTableData(data)
    .then((resp) => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      handleAppendSql(resp.data.sql);
      nextTick(() => {
        // 清空选中行
        selectedRows.value = [];
        handleSearch();
      });
    })
    .catch((error) => {
      ElMessage.error({ message: t('common.fail', { error: error.message }), grouping: true });
    });
}

function handleBatchDelete() {
  ElMessageBox.confirm(t('common.deleteConfirm'), t('common.operation'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  }).then(() => {
    // 执行删除操作
    deleteData(selectedRows.value);
  });
}

function handleSelectChange(val: Record<string, any>[]) {
  // 处理选中数据
  selectedRows.value = val;
}
function handleDeleteRow(row: Record<string, any>) {
  // 处理删除行
  ElMessageBox.confirm(t('common.deleteConfirm'), t('common.operation'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  }).then(() => {
    // 执行删除操作
    deleteData([row]);
  });
}
function handleInsert() {
  dynamicEditTableRef.value?.newRow();
}

// 将值自动加单引号
function processValues(values: string[], types: string[]): string[] {
  return values.map((value, index) => {
    const currentType = types[index]!.toUpperCase();

    if (['STRING', 'BLOB', 'TEXT']!.includes(currentType)) {
      return `'${value}'`;
    }
    return value;
  });
}

function handleSave(row: Record<string, any>) {
  const copyRow = cloneDeep(row);
  delete copyRow.editable;
  delete copyRow.isNew;
  const valueList = Object.values(copyRow);
  const processedValues = processValues(valueList, columnTypes.value);
  const data = {
    database: props.currentNode.database!,
    tableName: props.currentNode.nodeName,
    metaDataList: Object.keys(copyRow),
    valueList: processedValues,
  } as InsertTableDataReq;
  insertTableData(data).then((resp) => {
    ElMessage.success({ message: t('common.submitSuccess'), grouping: true });
    handleAppendSql(resp.data.sql);
    nextTick(() => {
      handleSearch();
    });
    dynamicEditTableRef.value?.onSaveRow(row);
  });
}

function setStorage() {
  window.sessionStorage.setItem(
    'dataSearchStorage',
    JSON.stringify({
      ...copySearchFormData.value,
    }),
  );
}

onBeforeUnmount(() => {
  setStorage();
});

watch(
  () => canViewData.value,
  (val) => {
    if (val) {
      firstLoad.value = true;
      getListLoading.value = false;
      if (route.query.measurement) {
        handleReset();
        searchFormData.columns = [route.query.measurement] as string[];
        handleSearch();
        return;
      }
      if (window.sessionStorage.getItem('dataSearchStorage')) {
        const searchData = JSON.parse(window.sessionStorage.getItem('dataSearchStorage') as string);
        searchFormData.columns = searchData.path || [];

        searchFormData.datetimerange = searchData.datetimerange;
        handleSearch();
        return;
      }
      handleReset();
      handleSearch();
    } else if (route.query.measurement) {
      handleReset();
      searchFormData.columns = [route.query.measurement] as string[];
    }
  },
  {
    immediate: true,
  },
);

function handleRefresh() {
  getDatabases();
  handleSearch();
}

defineExpose({
  handleRefresh,
});
</script>

<style lang="scss" scoped>
.info-title {
  font-size: 12px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
  padding-bottom: 6px;
  border-bottom: 1px solid #dfe1ed;
  display: flex;
  align-items: center;
}

.page-container {
  background-color: #fff;
  border-radius: 6px;
  padding: 8px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .el-button:focus-visible {
    outline: none;
  }
}

.search-time-wrapper {
  display: flex;
  align-items: center;

  :deep(.el-input__inner, .el-range-input, .el-select__input-wrapper, .el-select__placeholder) {
    color: #656a85 !important;
  }

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
  padding: 8px;
  border-radius: 2px;
  background: #f7f8fc;
  display: flex;
  flex: 1;
  flex-direction: column;

  .page-info-title {
    display: flex;
    font-size: 12px;
    line-height: 20px;
    color: #495ad4;

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
    margin-bottom: 12px;
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

.dynamic-edit-table :deep(th.el-table__cell) {
  font-size: 12px;
}

.el-form-wrapper :deep(.el-form-item__label) {
  font-size: 12px;
}
</style>
