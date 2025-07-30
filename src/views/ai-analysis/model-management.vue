<template>
  <coming-soon-container :is-show="locale !== 'en'">
    <version-container :is-show="showAuthMenu" :versiton-tip="'2.0.5'">
      <active-container :is-show="connectionIsActive">
        <el-container class="model-management-wrapper">
          <el-header class="search-form-wrapper p-x-0" style="height: auto">
            <el-form :model="searchFormData" label-position="left" size="default" inline @submit.prevent>
              <base-form-item :label="`${t('aiAnalysis.modelName')}：`" prop="name">
                <el-input v-model="searchFormData.name" :placeholder="t('aiAnalysis.modelNamePlaceholder')" @keyup.enter="handleSearch" id="model-management-search-name" style="width: 200px">
                  <template #prefix>
                    <i-custom-search-icon class="remote-select-search-icon" />
                  </template>
                </el-input>
              </base-form-item>
            </el-form>
            <div class="search-form-buttons">
              <el-button @click="handleReset" :disabled="!canUseModel || !enableAINode" id="model-management-search-reset">{{ t('common.reset') }}</el-button>
              <auth-tooltip :is-disabled="canUseModel" :content="'common.modelAuth'">
                <el-button type="primary" @click="handleSearch" :disabled="!canUseModel || !enableAINode" id="model-management-search-search">{{ t('common.query') }}</el-button>
              </auth-tooltip>
            </div>
          </el-header>
          <el-main class="p-0">
            <div class="page-table-details">
              <div class="page-table-title-box">
                <h4 class="page-table-title">{{ t('aiAnalysis.modelList') }}</h4>
                <div class="operate-buttons">
                  <auth-tooltip :is-disabled="canUseModel" :content="'common.modelAuth'">
                    <el-button type="primary" @click="handleFineTuning" :disabled="!canUseModel || !enableAINode || !connectionIsActive" id="model-management-fineTuning">
                      {{ t('aiAnalysis.fineTuning') }}
                    </el-button>
                  </auth-tooltip>
                  <auth-tooltip :is-disabled="canUseModel" :content="'common.modelAuth'">
                    <el-button type="primary" @click="handleImport" :disabled="!canUseModel || !enableAINode" id="model-management-add">{{ t('aiAnalysis.importModel') }}</el-button>
                  </auth-tooltip>
                  <auth-tooltip :is-disabled="canUseModel" :content="'common.modelAuth'">
                    <el-button type="primary" @click="handleBatchDel" :disabled="!canUseModel || multipleSelection.length === 0 || !enableAINode" id="model-management-batch-del">
                      {{ t('common.batchDelete') }}
                    </el-button>
                  </auth-tooltip>
                </div>
              </div>

              <auth-container :is-auth="canUseModel && enableAINode" :content="enableAINode ? 'common.modelAuth' : 'aiAnalysis.enableTip'" style="height: 100%; width: 100%">
                <div class="page-table-box">
                  <el-table
                    :data="tableDataPagination"
                    v-loading="loading"
                    style="width: 100%"
                    :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
                    :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
                    tooltip-effect="light"
                    :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
                    :row-key="(row) => row.modelId"
                    ref="tableRef"
                    @selection-change="handleSelectionChange"
                  >
                    <el-table-column type="selection" :reserve-selection="true" :selectable="(row) => !row.modelType.startsWith('内置模型')" width="55" />
                    <el-table-column :label="t('aiAnalysis.modelName')" prop="modelId" min-width="180" align="center" show-overflow-tooltip />
                    <el-table-column :label="t('aiAnalysis.category')" prop="categoryString" min-width="160" align="center" show-overflow-tooltip />
                    <el-table-column :label="t('aiAnalysis.modelType')" prop="modelType" min-width="160" align="center" show-overflow-tooltip />
                    <el-table-column :label="t('aiAnalysis.state')" prop="stateString" min-width="120" align="center" show-overflow-tooltip>
                      <template #default="{ row }">
                        <el-tag :type="formatState(row.state)" class="model-state-tag" :id="`model-management-table-${row.name}-state`">
                          {{ row.stateString }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <!-- <el-table-column :label="t('aiAnalysis.modelConfig')" v-if="false" prop="configs" width="160" align="center" show-overflow-tooltip>
                      <template #default="{ row }">
                        <div class="flex justify-center items-center">
                          <div v-if="row.configs === ''">{{ t('aiAnalysis.noConfigs') }}</div>
                          <div v-else>
                            <el-button v-if="row.state === 'ACTIVE'" type="primary" link size="small" @click="handleViewConfig(row)" :id="`model-management-table-${row.name}-del`">
                              {{ t('aiAnalysis.viewConfig') }}
                            </el-button>
                            <div v-else>{{ t('aiAnalysis.viewConfig') }}</div>
                          </div>
                        </div>
                      </template>
                    </el-table-column> -->
                    <el-table-column :label="t('common.operation')" width="180" align="center" fixed="right">
                      <template #default="{ row }">
                        <div>
                          <el-button v-if="!(row.category === 'BUILT-IN')" type="primary" link size="small" @click="handleDel('row', row)" :id="`model-management-table-${row.name}-del`">
                            {{ t('common.delete') }}
                          </el-button>
                          <el-tooltip effect="light" :content="t('aiAnalysis.cannotDel')" v-else>{{ t('common.delete') }}</el-tooltip>
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

          <model-import v-model:visible="importVisible" @handle-close="handleImportClose" />

          <model-config v-model:visible="configVisible" ref="modelConfig" />

          <modal-fine-tuning v-model:visible="fineTuningVisible" v-if="fineTuningVisible" @handle-save="handleFineTuningSuccess" />
        </el-container>
      </active-container>
    </version-container>
  </coming-soon-container>
</template>

<script lang="ts" setup>
import type { ElTable } from 'element-plus';
import { reactive, ref, computed } from 'vue';
import { useUserStore, useConnectionStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { AIAnalysisApi } from '@/api';
import { iotdbShowAuth } from '@/utils/auth';

import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModelImport from './components/model-import.vue';
import ModelConfig from './components/model-config.vue';
import ModalFineTuning from './components/modal-fine-tuning.vue';

const { t, locale } = useI18n();
const userStore = useUserStore();
const { canUseModel } = storeToRefs(userStore);
const connectionStore = useConnectionStore();
const connectionIsActive = computed(() => typeof connectionStore.connectionIsActive === 'boolean');

const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, '2.0.5'));
const { enableAINode } = storeToRefs(connectionStore);
const importVisible = ref(false);
const configVisible = ref(false);
const fineTuningVisible = ref(false);
const searchFormData = reactive({
  name: '',
});
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const { maxTableHeight } = useTableHeight(300);
const tableData = ref<AIAnalysis.Model[]>([]);
const totalCount = ref(0);
const multipleSelection = ref<AIAnalysis.Model[]>([]);
const modelConfig = ref<InstanceType<typeof ModelConfig>>();
const tableRef = ref<InstanceType<typeof ElTable>>();

const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

const { requestFn: getModels, loading } = useRequest(AIAnalysisApi.getModels);
const { requestFn: batchDeleteModel } = useRequest(AIAnalysisApi.batchDeleteModel);

function formatState(state: string) {
  switch (state) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
    case 'FAILED':
      return 'danger';
    default:
      return 'warning';
  }
}

function getListData() {
  getModels(searchFormData.name).then((res) => {
    if (res.data) {
      tableData.value = res.data
        .filter((item) => searchFormData.name === '' || item.modelId.toLowerCase().includes(searchFormData.name.toLowerCase()))
        .map((item) => {
          item.configs = item.configs || '';
          return item;
        });
    }
    totalCount.value = tableData.value.length;
  });
}

function handleSearch() {
  pagination.pageNum = 1;
  tableRef.value?.clearSelection();
  getListData();
}

function handleReset() {
  searchFormData.name = '';
  tableData.value = [];
  totalCount.value = 0;
  handleSearch();
}

function handleSelectionChange(vals: AIAnalysis.Model[]) {
  multipleSelection.value = vals;
}

function onChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
}

function onChangePage(page: number) {
  pagination.pageNum = page;
}

function handleImport() {
  importVisible.value = true;
}

function handleFineTuning() {
  fineTuningVisible.value = true;
}

function handleImportClose(reload: boolean) {
  if (reload) {
    handleSearch();
  }
}

function handleFineTuningSuccess(reload: boolean) {
  fineTuningVisible.value = false;
  if (reload) {
    handleSearch();
  }
}

function handleDel(type: string, data: AIAnalysis.Model | null) {
  ElMessageBox.confirm(type === 'batch' ? t('aiAnalysis.batchDelete') : t('aiAnalysis.singleDelete'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-model-management-confirm',
    cancelButtonClass: 'del-model-management-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    let arr = [];
    if (type === 'batch') {
      arr = multipleSelection.value?.map((i) => i.modelId);
    } else {
      arr = [data!.modelId];
    }
    batchDeleteModel(arr).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      handleSearch();
    });
  });
}

// function handleViewConfig(data: AIAnalysis.Model | null) {
//   configVisible.value = true;
//   modelConfig.value?.configContent(data!.configs);
// }

function handleBatchDel() {
  handleDel('batch', null);
}

watch(
  () => connectionIsActive.value && canUseModel.value && enableAINode.value,
  (val) => {
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
.model-management-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 16px 16px 14px;
}

.page-table-details {
  padding: 16px 16px 10px;
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
