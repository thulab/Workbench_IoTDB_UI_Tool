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
        <li class="database-info-item" id="device-total-li" v-if="!isSystemDatabase">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.ttl') }}：</span>
          {{ databaseInfos?.ttl ? `${databaseInfos?.ttl} ms` : 'INF' }}
          <auth-tooltip :is-disabled="canAlterDatabase" content="dataManage.needAlterPrivilege">
            <span>
              <el-icon
                size="24"
                class="svg-button-hover-color m-r-6"
                :class="{ 'edit-disabled': !canAlterDatabase }"
                :style="{ cursor: canAlterDatabase ? 'pointer' : 'not-allowed' }"
                @click="handleEditDbTTL"
              >
                <i-custom-edit />
              </el-icon>
            </span>
          </auth-tooltip>
        </li>
        <li class="database-info-item" id="measurement-total-li" v-if="!isSystemDatabase">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.partitionInterval') }}：</span>
          {{ databaseInfos?.partitionInterval }} {{ databaseInfos?.partitionIntervalUnit }}
        </li>
        <li class="database-info-item" id="measurement-total-li" v-if="!isSystemDatabase">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.schemaDuplicate') }}：</span>
          {{ databaseInfos?.schemaDuplicate }}
        </li>
        <li class="database-info-item" id="measurement-total-li" v-if="!isSystemDatabase">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.dataDuplicate') }}：</span>
          {{ databaseInfos?.dataDuplicate }}
        </li>
        <li class="database-info-item" id="measurement-total-li">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.tables') }}：</span>
          {{ currentNode?.children?.length || 0 }}
        </li>
      </ul>
    </div>

    <div class="search-form-container">
      <div class="search-form-box">
        <el-input v-model="searchKeyword" :placeholder="searchPlaceholder" @keyup.enter="goto(1)" id="mesaurement-search" style="width: 340px">
          <template #prefix>
            <i-custom-search-icon class="remote-select-search-icon" />
          </template>
          <template #prepend>
            <el-select v-model="searchType" style="width: 88px" placeholder="" @change="goto(1)" id="measurement-search-type" class="measurement-search-type-select">
              <el-option :label="t('dataManage.tableName')" value="tableName" id="measurement-search-type-name" />
              <el-option :label="t('dataManage.comment')" value="comment" id="measurement-search-type-description" />
            </el-select>
          </template>
        </el-input>
      </div>

      <div class="search-form-buttons">
        <template v-if="isInformationSchemaDatabase">
          <el-tooltip effect="light" :content="t('common.systemTableViewOnly')" placement="top" :disabled="false">
            <span>
              <el-button type="primary" :disabled="true" id="table-add" @click="showAddTableDialog">
                {{ t('common.add') }}
              </el-button>
            </span>
          </el-tooltip>
        </template>
        <template v-else>
          <auth-tooltip :is-disabled="canCreateTable" content="dataManage.needCreatePrivilege">
            <span>
              <el-button type="primary" :disabled="!canCreateTable" id="table-add" @click="showAddTableDialog">
                {{ t('common.add') }}
              </el-button>
            </span>
          </auth-tooltip>
        </template>

        <template v-if="isInformationSchemaDatabase">
          <el-tooltip effect="light" :content="t('common.systemTableViewOnly')" placement="top" :disabled="false">
            <span>
              <el-button class="m-l-16" :disabled="true" @click="handleImport" id="table-data-import">
                {{ t('common.import') }}
              </el-button>
            </span>
          </el-tooltip>
        </template>
        <template v-else>
          <auth-tooltip :is-disabled="canCreateTable" content="dataManage.needCreatePrivilege">
            <span>
              <el-button class="m-l-16" :disabled="!canCreateTable" @click="handleImport" id="table-data-import">
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
              <el-button type="primary" id="mesaurement-batch-del" @click="handleDelRow('batch', null)" :disabled="true">
                {{ t('common.batchDelete') }}
              </el-button>
            </span>
          </el-tooltip>
        </template>
        <template v-else>
          <auth-tooltip :is-disabled="canDropTables" content="dataManage.needDropPrivilege">
            <span>
              <el-button type="primary" id="mesaurement-batch-del" @click="handleDelRow('batch', null)" :disabled="!multipleSelection.length || !canDropTables">
                {{ t('common.batchDelete') }}
              </el-button>
            </span>
          </auth-tooltip>
        </template>

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
        <el-table-column :label="t('dataManage.tableName')" prop="tableName" :show-overflow-tooltip="true" />
        <el-table-column :label="t('dataManage.comment')" prop="comment" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <div class="row-description-box">
              <div class="row-description-text">
                <text-tooltip :content="row.comment && row.comment !== 'null' ? row.comment : '-'" />
              </div>
              <auth-tooltip :is-disabled="canAlterTableRow(row.tableName)" content="dataManage.needAlterPrivilege" v-if="!isSystemDatabase">
                <span>
                  <div class="edit-box flex-align-center" :class="{ 'edit-disabled': !canAlterTableRow(row.tableName) }" @click="handleEditTableComment(row)">
                    <i-custom-edit-normal class="edit-icon" />
                    <i-custom-edit-active class="edit-icon-active" />
                  </div>
                </span>
              </auth-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="TTL(ms)" prop="ttl" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <div class="row-description-box">
              <div class="row-description-text">
                <text-tooltip :content="row.ttl || ''" />
              </div>
              <auth-tooltip :is-disabled="canAlterTableRow(row.tableName)" content="dataManage.needAlterPrivilege" v-if="!isSystemDatabase">
                <span>
                  <div class="edit-box flex-align-center" :class="{ 'edit-disabled': !canAlterTableRow(row.tableName) }" @click="handleEditTableTTL(row)">
                    <i-custom-edit-normal class="edit-icon" />
                    <i-custom-edit-active class="edit-icon-active" />
                  </div>
                </span>
              </auth-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operation')" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="isSystemDatabase" type="primary" link size="small" :disabled="true" :id="`mesaurement-table-${row.tableName}-del`">
              {{ t('common.delete') }}
            </el-button>
            <auth-tooltip v-else :is-disabled="canDropTableRow(row.tableName)" content="dataManage.needDropPrivilege">
              <span>
                <el-button type="primary" link size="small" @click="handleDelRow('row', row)" :disabled="!canDropTableRow(row.tableName)" :id="`mesaurement-table-${row.tableName}-del`">
                  {{ t('common.delete') }}
                </el-button>
              </span>
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

    <modal-add-table ref="addTableDialog" @handle-reload="handleRefresh" @append-sql="handleAppendSql" />
    <modal-ttl
      v-model:visible="modalTtlVisible"
      :current-database="currentNode?.database"
      :current-table="currentTable?.tableName"
      :current-ttl="ttlType === 'db' ? databaseInfos?.ttl : currentTable?.ttl"
      :type="ttlType"
      @append-sql="handleAppendSql"
      @handle-save="handleRefresh()"
    />
    <modal-comment
      v-model:visible="modalCommentVisible"
      :current-table="currentTable?.tableName"
      :current-database="currentNode?.database"
      :current-comment="currentTable?.comment"
      @append-sql="handleAppendSql"
      @handle-save="handleRefresh()"
    />
    <modal-import-table v-model:visible="importVisible" import-type="table" :current-node="currentNode" @handle-close="handleImportClose" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { IoTDBApi } from '@/api';
import { storeToRefs } from 'pinia';
import { useTableHeight } from '@/composition-api';
import { useDbStore, useUserStore, useConnectionStore } from '@/stores';
import SqlPreview from '@/components/sql-preview.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalTtl from './modal-ttl.vue';
import ModalAddTable from './modal-add-table.vue';
import ModalComment from './modal-comment.vue';
import ModalImportTable from './modal-import-table.vue';
import type { TableTreeNodeData, TableDatabaseInfo, TableVO } from '@/types';

const props = defineProps<{
  currentNode: TableTreeNodeData;
}>();

const sqlPreviewRef = ref<InstanceType<typeof SqlPreview>>();

const { t, locale } = useI18n();
const route = useRoute();
const { data: schemaDataDbInfo, requestFn: getDatabaseInfo } = useRequest(IoTDBApi.getDatabaseInfo);
const { data: tableVO, requestFn: getTableList } = useRequest(IoTDBApi.getTableList);
const { requestFn: deleteTables } = useRequest(IoTDBApi.deleteTables);
const { requestFn: exportTableId } = useRequest(IoTDBApi.exportTableId);
const searchKeyword = ref((route.query.databaseSearch as string) || '');
const databaseInfos = ref<TableDatabaseInfo | null>(null);
const searchType = ref('tableName');
const searchPlaceholder = computed(() => (searchType.value === 'tableName' ? t('dataManage.tableNamePlaceholder') : t('dataManage.commentPlaceholder')));
const { maxTableHeight } = useTableHeight(340);
const modalTtlVisible = ref(false);
const modalCommentVisible = ref(false);
const currentTable = ref<TableVO>();
const ttlType = ref('db'); // 'db' or 'table'
const multipleSelection = ref<TableVO[]>([]);
const addTableDialog = ref<InstanceType<typeof ModalAddTable>>();
const currentPage = ref(1);
const pageSize = ref(10);
const userStore = useUserStore();
const connectionStore = useConnectionStore();
const { isTableModel } = storeToRefs(connectionStore);
const { canWriteSchema } = storeToRefs(userStore);
const importVisible = ref(false);

const { getDatabases, setFirstLoad, setActiveList } = useDbStore();
const isInformationSchemaDatabase = computed(() => {
  return props.currentNode?.nodeName === 'information_schema';
});

const isSystemDatabase = computed(() => {
  return props.currentNode?.nodeName === 'information_schema';
});

const canCreateTable = computed(() => {
  const dbName = props.currentNode?.nodeName;
  if (isTableModel.value) {
    return userStore.hasTableModelPrivilege('CREATE', dbName);
  }
  return canWriteSchema.value;
});

const canDropTables = computed(() => {
  if (isInformationSchemaDatabase.value) return false;
  const dbName = props.currentNode?.nodeName;
  if (isTableModel.value) {
    return userStore.hasTableModelPrivilege('DROP', dbName);
  }
  return canWriteSchema.value;
});

const canAlterDatabase = computed(() => {
  if (isInformationSchemaDatabase.value) return false;
  const dbName = props.currentNode?.nodeName;
  if (isTableModel.value) {
    return userStore.hasTableModelPrivilege('ALTER', dbName);
  }
  return canWriteSchema.value;
});

function canAlterTableRow(tableName?: string) {
  if (isSystemDatabase.value) return false;
  const dbName = props.currentNode?.nodeName;
  if (isTableModel.value) {
    return userStore.hasTableModelPrivilege('ALTER', dbName, tableName);
  }
  return canWriteSchema.value;
}

function canDropTableRow(tableName?: string) {
  if (isSystemDatabase.value) return false;
  const dbName = props.currentNode?.nodeName;
  if (isTableModel.value) {
    return userStore.hasTableModelPrivilege('DROP', dbName, tableName);
  }
  return canWriteSchema.value;
}

function handleAppendSql(sql: string) {
  sqlPreviewRef.value?.appendSql(sql);
}

const tableDataFilter = computed(() => {
  if (tableVO.value?.value && tableVO.value.value.length) {
    return tableVO.value.value.filter((item) =>
      searchType.value === 'tableName'
        ? item.tableName.toLocaleLowerCase().includes(searchKeyword.value.toLocaleLowerCase())
        : item.comment?.toLocaleLowerCase().includes(searchKeyword.value.toLocaleLowerCase()),
    );
  }
  return [];
});

const tableDataPagination = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableDataFilter.value.slice(start, end);
});

const total = computed(() => tableDataFilter.value.length || 0);

function showAddTableDialog() {
  if (addTableDialog.value) {
    addTableDialog.value?.open(props.currentNode);
  }
}

// 存储组详细信息
function getDatabaseDetail(data: string) {
  getDatabaseInfo(data).then(() => {
    handleAppendSql(schemaDataDbInfo.value.sql || '');
    databaseInfos.value = schemaDataDbInfo.value.value;
  });
}

function handleEditDbTTL() {
  if (!canAlterDatabase.value) return;
  ttlType.value = 'db';
  modalTtlVisible.value = true;
}

function handleEditTableTTL(row: TableVO) {
  if (!canAlterTableRow(row.tableName)) return;
  ttlType.value = 'table';
  currentTable.value = row;
  modalTtlVisible.value = true;
}
function handleEditTableComment(row: TableVO) {
  if (!canAlterTableRow(row.tableName)) return;
  currentTable.value = row;
  modalCommentVisible.value = true;
}

function handleRefresh() {
  getDatabases();
  getDatabaseDetail(props.currentNode?.nodeName || '');
  getTableList(props.currentNode?.nodeName || '').then(() => {
    handleAppendSql(tableVO.value?.sql || '');
  });
}

function handleSelectionChange(vals: TableVO[]) {
  multipleSelection.value = vals;
}

function handleDelRow(type: string, row: TableVO | null) {
  ElMessageBox.confirm(type === 'batch' ? `${t('dataManage.delTableBatchTip')}` : `${t('dataManage.delTableSingleTip')}`, t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'mesaurement-table-del-confirm',
    cancelButtonClass: 'mesaurement-table-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    let measurementList = [];
    if (type === 'batch') {
      measurementList = multipleSelection.value?.map((i) => i.tableName);
    } else {
      measurementList = row?.tableName ? [row.tableName] : [];
    }
    deleteTables(props.currentNode.nodeName, measurementList).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      setActiveList([`${props.currentNode.database}`]);
      setFirstLoad(true);
      handleRefresh();
    });
  });
}

function goto(page: number) {
  currentPage.value = page;
}

// 导出
function handleExportData(exportType: string) {
  exportTableId({
    database: props.currentNode?.nodeName,
    name: searchType.value === 'tableName' ? searchKeyword.value : '',
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
    setActiveList([`${props.currentNode.database}`]);
    handleRefresh();
  }
}

watch(
  () => props.currentNode,
  (newNode) => {
    if (newNode) {
      getDatabaseDetail(newNode.nodeName);
    }
  },
);

onMounted(() => {
  getDatabaseDetail(props.currentNode?.nodeName || '');
  getTableList(props.currentNode?.nodeName || '');
});

defineExpose({
  handleRefresh,
});
</script>
<style lang="scss" scoped>
.database-detail-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100% - 32px);
  padding: 8px;
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
  padding: 8px;
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
