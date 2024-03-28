<template>
  <active-container :is-show="connectionIsActive">
    <el-container class="audit-detail-wrapper">
      <el-header class="p-x-0" style="height: auto">
        <div class="search-form-wrapper">
          <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
            <base-form-item :label="`${t('log.operateUser')}：`" prop="username" :label-width="locale === 'en' ? '100px' : '80px'">
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
            <el-row>
              <base-form-item :label="`${t('log.timeRange')}：`" prop="time" :label-width="locale === 'en' ? '100px' : '80px'">
                <el-date-picker
                  v-model="searchFormData.time"
                  type="datetimerange"
                  range-separator="～"
                  unlink-panels
                  :clearable="false"
                  :shortcuts="shortcutsDaterange"
                  :disabled-date="disabledDate"
                  :prefix-icon="ICustomCalender"
                  :default-time="[new Date(2024, 3, 28, 0, 0, 0), new Date(2024, 3, 28, 23, 59, 59)]"
                  id="audit-search-time"
                />
              </base-form-item>
              <div class="search-form-buttons">
                <el-button @click="handleReset" id="audit-search-reset">{{ t('common.reset') }}</el-button>
                <el-button type="primary" @click="handleSearch" id="audit-search-search">{{ t('common.query') }}</el-button>
              </div>
            </el-row>
          </el-form>
        </div>
      </el-header>
      <el-main class="p-0">
        <div class="page-table-details">
          <h4 class="page-table-title">{{ t('log.auditList') }}</h4>
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
            >
              <el-table-column :label="t('log.operateTime')" prop="time" width="180" align="center" show-overflow-tooltip />
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
        </div>
      </el-main>

      <el-dialog :title="t('common.operationDetail')" v-model="dialogVisible" width="480px" :close-on-click-modal="false" align-center id="audit-modal-detail">
        <div class="detail-text">{{ editDetail }}</div>
      </el-dialog>
    </el-container>
  </active-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import { LogApi } from '@/api';
import { useConnectionStore } from '@/stores';
import { getStartAndEnd, today, formatDate, getOneInterval, getOneIntervalNow } from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';
import OverflowClick from './components/overflow-click.vue';

const { t, locale } = useI18n();
const connectionStore = useConnectionStore();
const connectionIsActive = computed(() => typeof connectionStore.connectionIsActive === 'boolean');
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
    text: t('common.today'),
    value: () => getStartAndEnd(0),
  },
  {
    text: t('common.yesterday'),
    value: () => getOneInterval(1),
  },
  {
    text: t('common.7dayRecend'),
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
  if (!connectionIsActive.value) return;
  handleReset();
  handleSearch();
});

watch(
  () => connectionIsActive.value,
  (val) => {
    if (val) {
      handleReset();
      handleSearch();
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.audit-detail-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 16px 16px 14px;
}

.search-form-buttons {
  display: inline-flex;
  flex-wrap: nowrap;
  flex: 1;
  justify-content: end;
}

.page-table-details {
  padding: 20px 16px 10px;

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
