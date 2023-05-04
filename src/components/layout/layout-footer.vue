<template>
  <div class="footer flex-center">
    © Timecho
    <div class="right">Build: {{ AppBuildCommit }}</div>
  </div>
</template>

<script setup lang="ts">
import useAppStore from '@/stores/app';

const { AppBuildCommit } = useAppStore();
</script>

<style scoped lang="scss">
.footer {
  height: 0;
  overflow: hidden;
  font-size: 12px;
  background: var(--el-bg-color);
  border-top: 0;

  .right {
    position: absolute;
    color: #ccc;
    right: 10px;
    bottom: 0;
  }
}
</style>
