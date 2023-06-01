<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
        <el-form-item label="告警名称:" prop="alarmName">
          <el-input v-model="searchFormData.alarmName" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="告警序列:" prop="measurements">
          <template #label>
            告警序列:<el-tooltip effect="light" content="仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select v-model="searchFormData.measurements" :server-id="serverId" :is-show-view-btn="true" />
        </el-form-item>
        <el-form-item label="告警级别:" prop="alarmLevel">
          <template #label>
            告警级别:<el-tooltip effect="light" content="一级为最高级别告警，二级次之，依次递减" placement="top"><i-custom-question /></el-tooltip>
          </template>
          <el-select v-model="searchFormData.alarmLevel">
            <el-option v-for="item in levelOptions" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态:" prop="status">
          <el-select v-model="searchFormData.status" style="width: 120px;" clearable>
            <el-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间:" prop="createtimerange">
          <el-date-picker
            v-model="searchFormData.createtimerange"
            type="datetimerange"
            range-separator="-"
            unlink-panels
            :disabled-date="disabledDate"
            :shortcuts="shortcutsDaterange"
          />
        </el-form-item>
        <el-form-item label="更新时间:" prop="updatetimerange">
          <el-date-picker
            v-model="searchFormData.updatetimerange"
            type="datetimerange"
            range-separator="-"
            unlink-panels
            :disabled-date="disabledDate"
            :shortcuts="shortcutsDaterange"
          />
        </el-form-item>
      </el-form>
      <div class="search-form-buttons">
        <el-button @click="handleReset">重 置</el-button>
        <el-button type="primary" @click="handleSearch">查 询</el-button>
      </div>

    </div>

    <div class="page-table-details">
      <div class="operate-buttons">
        <el-button type="primary" @click="handleAdd">新建告警</el-button>
        <el-button :disabled="!multipleSelection.length" type="primary" @click="handleDel('batch', null)">批量删除</el-button>
      </div>
      <div class="page-table-box">
        <el-table
          :data="tableData"
          v-loading="loading"
          style="width: 100%;"
          :max-height="maxTableHeight"
          tooltip-effect="light"
          ref="tableRef"
          :header-cell-style="{
            color: '#424561',
            overflow: 'hidden',
            background: '#F0F1FA',
          }"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="告警序列" prop="measurement" min-width="240" show-overflow-tooltip />
          <el-table-column label="告警名称" prop="alarmName" width="160" show-overflow-tooltip />
          <el-table-column label="告警级别" prop="alarmLevel" sortable="custom" width="140" show-overflow-tooltip />
          <el-table-column label="创建时间" prop="createTime" sortable="custom" min-width="140" show-overflow-tooltip />
          <el-table-column label="更新时间" prop="updateTime" sortable="custom" min-width="140" show-overflow-tooltip />
          <el-table-column label="告警描述" prop="alarmDesc" min-width="140" show-overflow-tooltip />
          <el-table-column label="告警规则" prop="alarmRule" min-width="240" show-overflow-tooltip />
          <el-table-column label="状态" prop="status" min-width="240" show-overflow-tooltip />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleStatus(row)">{{ row.status ? '禁用' : '启用' }}</el-button>
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="primary" link size="small" @click="handleDel('row', row)">删除</el-button>
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

    <modal-config
      v-model:visible="editVisible"
      :server-id="serverId"
      :alarmConfId="alarmConfId"
      :edit-type="editType"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  FormInstance, DateModelType,
} from 'element-plus';
// import dayjs from 'dayjs';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import { AlarmApi } from '@/api';
import { useServerStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import modalConfig from './modal-config.vue';

const serverStroe = useServerStore();
const serverId = serverStroe.currentServerId;

const { maxTableHeight } = useTableHeight(420);
const searchFormRef = ref<FormInstance>();
const levelOptions = [
  { label: '全部', value: '' },
  { label: '一级', value: '1' },
  { label: '二级', value: '2' },
  { label: '三级', value: '3' },
  { label: '四级', value: '4' },
  { label: '五级', value: '5' },
];
const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: '0' },
  { label: '禁用', value: '1' },
  { label: '失效', value: '2' },
];
const searchFormData = reactive({
  alarmName: '',
  measurements: [] as string[],
  createtimerange: null as unknown as [DateModelType, DateModelType],
  updatetimerange: null as unknown as [DateModelType, DateModelType],
  alarmLevel: '',
  status: '',
  createStartTime: null as unknown as DateModelType,
  createEndTime: null as unknown as DateModelType,
  updateStartTime: null as unknown as DateModelType,
  updateEndTime: null as unknown as DateModelType,
});
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
const tableData = ref<Record<string, any>[]>([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const loading = ref(false);
const multipleSelection = ref<Alarm.QueryConfigResult[]>([]);
const editVisible = ref(false);
const editType = ref('add');
const alarmConfId = ref();

// const { requestFn: getAlarmConfigList, data: tableData, loading } = useRequest(AlarmApi.getAlarmConfigList);
const { requestFn: deleteAlarmConfig } = useRequest(AlarmApi.deleteAlarmConfig);

function getListData() {
  // getAlarmConfigList({
  //   ...searchFormData,
  //   createStartTime: searchFormData.createtimerange ? dayjs(searchFormData.createtimerange[0]).valueOf() : null,
  //   createEndTime: searchFormData.createtimerange ? dayjs(searchFormData.createtimerange[1]).valueOf() : null,
  //   updateStartTime: searchFormData.updatetimerange ? dayjs(searchFormData.updatetimerange[0]).valueOf() : null,
  //   updateEndTime: searchFormData.updatetimerange ? dayjs(searchFormData.updatetimerange[1]).valueOf() : null,
  //   size: pagination.pageSize,
  //   page: pagination.pageNum,
  // }).then((res) => {
  //   if (res.code === 0) {
  //     totalCount.value = res.data.totalCount;
  //   }
  // });
}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
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

function handleSelectionChange(vals: Alarm.QueryConfigResult[]) {
  multipleSelection.value = vals;
}

function handleSortChange({ column, prop, order }:SortMethod<Alarm.QueryConfigResult>) {
  console.log(column, prop, order);
}

function handleStatus(row: Alarm.QueryConfigResult) {
  console.log(row, '状态');
}

function handleAdd() {
  editType.value = 'add';
  editVisible.value = true;
}

function handleEdit(row: Alarm.QueryConfigResult) {
  editType.value = 'edit';
  alarmConfId.value = row.alarmConfId;
  editVisible.value = true;
  console.log(row, '编辑');
}

function handleDel(type: string, data: Alarm.QueryConfigResult | null) {
  ElMessageBox.confirm(type === 'batch' ? '确认删除这些告警配置吗？' : '确认删除该条告警配置吗？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      let alarmConfIds = [];
      if (type === 'batch') {
        alarmConfIds = multipleSelection.value?.map((i) => i.alarmConfId);
      } else {
        alarmConfIds = data?.alarmConfId ? [data.alarmConfId] : [];
      }
      deleteAlarmConfig(alarmConfIds).then((res) => {
        if (res.code === 0) {
          ElMessage.success('删除成功');
          handleSearch();
        }
      });
    });
}

onMounted(() => {
  handleReset();
  handleSearch();
});

</script>

<style lang="scss" scoped>
.search-form-wrapper{
  display: flex;
  justify-content: space-between;

  .search-form-buttons{
    align-self: flex-end;
    margin-bottom: 18px;
    flex: 0 0 180px;
  }
}

:deep(.el-select-v2__selection){
  flex-wrap: nowrap;
}

.operate-buttons{
  text-align: right;
  margin: 12px 0;
}
</style>
