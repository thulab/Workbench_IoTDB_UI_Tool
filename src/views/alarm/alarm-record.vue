<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
        <base-form-item label="告警名称：" prop="alarmName">
          <el-input v-model="searchFormData.alarmName" placeholder="请输入告警名称" style="width: 172px;" />
        </base-form-item>
        <base-form-item label="告警序列：" prop="measurements">
          <template #label>
            告警序列：<el-tooltip effect="light" content="关键字搜索仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select v-model="searchFormData.measurements" :server-id="serverId" :is-show-view-btn="true" :placeholder="'请输入告警序列'" :viewText="'已选序列'" />
        </base-form-item>
        <base-form-item label="告警级别：" prop="alarmLevel" class="m-r-0">
          <template #label>
            告警级别：<el-tooltip effect="light" content="一级为最高级别告警，二级次之，依次递减。" placement="top"><i-custom-question /></el-tooltip>
          </template>
          <el-select v-model="searchFormData.alarmLevel" :style="{ color: getLevelColor() }" class="level-select-box" style="width: 80px;">
            <template #prefix>
              <el-icon v-if="searchFormData.alarmLevel" :style="{ color: getLevelColor() }" size="20"><i-custom-alarm-level /></el-icon>
            </template>
            <el-option v-for="item in levelOptions" :key="item.value" :value="item.value" :label="item.name">
              <span v-if="item.value" style="display: flex; align-items: center;">
                <el-icon size="20" :style="{ color: item?.paramMap?.color }"><i-custom-alarm-level /></el-icon>
                <span :style="{ color: item?.paramMap?.color }">{{ item.name }}</span>
              </span>
              <span v-else style="margin-left: 18px;">{{ item.name }}</span>
            </el-option>
          </el-select>
        </base-form-item>
        <el-row>
          <base-form-item label="告警时间：" prop="createtimerange">
            <el-date-picker
              v-model="searchFormData.createtimerange"
              type="datetimerange"
              range-separator="-"
              unlink-panels
              :disabled-date="disabledDate"
              :shortcuts="shortcutsDaterange"
              :prefix-icon="ICustomCalender"
            />
          </base-form-item>
          <base-form-item label="仅查看最新状态：" prop="status">
            <el-switch
              v-model="searchFormData.status"
              :active-value="1"
              :inactive-value="0"
              style="

--el-switch-on-color: #44C795; --el-switch-off-color: #DFE1ED;" />
          </base-form-item>
          <div class="search-form-buttons">
            <el-button @click="handleReset">重置</el-button>
            <el-button type="primary" @click="handleSearch">查询</el-button>
          </div>
        </el-row>
      </el-form>

    </div>

    <div class="page-table-details">
      <div class="operate-buttons">
        <el-dropdown class="m-r-12" :disabled="!totalCount" @command="val => handleCommandDown(val)">
          <el-button type="primary" class="export-btn" :disabled="!totalCount">导出<el-tooltip effect="light" content="此导出操作为搜索结果导出。excel格式最大支持下载量为2G，csv无限制，推荐使用csv格式导出" placement="top"><i-custom-question-white /></el-tooltip></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="csv">以.csv格式导出</el-dropdown-item>
              <el-dropdown-item command="xlsx">以.xlsx格式导出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button :disabled="!multipleSelection.length" type="primary" @click="handleDel('batch', null)">批量删除</el-button>
      </div>
      <div class="page-table-box">
        <el-table
          :data="tableData.list"
          v-loading="loading"
          style="width: 100%;"
          :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 52"
          :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 52"
          tooltip-effect="light"
          ref="tableRef"
          :default-sort="{ prop: 'createTime', order: 'descending' }"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="告警名称" prop="alarmName" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column label="告警级别" prop="alarmLevel" sortable="custom" min-width="120" align="center">
            <template #default="{ row }">
              <span v-if="row.alarmLevel" style="display: flex; align-items: center; justify-content: center; margin-left: -20px;">
                <el-icon size="20" :style="{ color: getLevelColor(row) }"><i-custom-alarm-level /></el-icon>
                {{ getOptionField(row.alarmLevel, enumStore.alarmLevelEnum) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="告警序列" prop="measurement" min-width="200" align="center" show-overflow-tooltip />
          <el-table-column label="告警值" prop="alarmValue" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column label="告警时间" prop="createTime" sortable="custom" min-width="180" align="center" show-overflow-tooltip />
          <el-table-column label="告警描述" prop="alarmDesc" min-width="140" align="center" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <div style="display: flex; align-items: center;">
                <el-button v-if="!row.hasRead" type="primary" link size="small" @click="handleStatus(row)">已阅</el-button>
                <el-icon v-else size="16" class="m-r-8"><i-custom-success-green /></el-icon>
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
  </div>
</template>

<script setup lang="ts">
import type {
  FormInstance, DateModelType, ElTable,
} from 'element-plus';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash-es';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import { getOptionField } from '@/utils/format';
import { AlarmApi } from '@/api';
import { useServerStore, useEnumStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ICustomCalender from '~icons/custom/calender.svg';

const serverStroe = useServerStore();
const serverId = serverStroe.currentServerId;
const enumStore = useEnumStore();

const { maxTableHeight } = useTableHeight(340);
const searchFormRef = ref<FormInstance>();
const tableRef = ref<InstanceType<typeof ElTable>>();
const levelOptions = [{ name: '全部', value: '', paramMap: { color: '#656A85', icon: '' } }, ...enumStore.alarmLevelEnum];
const searchFormData = reactive({
  orderBy: '',
  asc: '',
  alarmName: '',
  measurements: [] as string[],
  createtimerange: null as unknown as [DateModelType, DateModelType],
  alarmLevel: '',
  status: 0,
  createStartTime: null as unknown as DateModelType,
  createEndTime: null as unknown as DateModelType,
});
let copySearchFormData = cloneDeep(searchFormData);
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
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const multipleSelection = ref<Alarm.QueryRecordResult[]>([]);

const getLevelColor = computed(() => function (data?: Alarm.QueryRecordResult) {
  if (!data) {
    if (searchFormData.alarmLevel) {
      const res = levelOptions.find((f) => f.value === searchFormData.alarmLevel);
      return res?.paramMap?.color;
    }
    return '#656A85';
  }
  const res = levelOptions.find((f) => f.value === data.alarmLevel);
  return res?.paramMap?.color;
});

const { requestFn: getAlarmRecordList, data: tableData, loading } = useRequest(AlarmApi.getAlarmRecordList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});
const { requestFn: deleteAlarmRecord } = useRequest(AlarmApi.deleteAlarmRecord);
const { requestFn: exportAlarmRecord } = useRequest(AlarmApi.exportAlarmRecord);
const { requestFn: updateAlarmRecordStatus } = useRequest(AlarmApi.updateAlarmRecordStatus);

function getListData() {
  getAlarmRecordList({
    ...copySearchFormData,
    ...pagination,
    createStartTime: copySearchFormData.createtimerange ? dayjs(copySearchFormData.createtimerange[0]).valueOf() : null,
    createEndTime: copySearchFormData.createtimerange ? dayjs(copySearchFormData.createtimerange[1]).valueOf() : null,
  }).then((res) => {
    if (res.code === 0) {
      totalCount.value = res.data.totalCount;
    }
  });
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.status = 0;
  searchFormData.measurements = [];
}

// 查询
function handleSearch() {
  pagination.pageNum = 1;
  copySearchFormData = cloneDeep(searchFormData);
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

function handleSelectionChange(vals: Alarm.QueryRecordResult[]) {
  multipleSelection.value = vals;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleSortChange({ column, prop, order }:SortMethod<Alarm.QueryRecordResult>) {
  const lastOrderBy = searchFormData.orderBy;
  const lastAsc = searchFormData.asc;
  searchFormData.asc = order === 'ascending' ? 'asc' : 'desc';
  searchFormData.orderBy = prop;
  copySearchFormData = cloneDeep(searchFormData);
  if (!order) {
    tableRef.value?.sort(lastOrderBy, lastAsc === 'asc' ? 'descending' : 'ascending');
    return;
  }
  handleSearch();
}

// 导出
function handleCommandDown(val: string) {
  exportAlarmRecord({
    ...copySearchFormData,
    ...pagination,
    createStartTime: copySearchFormData.createtimerange ? dayjs(copySearchFormData.createtimerange[0]).valueOf() : null,
    createEndTime: copySearchFormData.createtimerange ? dayjs(copySearchFormData.createtimerange[1]).valueOf() : null,
  }).then((res) => {
    if (res) {
      let url = `/api/file/exportExcelAlarmRecordData?exportId=${res.data}`;
      if (val === 'csv') {
        url = `/api/file/exportCSVAlarmRecordData?exportId=${res.data}`;
      }
      window.open(url);
    }
  });
}

function handleStatus(row: Alarm.QueryRecordResult) {
  updateAlarmRecordStatus(row.alarmTraceId).then(() => {
    ElMessage.success('已阅');
    // handleSearch();
    copySearchFormData = cloneDeep(searchFormData);
    getListData();
  });
}

function handleDel(type: string, data: Alarm.QueryRecordResult | null) {
  ElMessageBox.confirm(type === 'batch' ? '确认删除这些告警记录吗？' : '确认删除该条告警记录吗？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      let alarmRecordIds = [];
      if (type === 'batch') {
        alarmRecordIds = multipleSelection.value?.map((i) => i.alarmRecordId);
      } else {
        alarmRecordIds = data?.alarmRecordId ? [data.alarmRecordId] : [];
      }
      deleteAlarmRecord(alarmRecordIds).then((res) => {
        if (res.code === 0) {
          ElMessage.success('删除成功');
          handleSearch();
        }
      });
    });
}

onMounted(() => {
  handleReset();
  searchFormData.asc = 'desc';
  searchFormData.orderBy = 'createTime';
  handleSearch();
});

</script>

<style lang="scss" scoped>
.search-form-wrapper{
  width: 100%;

  .search-form-buttons{
    margin-bottom: 18px;
    display: inline-flex;
    flex-wrap: nowrap;
    flex: 1;
    justify-content: end;
  }

  :deep(.el-form-item) {
    margin-right: 36px;
  }

  :deep(.el-switch) {
    height: 28px;
  }

  :deep(.el-switch__core){
    width: 64px;
    height: 28px;
    border-radius: 14px;
  }

  :deep(.el-switch__action) {
    width: 24px;
    height: 24px;
  }

  :deep(.el-switch.is-checked .el-switch__core .el-switch__action) {
    left: calc(100% - 24px);
  }
}

:deep(.el-select-v2__selection){
  flex-wrap: nowrap;
}

.level-select-box{
  :deep(.el-input__inner) {
    color: unset;
  }
}

.operate-buttons{
  text-align: right;
  margin: 12px 0;
}

.export-btn svg{
  position: absolute;
  right: 6px;
  top: 3px;
}
</style>
