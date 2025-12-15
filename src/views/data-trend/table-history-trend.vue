<template>
  <div class="history-trend-page-container">
    <div class="database-list-wrapper">
      <TableSideTree />
    </div>
    <div class="trend-details-wrapper">
      <TrendGraphArea />
      <TimelineArea :range="pendingRange" :full-range="globalTimeRange" />
      <MarkerTableArea />
    </div>
  </div>
</template>

<script lang="ts" setup>
import TableSideTree from './components/table-side-tree.vue';
import TrendGraphArea from './components/trend-graph-area.vue';
import MarkerTableArea from './components/marker-table-area.vue';
import TimelineArea from './components/timeline-area.vue';
import type { TimeRange } from '@/types/trend';

const globalTimeRange: TimeRange = {
  start: Date.now() - 12 * 3600 * 1000,
  end: Date.now(),
};
const pendingRange = ref<TimeRange>({ ...globalTimeRange });
</script>

<style>
.history-trend-page-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.database-list-wrapper {
  width: 240px;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.trend-details-wrapper {
  width: calc(100% - 256px);
  margin-left: 256px;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}
</style>
