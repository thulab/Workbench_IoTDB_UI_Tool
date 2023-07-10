<template>
  <el-container class="audit-detail-wrapper">
    <el-header class="p-x-0" style="height: auto;">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
          <base-form-item label="操作用户：" prop="username">
            <el-input v-model="searchFormData.username" placeholder="请输入用户名称" style="width: 172px;">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
            </el-input>
          </base-form-item>
          <base-form-item label="IP来源：" prop="address">
            <el-input v-model="searchFormData.address" placeholder="请输入 IP 来源" style="width: 172px;">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
            </el-input>
          </base-form-item>
          <base-form-item label="操作详情：" prop="log">
            <el-input v-model="searchFormData.log" placeholder="请输入操作详情" style="width: 172px;">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
            </el-input>
          </base-form-item>
          <el-row>
            <base-form-item label="时间范围：" prop="time">
              <el-date-picker
                v-model="searchFormData.time"
                type="datetimerange"
                range-separator="～"
                unlink-panels
                :disabled-date="disabledDate"
                :prefix-icon="ICustomCalender"
              />
            </base-form-item>
            <div class="search-form-buttons">
              <el-button @click="handleReset">重置</el-button>
              <el-button type="primary" @click="handleSearch">查询</el-button>
            </div>
          </el-row>
        </el-form>
      </div>
    </el-header>
    <el-main class="p-0">
      <div class="page-table-details">
        <h4 class="page-table-title">日志列表</h4>
        <div class="page-table-box">
          <el-table
            :data="tableData.list"
            v-loading="loading"
            style="width: 100%;"
            :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            tooltip-effect="light"
            ref="tableRef"
          >
            <el-table-column label="操作时间" prop="time" width="160" align="center" show-overflow-tooltip />
            <el-table-column label="IP来源" prop="address" width="160" align="center" show-overflow-tooltip />
            <el-table-column label="操作用户" prop="username" width="140" align="center" show-overflow-tooltip />
            <el-table-column label="操作详情" prop="log" min-width="280" align="left">
              <template #default="{ row }">
                <span class="detail-text-button" @click="handleView(row)">{{ row.log }}</span>
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

    <el-dialog title="操作详情" v-model="dialogVisible" width="480px" :close-on-click-modal="false">
      <el-scrollbar :max-height="300">
        <pre class="detail-text">{{ editDetail }}</pre>
      </el-scrollbar>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import { LogApi } from '@/api';
import {
  getStartAndEnd, today, formatDate,
} from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';

const { maxTableHeight } = useTableHeight(330);
const searchFormRef = ref<FormInstance>();
const searchFormData = reactive({
  username: '',
  address: '',
  log: '',
  time: getStartAndEnd(0),
});
let copySearchFormData = cloneDeep(searchFormData);
const timestamp = ref(0);
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const dialogVisible = ref(false);
const editDetail = ref('');

const { requestFn: getAuditLogList, data: tableData, loading } = useRequest(LogApi.getAuditLogList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});

function getListData() {
  getAuditLogList({
    ...pagination,
    ...copySearchFormData,
    startTime: formatDate(copySearchFormData.time[0], 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    endTime: formatDate(copySearchFormData.time[1], 'YYYY-MM-DD HH:mm:ss.SSSZ'),
    timestamp: timestamp.value,
  }).then((res) => {
    totalCount.value = res.data.totalCount;
  });
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.time = getStartAndEnd(0);
}

// 查询
function handleSearch() {
  pagination.pageNum = 1;
  copySearchFormData = cloneDeep(searchFormData);
  timestamp.value = Number(new Date());
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

function handleView(row: Log.AuditData) {
  editDetail.value = row.log;
  dialogVisible.value = true;
}

onMounted(() => {
  handleReset();
  handleSearch();
});
</script>

<style lang="scss" scoped>
.audit-detail-wrapper{
  border-radius: 6px;
  background: #FFF;
  box-sizing: border-box;
  padding: 26px 16px 16px 14px;
}

.search-form-buttons{
  display: inline-flex;
  flex-wrap: nowrap;
  flex: 1;
  justify-content: end;
}

.page-table-details{
  padding: 20px 16px 10px;

  .page-table-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
    margin-bottom: 15px;
  }
}

.detail-text{
  font-size: 14px;
  line-height: 21px;
  font-weight: 300;
  color: #131926;
  padding: 12px 0;
}
</style>
