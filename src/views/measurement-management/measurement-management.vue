<template>
  <div class="database-page-container">
    <div class="database-list-wrapper">
      <side-tree />
    </div>

    <div class="database-details-wrapper">
      <database-detail :current-database="currentNode" />
      <!-- <measurement-detail :current-measurement="currentNode" /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import SideTree from './components/side-tree.vue';
import DatabaseDetail from './components/database-detail.vue';
// import MeasurementDetail from './components/measurement-detail.vue';

const currentNode = ref('root');
// const currentNode = ref('root.stock.Legacy.0700HK.L1_BidPrice');
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
