<template>
  <div class="measurement-tree-wrapper">
    <div class="search-refresh-box">
      <el-input :placeholder="t('measurement.searchPlaceholder')" v-model="searchText" id="measurement-tree-input" @keyup.enter="handleSearch" class="measurement-tree-search-input" />

      <el-button link @click="handleRefresh" id="measurement-tree-refresh" class="svg-button-hover-color m-l-16">
        <i-custom-border-refresh style="width: 24px; height: 24px" />
      </el-button>
    </div>

    <div class="measurement-tree-box"></div>

    <modal-database v-model:visible="databaseVisible" @handleSave="handleSaveDatabase" />
  </div>
</template>

<script setup lang="ts">
import ModalDatabase from './modal-database.vue';

const { t } = useI18n();
const searchText = ref('');
const databaseVisible = ref(false);

function handleSearch() {}

function handleRefresh() {}

function handleSaveDatabase() {}
</script>
<style lang="scss" scoped>
.measurement-tree-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.search-refresh-box {
  padding: 16px;
  display: flex;
  align-items: center;
}

.measurement-tree-box {
  flex: 1;
  overflow: auto;
}
</style>
