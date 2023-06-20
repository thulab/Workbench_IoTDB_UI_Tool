<template>
  <el-container>
    <el-header>
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" label-width="88px" size="default" inline>
          <base-form-item label="">
            <el-switch
              v-model="searchFormData.tab"
              :active-value="1"
              :inactive-value="0"
              active-text="实时趋势"
              inactive-text="历史趋势"
              style="

--el-switch-on-color: #44C795; --el-switch-off-color: #DFE1ED;" />
          </base-form-item>
          <base-form-item label="时间范围：" prop="datetimerange" :rules="requiredRules">
            <el-date-picker
              v-model="searchFormData.datetimerange"
              type="datetimerange"
              range-separator="～"
              unlink-panels
              :disabled-date="disabledDate"
              :shortcuts="shortcutsDaterange"
              :clearable="false"
              :prefix-icon="ICustomCalender"
            />
          </base-form-item>
          <base-form-item label="采样周期：" prop="unitInterval" :rules="requiredRules">
            <el-select v-model="searchFormData.unitInterval">
              <el-option v-for="item in timeUnits" :key="item.value" :value="item.value" :label="item.label" />
            </el-select>
          </base-form-item>
          <base-form-item label="采样策略：" prop="aggregation" :rules="requiredRules">
            <el-select v-model="searchFormData.aggregation">
              <el-option v-for="item in aggregateFunctions" :key="item.value" :value="item.value" :label="item.label" />
            </el-select>
          </base-form-item>
          <base-form-item class="search-form-buttons">
            <el-button @click="handleReset">重置</el-button>
            <el-tooltip
              placement="top-start"
              effect="light"
              trigger="hover"
              content="请先添加测点并选中"
              :disabled="!!pathList.length"
            >
              <el-button :class="[!pathList.length && 'hover-btn-disabled']" type="primary" @click="handleSearch">应用</el-button>
            </el-tooltip>
          </base-form-item>
        </el-form>
      </div>
    </el-header>
    <el-main>
      <el-container>
        <el-main>趋势图</el-main>
        <el-aside>
          <h4>已选测点</h4>
          <el-tooltip
            placement="top-start"
            effect="light"
            trigger="hover"
            content="最多同时展示10条测点趋势"
            :disabled="pathList.length !== 10"
          >
            <el-button :class="[pathList.length === 10 && 'hover-btn-disabled']" @click="handleAdd"><i-custom-add class="m-r-4" /></el-button>
          </el-tooltip>
        </el-aside>
      </el-container>
    </el-main>

    <modal-path
      v-model:visible="pathVisible"
      :path-list="editPathList"
      @handleSave="handleSavePath"
    />
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import dayjs from 'dayjs';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';
import ModalPath from './components/modal-path.vue';

const searchFormRef = ref<FormInstance>();

const searchFormData = reactive({
  tab: '',
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  unitInterval: '10min',
  aggregation: 'avg',
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
const timeUnits = [
  { label: '1min', value: '1min', timestamp: 60000 },
  { label: '5min', value: '5min', timestamp: 300000 },
  { label: '10min', value: '10min', timestamp: 600000 },
  { label: '30min', value: '30min', timestamp: 1800000 },
  { label: '1h', value: '1h', timestamp: 3600000 },
  { label: '8h', value: '8h', timestamp: 28800000 },
  { label: '1d', value: '1d', timestamp: 86400000 },
  { label: '1w', value: '1w', timestamp: 604800000 },
  { label: '1m', value: '1m', timestamp: 2592000000 },
];
const aggregateFunctions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max_value' },
  { label: '最小值', value: 'min_value' },
  { label: '最新值', value: 'last_value' },
];

const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['change'],
  },
]);

const pathList = ref<Trend.LineObj[]>([]);
const pathVisible = ref(false);
const editPathList = ref<string[]>([]);

// 重置
function handleReset() {
  searchFormData.datetimerange = getOneIntervalNow(7) as [DateModelType, DateModelType];
  searchFormData.unitInterval = '10min';
  searchFormData.aggregation = 'avg';
}

// 查询
function handleSearch() {
  if (!pathList.value.length) return;
  const timerange = dayjs(searchFormData.datetimerange[1]).valueOf() - dayjs(searchFormData.datetimerange[0]).valueOf();
  const timeinterval = timeUnits.find((time) => time.value === searchFormData.unitInterval)?.timestamp;
  const point = timeinterval ? Math.ceil(timerange / timeinterval) : 0;
  if (point > 2000) {
    ElMessage.warning('当前数据点较多，无法绘制，请缩短时间范围或调整采样周期重试');
    return;
  }
  console.log('handleSearch');
}

function handleAdd() {
  if (pathList.value.length === 10) return;
  editPathList.value = pathList.value.map((item) => item.path);
  pathVisible.value = true;
}

function handleSavePath(data: Trend.LineObj) {
  console.log(data, 'data');
  pathList.value.push(data);
}

</script>

<style lang="scss" scoped>
.hover-btn-disabled, .hover-btn-disabled:focus{
  color: var(--el-button-disabled-text-color) !important;
  cursor: not-allowed !important;
  background-color: var(--el-button-disabled-bg-color) !important;
  border-color: var(--el-button-disabled-border-color) !important;
}
</style>
