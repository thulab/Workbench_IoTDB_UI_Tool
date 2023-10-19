<template>
  <el-container class="data-sync-detail-wrapper">
    <el-header class="p-x-0" style="height: auto;">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" label-position="left" size="default" inline>
          <base-form-item label="任务名称：" prop="name">
            <el-input v-model="searchFormData.name" placeholder="请输入任务名称" id="data-sync-search-name">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
            </el-input>
          </base-form-item>
        </el-form>
        <div class="search-form-buttons">
          <el-button @click="handleReset" id="data-sync-search-reset">重置</el-button>
          <el-button type="primary" @click="handleSearch" id="data-sync-search-search">查询</el-button>
        </div>
      </div>
    </el-header>
    <el-main class="p-0">
      <div class="page-table-details">
        <div class="page-table-title-box">
          <h4 class="page-table-title">任务列表</h4>
          <div class="operate-buttons">
            <el-button type="primary" @click="handleAdd" id="data-sync-add">新建任务</el-button>
            <el-dropdown :disabled="!multipleSelection.length" @command="val => handleCommandDown(val)" class="m-x-16">
              <el-button type="primary" class="export-btn" :disabled="!multipleSelection.length" id="data-sync-batch">
                批量操作<el-icon class="el-icon--right"><i-ep-arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="del">批量删除</el-dropdown-item>
                  <el-dropdown-item command="run">批量启动</el-dropdown-item>
                  <el-dropdown-item command="stop">批量静止</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link @click="handleSearch" id="data-sync-refresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
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
            :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
            ref="tableRef"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="任务名称" prop="name" min-width="120" align="center" show-overflow-tooltip />
            <el-table-column label="同步数据" prop="desc" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column label="同步范围" prop="desc" min-width="120" align="center" show-overflow-tooltip />
            <el-table-column label="目标地址" prop="desc" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column label="任务状态" prop="measurement" width="160" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tooltip
                  placement="top-start"
                  effect="light"
                  trigger="hover"
                  content="错误详情"
                  :disabled="false"
                  popper-class="tooltip-box-width"
                >
                  <span class="stop-error-button" @click="handleStatusInfo(row)">{{ row.measurement }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" prop="valueTime" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <div>
                  <el-button type="primary" link size="small" @click="handleEdit(row)" :id="`data-sync-table-${row.measurement}-data`">详情</el-button>
                  <el-button type="primary" link size="small" @click="handleStatus('row', row, row.status)" :id="`data-sync-table-${row.measurement}-edit`">启动</el-button>
                  <el-button type="primary" link size="small" @click="handleDel('row', row)" :id="`data-sync-table-${row.measurement}-del`">删除</el-button>
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
      </div>
    </el-main>

    <modal-sync
      v-model:visible="editVisible"
      :edit-type="editType"
      :edit-data="editData"
      @handleSave="handleSearch"
    />
  </el-container>
</template>

<script setup lang="ts">
import { CalculateApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ICustomMessageError from '~icons/custom/error.svg';
import ModalSync from './components/modal-sync.vue';

const { maxTableHeight } = useTableHeight(300);
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

const { requestFn: getCalculateList, data: tableData, loading } = useRequest(CalculateApi.getCalculateList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});
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
  });
}

// 重置
function handleReset() {
  searchFormData.name = '';
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

function handleSelectionChange(vals: Calculate.CalculateItem[]) {
  multipleSelection.value = vals;
}

function handleStatusInfo(row: Calculate.CalculateItem) {
  ElMessageBox.confirm(row.desc, '报错详情', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageError,
  });
}

function handleAdd() {
  editType.value = 'add';
  editData.value = undefined;
  editVisible.value = true;
}

function handleEdit(row: Calculate.CalculateItem) {
  editType.value = 'view';
  editData.value = { ...row };
  editVisible.value = true;
}

function handleStatus(type: string, data: Calculate.CalculateItem | null, status: string) {
  console.log(type, data, status);
}

function handleDel(type: string, data: Calculate.CalculateItem | null) {
  ElMessageBox.confirm(type === 'batch' ? '确认删除这些任务吗？' : '是否删除该任务？', '注意', {
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

function handleCommandDown(val: 'del' | 'run' | 'stop') {
  if (val === 'del') {
    handleDel('batch', null);
  } else {
    handleStatus('batch', null, val);
  }
}

onMounted(() => {
  handleReset();
  handleSearch();
});
</script>

<style lang="scss" scoped>
.data-sync-detail-wrapper{
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

.stop-error-button{
  // color: #495AD4;
  // cursor: pointer;

  // &:hover{
  //   text-decoration: underline;
  // }
}
</style>
