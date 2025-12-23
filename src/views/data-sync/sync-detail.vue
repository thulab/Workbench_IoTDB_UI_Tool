<template>
  <version-container :is-show="showAuthMenu" :versionTip="'1.2.1'">
    <el-container class="data-sync-detail-wrapper" v-if="showMain">
      <el-header class="search-form-wrapper p-x-0" style="height: auto">
        <el-form :model="searchFormData" label-position="left" size="default" inline @submit.prevent>
          <base-form-item :label="`${t('dataSync.taskName')}：`" prop="name">
            <el-input v-model="searchFormData.name" :placeholder="t('dataSync.taskNamePlaceholder')" id="data-sync-search-name" style="width: 200px">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
            </el-input>
          </base-form-item>
        </el-form>
        <div class="search-form-buttons">
          <el-button @click="handleReset" id="data-sync-search-reset">{{ t('common.reset') }}</el-button>
          <auth-tooltip :is-disabled="canUsePipe" :content="'common.pipeAuth'">
            <el-button type="primary" @click="handleSearch" :disabled="!canUsePipe" id="data-sync-search-search">{{ t('common.query') }}</el-button>
          </auth-tooltip>
        </div>
      </el-header>
      <el-main class="p-0">
        <div class="page-table-details">
          <div class="page-table-title-box">
            <h4 class="page-table-title">{{ t('dataSync.taskList') }}</h4>
            <div class="operate-buttons">
              <auth-tooltip :is-disabled="canUsePipe" :content="'common.pipeAuth'">
                <el-button type="primary" @click="handleAdd" :disabled="!canUsePipe" id="data-sync-add">{{ t('dataSync.newTask') }}</el-button>
              </auth-tooltip>
              <auth-tooltip :is-disabled="canUsePipe" :content="'common.pipeAuth'">
                <el-dropdown :disabled="!multipleSelection.length || !canUsePipe" @command="(val) => handleCommandDown(val)" class="m-x-16" id="data-sync-batch-dropdown">
                  <el-button type="primary" class="batch-button" :disabled="!multipleSelection.length || !canUsePipe" id="data-sync-batch">
                    {{ t('common.batchOperation') }}
                    <el-icon class="el-icon--right"><i-ep-arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="del" id="data-sync-batch-del">{{ t('common.batchDelete') }}</el-dropdown-item>
                      <el-dropdown-item command="running" id="data-sync-batch-running">{{ t('common.batchRun') }}</el-dropdown-item>
                      <el-dropdown-item command="stopped" id="data-sync-batch-stopped">{{ t('common.batchStop') }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </auth-tooltip>
              <el-tooltip placement="top-start" effect="light" trigger="hover" :content="monitorTip" :disabled="monitorTipDisabled" popper-class="tooltip-box-width">
                <el-button type="primary" @click="handleMonitor" :disabled="!monitorTipDisabled" id="data-sync-add">{{ t('dataSync.monitorDashboard') }}</el-button>
              </el-tooltip>
              <auth-tooltip :is-disabled="canUsePipe" :content="'common.pipeAuth'">
                <el-button link @click="handleSearch" :disabled="!canUsePipe" id="data-sync-refresh" :class="!canUsePipe ? '' : 'svg-button-hover-color'">
                  <i-custom-refresh style="width: 24px; height: 24px" />
                </el-button>
              </auth-tooltip>
            </div>
          </div>
          <auth-container :is-auth="canUsePipe" :content="'common.pipeAuth'" style="height: 100%">
            <div class="page-table-box">
              <el-table
                :data="tableDataPagination"
                v-loading="loading"
                style="width: 100%"
                :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
                :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
                tooltip-effect="light"
                :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
                ref="tableRef"
                @selection-change="handleSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column :label="t('dataSync.taskName')" prop="name" min-width="180" align="center" show-overflow-tooltip />
                <el-table-column :label="t('dataSync.syncData')" prop="measurement" min-width="160" align="center" show-overflow-tooltip />
                <el-table-column :label="t('dataSync.syncRange')" prop="range" min-width="120" align="center" show-overflow-tooltip />
                <el-table-column :label="t('dataSync.address')" prop="targetAddress" min-width="160" align="center" show-overflow-tooltip />
                <el-table-column :label="t('dataSync.status')" prop="state" width="160" align="center" show-overflow-tooltip>
                  <template #default="{ row }">
                    <div class="flex justify-center items-center">
                      <el-icon v-if="row.state === 'stopped'" size="16" class="m-t-4"><i-custom-sync-stopped /></el-icon>
                      <el-icon v-else size="16" class="m-t-4"><i-custom-sync-running /></el-icon>
                      <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('common.errorDetail')" :disabled="!row.exceptionMessage" popper-class="tooltip-box-width">
                        <span :class="[row.exceptionMessage ? 'stop-error-button' : '', 'm-l-4']" @click="handleStatusInfo(row)">{{ row.state }}</span>
                      </el-tooltip>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="t('common.createTime')" prop="creationTime" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column :label="t('common.operation')" width="180" align="center" fixed="right">
                  <template #default="{ row }">
                    <div>
                      <el-button type="primary" link size="small" @click="handleEdit(row)" :id="`data-sync-table-${row.name}-view`">{{ t('common.detail') }}</el-button>
                      <el-button type="primary" link size="small" @click="handleStatus('row', row, row.state === 'running' ? 'stopped' : 'running')" :id="`data-sync-table-${row.name}-state`">
                        {{ row.state === 'running' ? t('dataSync.stop') : t('dataSync.run') }}
                      </el-button>
                      <el-button type="primary" link size="small" @click="handleDel('row', row)" :id="`data-sync-table-${row.name}-del`">{{ t('common.delete') }}</el-button>
                    </div>
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
          </auth-container>
        </div>
      </el-main>

      <modal-sync v-model:visible="editVisible" :edit-type="editType" :edit-data="editData" :edit-time="editTime" @handleSave="handleSearch" />

      <modal-error-message v-model:visible="errorMessageVisible" :content="editErrorMessage" />
    </el-container>
    <monitor-dashboard v-else @handleClose="handleCloseMonitor" />
  </version-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { DataSyncApi } from '@/api';
import { useUserStore, useConnectionStore } from '@/stores';
import { todayNow } from '@/utils/date';
import { iotdbShowAuth } from '@/utils/auth';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalSync from './components/modal-sync.vue';
import ModalErrorMessage from './components/modal-error-message.vue';
import MonitorDashboard from './components/monitor-dashboard.vue';
import type { SynchronListData } from '@/types';

const { t } = useI18n();
const connectionStore = useConnectionStore();
const userStore = useUserStore();
const { canUsePipe, canMaintain, enablePrometheus, configurePrometheus } = storeToRefs(userStore);
const showPrometheus = computed(() => enablePrometheus.value && configurePrometheus.value);
const monitorTip = computed(() => {
  if ((!canUsePipe.value && !canMaintain.value) || !canUsePipe.value) {
    return t('common.pipeAuth');
  }
  if (!canMaintain.value) {
    return t('common.maintainAuth');
  }
  if (!showPrometheus.value) {
    return t('common.noData');
  }
  return '';
});

const monitorTipDisabled = computed(() => {
  if (canUsePipe.value && canMaintain.value && showPrometheus.value) {
    return true;
  }
  return false;
});
const { maxTableHeight } = useTableHeight(300);
const searchFormData = reactive({
  name: '',
});
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const tableData = ref<SynchronListData[]>([]);
const totalCount = ref(0);
const multipleSelection = ref<SynchronListData[]>([]);
const editType = ref('add');
const editVisible = ref(false);
const editData = ref('');
const editTime = ref<number | string>('');
const errorMessageVisible = ref(false);
const editErrorMessage = ref('');
const showMain = ref(true);

const { requestFn: getDataSynchronList, loading } = useRequest(DataSyncApi.getDataSynchronList);
const { requestFn: deleteDataSynchronByNames } = useRequest(DataSyncApi.deleteDataSynchronByNames);
const { requestFn: startTaskByNames } = useRequest(DataSyncApi.startTaskByNames);
const { requestFn: stopTaskByNames } = useRequest(DataSyncApi.stopTaskByNames);

const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, '1.2.1'));

function getListData() {
  getDataSynchronList(searchFormData.name).then((res) => {
    tableData.value = res.data || [];
    totalCount.value = tableData.value.length;
  });
}

// 重置
function handleReset() {
  searchFormData.name = '';
  tableData.value = [];
  totalCount.value = 0;
}

// 查询
function handleSearch() {
  pagination.pageNum = 1;
  getListData();
}

function onChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
}

function onChangePage(page: number) {
  pagination.pageNum = page;
}

function handleSelectionChange(vals: SynchronListData[]) {
  multipleSelection.value = vals;
}

function handleStatusInfo(row: SynchronListData) {
  if (!row.exceptionMessage) return;
  editErrorMessage.value = row.exceptionMessage;
  errorMessageVisible.value = true;
}

function handleAdd() {
  editType.value = 'add';
  editData.value = '';
  editTime.value = todayNow();
  editVisible.value = true;
}

function handleEdit(row: SynchronListData) {
  editType.value = 'view';
  editData.value = row.name;
  editTime.value = todayNow();
  editVisible.value = true;
}

function handleStatus(type: string, data: SynchronListData | null, state: 'running' | 'stopped') {
  let statusData: string[] = [];
  const realStatus = state === 'running' ? 'stopped' : 'running';
  if (type === 'batch') {
    statusData = multipleSelection.value.filter((item) => item.state === realStatus).map((d) => d.name);
  } else if (data?.state === realStatus) {
    statusData = [data.name];
  } else {
    statusData = [];
  }
  if (!statusData.length) {
    ElMessage.warning({ message: state === 'running' ? t('dataSync.runTip') : t('dataSync.stopTip'), grouping: true });
    return;
  }
  if (state === 'running') {
    startTaskByNames(statusData).then(() => {
      ElMessage.success({ message: t('dataSync.runSuccess'), grouping: true });
      handleSearch();
    });
  } else {
    stopTaskByNames(statusData).then(() => {
      ElMessage.success({ message: t('dataSync.stopSuccess'), grouping: true });
      handleSearch();
    });
  }
}

function handleDel(type: string, data: SynchronListData | null) {
  ElMessageBox.confirm(type === 'batch' ? t('dataSync.batchDelete') : t('dataSync.singleDelete'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-data-sync-confirm',
    cancelButtonClass: 'del-data-sync-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    let arr = [];
    if (type === 'batch') {
      arr = multipleSelection.value?.map((i) => i.name);
    } else {
      arr = [data!.name];
    }
    deleteDataSynchronByNames(arr).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      handleSearch();
    });
  });
}

function handleCommandDown(val: 'del' | 'running' | 'stopped') {
  if (val === 'del') {
    handleDel('batch', null);
  } else {
    handleStatus('batch', null, val);
  }
}

function handleMonitor() {
  showMain.value = false;
}

function handleCloseMonitor() {
  showMain.value = true;
  handleReset();
  handleSearch();
}

watch(
  () => canUsePipe.value && showAuthMenu.value,
  (val) => {
    handleReset();
    if (val) {
      handleSearch();
    }
  },
  {
    immediate: true,
  },
);
</script>

<style lang="scss" scoped>
.data-sync-detail-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 12px 8px 8px;
}

.page-table-details {
  padding: 8px 8px 10px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.page-table-title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 12px;

  .page-table-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }
}

.stop-error-button {
  cursor: pointer;
  text-decoration: underline;
}
</style>
