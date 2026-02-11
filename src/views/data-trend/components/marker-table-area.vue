<template>
  <div>
    <div v-if="isCollapse" class="relative">
      <div class="rounded-[6px] bg-white h-[18px] w-full"></div>
      <div class="rounded-[6px] bg-white flex h-[18px] w-[40px] cursor-pointer items-center top-0 justify-center absolute overflow-hidden" @click="handleExpand">
        <i-custom-expand />
      </div>
    </div>
    <div v-if="!isCollapse" class="flex" ref="tableRef">
      <button class="mr-[1px] flex cursor-pointer items-start" @click="handleCollapse">
        <i-custom-expand style="transform: rotate(180deg)" />
      </button>
      <el-table
        :data="convertedMarkerDatas"
        border
        class="text-[12px] h-92px! marker-table"
        size="small"
        :table-layout="'auto'"
        :header-cell-style="{ textAlign: 'center', color: '#424561', fontWeight: '700' }"
        :cell-style="{ color: '#656A85', fontWeight: '300' }"
        :empty-text="props.isRunning ? t('dataTrend.runningTableTip') : '暂无数据'"
      >
        <el-table-column prop="name" :label="t('dataTrend.measurementName')" :show-overflow-tooltip="{ effect: 'light' }" :width="2 * singleCellWidth" align="center"></el-table-column>
        <el-table-column prop="x1" label="T1" :show-overflow-tooltip="{ effect: 'light' }" :width="singleCellWidth" align="center"></el-table-column>
        <el-table-column prop="x2" label="T2" :show-overflow-tooltip="{ effect: 'light' }" :width="singleCellWidth" align="center"></el-table-column>
        <el-table-column prop="x2_x1" label="T2 - T1" :show-overflow-tooltip="{ effect: 'light' }" :width="singleCellWidth" align="center"></el-table-column>
        <el-table-column prop="y1" label="V1" :show-overflow-tooltip="{ effect: 'light' }" :width="singleCellWidth" align="center"></el-table-column>
        <el-table-column prop="y2" label="V2" :show-overflow-tooltip="{ effect: 'light' }" :width="singleCellWidth" align="center"></el-table-column>
        <el-table-column prop="y2_y1" label="V2 - V1" :show-overflow-tooltip="{ effect: 'light' }" :width="singleCellWidth" align="center"></el-table-column>
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

const tableRef = ref<HTMLElement | null>(null);
const tableWidth = ref(0);
let observer: ResizeObserver | null = null;

const singleCellWidth = computed(() => {
  const totalColumns = 8;
  return (tableWidth.value - 25) / totalColumns;
});

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

onMounted(() => {
  if (tableRef.value) {
    observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width === undefined || width <= 0) return;
      for (const entry of entries) {
        tableWidth.value = entry.contentRect.width;
      }
    });
    observer.observe(tableRef.value);
  }
});

onBeforeUnmount(() => {
  if (observer && tableRef.value) {
    observer.unobserve(tableRef.value);
  }
});
</script>

<style scoped>
.marker-table :deep(th.el-table__cell) {
  font-size: 12px;
  padding: 2px 0;
}

.marker-table :deep(td.el-table__cell) {
  font-size: 12px;
  padding: 2px 0;
}
</style>
