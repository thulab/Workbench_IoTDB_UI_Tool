<template>
  <div class="database-page-container">
    <div class="database-list-wrapper">
      <side-tree ref="measurementSideTree" :can-read-write-schema="canReadWriteSchema" :current-node="currentNode" @handle-change-node="handleChangeNode" />
    </div>

    <div class="database-details-wrapper" :key="renderKey">
      <database-detail v-if="currentNodeType !== 'TIMESERIES'" :current-database="currentNode" :current-search-text="currentSearchText" @handle-reload="handleReload" />
      <measurement-detail v-if="currentNodeType === 'TIMESERIES'" :current-measurement="currentNode" @handle-reload="handleReload" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores';
import SideTree from './components/side-tree.vue';
import DatabaseDetail from './components/database-detail.vue';
import MeasurementDetail from './components/measurement-detail.vue';

const userStore = useUserStore();
const { canReadWriteSchema } = storeToRefs(userStore);
const measurementSideTree = ref<InstanceType<typeof SideTree>>();
const currentNode = ref('root');
const currentNodeType = ref('DATABASE');
const currentSearchText = ref('');
const renderKey = ref(0);

function handleChangeNode(path: string, type: string, searchText: string) {
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
  width: 240px;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.database-details-wrapper {
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
