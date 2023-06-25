<template>
  <el-container class="data-trend-wrapper">
    <el-header class="p-0" style="height: auto;">
      <div class="search-form-wrapper">
        <el-form :model="searchFormData" ref="searchFormRef" label-position="left" label-width="88px" size="default" inline class="m-b-22">
          <ul class="search-data-list">
            <li :class="['search-data-type', { 'search-data-active': dataTab === 'running' }]" @click="handleTrendTab('running')">实时趋势</li>
            <li :class="['search-data-type', { 'search-data-active': dataTab === 'history' }]" @click="handleTrendTab('history')">历史趋势</li>
          </ul>
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
              :disabled="isRunningTab"
            />
          </base-form-item>
          <base-form-item label="采样周期：" prop="unitInterval" :rules="requiredRules">
            <el-select v-model="searchFormData.unitInterval" :disabled="isRunningTab" style="width: 80px;">
              <el-option v-for="item in timeUnits" :key="item.value" :value="item.value" :label="item.label" />
            </el-select>
          </base-form-item>
          <base-form-item label="采样策略：" prop="aggregation" :rules="requiredRules">
            <el-select v-model="searchFormData.aggregation" :disabled="isRunningTab" style="width: 80px;">
              <el-option v-for="item in aggregateFunctions" :key="item.value" :value="item.value" :label="item.label" />
            </el-select>
          </base-form-item>
          <div class="play-pause-buttons">
            <el-icon size="30" v-if="!isRunningTab"><i-custom-play-disabled /></el-icon>
            <template v-else>
              <el-icon size="30" v-if="!loading"><i-custom-play-active /></el-icon>
              <el-icon size="30" v-else><i-custom-pause /></el-icon>
            </template>
          </div>
        </el-form>
        <div class="search-form-buttons" v-if="!isRunningTab">
          <el-button @click="handleReset">重置</el-button>
          <el-tooltip
            placement="top-start"
            effect="light"
            trigger="hover"
            content="请先添加测点并选中"
            :disabled="searchAbled"
          >
            <el-button :class="[!searchAbled && 'hover-btn-disabled']" type="primary" @click="handleSearch">应用</el-button>
          </el-tooltip>
        </div>
      </div>
    </el-header>
    <el-main class="p-0">
      <el-container class="chart-detail-wrapper">
        <el-main>趋势图</el-main>
        <el-aside :width="isExpand ? '240px' : '24px'" :class="['path-list-wrapper', !isExpand && 'p-0']">
          <trend-list
            v-model="pathList"
            v-model:is-expand="isExpand"
          />
        </el-aside>
      </el-container>
    </el-main>

  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import dayjs from 'dayjs';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';
import TrendList from './components/trend-list.vue';

const isExpand = ref(true);
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

const dataTab = ref<'running' | 'history'>('running');
const pathList = ref<Trend.LineObj[]>([]);
const loading = ref(false);
const isRunningTab = computed(() => dataTab.value === 'running');
const searchAbled = computed(() => pathList.value.length > 0 && pathList.value.filter((item) => item.checked).length > 0);

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

// 切换数据类型
function handleTrendTab(type: 'running' | 'history') {
  dataTab.value = type;
}
</script>

<style lang="scss" scoped>

.data-trend-wrapper{
  border-radius: 6px;
  background: #FFF;
  box-sizing: border-box;
  padding: 26px 16px 16px 30px;
}

.search-form-wrapper{
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  :deep(.el-form) {
    display: flex;
    align-items: center;
    height: 30px;
  }

  :deep(.el-form-item--default) {
    margin: 0 24px 0 0;
  }
}

.search-data-list {
  display: inline-flex;
  margin-right: 24px;
  border-radius: 12px;
  background-color: #f0f1fa;
  padding: 4px;

  .search-data-type {
    padding: 3px 12px 3px 8px;
    cursor: pointer;
    border-radius: 12px;
    background-color: transparent;
    font-size: 12px;
    line-height: 12px;
    font-weight: 300;
    color: #656a85;
    white-space: nowrap;
  }

  .search-data-active {
    background-color: #495ad4;
    color: #fff;
    padding: 3px 12px;
  }
}

.play-pause-buttons{
  height: 30px;
}

.search-form-buttons{
  display: inline-flex;
  flex-wrap: nowrap;
  flex: 1;
  justify-content: end;
  margin-bottom: 16px;
}

.hover-btn-disabled, .hover-btn-disabled:focus{
  color: var(--el-button-disabled-text-color) !important;
  cursor: not-allowed !important;
  background-color: var(--el-button-disabled-bg-color) !important;
  border-color: var(--el-button-disabled-border-color) !important;
}

.chart-detail-wrapper{
  width: 100%;
  height: 100%;
}

.path-list-wrapper{
  margin-left: 16px;
  background-color: #F7F8FC;
  border-radius: 2px;
  box-sizing: border-box;
  padding: 12px 16px 25px;
  position: relative;
  transition: all 0.3s ease;
}

</style>
