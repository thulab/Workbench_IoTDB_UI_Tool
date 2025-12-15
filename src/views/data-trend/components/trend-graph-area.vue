<template>
  <div class="trend-graph-area-wrapper">
    <div class="operate-button-row">
      <div v-if="!props.isRunning">
        <div>
          时间范围：
          <el-date-picker
            v-model="selectedDateTime.value"
            type="datetimerange"
            range-separator="-"
            unlink-panels
            :disabled-date="disabledDate"
            :shortcuts="shortcutsDaterange"
            :clearable="false"
            :prefix-icon="ICustomCalender"
            :default-time="[new Date(2024, 3, 28, 0, 0, 0), new Date(2024, 3, 28, 23, 59, 59)]"
            @change="handleChangeTime"
          />
        </div>
      </div>
      <div class="operate-button-group">
        <button v-if="props.isRunning" class="operate-button">
          <el-icon size="22"><VideoPlay /></el-icon>
        </button>
        <button v-if="props.isRunning" class="operate-button">
          <el-icon size="22"><VideoPause /></el-icon>
        </button>
        <button class="operate-button">
          <el-icon size="30"><i-custom-sql-save /></el-icon>
        </button>
        <button class="operate-button">
          <el-icon size="30"><i-custom-template /></el-icon>
        </button>
      </div>
    </div>
    <el-scrollbar>
      <div>
        <MetricChartGroup
          v-for="(group, index) in props.measurementGroupInfo"
          :key="group.id"
          :group="group"
          :index="index"
          :range="props.range"
          :markers="markers"
          :height="chartHeight"
          :loading="props.loading"
          @marker-change="updateMarker"
        />
        <MetricChartGroup
          v-if="props.measurementGroupInfo.length === 0"
          :group="{ id: 'default', members: [] }"
          :index="0"
          :range="props.range"
          :markers="markers"
          :height="chartHeight"
          :loading="props.loading"
          @marker-change="updateMarker"
        />
      </div>
    </el-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import MetricChartGroup from './metric-chart-group.vue';
import ICustomCalender from '~icons/custom/calender.svg';
import type { TimeRange, ChartMarker, ChartGroupInput } from '@/types/trend';
import dayjs from 'dayjs';
import { today, getOneIntervalNow } from '@/utils/date';
import type { DateModelType } from 'element-plus';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';

const props = withDefaults(
  defineProps<{
    isRunning: boolean;
    range: TimeRange;
    markers: ChartMarker[];
    measurementGroupInfo: ChartGroupInput[];
    loading?: boolean;
  }>(),
  {},
);

const chartHeight = computed(() => {
  if (props.measurementGroupInfo.length === 0) {
    return props.isRunning ? 800 : 690;
  }
  if (props.measurementGroupInfo.length > 3) {
    return 240;
  }
  return props.isRunning ? 800 : 690 / props.measurementGroupInfo.length;
});

const emit = defineEmits<{
  'global-time-change': [payload: TimeRange];
  'marker-change': [payload: { id: string; timestamp: number }];
}>();

const { t } = useI18n();
const { shortcutsDaterange } = useShortcutsDate();
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const selectedDateTime = reactive<{
  value: [DateModelType, DateModelType];
}>({
  value: props.range ? [new Date(props.range.start), new Date(props.range.end)] : getOneIntervalNow(12),
});

function handleChangeTime(value: [DateModelType, DateModelType]) {
  const start = dayjs(value[0]).valueOf();
  const end = dayjs(value[1]).valueOf();
  if (start >= end) {
    ElMessage.warning({
      message: t('dataTrend.timeTip'),
      grouping: true,
    });
  }
  emit('global-time-change', { start, end });
}

function updateMarker(payload: { id: string; timestamp: number }) {
  emit('marker-change', payload);
}
</script>

<style>
.trend-graph-area-wrapper {
  width: 100%;
  min-height: 760px;
  box-sizing: border-box;
  padding: 0 16px;
}

.operate-button-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.operate-button-group {
  display: flex;
}

.operate-button {
  width: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>
