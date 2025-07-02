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
          {{ databaseInfos?.ttl ? databaseInfos?.ttl : '-' }}
          <el-icon
            size="24"
            class="m-r-6 svg-button-hover-color"
            style="cursor: pointer"
            @click="
              ttlType = 'db';
              modalTtlVisible = true;
            "
          >
            <i-custom-edit />
          </el-icon>
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
        <el-button type="primary" id="table-add" @click="showAddTableDialog">
          {{ t('common.add') }}
        </el-button>
        <el-button type="primary" id="mesaurement-batch-del" @click="handleDelRow('batch', null)" :disabled="!multipleSelection.length">
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
        <el-table-column :label="t('dataManage.tableName')" prop="tableName" :show-overflow-tooltip="true" />
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
        <el-table-column label="TTL(ms)" prop="ttl" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <div class="row-description-box">
              <div class="row-description-text">
                <text-tooltip :content="row.ttl || ''" />
              </div>
              <div class="edit-box flex-align-center" @click="handleEditTableTTL(row)" v-if="!isSystemDatabase">
                <i-custom-edit-normal class="edit-icon" />
                <i-custom-edit-active class="edit-icon-active" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operation')" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDelRow('row', row)" :disabled="isSystemDatabase" :id="`mesaurement-table-${row.tableName}-del`">
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

    <modal-add-table ref="addTableDialog" @handle-reload="handleRefresh" @append-sql="handleAppendSql" />
    <modal-ttl
      v-model:visible="modalTtlVisible"
      :current-database="currentNode?.database"
      :current-table="currentTable?.tableName"
      :current-ttl="ttlType === 'db' ? currentNode.ttl : currentTable?.ttl"
      :type="ttlType"
      :key="modalTTLNum"
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
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { IoTDBApi } from '@/api';
import { useTableHeight } from '@/composition-api';
import { useDbStore } from '@/stores';
import SqlPreview from '@/components/sql-preview.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalTtl from './modal-ttl.vue';
import ModalAddTable from './modal-add-table.vue';
import ModalComment from './modal-comment.vue';

const props = defineProps<{
  currentNode: IoTDB.TreeNodeData;
}>();

const sqlPreviewRef = ref<InstanceType<typeof SqlPreview>>();

const { t } = useI18n();
const route = useRoute();
const { data: schemaDataDbInfo, requestFn: getDatabaseInfo } = useRequest(IoTDBApi.getDatabaseInfo);
const { data: tableVO, requestFn: getTableList } = useRequest(IoTDBApi.getTableList);
const { requestFn: deleteTables } = useRequest(IoTDBApi.deleteTables);
const searchKeyword = ref((route.query.databaseSearch as string) || '');
const databaseInfos = ref<IoTDB.DatabaseInfo | null>(null);
const searchType = ref('tableName');
const searchPlaceholder = computed(() => (searchType.value === 'tableName' ? t('dataManage.tableNamePlaceholder') : t('dataManage.commentPlaceholder')));
const { maxTableHeight } = useTableHeight(410);
const modalTtlVisible = ref(false);
const modalCommentVisible = ref(false);
const currentTable = ref<IoTDB.TableVO>();
const modalTTLNum = ref(0);
const ttlType = ref('db'); // 'db' or 'table'
const multipleSelection = ref<IoTDB.TableVO[]>([]);
const addTableDialog = ref<InstanceType<typeof ModalAddTable>>();
const currentPage = ref(1);
const pageSize = ref(10);

const { getDatabases, setFirstLoad } = useDbStore();

const isSystemDatabase = computed(() => {
  return props.currentNode?.nodeName === 'information_schema';
});

function handleAppendSql(sql: string) {
  sqlPreviewRef.value?.appendSql(sql);
}

const tableDataFilter = computed(() => {
  if (tableVO.value?.value && tableVO.value.value.length) {
    return tableVO.value.value.filter((item) =>
      searchType.value === 'tableName'
        ? item.tableName.toLocaleLowerCase().includes(searchKeyword.value.toLocaleLowerCase())
        : item.comment?.toLocaleLowerCase().includes(searchKeyword.value.toLocaleLowerCase())
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

function handleEditTableTTL(row: IoTDB.TableVO) {
  ttlType.value = 'table';
  currentTable.value = row;
  modalTtlVisible.value = true;
  modalTTLNum.value++;
}
function handleEditTableComment(row: IoTDB.TableVO) {
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

function handleSelectionChange(vals: IoTDB.TableVO[]) {
  multipleSelection.value = vals;
}

function handleDelRow(type: string, row: IoTDB.TableVO | null) {
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
      setFirstLoad(true);
      handleRefresh();
    });
  });
}

function goto(page: number) {
  currentPage.value = page;
}

watch(
  () => props.currentNode,
  (newNode) => {
    if (newNode) {
      getDatabaseDetail(newNode.nodeName);
    }
  }
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
  height: 100%;
}

.info-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
  padding: 14px 0 6px 16px;
  border-bottom: 1px solid #dfe1ed;
  display: flex;
  align-items: center;
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
