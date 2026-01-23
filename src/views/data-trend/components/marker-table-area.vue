<template>
  <div class="flex">
    <button class="flex items-start">
      <i-custom-collapse />
    </button>
    <el-table :data="convertedMarkerDatas" border class="text-[12px] h-105px! marker-table" size="small" :table-layout="'auto'" :header-cell-style="{ textAlign: 'center' }">
      <el-table-column prop="name" :label="t('dataTrend.measurementName')" :show-overflow-tooltip="{ effect: 'light' }"></el-table-column>
      <el-table-column prop="x1" label="X1" :show-overflow-tooltip="{ effect: 'light' }" width="150%"></el-table-column>
      <el-table-column prop="x2" label="X2" :show-overflow-tooltip="{ effect: 'light' }" width="150%"></el-table-column>
      <el-table-column prop="x2_x1" label="X2 - X1" :show-overflow-tooltip="{ effect: 'light' }" width="100%"></el-table-column>
      <el-table-column prop="y1" label="Y1" :show-overflow-tooltip="{ effect: 'light' }" width="100%"></el-table-column>
      <el-table-column prop="y2" label="Y2" :show-overflow-tooltip="{ effect: 'light' }" width="100%"></el-table-column>
      <el-table-column prop="y2_y1" label="Y2 - Y1" :show-overflow-tooltip="{ effect: 'light' }" width="100%"></el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import type { MeasurementMarkerData } from '@/types/trend';
import dayjs from 'dayjs';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    isRunning: boolean;
    markerDatas: MeasurementMarkerData[];
  }>(),
  {},
);

const convertedMarkerDatas = computed(() => {
  return props.markerDatas.map((marker) => {
    return {
      ...marker,
      y1: isNaN(marker.y1) ? '' : marker.y1.toFixed(4),
      y2: isNaN(marker.y2) ? '' : marker.y2.toFixed(4),
      x1: dayjs(marker.x1).format('YYYY-MM-DD HH:mm:ss'),
      x2: dayjs(marker.x2).format('YYYY-MM-DD HH:mm:ss'),
      x2_x1: ((marker.x2 - marker.x1) / 1000).toFixed(2) + ' 秒',
      y2_y1: isNaN(marker.y2) || isNaN(marker.y1) ? '' : (marker.y2 - marker.y1).toFixed(4),
    };
  });
});
</script>

<style scoped>
.marker-table :deep(th.el-table__cell) {
  font-size: 12px;
}
</style>
