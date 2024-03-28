<template>
  <active-container :is-show="connectionIsActive">
    <el-container class="details-wrapper">
      <el-main class="p-0">
        <h4 class="detail-title-text">{{ t('white.config') }}</h4>
        <div class="config-switch-box">
          <span class="config-label">{{ t('white.switch') }}：</span>
          <el-switch v-model="configStatus" :active-value="1" :inactive-value="0" style="--el-switch-on-color: #44c795; --el-switch-off-color: #dfe1ed" id="white-list-status" />
        </div>

        <h4 class="detail-title-text">t('white.list')</h4>
        <div class="detail-no-config-box" v-if="!configStatus">
          <img src="@/assets/white-list-empty.png" alt="" class="data-empty-img" />
          <span class="data-empty-text">{{ t('white.ipTip') }}</span>
        </div>
        <div class="list-container" v-else>
          <div class="search-form-wrapper">
            <div class="search-form-box">
              <span class="search-from-label">{{ t('white.ip') }}：</span>
              <el-input v-model="searchKeyword" :placeholder="t('white.ipPlaceholder')" @keyup.enter="handleRefresh" id="white-list-search-ip">
                <template #prefix>
                  <i-custom-search-icon class="remote-select-search-icon" @click="handleRefresh" id="white-list-search-icon" />
                </template>
              </el-input>
            </div>

            <div class="search-form-buttons">
              <el-button type="primary" @click="handleAdd" class="handle-add-button" id="white-list-add">
                <el-icon size="24" class="m-r-4"><i-custom-new-white-list /></el-icon>
                {{ t('white.addIp') }}
              </el-button>
            </div>
          </div>

          <div class="table-box">
            <el-table
              :data="tableData"
              v-loading="loading"
              style="width: 100%"
              :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
              :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
              tooltip-effect="light"
              :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
              ref="tableRef"
            >
              <el-table-column :label="t('white.ip')" prop="ip" align="center" />
              <el-table-column :label="t('common.operation')" width="120" align="center">
                <template #default="{ row, $index }">
                  <el-button type="primary" link size="small" :disabled="row === '127.0.0.1'" @click="handleEditRow(row)" :id="`white-list-table-${$index}-edit`">{{ t('common.edit') }}</el-button>
                  <el-button type="primary" link size="small" :disabled="row === '127.0.0.1'" @click="handleDelRow(row)" :id="`white-list-table-${$index}-del`">{{ t('common.delete') }}</el-button>
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
              class="m-t-20"
              layout="prev, pager, next, sizes, jumper"
              background
              :page-sizes="[10, 20, 50, 100]"
              :total="totalCount"
              @size-change="onChangePageSize"
              @current-change="onChangePage"
            />
          </div>
        </div>
      </el-main>
      <modal-ip v-model:visible="dialogVisible" :edit-data="editData" />
    </el-container>
  </active-container>
</template>

<script setup lang="ts">
import { useTableHeight } from '@/composition-api';
import { useConnectionStore } from '@/stores';
import ModalIp from './components/modal-ip.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const { t } = useI18n();
const connectionStore = useConnectionStore();
const connectionIsActive = computed(() => typeof connectionStore.connectionIsActive === 'boolean');
const { maxTableHeight } = useTableHeight(390);
const configStatus = ref(1);
const searchKeyword = ref('');
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const tableData = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editData = ref('');

function getListData() {
  totalCount.value = 0;
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

function handleAdd() {
  editData.value = '';
  dialogVisible.value = true;
}

function handleEditRow(data: any) {
  editData.value = data.ip;
  dialogVisible.value = true;
  console.log(data);
}

function handleDelRow(data: any) {
  console.log(data);
  ElMessageBox.confirm(t('white.deleteTip'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-white-list-confirm',
    cancelButtonClass: 'del-white-list-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
    handleRefresh();
  });
}

onMounted(() => {
  if (!connectionIsActive.value) return;
  getListData();
});

watch(
  () => connectionIsActive.value,
  (val) => {
    if (val) {
      getListData();
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.details-wrapper {
  background-color: #fff;
  border-radius: 6px;
}

.detail-title-text {
  width: 100%;
  border-bottom: 1px solid #dfe1ed;
  padding: 14px 16px 6px;
  box-sizing: border-box;
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
}

.config-switch-box {
  padding: 18px 16px 16px;
  width: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;

  :deep(.el-switch) {
    height: 28px;
  }

  :deep(.el-switch__core) {
    width: 64px;
    height: 28px;
    border-radius: 14px;
  }

  :deep(.el-switch__action) {
    width: 24px;
    height: 24px;
  }

  :deep(.el-switch.is-checked .el-switch__core .el-switch__action) {
    left: calc(100% - 24px);
  }

  .config-label {
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #131926;
    margin-right: 8px;
  }
}

.list-container {
  padding: 16px;
  box-sizing: border-box;
}

.search-form-wrapper {
  display: flex;
  justify-content: space-between;
  padding: 2px 0 18px;

  .search-form-box {
    display: flex;
    align-items: center;

    .search-from-label {
      font-size: 14px;
      font-weight: 400;
      line-height: 21px;
      color: #131926;
      flex: 0 0 63px;
    }
  }

  .handle-add-button {
    padding-left: 2px;
    padding-right: 4px;
  }
}

.table-box {
  padding: 16px;
  background-color: #f7f8fc;
}

.detail-no-config-box {
  width: 100%;
  height: calc(100% - 146px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .data-empty-img {
    width: 150px;
    height: 150px;
    margin-bottom: 16px;
  }

  .data-empty-text {
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #131926;
  }
}
</style>
