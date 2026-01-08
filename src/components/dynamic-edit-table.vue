<template>
  <div class="stand-table">
    <div class="flex row">
      <div class="border_table flex-1" :style="{ maxWidth: totalColumnPage > 1 ? 'calc(100% - 70px)' : '100%' }">
        <el-table
          :data="currentTableData"
          style="width: 100%"
          :height="tableHeight"
          :max-height="tableMaxHeight"
          tooltip-effect="light"
          :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
          :default-sort="defaultSort"
          @sort-change="handleSortChange"
          @selection-change="handleSelectionChange"
        >
          <el-table-column fixed="left" v-if="showSelect" type="selection" width="50" align="center" />
          <el-table-column
            :key="item!.prop"
            :prop="item!.prop"
            v-for="item of columnsByPage"
            min-width="180px"
            :width="`${item!.width}px`"
            :align="item!.align"
            :fixed="item!.fixed"
            :sortable="item!.sortable"
            :sort-orders="['ascending', 'descending']"
            show-overflow-tooltip
          >
            <template #header>
              <span :class="item!.sortable ? '' : 'flex-header'"><text-tooltip :content="item!.label" /></span>
            </template>
            <template #default="scope">
              <span v-if="!scope.row.editable">{{ item!.formatContent ? item!.formatContent(scope.row[item!.prop] || item!.defaultValue) : scope.row[item!.prop] || item!.defaultValue }}</span>
              <el-input v-else v-model="scope.row[item!.prop]" :type="item!.type || 'text'" :style="{ width: item!.width ? `${item!.width}px` : '100%' }" class="tag_content" />
            </template>
          </el-table-column>
          <el-table-column fixed="right" width="200" align="center" label="操作">
            <template #default="scope">
              <el-button v-if="!scope.row.editable && canDelete" :disabled="isSystemDatabase" class="edit-f" type="text" size="small" @click="$emit('deleteRow', scope.row)">
                {{ t('common.delete') }}
              </el-button>
              <template v-else-if="!scope.row.editable && !canDelete && isSystemDatabase">
                <el-button :disabled="true" size="small" type="text">
                  {{ t('common.delete') }}
                </el-button>
              </template>
              <el-tooltip v-else-if="!scope.row.editable && !canDelete" effect="light" :content="cannotDeleteTip" placement="top" popper-class="table-tooltip-max-width">
                <el-button :disabled="true" size="small" type="text">
                  {{ t('common.delete') }}
                </el-button>
              </el-tooltip>
              <template v-if="scope.row.editable">
                <el-button class="edit-f" type="text" size="small" @click="handleSaveRow(scope.row)">{{ t('common.save') }}</el-button>
                <el-button
                  class="edit-f"
                  type="text"
                  size="small"
                  @click="
                    scope.row.editable = false;
                    newRows.splice(newRows.indexOf(scope.row), 1);
                  "
                >
                  {{ t('common.cancel') }}
                </el-button>
              </template>
            </template>
          </el-table-column>
          <slot name="append-column"></slot>
          <template #empty>
            <div class="table-empty-wrapper">
              <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
              <span class="data-empty-text">{{ t('common.noData') }}</span>
            </div>
          </template>
        </el-table>
      </div>
      <div style="width: 60px" class="m-l-4" v-if="totalColumnPage > 1">
        <el-button size="small" @click="columnPageNum--" :disabled="columnPageNum < 2" circle><i-ep-arrow-left-bold /></el-button>
        <el-button class="m-l-4" @click="columnPageNum++" :disabled="columnPageNum >= totalColumnPage" size="small" circle><i-ep-arrow-right-bold /></el-button>
      </div>
    </div>
    <div class="paination" v-if="showPagination && total && total > 0">
      <div></div>
      <el-pagination
        v-if="showPagination"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        v-model:current-page="currentPageVM"
        v-model:page-size="pageSizeVM"
        layout="prev, pager, next, sizes, jumper"
        :page-sizes="[10, 20, 50, 100]"
        :total="total || 0"
        :hide-on-single-page="total < 10"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Sort } from 'element-plus';
import type { TableTreeNodeData } from '@/types';

const props = defineProps<{
  columns: Array<globalThis.DynamicTableColumn>;
  tableData: Array<Record<string, any>>;
  defaultSort?: Sort;
  maxHeight: number;
  height?: number;
  showPagination?: boolean;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  batchDeleting?: boolean;
  showSelect?: boolean;
  currentNode?: TableTreeNodeData;
  canDelete?: boolean;
  cannotDeleteTip?: string;
}>();
const emit = defineEmits<{
  (event: 'batchDelete'): Promise<void>;
  (event: 'loadData'): Promise<void>;
  (event: 'selectedChange', payload: Record<string, any>[]): Promise<void>;
  (event: 'handleSortChange', data: { column: any; prop: string; order: any }): void;
  (event: 'update:currentPage', payload: number): void;
  (event: 'update:pageSize', payload: number): void;
  (event: 'deleteRow', row: Record<string, any>): void;
  (event: 'saveRow', row: Record<string, any>): void;
}>();

const isSystemDatabase = computed(() => props.currentNode?.database === 'information_schema');

const { t } = useI18n();
const currentPageVM = useVModel(props, 'currentPage');
const pageSizeVM = useVModel(props, 'pageSize');
const columnPageSize = 100;
const newRows = ref<Record<string, any>[]>([]);

const currentTableData = computed(() => {
  if (newRows.value.length > 0) {
    return [...props.tableData, ...newRows.value];
  }
  return props.tableData || [];
});

const tableHeight = computed(() => {
  const total = props.total || 0;
  if (total < 10 && props.pageSize && props.height) {
    return props.height + 41;
  }
  return props.height;
});
const tableMaxHeight = computed(() => {
  const total = props.total || 0;
  if (total < 10 && props.pageSize && props.height) {
    return props.maxHeight + 41;
  }
  return props.maxHeight;
});

const totalColumnPage = computed(() => Math.ceil((props.columns.length - 1) / columnPageSize));
const columnPageNum = ref(1);

const columnsByPage = computed(() => {
  if (props.columns && props.columns.length <= 11) {
    return props.columns;
  }
  if (!props.columns) {
    return [];
  }
  const start = (columnPageNum.value - 1) * columnPageSize + 1;
  const end = columnPageNum.value * columnPageSize + 1;
  return [props.columns[0], ...props.columns.slice(start, end)];
});

// 添加新行
const newRow = () => {
  if (newRows.value.length >= 1) {
    ElMessage.warning({ message: t('common.onlyOneNewRow') });
    return;
  }
  const newItem: Record<string, any> = {};
  props.columns.forEach((col) => {
    newItem[col.prop] = '';
  });
  newItem.editable = true;
  newItem.isNew = true;
  newRows.value.push(newItem);
};

// 保存成功后从新增中移除
const onSaveRow = (row: Record<string, any>) => {
  if (row.isNew) {
    newRows.value.splice(newRows.value.indexOf(row), 1);
  } else {
    row.editable = false;
  }
};
// 保存行
const handleSaveRow = (row: Record<string, any>) => {
  emit('saveRow', row);
};

defineExpose({
  newRow,
  onSaveRow,
});

watch(props.columns, () => {
  columnPageNum.value = 1;
});

function handleSelectionChange(val: Record<string, any>[]) {
  emit('selectedChange', val);
}

function handleSortChange(data: { column: any; prop: string; order: any }) {
  emit('handleSortChange', data);
}

function handleCurrentChange() {
  emit('loadData');
}
function handleSizeChange() {
  emit('loadData');
}
</script>

<style lang="scss" scoped>
.stand-table {
  .icon {
    cursor: pointer;
  }

  .icon-time {
    color: #4eb5ff;
  }
}

.flex-header {
  display: flex;
  max-width: 100%;
}

.border_table {
  border-radius: 4px;
  max-width: calc(100% - 70px);
  border: 1px solid #eaecf0;
}

.edit-f {
  cursor: pointer;
  padding-right: 3px;
}

.stand-table :deep(.el-button.is-disabled.el-button--text) {
  color: #9bb5ff !important;
  opacity: 1 !important;
  cursor: not-allowed;
}

.tag_content {
  div {
    padding: 8px 0;
  }

  .icon_color {
    cursor: pointer;
    color: #7a859f;
  }

  .content {
    div {
      text-align: center;
    }

    i {
      color: red;
    }

    .el-input__inner {
      width: 150px;
    }
  }
}

.spanbox::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
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

:deep(.el-table) th > .cell {
  white-space: nowrap;
}
</style>
<style lang="scss">
.border-red {
  border: 1px solid red;
  border-radius: 4px;
}

.tag_content {
  .content {
    .el-input {
      width: 100px;
      padding: 0 16px;
    }
  }
}

.table-empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px 0;

  .data-empty-img {
    width: 150px;
    height: 150px;
    margin-bottom: 16px;
  }

  .data-empty-text {
    font-size: 14px;
    color: #131926;
    line-height: 21px;
  }
}
</style>
