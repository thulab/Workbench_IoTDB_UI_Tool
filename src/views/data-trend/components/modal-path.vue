<template>
  <el-dialog :title="t('measurement.addMeasurement')" v-model="dialogVisible" width="480px" align-center :close-on-click-modal="false" id="trend-modal-path">
    <el-form ref="formRef" :model="formData">
      <base-form-item prop="path" :rules="requiredRules">
        <template #label>
          {{ t('measurement.measurementName') }}：
          <el-tooltip effect="light" :content="t('common.searchAllTipLimit100')" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
        </template>
        <timeseries-select-single
          id="trend-modal-select-path"
          ref="timeseriesSelectSingleRef"
          v-model="formData.path"
          :selectWidth="locale === 'en' ? 280 : 350"
          :itemWidth="locale === 'en' ? 250 : 320"
          class="path-select"
          :key="dialogKey"
          :disabled-path="(item) => item.dataType === 'TEXT' || pathList.includes(item.timeseries)"
        />
      </base-form-item>
      <div class="chart-detail-box">
        <base-form-item :label="`${t('common.color')}：`" prop="color" :rules="requiredRules">
          <el-color-picker v-model="formData.color" color-format="hex" :predefine="predefineColors" id="trend-modal-color" />
        </base-form-item>
        <base-form-item class="chart-width-box" :label="`${t('common.lineWidth')}：`" prop="width" :rules="requiredNumberRules">
          <el-input-number v-model.number="formData.width" :min="1" :max="10" step-strictly controls-position="right" style="width: 40px" id="trend-modal-input" />
        </base-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="trend-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm" id="trend-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  pathList: string[];
  predefineColors: string[];
  defaultColor: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', payload: Trend.LineObj): void;
}>();

const dialogKey = ref(0);
const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const formData = reactive<Trend.LineObj>({
  path: '',
  color: '',
  width: 2,
});
const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: ['blur', 'change'],
  },
]);
const checkNumber = (rule: any, value: any, callback: any) => {
  if (!value && value !== 0) {
    formData.width = 2;
    return callback();
  }
  if (!/^[1-9]\d*$/.test(`${value}`)) {
    return callback(new Error(t('dataTrend.number10Tip')));
  }
  if (value < 1 || value > 10) {
    return callback(new Error(t('dataTrend.number10Tip')));
  }
  return callback();
};
const requiredNumberRules = ref([
  {
    required: true,
    validator: checkNumber,
    trigger: ['blur'],
  },
]);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      dialogVisible.value = false;
      emit('handleSave', formData);
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.width = 2;
      formData.color = props.defaultColor;
      dialogKey.value++;
    }
  }
);
</script>

<style lang="scss" scoped>
.chart-detail-box {
  display: flex;
  margin-top: 24px;

  .chart-width-box {
    margin-left: 36px;
  }
}

.path-select {
  :deep(.el-input__suffix) {
    background-color: transparent;
  }
}
</style>
