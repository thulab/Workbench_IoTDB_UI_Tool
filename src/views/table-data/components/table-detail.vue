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
          {{ currentNode?.ttl }}
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
    <modal-comment
      v-model:visible="modalCommentVisible"
      :current-table="currentNode?.nodeName"
      :current-database="currentNode?.parentName"
      :current-column="currentColumn?.columnName"
      :current-comment="currentColumn?.comment"
      @append-sql="handleAppendSql"
      @handle-save="handleRefresh()"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useTableHeight } from '@/composition-api';
import { IoTDBApi } from '@/api';
import { useDbStore } from '@/stores';
import SqlPreview from '@/components/sql-preview.vue';
import ModalAddTable from './modal-add-table.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalComment from './modal-comment.vue';

const props = defineProps<{
  currentNode: IoTDB.TreeNodeData;
}>();

const { t } = useI18n();
const route = useRoute();
const searchKeyword = ref((route.query.databaseSearch as string) || '');
const searchType = ref('columnName');
const searchPlaceholder = computed(() => (searchType.value === 'columnName' ? t('dataManage.columnNamePlaceholder') : t('dataManage.commentPlaceholder')));
const { maxTableHeight } = useTableHeight(420);
const addTableDialog = ref<InstanceType<typeof ModalAddTable>>();
const columnsSelection = ref<IoTDB.TreeNodeData[]>([]);
const { requestFn: deleteColumns } = useRequest(IoTDBApi.deleteColumns);
const { data: columnVOS, requestFn: getColumnsList } = useRequest(IoTDBApi.getColumnsList);
const sqlPreviewRef = ref<InstanceType<typeof SqlPreview>>();
const modalCommentVisible = ref(false);
const currentColumn = ref<IoTDB.ColumnVOS>();
const currentPage = ref(1);
const pageSize = ref(10);

const { getDatabases } = useDbStore();

const isSystemDatabase = computed(() => {
  return props.currentNode?.parentName === 'information_schema';
});

function showAddTableDialog() {
  if (addTableDialog.value) {
    addTableDialog.value?.open(props.currentNode, 'addColumn');
  }
}

const columnDataFilter = computed(() => {
  if (columnVOS.value?.value && columnVOS.value.value.length) {
    return columnVOS.value.value.filter((item) =>
      searchType.value === 'columnName'
        ? item.columnName.toLocaleLowerCase().includes(searchKeyword.value.toLocaleLowerCase())
        : item.comment?.toLocaleLowerCase().includes(searchKeyword.value.toLocaleLowerCase())
    );
  }
  return [];
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
      handleRefresh();
    });
  });
}
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
