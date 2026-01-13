<template>
  <active-container :is-show="connectionIsActive">
    <el-container class="audit-detail-wrapper">
      <el-header class="search-form-wrapper p-x-0" style="height: auto">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
          <base-form-item :label="`${t('log.operateUser')}：`" prop="username">
            <el-input v-model="searchFormData.username" :placeholder="t('auth.userPlaceholder')" style="width: 172px" id="audit-search-name">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
            </el-input>
          </base-form-item>
          <base-form-item :label="`${t('log.ip')}：`" prop="address">
            <el-input v-model="searchFormData.address" :placeholder="t('log.ipPlaceholder')" style="width: 172px" id="audit-search-ip">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
            </el-input>
          </base-form-item>
          <base-form-item :label="`${t('common.operationDetail')}：`" prop="log">
            <el-input v-model="searchFormData.log" :placeholder="t('log.operationDetailPlaceholder')" style="width: 172px" id="audit-search-log">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
            </el-input>
          </base-form-item>
          <base-form-item :label="`${t('log.timeRange')}：`" prop="time">
            <el-date-picker
              v-model="searchFormData.time"
              type="datetimerange"
              range-separator="-"
              unlink-panels
              :clearable="false"
              :shortcuts="shortcutsDaterange"
              :disabled-date="disabledDate"
              :prefix-icon="ICustomCalender"
              :default-time="[new Date(2024, 3, 28, 0, 0, 0), new Date(2024, 3, 28, 23, 59, 59)]"
              id="audit-search-time"
            />
          </base-form-item>
        </el-form>
        <div class="search-form-buttons">
          <el-button @click="handleReset" id="audit-search-reset">{{ t('common.reset') }}</el-button>
          <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
            <el-button type="primary" :disabled="!canReadWriteData" @click="handleSearch" id="audit-search-search">{{ t('common.query') }}</el-button>
          </auth-tooltip>
        </div>
      </el-header>
      <el-main class="p-0">
        <div class="page-table-details">
          <h4 class="page-table-title">{{ t('log.auditList') }}</h4>
          <auth-container :is-auth="canReadWriteData" style="height: calc(100% - 36px)" :content="'common.dataAuth'">
            <div class="page-table-box">
              <el-table
                border
                :data="tableData.list"
                v-loading="loading"
                style="width: 100%"
                :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
                :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
                tooltip-effect="light"
                :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
                :default-sort="defaultSort"
                @sort-change="handleSortChange"
                ref="tableRef"
              >
                <el-table-column :label="t('log.operateTime')" prop="time" width="180" align="center" sortable :sort-orders="['ascending', 'descending']" show-overflow-tooltip />
                <el-table-column :label="t('log.ip')" prop="address" width="160" align="center" show-overflow-tooltip />
                <el-table-column :label="t('log.operateUser')" prop="username" width="140" align="center" show-overflow-tooltip />
                <el-table-column :label="t('common.operationDetail')" prop="log" min-width="280" align="left">
                  <template #default="{ row, $index }">
                    <overflow-click
                      class="detail-text-button"
                      :content="row.log"
                      :key="`${row.time + $index}_${row.log}`"
                      :id="`${row.time + $index}_${row.log}`"
                      :offset="24"
                      @handleClick="() => handleView(row)"
                    />
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

      <el-dialog :title="t('common.operationDetail')" v-model="dialogVisible" width="480px" :close-on-click-modal="false" align-center id="audit-modal-detail">
        <div class="detail-text">{{ editDetail }}</div>
      </el-dialog>
    </el-container>
  </active-container>
</template>

<script setup lang="ts">
import type { FormInstance, Sort } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { LogApi } from '@/api';
import { useConnectionStore, useUserStore } from '@/stores';
import { getStartAndEnd, today, formatDate } from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';
import OverflowClick from './components/overflow-click.vue';
import type { AuditData } from '@/types';

const { t } = useI18n();
const connectionStore = useConnectionStore();
const userStore = useUserStore();
const connectionIsActive = computed(() => typeof connectionStore.connectionIsActive === 'boolean');
const { canReadWriteData } = storeToRefs(userStore);
const { maxTableHeight } = useTableHeight(315);
const defaultSort = ref<Sort>({ prop: 'time', order: 'descending' });
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
const { shortcutsDaterange } = useShortcutsDate();

const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const dialogVisible = ref(false);
const editDetail = ref('');

const {
  requestFn: getAuditLogList,
  data: tableData,
  loading,
} = useRequest(LogApi.getAuditLogList, {
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
    orderBy: defaultSort.value.order === 'ascending' ? 'asc' : 'desc',
  }).then((res) => {
    totalCount.value = res.data.totalCount;
  });
}

function handleSortChange(data: { column: any; prop: string; order: any }) {
  defaultSort.value = { prop: 'time', order: data.order };
  getListData();
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.time = getStartAndEnd(0);
  copySearchFormData = cloneDeep(searchFormData);
  timestamp.value = Number(new Date());
  tableData.value.list = [];
  totalCount.value = 0;
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

function handleView(row: AuditData) {
  editDetail.value = row.log;
  dialogVisible.value = true;
}

watch(
  () => connectionIsActive.value && canReadWriteData.value,
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
.audit-detail-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 12px 8px 8px;
}

.page-table-details {
  padding: 8px 8px 10px;
  height: 100%;
  box-sizing: border-box;

  .page-table-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
    margin-bottom: 15px;
  }
}

.detail-text-button {
  // overflow: hidden;
  // text-overflow: ellipsis;
  // white-space: nowrap;
  width: 100%;
  white-space: pre;
}

.detail-text {
  font-size: 14px;
  line-height: 21px;
  font-weight: 300;
  color: #131926;
  padding: 12px 0;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
}
</style>
