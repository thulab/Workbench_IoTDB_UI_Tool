<template>
  <sql-search-table v-if="connectionStore.isTableModel" />
  <sql-search-tree v-else />
</template>

<script lang="ts" setup>
import { useConnectionStore } from '@/stores';
import SqlSearchTable from './components/sql-search-table.vue';
import SqlSearchTree from './components/sql-search-tree.vue';

const connectionStore = useConnectionStore();
</script>
