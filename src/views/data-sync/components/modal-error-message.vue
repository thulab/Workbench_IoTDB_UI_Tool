<template>
  <el-dialog
    title="报错详情"
    v-model="dialogVisible"
    width="480px"
    align-center
    :close-on-click-modal="false"
    id="error-message-modal"
  >
    <div class="error-message-box">
      <el-icon size="16"><i-custom-error /></el-icon>
      <el-scrollbar :height="100" ref="scrollRef">
        <div class="expression-text">{{ content }}</div>
      </el-scrollbar>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="error-message-modal-cancel">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false" id="error-message-modal-confirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { ElScrollbar } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  content: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const scrollRef = ref<InstanceType<typeof ElScrollbar> | null>(null);

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (scrollRef.value) {
        scrollRef.value.setScrollTop(0);
      }
    }
  },
);
</script>

<style lang="scss" scoped>

.error-message-box{
  display: flex;
}

.expression-text{
  padding: 0 12px;

  // white-space: pre-line;
  font-size: 14px;
  line-height: 21px;
  font-weight: 300;
  color: #424561;
  word-break: break-all;
  word-wrap: break-word;
}
</style>
