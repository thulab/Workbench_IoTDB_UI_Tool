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
  height: 30px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);

  .right {
    position: absolute;
    color: #ccc;
    right: 10px;
  }
}
</style>
