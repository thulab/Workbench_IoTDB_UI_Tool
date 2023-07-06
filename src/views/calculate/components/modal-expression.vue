<template>
  <el-dialog
    title="表达式"
    v-model="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-scrollbar :max-height="300">
      <pre class="expression-text">{{ content }}</pre>
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

<style lang="scss" scoped>
.expression-text{
  // white-space: pre-line;
  font-size: 14px;
  line-height: 21px;
  font-weight: 300;
  color: #131926;
  padding: 12px 0;
}
</style>
