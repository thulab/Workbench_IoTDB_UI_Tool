<template>
  <active-container :is-show="connectionIsActive">
    <el-container class="calculate-detail-wrapper">
      <el-header class="search-form-wrapper p-x-0" style="height: auto">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline @submit.prevent>
          <base-form-item label="" prop="name" style="margin-left: -8px">
            <el-input v-model="searchFormData.name" :placeholder="searchPlaceholder()" style="width: 380px" id="calculate-search-name">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
              <template #prepend>
                <el-select v-model="searchFormData.type" style="width: 88px" placeholder="" id="calculate-search-type">
                  <el-option :label="appType === 1 ? t('calculate.calculateName') : t('calculate.viewName')" value="name" id="calculate-search-type-name" />
                  <el-option :label="t('calculate.resultMeasurement')" value="measurement" id="calculate-search-type-measurement" />
                  <el-option :label="appType === 1 ? t('calculate.calculateDesc') : t('calculate.viewDesc')" value="desc" id="calculate-search-type-desc" />
                </el-select>
              </template>
            </el-input>
          </base-form-item>
        </el-form>
        <div class="search-form-buttons">
          <el-button @click="handleReset" id="calculate-search-reset">{{ t('common.reset') }}</el-button>
          <auth-tooltip :is-disabled="canReadWriteSchema" :content="'common.schemaAuth'">
            <el-button type="primary" :disabled="!canReadWriteSchema" @click="handleSearch" id="calculate-search-search">{{ t('common.query') }}</el-button>
          </auth-tooltip>
        </div>
      </el-header>
      <el-main class="p-0">
        <div class="page-table-details">
          <div class="page-table-title-box">
            <h4 class="page-table-title">{{ appType === 1 ? t('calculate.calculateList') : t('calculate.viewList') }}</h4>
            <div class="operate-buttons">
              <auth-tooltip :is-disabled="canAllWriteSchema" :content="'common.schemaAuthAnother'">
                <el-button type="primary" :disabled="!canAllWriteSchema" @click="handleAdd" id="calculate-add">{{ appType === 1 ? t('calculate.newCalculate') : t('calculate.newView') }}</el-button>
              </auth-tooltip>
              <auth-tooltip :is-disabled="canAllWriteSchema" :content="'common.schemaAuthAnother'">
                <el-button class="m-l-16" :disabled="!canAllWriteSchema" @click="handleImport" id="calculate-import">
                  {{ t('common.import') }}
                </el-button>
              </auth-tooltip>
              <auth-tooltip :is-disabled="canReadWriteSchema" :content="'common.schemaAuth'">
                <el-dropdown class="m-x-16" :disabled="!(totalCount > 0) || !canReadWriteSchema" @command="(val) => handleCommandDown(val)" id="calculate-download-dropdown">
                  <el-button :class="[locale === 'en' ? 'export-button' : 'export-spacing-button']" :disabled="!(totalCount > 0) || !canReadWriteSchema" id="calculate-download">
                    {{ t('common.export') }}
                    <el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question class="export-tip" /></el-tooltip>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="csv" id="calculate-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                      <el-dropdown-item command="xlsx" id="calculate-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </auth-tooltip>
              <auth-tooltip :is-disabled="canWriteSchema" :content="'common.schemaAuthAnother'">
                <el-button :disabled="!multipleSelection.length || !canWriteSchema" type="primary" @click="handleDel('batch', null)" id="calculate-batch-del">{{ t('common.batchDelete') }}</el-button>
              </auth-tooltip>
              <el-tooltip placement="top-start" effect="light" trigger="hover" :content="refreshTip" :disabled="refreshTipDisabled" popper-class="tooltip-box-width">
                <el-button link :disabled="!refreshTipDisabled" :class="!refreshTipDisabled ? '' : 'svg-button-hover-color'" @click="getNewVal" id="calculate-refresh">
                  <i-custom-refresh style="width: 24px; height: 24px" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <auth-container :is-auth="canReadWriteSchema" :content="'common.schemaAuth'" style="height: 100%">
            <div class="page-table-box">
              <el-table
                :data="tableData.list"
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
                <el-table-column :label="appType === 1 ? t('calculate.calculateName') : t('calculate.viewName')" prop="name" width="160" align="center" show-overflow-tooltip />
                <el-table-column :label="appType === 1 ? t('calculate.calculateDesc') : t('calculate.viewDesc')" prop="desc" width="180" align="center" show-overflow-tooltip />
                <el-table-column :label="t('calculate.resultMeasurement')" prop="measurement" width="180" align="center" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span class="measurement-text-button" @click="handleView(row)">{{ row.measurement }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('calculate.expression')" prop="expression" min-width="120" align="center" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="handleExpression(row)">{{ t('common.detail') }}</el-button>
                  </template>
                </el-table-column>
                <el-table-column :label="t('calculate.lastValue')" prop="value" min-width="140" align="center" show-overflow-tooltip />
                <el-table-column :label="t('calculate.lastValueTime')" prop="valueTime" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column :label="t('common.operation')" width="180" align="center" fixed="right">
                  <template #default="{ row }">
                    <div>
                      <el-button type="primary" link size="small" @click="handleQuery(row)" :id="`calculate-table-${row.measurement}-data`">{{ t('calculate.view') }}</el-button>
                      <auth-tooltip :is-disabled="rowCanWriteSchemaByPath(row.measurement)" :content="'common.schemaAuthAnother'">
                        <el-button type="primary" :disabled="!rowCanWriteSchemaByPath(row.measurement)" link size="small" @click="handleEdit(row)" :id="`calculate-table-${row.measurement}-edit`">
                          {{ t('common.edit') }}
                        </el-button>
                      </auth-tooltip>
                      <auth-tooltip :is-disabled="rowCanWriteSchemaByPath(row.measurement)" :content="'common.schemaAuthAnother'">
                        <el-button type="primary" :disabled="!rowCanWriteSchemaByPath(row.measurement)" link size="small" @click="handleDel('row', row)" :id="`calculate-table-${row.measurement}-del`">
                          {{ t('common.delete') }}
                        </el-button>
                      </auth-tooltip>
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

      <modal-calculate v-model:visible="editVisible" :edit-type="editType" :edit-data="editData" @handleSave="handleSearch" />

      <modal-expression v-model:visible="expressionVisible" :content="editExpression" />

      <modal-import v-model:visible="importVisible" @handle-close="handleImportClose" />
    </el-container>
  </active-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { CalculateApi, StorageApi } from '@/api';
import { useUserStore, useConnectionStore } from '@/stores';
import { getPathAuthList, getParentPathAuthList } from '@/utils/auth';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalCalculate from './components/modal-calculate.vue';
import ModalExpression from './components/modal-expression.vue';
import ModalImport from './components/modal-import.vue';

const { t, locale } = useI18n();
const appType = Number(import.meta.env.VITE_APP_TYPE);
const router = useRouter();
const userStore = useUserStore();
const { canWriteSchema, canReadWriteSchema, userAllPrivileges, userAllEntityPrivileges, userAllPathPrivileges } = storeToRefs(userStore);
const connectionStore = useConnectionStore();
const connectionIsActive = computed(() => typeof connectionStore.connectionIsActive === 'boolean');
const { maxTableHeight } = useTableHeight(300);
const searchFormRef = ref<FormInstance>();
const searchFormData = reactive({
  name: '',
  type: 'name',
});
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const multipleSelection = ref<Calculate.CalculateItem[]>([]);
const editType = ref('add');
const editVisible = ref(false);
const editData = ref();
const expressionVisible = ref(false);
const editExpression = ref('');
const importVisible = ref(false);
const canAllWriteSchema = computed(() => userAllPrivileges.value.includes('WRITE_SCHEMA'));
const canAllReadWriteData = computed(() => userAllPrivileges.value.includes('READ_DATA') || userAllPrivileges.value.includes('WRITE_DATA'));

const refreshTip = computed(() => {
  if (!canReadWriteSchema.value) {
    return t('common.schemaAuth');
  }
  if (!canAllReadWriteData.value) {
    return t('common.dataAuth');
  }
  return '';
});

const refreshTipDisabled = computed(() => {
  if (canReadWriteSchema.value && canAllReadWriteData.value) {
    return true;
  }
  return false;
});

function searchPlaceholder() {
  if (searchFormData.type === 'name') {
    return t('calculate.namePlaceholder');
  }
  if (searchFormData.type === 'measurement') {
    return t('measurement.measurementNamePlaceholder');
  }
  return t('calculate.descPlaceholder');
}

function rowCanWriteSchemaByPath(path: string) {
  if (userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  const authList = getPathAuthList(path, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('WRITE_SCHEMA');
  }
  return false;
}

function rowReadWriteDataByParentPath(path: string) {
  if (userAllEntityPrivileges.value.includes('READ_DATA') || userAllEntityPrivileges.value.includes('WRITE_DATA')) return true;
  const authList = getParentPathAuthList(path, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('READ_DATA') || authList.includes('WRITE_DATA');
  }
  return false;
}

const {
  requestFn: getCalculateList,
  data: tableData,
  loading,
} = useRequest(CalculateApi.getCalculateList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});
const { requestFn: getBatchLastValue } = useRequest(StorageApi.getBatchLastValue);
const { requestFn: deleteCalculate } = useRequest(CalculateApi.deleteCalculate);
const { requestFn: exportCalculateData } = useRequest(CalculateApi.exportCalculateData);

function getNewVal() {
  if (tableData.value.list.length) {
    const timeseriesList: string[] = [];
    const viewTypeList: string[] = [];
    tableData.value.list.forEach((item) => {
      timeseriesList.push(item.measurement);
      viewTypeList.push('VIEW');
    });
    const authTimeseries = tableData.value.list.filter((f) => rowReadWriteDataByParentPath(f.measurement)).map((d) => d.measurement);
    getBatchLastValue(timeseriesList, viewTypeList).then((newRes) => {
      if (newRes.data.values.length || newRes.data.timestamps.length) {
        tableData.value.list.forEach((item, index) => {
          item.value = authTimeseries.includes(item.measurement) ? newRes.data.values[index] || '-' : t('common.noAuth');
          item.valueTime = authTimeseries.includes(item.measurement) ? newRes.data.timestamps[index] || '-' : t('common.noAuth');
        });
      }
    });
  }
}

function getListData() {
  getCalculateList({
    ...pagination,
    name: searchFormData.type === 'name' ? searchFormData.name : '',
    measurement: searchFormData.type === 'measurement' ? searchFormData.name : '',
    desc: searchFormData.type === 'desc' ? searchFormData.name : '',
  }).then((res) => {
    totalCount.value = res.data.totalCount;
    getNewVal();
  });
}

// 重置
function handleReset() {
  searchFormData.name = '';
  searchFormData.type = 'name';
  tableData.value.list = [];
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
  getListData();
}

function onChangePage(page: number) {
  pagination.pageNum = page;
  getListData();
}

function handleSelectionChange(vals: Calculate.CalculateItem[]) {
  multipleSelection.value = vals;
}

// 测点管理
function handleView(row: Calculate.CalculateItem) {
  router.push({
    name: 'MeasurementManagement',
    query: {
      databse: row.database,
      measurement: row.measurement,
    },
  });
}

// 数据查询
function handleQuery(row: Calculate.CalculateItem) {
  router.push({
    name: 'DataSearch',
    query: {
      measurement: row.measurement,
    },
  });
}

// 表达式
function handleExpression(row: Calculate.CalculateItem) {
  editExpression.value = row.expression || '';
  expressionVisible.value = true;
}

function handleAdd() {
  editType.value = 'add';
  editData.value = undefined;
  editVisible.value = true;
}

function handleEdit(row: Calculate.CalculateItem) {
  editType.value = 'edit';
  editData.value = { ...row };
  editVisible.value = true;
}

function handleDel(type: string, data: Calculate.CalculateItem | null) {
  ElMessageBox.confirm(
    type === 'batch'
      ? `${appType === 1 ? t('calculate.batchDeleteCalculate') : t('calculate.batchDeleteView')}`
      : `${appType === 1 ? t('calculate.singleDeleteCalculate') : t('calculate.singleDeleteView')}`,
    t('common.notice'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: 'del-calculate-confirm',
      cancelButtonClass: 'del-calculate-cancel',
      type: 'warning',
      icon: ICustomMessageWarning,
    }
  ).then(() => {
    let arr = [];
    if (type === 'batch') {
      arr = multipleSelection.value?.map((i) => i.measurement);
    } else {
      arr = data?.measurement ? [data.measurement] : [];
    }
    deleteCalculate(arr).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      handleSearch();
    });
  });
}

// 导入
function handleImport() {
  importVisible.value = true;
}

// 导入物理量
function handleImportClose(reload: boolean) {
  if (reload) {
    handleSearch();
  }
}

// 下载
function handleCommandDown(val: string) {
  exportCalculateData({
    ...pagination,
    name: searchFormData.type === 'name' ? searchFormData.name : '',
    measurement: searchFormData.type === 'measurement' ? searchFormData.name : '',
    desc: searchFormData.type === 'desc' ? searchFormData.name : '',
  }).then((res) => {
    let url = `/api/file/exportExcelCalculateData?exportId=${res.data}`;
    if (val === 'csv') {
      url = `/api/file/exportCsvCalculateData?exportId=${res.data}`;
    }
    window.open(url);
  });
}

watch(
  () => connectionIsActive.value && canReadWriteSchema.value,
  (val) => {
    handleReset();
    if (val) {
      handleSearch();
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.calculate-detail-wrapper {
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

.measurement-text-button {
  color: #495ad4;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
