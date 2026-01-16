<template>
  <div class="database-page-container">
    <div class="database-list-wrapper" :style="{ width: sideTreeWidth + 'px' }">
      <div style="position: absolute; left: 0; right: 0">
        <side-tree ref="measurementSideTree" :can-read-write-schema="canReadWriteSchema" @handle-node-click="handleNodeClick" @update-detail="handleUpdateDetail" />
      </div>
      <div style="height: 100%; width: 4px; background-color: transparent; position: absolute; right: -2px; cursor: ew-resize" @pointerdown="(e) => onSliderPointerDown(e)"></div>
    </div>

    <div class="database-details-wrapper" :style="{ width: `calc(100% - ${sideTreeWidth}px - 8px)`, marginLeft: sideTreeWidth + 8 + 'px' }" :key="detailKey">
      <database-detail ref="dbDtail" v-if="currentNode && currentNode.nodeType === 'DATABASE'" :current-node="currentNode" />
      <table-detail ref="tableDtail" v-if="currentNode && currentNode.nodeType === 'TABLE'" :current-node="currentNode" />
      <table-data-detail ref="tableDataDtail" v-if="currentNode && currentNode.nodeType === 'TABLEDATA'" :current-node="currentNode" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores';
import { ref } from 'vue';
import SideTree from './components/side-tree.vue';
import DatabaseDetail from './components/database-detail.vue';
import TableDetail from './components/table-detail.vue';
import TableDataDetail from './components/table-data-detail.vue';
import type { TableTreeNodeData } from '@/types/table-data';

const userStore = useUserStore();
const { canReadWriteSchema } = storeToRefs(userStore);
const currentNode = ref<TableTreeNodeData | null>(null);
const detailKey = ref(0);
const dbDtail = ref<InstanceType<typeof DatabaseDetail>>();
const tableDtail = ref<InstanceType<typeof TableDetail>>();
const tableDataDtail = ref<InstanceType<typeof TableDataDetail>>();

function handleNodeClick(nodeInfo: TableTreeNodeData) {
  currentNode.value = nodeInfo;
  detailKey.value++;
}

function handleUpdateDetail() {
  dbDtail?.value?.handleRefresh();
  tableDtail?.value?.handleRefresh();
  tableDataDtail?.value?.handleRefresh();
}

const sideTreeWidth = ref<number>(240);

function onSliderPointerDown(event: PointerEvent) {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = sideTreeWidth.value || 240;

  function onPointerMove(e: PointerEvent) {
    const deltaX = e.clientX - startX;
    const newWidth = Math.min(Math.max(200, startWidth + deltaX), 600);
    sideTreeWidth.value = newWidth;
  }

  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}
</script>

<style lang="scss" scoped>
.database-page-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.database-list-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.database-details-wrapper {
  height: 100%;
  background-color: #fff;
  border-radius: 6px;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}
</style>
