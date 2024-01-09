<template>
  <active-container :is-show="connectionIsActive">
    <el-container class="calculate-detail-wrapper">
      <el-header class="p-x-0" style="height: auto;">
        <div class="search-form-wrapper">
          <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline @submit.prevent>
            <base-form-item label="" prop="name" style="margin-left: -8px;">
              <el-input v-model="searchFormData.name" placeholder="请输入名称" style="width: 346px;" id="calculate-search-name">
                <template #prefix>
                  <i-custom-search-icon class="remote-select-search-icon" />
                </template>
                <template #prepend>
                  <el-select v-model="searchFormData.type" style="width: 88px;" placeholder="" id="calculate-search-type">
                    <el-option :label="`${pageText}名称`" value="name" id="calculate-search-type-name" />
                    <el-option label="结果测点" value="measurement" id="calculate-search-type-measurement" />
                    <el-option :label="`${pageText}描述`" value="desc" id="calculate-search-type-desc" />
                  </el-select>
                </template>
              </el-input>
            </base-form-item>
          </el-form>
          <div class="search-form-buttons">
            <auth-tooltip :is-disabled="canReadWriteSchema">
              <el-button :disabled="!canReadWriteSchema" @click="handleReset" id="calculate-search-reset">重置</el-button>
            </auth-tooltip>
            <auth-tooltip :is-disabled="canReadWriteSchema">
              <el-button type="primary" :disabled="!canReadWriteSchema" @click="handleSearch" id="calculate-search-search">查询</el-button>
            </auth-tooltip>
          </div>
        </div>
      </el-header>
      <el-main class="p-0">
        <div class="page-table-details">
          <div class="page-table-title-box">
            <h4 class="page-table-title">{{pageText}}列表</h4>
            <div class="operate-buttons">
              <auth-tooltip :is-disabled="canAllWriteSchema">
                <el-button type="primary" :disabled="!canAllWriteSchema" @click="handleAdd" id="calculate-add">新建{{pageText}}</el-button>
              </auth-tooltip>
              <auth-tooltip :is-disabled="canWriteSchema">
                <el-button :disabled="!multipleSelection.length || !canWriteSchema" type="primary" @click="handleDel('batch', null)" id="calculate-batch-del">批量删除</el-button>
              </auth-tooltip>
              <auth-tooltip :is-disabled="canReadWriteSchema">
                <el-button link :disabled="!canReadWriteSchema" @click="getNewVal" id="calculate-refresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
              </auth-tooltip>
            </div>
          </div>
          <auth-container :is-auth="canReadWriteSchema" style="height: 100%;">
            <div class="page-table-box">
              <el-table
                :data="tableDataPagination"
                v-loading="loading"
                style="width: 100%;"
                :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
                :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
                tooltip-effect="light"
                :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
                ref="tableRef"
                @selection-change="handleSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column :label="`${pageText}名称`" prop="name" min-width="120" align="center" show-overflow-tooltip />
                <el-table-column :label="`${pageText}描述`" prop="desc" min-width="160" align="center" show-overflow-tooltip />
                <el-table-column label="结果测点" prop="measurement" width="160" align="center" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span class="measurement-text-button" @click="handleView(row)">{{ row.measurement }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="表达式" prop="expression" min-width="80" align="center" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="handleExpression(row)">详情</el-button>
                  </template>
                </el-table-column>
                <el-table-column label="最新结果" prop="value" min-width="140" align="center" show-overflow-tooltip />
                <el-table-column label="最新结果时间" prop="valueTime" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column label="操作" width="180" align="center" fixed="right">
                  <template #default="{ row }">
                    <div>
                      <el-button type="primary" link size="small" @click="handleQuery(row)" :id="`calculate-table-${row.measurement}-data`">查看数据</el-button>
                      <el-button type="primary" link size="small" @click="handleEdit(row)" :id="`calculate-table-${row.measurement}-edit`">编辑</el-button>
                      <auth-tooltip :is-disabled="rowCanWriteSchemaByPath(row.measurement)">
                        <el-button type="primary" :disabled="!rowCanWriteSchemaByPath(row.measurement)" link size="small" @click="handleDel('row', row)" :id="`calculate-table-${row.measurement}-del`">删除</el-button>
                      </auth-tooltip>
                    </div>
                  </template>
                </el-table-column>
                <template #empty>
                  <div class="table-empty-wrapper">
                    <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                    <span class="data-empty-text">暂无数据</span>
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

      <modal-calculate
        v-model:visible="editVisible"
        :edit-type="editType"
        :edit-data="editData"
        @handleSave="handleSearch"
      />

      <modal-expression
        v-model:visible="expressionVisible"
        :content="editExpression"
      />
    </el-container>
  </active-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { CalculateApi, StorageApi } from '@/api';
import { useUserStore, useConnectionStore } from '@/stores';
import { getPathAuthList } from '@/utils/auth';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalCalculate from './components/modal-calculate.vue';
import ModalExpression from './components/modal-expression.vue';

const appType = Number(import.meta.env.VITE_APP_TYPE);
const pageText = appType === 1 ? '计算' : '视图';
const router = useRouter();
const userStore = useUserStore();
const {
  canWriteSchema,
  canReadWriteSchema,
  userAllPrivileges,
  userAllEntityPrivileges,
  userAllPathPrivileges,
} = storeToRefs(userStore);
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

const canAllWriteSchema = computed(() => userAllPrivileges.value.includes('WRITE_SCHEMA'));

function rowCanWriteSchemaByPath(path: string) {
  if (userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  const authList = getPathAuthList(path, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('WRITE_SCHEMA');
  }
  return false;
}

const { requestFn: getCalculateList, data: tableData, loading } = useRequest(CalculateApi.getCalculateList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});
const { requestFn: getBatchLastValue } = useRequest(StorageApi.getBatchLastValue);
const { requestFn: deleteCalculate } = useRequest(CalculateApi.deleteCalculate);

const tableDataPagination = computed(() => tableData.value.list.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

function getNewVal() {
  if (tableDataPagination.value.length) {
    const timeseriesList: string[] = [];
    const viewTypeList: string[] = [];
    tableDataPagination.value.forEach((item) => {
      timeseriesList.push(item.measurement);
      viewTypeList.push('VIEW');
    });
    getBatchLastValue(timeseriesList, viewTypeList).then((newRes) => {
      if (newRes.data.values.length || newRes.data.timestamps.length) {
        tableDataPagination.value.forEach((item, index) => {
          item.value = newRes.data.values[index] || '-';
          item.valueTime = newRes.data.timestamps[index] || '-';
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
    // if (tableData.value.list?.length) {
    //   tableData.value.list.forEach((item) => {
    //     if (item && item.measurement) {
    //       getLastValue(item.measurement).then((newRes) => {
    //         if (newRes.code === 0) {
    //           item.value = newRes.data.value || '-';
    //           item.valueTime = newRes.data.time || '-';
    //         }
    //       });
    //     }
    //   });
    // }
    getNewVal();
  });
}

// 重置
function handleReset() {
  searchFormData.name = '';
  searchFormData.type = 'name';
}

// 查询
function handleSearch() {
  pagination.pageNum = 1;
  getListData();
}

function onChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
  // getListData();
  getNewVal();
}

function onChangePage(page: number) {
  pagination.pageNum = page;
  // getListData();
  getNewVal();
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
  ElMessageBox.confirm(type === 'batch' ? `是否确认删除这些${pageText}？` : `是否删除该${pageText}？`, '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      let arr = [];
      if (type === 'batch') {
        arr = multipleSelection.value?.map((i) => i.measurement);
      } else {
        arr = data?.measurement ? [data.measurement] : [];
      }
      deleteCalculate(arr).then(() => {
        ElMessage.success('删除成功');
        handleSearch();
      });
    });
}

onMounted(() => {
  handleReset();
  if (!connectionIsActive.value) return;
  if (!canReadWriteSchema.value) return;
  handleSearch();
});

watch(
  () => connectionIsActive.value,
  (val) => {
    if (val) {
      if (!canReadWriteSchema.value) return;
      handleSearch();
    }
  },
  {
    immediate: true,
  },
);

watch(
  () => canReadWriteSchema.value,
  (val) => {
    if (val) {
      if (!connectionIsActive.value) return;
      handleSearch();
    }
  },
  {
    immediate: true,
  },
);
</script>

<style lang="scss" scoped>
.calculate-detail-wrapper{
  border-radius: 6px;
  background: #FFF;
  box-sizing: border-box;
  padding: 26px 16px 16px 14px;
}

.search-form-wrapper{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.page-table-details{
  padding: 16px 16px 10px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.page-table-title-box{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 12px;

  .page-table-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}

.measurement-text-button{
  color: #495AD4;
  cursor: pointer;

  &:hover{
    text-decoration: underline;
  }
}
</style>
