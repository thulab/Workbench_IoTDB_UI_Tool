<template>
  <div class="database-detail-wrapper">
    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px); align-items: center">
        <i-custom-field class="m-r-8" />
        <text-tooltip :content="`${currentNode?.nodeName}`" />
      </div>
      <span class="m-l-8">{{ t('dataManage.schema') }}</span>
    </h4>
    <div class="database-info-box">
      <ul class="database-info-list">
        <li class="database-info-item" id="device-total-li">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.ttl') }}：</span>
          {{ localCurrentNode?.ttl ? localCurrentNode?.ttl : 'INF' }}
          <el-icon size="24" class="m-r-6 svg-button-hover-color" style="cursor: pointer" @click="handleEditTableTTL()">
            <i-custom-edit />
          </el-icon>
        </li>
        <li class="database-info-item" id="measurement-total-li">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.columns') }}：</span>
          {{ currentNode?.children?.length || 0 }}
        </li>
      </ul>
    </div>

    <div class="search-form-container">
      <div class="search-form-box">
        <el-input v-model="searchKeyword" :placeholder="searchPlaceholder" id="mesaurement-search" style="width: 340px">
          <template #prefix>
            <i-custom-search-icon class="remote-select-search-icon" />
          </template>
          <template #prepend>
            <el-select v-model="searchType" style="width: 88px" placeholder="" @change="goto(1)" id="measurement-search-type" class="measurement-search-type-select">
              <el-option :label="t('dataManage.columnName')" value="columnName" id="measurement-search-type-name" />
              <el-option :label="t('dataManage.comment')" value="comment" id="measurement-search-type-description" />
            </el-select>
          </template>
        </el-input>
      </div>

      <div class="search-form-buttons">
        <el-button type="primary" id="table-add" @click="showAddTableDialog">
          {{ t('common.add') }}
        </el-button>
        <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
          <el-button class="m-l-16" :disabled="!canReadWriteData" @click="handleImport" id="table-data-import">
            {{ t('common.import') }}
          </el-button>
        </auth-tooltip>
        <auth-tooltip :is-disabled="canReadWriteData" :content="'common.schemaAuth'">
          <el-dropdown class="m-x-16" :disabled="!canReadWriteData || !(columnDataFilter.length > 0)" @command="(val) => handleCommandDown(val)" id="mesaurement-download-dropdown">
            <el-button :class="[locale === 'en' ? 'export-button' : 'export-spacing-button']" :disabled="!canReadWriteData || !(columnDataFilter.length > 0)" id="mesaurement-download">
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
        <el-button type="primary" id="mesaurement-batch-del" @click="handleDelRow('batch', null)" :disabled="columnsSelection.length === 0">
          {{ t('common.batchDelete') }}
        </el-button>
        <el-button link @click="handleRefresh" id="mesaurement-refresh" class="svg-button-hover-color">
          <i-custom-refresh style="width: 24px; height: 24px" />
        </el-button>
      </div>
    </div>

    <div class="storage-table-box">
      <el-table
        :data="tableDataPagination"
        style="width: 100%"
        :height="maxTableHeight"
        :max-height="maxTableHeight"
        tooltip-effect="light"
        ref="tableRef"
        :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column :label="t('dataManage.columnName')" prop="columnName" :show-overflow-tooltip="true" />
        <el-table-column :label="t('dataManage.comment')" prop="comment" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <div class="row-description-box">
              <div class="row-description-text">
                <text-tooltip :content="row.comment && row.comment !== 'null' ? row.comment : '-'" />
              </div>
              <div class="edit-box flex-align-center" @click="handleEditTableComment(row)" v-if="!isSystemDatabase">
                <i-custom-edit-normal class="edit-icon" />
                <i-custom-edit-active class="edit-icon-active" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('dataManage.dataType')" prop="dataType" :show-overflow-tooltip="true" />
        <el-table-column :label="t('dataManage.cateGory')" prop="cateGory" :show-overflow-tooltip="true" />
        <el-table-column :label="t('common.operation')" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.cateGory === 'TAG' || row.cateGory === 'TIME'"
              effect="light"
              :content="`${row.cateGory === 'TIME' ? 'TIME' : 'TAG'}列暂不支持删除`"
              placement="top"
              popper-class="table-tooltip-max-width"
            >
              {{ t('common.delete') }}
            </el-tooltip>
            <el-button v-else type="primary" link size="small" @click="handleDelRow('row', row)" :id="`mesaurement-table-${row.columnName}-del`">
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-wrapper">
            <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
            <span class="data-empty-text">{{ t('common.noData') }}</span>
          </div>
        </template>
      </el-table>
      <div class="paination" v-if="total && total > 0">
        <el-pagination
          background
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          layout="prev, pager, next, sizes, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="total || 0"
          :hide-on-single-page="total < 10"
        />
      </div>
    </div>
    <sql-preview ref="sqlPreviewRef" />

    <modal-add-table ref="addTableDialog" add-type="addColumn" :current-node="currentNode" @handle-reload="handleRefresh" />
    <modal-ttl
      v-model:visible="modalTtlVisible"
      :current-database="currentNode?.database"
      :current-table="currentNode?.nodeName"
      :current-ttl="localCurrentNode?.ttl"
      type="table"
      @append-sql="handleAppendSql"
      @handle-save="
        (newTtl: string) => {
          localCurrentNode.ttl = newTtl;
        }
      "
    />
    <modal-comment
      v-model:visible="modalCommentVisible"
      :current-table="currentNode?.nodeName"
      :current-database="currentNode?.parentName"
      :current-column="currentColumn?.columnName"
      :current-comment="currentColumn?.comment"
      @append-sql="handleAppendSql"
      @handle-save="handleRefresh()"
    />
    <modal-import-table v-model:visible="importVisible" import-type="column" :current-node="currentNode" @handle-close="handleImportClose" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useTableHeight } from '@/composition-api';
import { storeToRefs } from 'pinia';
import { IoTDBApi } from '@/api';
import { useDbStore, useUserStore } from '@/stores';
import SqlPreview from '@/components/sql-preview.vue';
import ModalAddTable from './modal-add-table.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalComment from './modal-comment.vue';
import ModalImportTable from './modal-import-table.vue';
import ModalTtl from './modal-ttl.vue';

const props = defineProps<{
  currentNode: IoTDB.TreeNodeData;
}>();

const { t, locale } = useI18n();
const route = useRoute();
const searchKeyword = ref((route.query.databaseSearch as string) || '');
const searchType = ref('columnName');
const searchPlaceholder = computed(() => (searchType.value === 'columnName' ? t('dataManage.columnNamePlaceholder') : t('dataManage.commentPlaceholder')));
const { maxTableHeight } = useTableHeight(420);
const addTableDialog = ref<InstanceType<typeof ModalAddTable>>();
const columnsSelection = ref<IoTDB.TreeNodeData[]>([]);
const { requestFn: deleteColumns } = useRequest(IoTDBApi.deleteColumns);
const { requestFn: exportTableId } = useRequest(IoTDBApi.exportTableId);
const { data: columnVOS, requestFn: getColumnsList } = useRequest(IoTDBApi.getColumnsList);
const sqlPreviewRef = ref<InstanceType<typeof SqlPreview>>();
const modalCommentVisible = ref(false);
const currentColumn = ref<IoTDB.ColumnVOS>();
const currentPage = ref(1);
const pageSize = ref(10);
const userStore = useUserStore();
const { canReadWriteData } = storeToRefs(userStore);
const importVisible = ref(false);
const modalTtlVisible = ref(false);
const localCurrentNode = ref<IoTDB.TreeNodeData>({ ...props.currentNode });

const { getDatabases, setFirstLoad, setActiveList } = useDbStore();

const isSystemDatabase = computed(() => {
  return props.currentNode?.parentName === 'information_schema';
});

function showAddTableDialog() {
  if (addTableDialog.value) {
    addTableDialog.value?.open(props.currentNode, 'addColumn');
  }
}

const columnDataFilter = computed(() => {
  if (!columnVOS.value?.value?.length) return [];
  const filteredData = columnVOS.value.value.filter((item) =>
    searchType.value === 'columnName' ? item.columnName.toLowerCase().includes(searchKeyword.value.toLowerCase()) : item.comment?.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );

  return filteredData.sort((a, b) => {
    const categoryOrder = ['TIME', 'TAG', 'ATTRIBUTE', 'FIELD'];
    const indexA = categoryOrder.indexOf(a.cateGory);
    const indexB = categoryOrder.indexOf(b.cateGory);
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.columnName.localeCompare(b.columnName);
  });
});

const tableDataPagination = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return columnDataFilter.value.slice(start, end);
});

const total = computed(() => columnDataFilter.value.length || 0);

function handleSelectionChange(vals: IoTDB.TreeNodeData[]) {
  columnsSelection.value = vals;
}

function handleAppendSql(sql: string) {
  sqlPreviewRef.value?.appendSql(sql);
}

function getColumns() {
  getColumnsList(props.currentNode?.parentName || '', props.currentNode?.nodeName || '').then(() => {
    handleAppendSql(columnVOS.value?.sql || '');
  });
}

onMounted(() => {
  getColumns();
});

function handleEditTableTTL() {
  modalTtlVisible.value = true;
}

function handleEditTableComment(row: IoTDB.ColumnVOS) {
  currentColumn.value = row;
  modalCommentVisible.value = true;
}

function goto(page: number) {
  currentPage.value = page;
}

function handleRefresh() {
  getDatabases();
  getColumns();
}

function handleDelRow(type: string, row: IoTDB.TreeNodeData | null) {
  ElMessageBox.confirm(type === 'batch' ? `${t('dataManage.delColumnBatchTip')}` : `${t('dataManage.delColumnSingleTip')}`, t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'mesaurement-table-del-confirm',
    cancelButtonClass: 'mesaurement-table-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    let columnDelList = [] as string[];
    if (type === 'batch') {
      columnDelList = columnsSelection.value?.map((i) => i.columnName) as string[];
    } else {
      columnDelList = row?.columnName ? [row.columnName] : [];
    }
    const deleteData: IoTDB.DatabasePostData = {
      database: props.currentNode.parentName,
      tableName: props.currentNode.nodeName,
      columns: columnDelList,
    };
    deleteColumns(deleteData).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      setActiveList([`${props.currentNode.database}`, `${props.currentNode.database}-${props.currentNode.nodeName}`]);
      setFirstLoad(true);
      handleRefresh();
    });
  });
}

// 导出
function handleExportData(exportType: string) {
  exportTableId({
    database: props.currentNode?.database!,
    tableName: props.currentNode?.nodeName,
    name: searchType.value === 'columnName' ? searchKeyword.value : '',
    comment: searchType.value === 'comment' ? searchKeyword.value : '',
  }).then((res) => {
    let url = `/api/file/exportExcelTableColumnTable?exportId=${res.data}`;
    if (exportType === 'csv') {
      url = `/api/file/exportCsvTableColumnTable?exportId=${res.data}`;
    }
    window.open(url);
  });
}

// 下载
function handleCommandDown(val: string) {
  handleExportData(val);
}

// 导入
function handleImport() {
  importVisible.value = true;
}

// 导入物理量
function handleImportClose(reload: boolean) {
  if (reload) {
    setActiveList([`${props.currentNode.database}`, `${props.currentNode.database}-${props.currentNode.nodeName}`]);
    setFirstLoad(true);
    handleRefresh();
  }
}

defineExpose({
  handleRefresh,
});
</script>
<style lang="scss" scoped>
.database-detail-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100% - 32px);
  padding: 16px;
}

.info-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
  padding-bottom: 6px;
  border-bottom: 1px solid #dfe1ed;
  display: flex;
  align-items: center;
}

.database-info-box {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
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

.search-form-container {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;

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
  padding: 16px;
  background-color: #f7f8fc;
}

.row-description-box {
  display: flex;
  align-items: center;

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

.paination {
  display: flex;
  justify-content: center;
  margin-top: 10px;

  // padding: 10px 0px;
  .el-pagination {
    padding: 4px 5px 0;
  }
}
</style>
