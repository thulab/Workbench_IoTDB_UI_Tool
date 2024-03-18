<template>
  <el-dialog :title="t('calculate.expression')" v-model="dialogVisible" width="480px" align-center :close-on-click-modal="false" id="calculate-modal-expression">
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

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
</script>

<style lang="scss" scoped>
.expression-text {
  // white-space: pre-line;
  font-size: 14px;
  line-height: 21px;
  font-weight: 300;
  color: #131926;
  padding: 12px 0;
}
</style>
