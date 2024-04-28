<template>
  <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t(content)" :disabled="isDisabled" popper-class="tooltip-box-width">
    <slot></slot>
  </el-tooltip>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isDisabled: boolean;
    content?: string;
  }>(),
  {
    content: 'common.noAuth',
  }
);

const { t } = useI18n();
</script>
