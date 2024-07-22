<template>
  <div class="database-page-container">
    <div class="database-list-wrapper">
      <side-tree :can-read-write-schema="canReadWriteSchema" @handleChangeNode="handleChangeNode" />
    </div>

    <div class="database-details-wrapper">
      <database-detail v-if="currentNodeType === 'DATABASE'" :current-database="currentNode" />
      <measurement-detail v-if="currentNodeType === 'TIMESERIES'" :current-measurement="currentNode" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores';
import SideTree from './components/side-tree.vue';
import DatabaseDetail from './components/database-detail.vue';
import MeasurementDetail from './components/measurement-detail.vue';

const route = useRoute();
const userStore = useUserStore();
const { canReadWriteSchema } = storeToRefs(userStore);
const currentNode = ref((route.query.databse as string) || 'root');
// const currentNode = ref('root');
const currentNodeType = ref('DATABASE');

function handleChangeNode(path: string, type: string) {
  currentNode.value = path;
  currentNodeType.value = type;
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
