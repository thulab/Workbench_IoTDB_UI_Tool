<template>
  <el-dialog
    :title="t('common.errorDetail')"
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
        <el-button @click="dialogVisible = false" id="error-message-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="dialogVisible = false" id="error-message-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElScrollbar } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  content: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const scrollRef = ref<InstanceType<typeof ElScrollbar> | null>(null);

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        if (scrollRef.value) {
          scrollRef.value.scrollTo(0, 0);
        }
      });
    }
  },
  {
    immediate: true,
  },
);
</script>

<style lang="scss" scoped>

.error-message-box{
  display: flex;
}

.expression-text{
  padding: 0 12px;
  margin-top: -3px;
  font-size: 14px;
  line-height: 21px;
  font-weight: 300;
  color: #424561;

  // word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>
