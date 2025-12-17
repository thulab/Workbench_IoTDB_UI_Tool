<template>
  <div class="marker-table-area-wrapper">
    <el-table :data="props.markerDatas" border style="width: 100%" :height="props.isRunning ? '145px' : '110px'" size="small">
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

const props = withDefaults(
  defineProps<{
    isRunning: boolean;
    markerDatas: MeasurementMarkerData[];
  }>(),
  {},
);
</script>

<style>
.marker-table-area-wrapper {
  width: 100%;
  box-sizing: border-box;
  padding: 15px 25px;
}
</style>
