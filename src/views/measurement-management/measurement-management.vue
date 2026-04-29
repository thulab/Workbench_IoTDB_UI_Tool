<template>
  <div class="database-page-container" data-testid="measurement-management-page">
    <div class="database-list-wrapper" :style="{ width: sideTreeWidth + 'px' }" data-testid="measurement-management-side-panel">
      <div style="position: absolute; left: 0; right: 0">
        <side-tree ref="measurementSideTree" :can-read-write-schema="canReadWriteSchema" :current-node="currentNode" @handle-change-node="handleChangeNode" />
      </div>
      <div style="height: 100%; width: 4px; background-color: transparent; position: absolute; right: -2px; cursor: ew-resize" @pointerdown="(e) => onSliderPointerDown(e)"></div>
    </div>

    <div class="database-details-wrapper" :style="{ width: `calc(100% - ${sideTreeWidth}px - 8px)`, marginLeft: sideTreeWidth + 8 + 'px' }" :key="renderKey" data-testid="measurement-management-detail-panel">
      <database-detail
        v-if="currentNodeType !== 'TIMESERIES'"
        :current-node-type="currentNodeType"
        :current-database="currentNode"
        :current-search-text="currentSearchText"
        @handle-reload="handleReload"
        @handle-delete="handleDelete"
        @handle-save-measurement="handleSaveMeasurement"
      />
      <measurement-detail v-if="currentNodeType === 'TIMESERIES'" :current-measurement="currentNode" @handle-reload="handleReload" @handle-delete="handleDelete" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores';
import SideTree from './components/side-tree.vue';
import DatabaseDetail from './components/database-detail.vue';
import MeasurementDetail from './components/measurement-detail.vue';
import type { TreeEventPayload } from '@/types';

const userStore = useUserStore();
const { canReadWriteSchema } = storeToRefs(userStore);
const measurementSideTree = ref<InstanceType<typeof SideTree>>();
const currentNode = ref('root');
const currentNodeType = ref('DATABASE');
const currentSearchText = ref('');
const renderKey = ref(0);
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

function handleChangeNode(path: string, type: string, searchText: string) {
  if (type === 'loading') return;
  currentNode.value = path;
  if (currentSearchText.value !== searchText) {
    currentSearchText.value = searchText;
  }
  currentNodeType.value = type;
  renderKey.value++;
}

function handleReload() {
  measurementSideTree.value?.handleRefresh();
}

function handleDelete(payload: TreeEventPayload) {
  measurementSideTree.value?.handleOperate('delete', payload);
}
function handleSaveMeasurement(path: string) {
  measurementSideTree.value?.handleOperate('add', { path, type: 'MEASUREMENT' });
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
  margin-left: 248px;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}
</style>
