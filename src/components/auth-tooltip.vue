<template>
  <el-tooltip
    placement="top-start"
    effect="light"
    trigger="hover"
    :content="t('common.noAuth')"
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

const { t } = useI18n();
</script>
