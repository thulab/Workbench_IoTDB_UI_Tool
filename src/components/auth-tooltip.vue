<template>
  <el-tooltip
    placement="top-start"
    effect="light"
    trigger="hover"
    content="暂无权限"
    :disabled="isDisabled"
    popper-class="tooltip-box-width"
  >
    <slot></slot>
  </el-tooltip>
</template>

<script setup lang="ts">
defineProps<{
  isDisabled: boolean;
}>();

</script>
