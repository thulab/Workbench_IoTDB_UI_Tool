<template>
  <div>
    <div v-if="isCollapse" class="relative">
      <div class="rounded-[6px] bg-white h-[12px] w-full"></div>
      <div class="rounded-[2px] bg-white flex h-[12px] w-[40px] cursor-pointer items-center top-0 justify-center absolute" @click="handleExpand">
        <i-custom-arrow-up />
      </div>
    </div>
    <div v-if="!isCollapse" class="flex">
      <button class="flex cursor-pointer items-start" @click="handleCollapse">
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

const isCollapse = ref(false);

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

function handleCollapse() {
  isCollapse.value = true;
  emit('table-collapse');
}

function handleExpand() {
  isCollapse.value = false;
  emit('table-expand');
}

const emit = defineEmits<{
  'table-collapse': [];
  'table-expand': [];
}>();
</script>

<style scoped>
.marker-table :deep(th.el-table__cell) {
  font-size: 12px;
}
</style>
