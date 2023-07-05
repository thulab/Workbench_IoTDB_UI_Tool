<template>
  <el-dialog
    title="表达式"
    v-model="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-scrollbar :max-height="300">
      <div class="expression-text">{{ content }}</div>
    </el-scrollbar>
  </el-dialog>
</template>

<script lang="ts" setup>
const props = defineProps<{
  visible: boolean;
  content: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
</script>
