<template>
  <div>
    <el-table :data="convertedMarkerDatas" border class="h-148px! mt-22px" size="small">
      <el-table-column prop="name" label="测点名称"></el-table-column>
      <el-table-column prop="x1" label="X1"></el-table-column>
      <el-table-column prop="x2" label="X2"></el-table-column>
      <el-table-column prop="x2_x1" label="X2 - X1"></el-table-column>
      <el-table-column prop="y1" label="Y1"></el-table-column>
      <el-table-column prop="y2" label="Y2"></el-table-column>
      <el-table-column prop="y2_y1" label="Y2 - Y1"></el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import type { MeasurementMarkerData } from '@/types/trend';
import dayjs from 'dayjs';

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
      y1: marker.y1.toFixed(4),
      y2: marker.y2.toFixed(4),
      x1: dayjs(marker.x1).format('YYYY-MM-DD HH:mm:ss'),
      x2: dayjs(marker.x2).format('YYYY-MM-DD HH:mm:ss'),
      x2_x1: ((marker.x2 - marker.x1) / 1000).toFixed(2) + ' 秒',
      y2_y1: (marker.y2 - marker.y1).toFixed(4),
    };
  });
});
</script>
