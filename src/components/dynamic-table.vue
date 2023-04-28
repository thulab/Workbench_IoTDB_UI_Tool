<template>
  <div class="stand-table">
    <div class="border_table">
      <el-table
        :data="tableData"
        style="width: 100%;"
        :height="height"
        :max-height="maxHeight"
        tooltip-effect="light"
        :header-cell-style="{
          color: 'black',
          overflow: 'hidden',
          background: '#F9FAFC',
        }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column fixed="left" v-if="showSelect" type="selection" width="50" align="center" />
        <el-table-column :key="item.prop" v-for="item of columns" min-width="180px" :width="item.width + 'px'" :align="item.align" :fixed="item.fixed" show-overflow-tooltip>
          <template #header>
            <svg v-if="getIconName(item.icon)" class="icon m-r-5" :class="[{ 'icon-time': item.icon === 'TIME' }]" aria-hidden="true">
              <use :xlink:href="`#icon-${getIconName(item.icon)}`" />
            </svg>
            <!-- 用$t函数包裹title导致页面警告过多卡死页面-->
            <span
              :title="item.label"
            >{{ item.formatHeader ? item.formatHeader(item.label) : getLabelName(item.label) }}
            </span>
          </template>
          <template #default="scope">
            <span>{{ item.formatContent ? item.formatContent(scope.row[item.prop] || item.defaultValue) : scope.row[item.prop] || item.defaultValue }}</span>
          </template>
        </el-table-column>
        <slot name="append-column"></slot>
      </el-table>
    </div>
    <div class="paination" v-if="(showPagination || showBatchDelete)">
      <el-button v-if="showBatchDelete" type="primary" @click="deleteArrys" :loading="batchDeleting">{{ $t('standTable.deleteArry') }}</el-button>
      <div></div>
      <el-pagination
        v-if="showPagination"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        :hide-on-single-page="true"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  columns: Array<DynamicTableColumn>,
  tableData: Array<Record<string, any>>,
  maxHeight: number,
  height?: number,
  showPagination?: boolean,
  currentPage?: number,
  pageSize?: number,
  total?: number,
  batchDeleting?: boolean,
  showBatchDelete?: boolean,
  showSelect?: boolean,
}>();
const emit = defineEmits<{
  (event: 'batchDelete'): Promise<void>;
  (event: 'loadData'): Promise<void>;
  (event: 'selectedChange', payload: Record<string, any>[]): Promise<void>;
  (event: 'update:currentPage', payload: number): void;
  (event: 'update:pageSize', payload: number): void;
}>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { t } = useI18n();

const { getIconName } = useDataTypeIcon();

const currentPage = useVModel(props, 'currentPage');
const pageSize = useVModel(props, 'pageSize');

function handleSelectionChange(val: Record<string, any>[]) {
  emit('selectedChange', val);
}
function deleteArrys() {
  emit('batchDelete');
}

function handleCurrentChange() {
  emit('loadData');
}
function handleSizeChange() {
  emit('loadData');
}

const getLabelName = (label: string) => {
  if (label.indexOf('root') !== -1 || label === 'Time' || !label) {
    return label;
  }
  // return t(label);
  return label;
};
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

.border_table {
  border-radius: 4px;
  border: 1px solid #eaecf0;
}

.edit-f {
  cursor: pointer;
  padding-right: 3px;
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
  content: "*";
  color: #f56c6c;
  margin-right: 4px;
}

.paination {
  display: flex;
  justify-content: space-between;
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
</style>
