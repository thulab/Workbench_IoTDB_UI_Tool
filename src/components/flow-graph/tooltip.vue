<template>
  <el-tooltip
    placement="top-start"
    effect="light"
    trigger="hover"
    :content="content"
    popper-class="tooltip-box-width"
    :visible="visible"
  >
    <slot></slot>
  </el-tooltip>
</template>

<script setup lang="ts">
defineProps<{
  content?: string;
  visible?: boolean;
}>();
</script>

<script lang="ts">
export default defineComponent({
  name: 'Tooltip',
});
</script>
