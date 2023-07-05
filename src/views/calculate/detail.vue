<template>
  <el-container class="calculate-detail-wrapper">
    <el-header class="p-x-0" style="height: auto;">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
          <base-form-item label="" prop="name" style="margin-left: -8px;">
            <el-input v-model="searchFormData.name" placeholder="请输入名称" style="width: 346px;">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
              <template #prepend>
                <el-select v-model="searchFormData.type" style="width: 88px;" placeholder="">
                  <el-option label="计算名称" value="name" />
                  <el-option label="结果测点" value="measurement" />
                  <el-option label="计算描述" value="desc" />
                </el-select>
              </template>
            </el-input>
          </base-form-item>
        </el-form>
        <div class="search-form-buttons">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
    </el-header>
    <el-main class="p-0">
      <div class="page-table-details">
        <div class="page-table-title-box">
          <h4 class="page-table-title">计算列表</h4>
          <div class="operate-buttons">
            <el-button type="primary" @click="handleAdd">创建计算</el-button>
            <el-button :disabled="!multipleSelection.length" type="primary" @click="handleDel('batch', null)">批量删除</el-button>
            <el-button link @click="getListData"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
          </div>
        </div>
        <div class="page-table-box">
          <el-table
            :data="tableDataPagination"
            v-loading="loading"
            style="width: 100%;"
            :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            tooltip-effect="light"
            ref="tableRef"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="计算名称" prop="name" min-width="120" align="center" show-overflow-tooltip>
              <template #default="{ row }">{{ row.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="计算描述" prop="desc" min-width="160" align="center" show-overflow-tooltip>
              <template #default="{ row }">{{ row.desc || '-' }}</template>
            </el-table-column>
            <el-table-column label="结果测点" prop="measurement" width="150" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                <el-button type="primary" class="measurement-text-button" link size="small" @click="handleView(row)">{{ row.measurement }}</el-button>
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
                  <el-button type="primary" link size="small" @click="handleQuery(row)">查看数据</el-button>
                  <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
                  <el-button type="primary" link size="small" @click="handleDel('row', row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
            <template #empty>
              <div class="table-empty-wrapper">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">无数据</span>
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
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { useRouter } from 'vue-router';
import { CalculateApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalCalculate from './components/modal-calculate.vue';
import ModalExpression from './components/modal-expression.vue';

const router = useRouter();
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

const { requestFn: getCalculateList, data: tableData, loading } = useRequest(CalculateApi.getCalculateList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});
const { requestFn: getLastValue } = useRequest(CalculateApi.getLastValue);
const { requestFn: deleteCalculate } = useRequest(CalculateApi.deleteCalculate);

const tableDataPagination = computed(() => tableData.value.list.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

function getListData() {
  getCalculateList({
    ...pagination,
    name: searchFormData.type === 'name' ? searchFormData.name : '',
    measurement: searchFormData.type === 'measurement' ? searchFormData.name : '',
    desc: searchFormData.type === 'desc' ? searchFormData.name : '',
  }).then((res) => {
    totalCount.value = res.data.totalCount;
    if (tableData.value.list?.length) {
      tableData.value.list.forEach((item) => {
        if (item && item.measurement) {
          getLastValue(item.measurement).then((newRes) => {
            if (newRes.code === 0) {
              item.value = newRes.data.value || '-';
              item.valueTime = newRes.data.time || '-';
            }
          });
        }
      });
    }
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
  editExpression.value = row.display || '';
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
  ElMessageBox.confirm(type === 'batch' ? '是否确认删除这些计算？' : '是否删除该计算？', '注意', {
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
  handleSearch();
});
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
  width: 100%;

  span{
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
