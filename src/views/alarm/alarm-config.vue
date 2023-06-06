<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
        <el-form-item label="告警名称:" prop="alarmName">
          <el-input v-model="searchFormData.alarmName" placeholder="请输入告警名称" />
        </el-form-item>
        <el-form-item label="告警序列:" prop="measurements">
          <template #label>
            告警序列:<el-tooltip effect="light" content="关键字搜索仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select v-model="searchFormData.measurements" :server-id="serverId" :is-show-view-btn="true" :placeholder="'请输入告警序列'" :viewText="'已选序列'" />
        </el-form-item>
        <el-form-item label="告警级别:" prop="alarmLevel">
          <template #label>
            告警级别:<el-tooltip effect="light" content="一级为最高级别告警，二级次之，依次递减。" placement="top"><i-custom-question /></el-tooltip>
          </template>
          <el-select v-model="searchFormData.alarmLevel" :style="{ color: getLevelColor() }" class="level-select-box">
            <template #prefix>
              <el-icon v-if="searchFormData.alarmLevel" :style="{ color: getLevelColor() }" size="20"><i-custom-alarm-level /></el-icon>
            </template>
            <el-option v-for="item in levelOptions" :key="item.value" :value="item.value" :label="item.name">
              <span v-if="item.value" style="display: flex; align-items: center;">
                <el-icon size="20" :style="{ color: item?.paramMap?.color }"><i-custom-alarm-level /></el-icon>
                <span :style="{ color: item?.paramMap?.color }">{{ item.name }}</span>
              </span>
              <span v-else>{{ item.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态:" prop="status">
          <el-select v-model="searchFormData.status" style="width: 120px;">
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
          :data="tableData.list"
          v-loading="loading"
          style="width: 100%;"
          :max-height="maxTableHeight"
          tooltip-effect="light"
          ref="tableRef"
          :default-sort="{ prop: 'createTime', order: 'descending' }"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="告警序列" prop="measurement" min-width="240" show-overflow-tooltip fixed="left" />
          <el-table-column label="告警名称" prop="alarmName" width="160" show-overflow-tooltip />
          <el-table-column label="告警级别" prop="alarmLevel" sortable="custom" width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.alarmLevel" style="display: flex; align-items: center;">
                <el-icon size="20" :style="{ color: getLevelColor(row) }"><i-custom-alarm-level /></el-icon>
                {{ getOptionField(row.alarmLevel, enumStore.alarmLevelEnum) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="createTime" sortable="custom" min-width="180" show-overflow-tooltip />
          <el-table-column label="更新时间" prop="updateTime" sortable="custom" min-width="180" show-overflow-tooltip />
          <el-table-column label="告警描述" prop="alarmDesc" min-width="140" show-overflow-tooltip />
          <el-table-column label="告警规则" prop="alarmRules" min-width="240" show-overflow-tooltip />
          <el-table-column label="状态" prop="status" min-width="90" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getOptionField(row.status, statusOptions, 'value', 'label') }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status !== 3" type="primary" link size="small" @click="handleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
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
      :alarm-config-id="alarmConfigId"
      :edit-type="editType"
      @handleSave="handleSaveConfig"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  FormInstance, DateModelType,
} from 'element-plus';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import { getOptionField } from '@/utils/format';
import { AlarmApi } from '@/api';
import { useServerStore, useEnumStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalConfig from './components/modal-config.vue';

const serverStroe = useServerStore();
const serverId = serverStroe.currentServerId;
const enumStore = useEnumStore();
const route = useRoute();

const { maxTableHeight } = useTableHeight(430);
const searchFormRef = ref<FormInstance>();
const levelOptions = [{ name: '全部', value: '', paramMap: { color: '#656A85', icon: '' } }, ...enumStore.alarmLevelEnum];
const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: 1 },
  { label: '禁用', value: 2 },
  { label: '失效', value: 3 },
];
const searchFormData = reactive({
  orderBy: '',
  asc: '',
  alarmName: '',
  measurements: (route.query.measurement ? [route.query.measurement] : []) as string[],
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
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const multipleSelection = ref<Alarm.QueryConfigResult[]>([]);
const editVisible = ref(false);
const editType = ref('add');
const alarmConfigId = ref();

const getLevelColor = computed(() => function (data?: Alarm.QueryConfigResult) {
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

const { requestFn: getAlarmConfigList, data: tableData, loading } = useRequest(AlarmApi.getAlarmConfigList, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    list: [],
  },
});
const { requestFn: deleteAlarmConfig } = useRequest(AlarmApi.deleteAlarmConfig);
const { requestFn: updateAlarmConfigStatus } = useRequest(AlarmApi.updateAlarmConfigStatus);

function getListData() {
  getAlarmConfigList({
    ...pagination,
    ...searchFormData,
    createStartTime: searchFormData.createtimerange ? dayjs(searchFormData.createtimerange[0]).valueOf() : null,
    createEndTime: searchFormData.createtimerange ? dayjs(searchFormData.createtimerange[1]).valueOf() : null,
    updateStartTime: searchFormData.updatetimerange ? dayjs(searchFormData.updatetimerange[0]).valueOf() : null,
    updateEndTime: searchFormData.updatetimerange ? dayjs(searchFormData.updatetimerange[1]).valueOf() : null,
  }).then((res) => {
    totalCount.value = res.data.totalCount;
  });
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleSortChange({ column, prop, order }:SortMethod<Alarm.QueryConfigResult>) {
  searchFormData.asc = order === 'ascending' ? 'asc' : 'desc';
  searchFormData.orderBy = prop;
  handleSearch();
}

function handleStatus(row: Alarm.QueryConfigResult) {
  const { status } = row;
  updateAlarmConfigStatus(row.alarmConfigId, status === 1 ? 2 : 1).then(() => {
    ElMessage.success('状态更新成功');
    row.status = status === 1 ? 2 : 1;
  });
}

function handleAdd() {
  editType.value = 'add';
  alarmConfigId.value = undefined;
  editVisible.value = true;
}

function handleEdit(row: Alarm.QueryConfigResult) {
  editType.value = 'edit';
  alarmConfigId.value = row.alarmConfigId;
  editVisible.value = true;
}

function handleDel(type: string, data: Alarm.QueryConfigResult | null) {
  ElMessageBox.confirm(type === 'batch' ? '确认删除这些告警配置吗？' : '确认删除该条告警配置吗？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      let alarmConfigIds = [];
      if (type === 'batch') {
        alarmConfigIds = multipleSelection.value?.map((i) => i.alarmConfigId);
      } else {
        alarmConfigIds = data?.alarmConfigId ? [data.alarmConfigId] : [];
      }
      deleteAlarmConfig(alarmConfigIds).then((res) => {
        if (res.code === 0) {
          ElMessage.success('删除成功');
          handleSearch();
        }
      });
    });
}

function handleSaveConfig() {
  handleReset();
  handleSearch();
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

.level-select-box{
  :deep(.el-input__inner) {
    color: unset;
  }
}

.operate-buttons{
  text-align: right;
  margin: 12px 0;
}
</style>
