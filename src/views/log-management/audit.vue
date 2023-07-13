<template>
  <el-container class="audit-detail-wrapper">
    <el-header class="p-x-0" style="height: auto;">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
          <base-form-item label="操作用户：" prop="username">
            <el-select v-model="searchFormData.username">
              <el-option v-for="item in userList" :key="item.name" :label="item.name" :value="item.name" />
            </el-select>
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
                :clearable="false"
                :shortcuts="shortcutsDaterange"
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
            <el-table-column label="操作时间" prop="time" width="180" align="center" show-overflow-tooltip />
            <el-table-column label="IP来源" prop="address" width="160" align="center" show-overflow-tooltip />
            <el-table-column label="操作用户" prop="username" width="140" align="center" show-overflow-tooltip />
            <el-table-column label="操作详情" prop="log" min-width="280" align="left">
              <template #default="{ row, $index }">
                <overflow-click
                  class="detail-text-button"
                  :content="row.log"
                  :key="row.time + $index + '_' + row.log"
                  :offset="24"
                  @handleClick="() => handleView(row)"
                />
              </template>
            </el-table-column>
            <template #empty>
              <div class="table-empty-wrapper">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">暂无内容</span>
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
      <div class="detail-text">{{ editDetail }}</div>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import { useUserStore } from '@/stores';
import { LogApi, AuthApi } from '@/api';
import {
  getStartAndEnd, today, formatDate, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';
import OverflowClick from './components/overflow-click.vue';

const userStore = useUserStore();
const userName = computed(() => userStore.userInfo.name || 'root');
const { maxTableHeight } = useTableHeight(340);
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
const shortcutsDaterange = [
  {
    text: '今天',
    value: () => getStartAndEnd(0),
  },
  {
    text: '昨天',
    value: () => getOneInterval(1),
  },
  {
    text: '最近7天',
    value: () => getOneIntervalNow(7),
  },
];
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const dialogVisible = ref(false);
const editDetail = ref('');

const { requestFn: getUserList, data: userList } = useRequest(AuthApi.getUserList);
const { requestFn: getAuditLogList, data: tableData, loading } = useRequest(LogApi.getAuditLogList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});

function getUsers() {
  getUserList();
}

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
  searchFormData.username = userName.value;
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
  getUsers();
  handleReset();
  searchFormData.username = userName.value;
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

.detail-text-button{
  // overflow: hidden;
  // text-overflow: ellipsis;
  // white-space: nowrap;
  width: 100%;
}

.detail-text{
  font-size: 14px;
  line-height: 21px;
  font-weight: 300;
  color: #131926;
  padding: 12px 0;
  max-height: 300px;
  overflow-y: auto;
}
</style>
