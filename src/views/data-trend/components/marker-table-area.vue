<template>
  <div class="marker-table-area-wrapper">
    <el-table :data="tableData" border style="width: 100%" :height="props.isRunning ? '145px' : '110px'" size="small">
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
const props = withDefaults(
  defineProps<{
    isRunning: boolean;
  }>(),
  {},
);

type MeasurementMarkerData = {
  name: string;
  x1: number;
  x2: number;
  x2_x1: number;
  y1: number;
  y2: number;
  y2_y1: number;
};

const tableData: MeasurementMarkerData[] = [
  { name: '测点-1', x1: 100, x2: 200, x2_x1: 100, y1: 10, y2: 20, y2_y1: 10 },
  { name: '测点-2', x1: 150, x2: 250, x2_x1: 100, y1: 15, y2: 25, y2_y1: 10 },
  { name: '测点-3', x1: 120, x2: 220, x2_x1: 100, y1: 12, y2: 22, y2_y1: 10 },
  { name: '测点-4', x1: 130, x2: 230, x2_x1: 100, y1: 13, y2: 23, y2_y1: 10 },
];
</script>

<style>
.marker-table-area-wrapper {
  width: 100%;
  box-sizing: border-box;
  padding: 15px 25px;
}
</style>
