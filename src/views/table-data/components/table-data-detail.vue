<template>
  <el-container class="page-container">
    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px); align-items: center">
        <i-custom-field class="m-r-8" />
        <text-tooltip :content="`${currentNode?.nodeName}`" />
      </div>
      <span class="m-l-8">{{ t('dataManage.data') }}</span>
    </h4>
    <el-header class="search-form-wrapper p-0" style="height: auto">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
        <base-form-item prop="path" :label="t('dataManage.columnName')">
          <columns-select
            v-model="searchFormData.columns"
            :disabled-select="getListLoading"
            :placeholder="t('dataManage.selectColumnPlaceholder')"
            :view-text="t('dataManage.columnsSelected')"
            :current-node="currentNode"
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
      </el-form>
      <div class="search-form-buttons">
        <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
          <el-button @click="handleReset(true)" :disabled="getListLoading || !canReadWriteData" id="data-search-reset">{{ t('common.reset') }}</el-button>
        </auth-tooltip>
        <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
          <el-button type="primary" :disabled="!canReadWriteData" @click="handleSearch" id="data-search-search">{{ getListLoading ? t('common.cancelQuery') : t('common.query') }}</el-button>
        </auth-tooltip>
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
          <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
            <el-button type="primary" :disabled="!canReadWriteData" @click="handleInsert" id="data-search-search">{{ t('dataManage.dataInsert') }}</el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
            <el-button class="m-l-16" :disabled="!canReadWriteData" @click="handleImport" id="table-data-import">
              {{ t('common.import') }}
            </el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canReadWriteData" :content="'common.schemaAuth'">
            <el-dropdown class="m-x-16" :disabled="!canReadWriteData || !(tableData.length > 0)" @command="(val) => handleCommandDown(val)" id="mesaurement-download-dropdown">
              <el-button :class="[locale === 'en' ? 'export-button' : 'export-spacing-button']" :disabled="!canReadWriteData || !(tableData.length > 0)" id="mesaurement-download">
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
          <auth-tooltip :is-disabled="canWriteData" :content="'common.dataAuthAnother'">
            <el-button type="primary" :disabled="selectedRows.length === 0 || !selectedAllColumns" @click="handleBatchDelete" id="data-search-search">{{ t('common.batchDelete') }}</el-button>
          </auth-tooltip>
        </div>
      </div>

      <auth-container :is-auth="canReadWriteData" style="height: 100%" :content="'common.dataAuth'">
        <div v-loading="getListLoading">
          <dynamic-edit-table
            ref="dynamicEditTableRef"
            :show-select="true"
            :columns="columns"
            :table-info="currentNode"
            :table-data="tableDataPagination"
            :height="maxTableHeight"
            :max-height="maxTableHeight"
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :total="tableData.length"
            :can-delete="selectedAllColumns"
            :show-pagination="true"
            :cannot-delete-tip="t('dataManage.cannotDeleteTip')"
            @selected-change="handleSelectChange"
            @delete-row="handleDeleteRow"
            @save-row="handleSave"
          />
          <div class="table-error-wrapper" v-if="searchDetailInfos.errMsg">Msg: {{ searchDetailInfos.errMsg }}</div>
        </div>
        <sql-preview ref="sqlPreviewRef" style="margin: 8px 0 0; background-color: #fff" />
      </auth-container>
    </el-main>

    <modal-import-data v-model:visible="importVisible" @handle-close="handleImportClose" />
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { cloneDeep } from 'lodash-es';
import { useTableHeight, useShortcutsDate } from '@/composition-api';
import { TableDataApi } from '@/api';
import { todayNow, formatDate } from '@/utils/date';
import { useUserStore } from '@/stores';
import DynamicEditTable from '@/components/dynamic-edit-table.vue';
import SqlPreview from '@/components/sql-preview.vue';
import ICustomCalender from '~icons/custom/calender.svg';
import ColumnsSelect from './columns-select.vue';
import ModalImportData from './modal-import-data.vue';

const props = defineProps<{
  currentNode: IoTDB.TreeNodeData;
}>();

const sqlPreviewRef = ref<InstanceType<typeof SqlPreview>>();
const dynamicEditTableRef = ref<InstanceType<typeof DynamicEditTable>>();

const { t, locale } = useI18n();
const route = useRoute();
const userStore = useUserStore();
const { canReadWriteData, canWriteData } = storeToRefs(userStore);
const { maxTableHeight } = useTableHeight(440);

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

const copySearchFormData = ref<any>();

const selectedAllColumns = computed(() => {
  if (!props.currentNode?.children) {
    return false;
  }
  if (copySearchFormData.value.columns?.length === 0 || !copySearchFormData.value.columns?.length) {
    return true;
  }
  // 如果选择的列数等于当前节点的子节点数量，则全选
  // 这里加1是因为time列是默认的第一列
  // 如果没有选择列，则默认全选
  return !!props.currentNode?.children?.length && copySearchFormData.value.columns?.length === props.currentNode.children.length - 1;
});

const { shortcutsDaterange } = useShortcutsDate();

const disabledDate = (time: number) => time < new Date('1970-1-1').getTime();

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

const selectedRows = ref<Record<string, any>[]>([]);
const importVisible = ref(false);
// const tableHeight = computed(() => (tableData.value.length > 0 ? maxTableHeight.value : maxTableHeight.value ));

const getListLoading = ref(false);

const columnsSelected = ref<string[]>([]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

function handleAppendSql(sql: string) {
  sqlPreviewRef.value?.appendSql(sql);
}

const { requestFn: getList } = useRequest(TableDataApi.getTableData);
const { requestFn: deleteTableData } = useRequest(TableDataApi.deleteTableData);
const { requestFn: insertTableData } = useRequest(TableDataApi.insertTableData);
// const { requestFn: exportTableData } = useRequest(IoTDBApi.exportTableData);

let controller = new AbortController();

function getListData() {
  firstLoad.value = false;
  columns.value = [];
  tableData.value = [];

  const startTime = copySearchFormData.value.datetimerange.length === 2 ? dayjs(copySearchFormData.value.datetimerange[0]).valueOf() : undefined;
  const endTime = copySearchFormData.value.datetimerange.length === 2 ? dayjs(copySearchFormData.value.datetimerange[1]).valueOf() : undefined;

  searchDetailInfos.value.status = undefined;
  searchDetailInfos.value.queryTime = '';
  currentQueryTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  getListLoading.value = true;
  controller = new AbortController();
  getList(
    {
      database: props.currentNode.database!,
      tableName: props.currentNode.nodeName!,
      columnNames: copySearchFormData.value.columns && copySearchFormData.value.columns.length > 0 ? ['time', ...copySearchFormData.value.columns] : undefined,
      startTime,
      endTime,
      size: 1000,
      page: pagination.pageNum,
    },
    controller
  )
    .then((res) => {
      // eslint-disable-next-line no-undef
      const list: DynamicTableColumn[] = [];
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
          obj[list[index].prop] = childItem;
        });
        return obj;
      });
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
  if (firstLoad.value) {
    getListData();
  }
}

// 导入
function handleImport() {
  importVisible.value = true;
}

// 导出
// function handleExportData(exportType: string) {
//   exportTableData({
//     pathName: props.currentNode.parentName,
//     keyword: searchKeyword.value,
//     type: searchType.value,
//     ...pagination,
//   }).then((res) => {
//     let url = `/api/file/exportExcelMeasurementData?exportId=${res.data}`;
//     if (exportType === 'csv') {
//       url = `/api/file/exportCSVMeasurementData?exportId=${res.data}`;
//     }
//     window.open(url);
//   });
// }

// 下载
function handleCommandDown(val: string) {
  // handleExportData(val);
  console.log(val);
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
    sessionStorage.setItem('dataSearchStorage', '');
    getListData();
  }
}

// 查询
function handleSearch() {
  // if (!searchFormData.path.length) {
  //   errorDeviceTip.value = '请输入测点名称后进行搜索';
  //   return;
  // }
  // errorDeviceTip.value = '';
  if (getListLoading.value) {
    controller.abort();
    return;
  }
  pagination.pageNum = 1;
  copySearchFormData.value = cloneDeep(searchFormData);
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
  const deleteConditions: IoTDB.DeleteCondition[] = rows.map((row) => ({
    tags: getTags(row),
    time: row.time as unknown as number,
  }));
  // 处理删除数据逻辑
  const data = {
    database: props.currentNode.database!,
    tableName: props.currentNode.nodeName!,
    conditions: deleteConditions,
  } as IoTDB.DeleteTableDataReq;
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

function handleSave(row: Record<string, any>) {
  const copyRow = cloneDeep(row);
  delete copyRow.editable;
  delete copyRow.isNew;
  const data = {
    database: props.currentNode.database!,
    tableName: props.currentNode.nodeName!,
    metaDataList: Object.keys(copyRow),
    valueList: Object.values(copyRow),
  } as IoTDB.InsertTableDataReq;
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
  sessionStorage.setItem(
    'dataSearchStorage',
    JSON.stringify({
      ...copySearchFormData.value,
    })
  );
}

onBeforeUnmount(() => {
  setStorage();
});

watch(
  () => canReadWriteData.value,
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
      if (sessionStorage.getItem('dataSearchStorage')) {
        const searchData = JSON.parse(sessionStorage.getItem('dataSearchStorage') as string);
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
  }
);

defineExpose({
  handleSearch,
});
</script>

<style lang="scss" scoped>
.info-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
  padding: 14px 0 6px;
  border-bottom: 1px solid #dfe1ed;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.page-container {
  background-color: #fff;
  border-radius: 6px;
  padding: 16px;
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
  padding: 8px 16px;
  border-radius: 2px;
  background: #f7f8fc;
  display: flex;
  flex: 1;
  flex-direction: column;

  .page-info-title {
    display: flex;
    font-size: 14px;
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
</style>
