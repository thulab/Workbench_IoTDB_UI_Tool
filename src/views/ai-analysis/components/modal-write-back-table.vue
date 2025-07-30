<template>
  <el-dialog :title="t('aiAnalysis.writeBack')" v-model="dialogVisible" width="480px" align-center>
    <el-form ref="formRef" :model="formData" :rules="formRules" :label-width="locale === 'en' ? '104px' : '110px'" label-position="right">
      <base-form-item :label="`${t('aiAnalysis.sourceName')}：`" prop="oldName" class="type-input-disabled el-form-item-not-mandatory">
        <el-descriptions :column="1">
          <el-descriptions-item :label="`t('aiAnalysis.writeBackSourceDatabase')：`">{{ props.database }}</el-descriptions-item>
          <el-descriptions-item :label="`t('aiAnalysis.writeBackSourceTable')：`">{{ props.table }}</el-descriptions-item>
          <el-descriptions-item :label="`t('aiAnalysis.writeBackSourceTags')：`">{{ props.tags.join(', ') }}</el-descriptions-item>
          <el-descriptions-item :label="`t('aiAnalysis.writeBackSourceMeasurement')：`">
            {{ props.fieldName }}
          </el-descriptions-item>
        </el-descriptions>
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.modelSelect')}：`" :placeholder="t('aiAnalysis.modelSelectPlaceholder')" prop="modelId">
        <el-select v-model="formData.modelId" :id="`write-back-modal-model`">
          <el-option v-for="item in props.modelIdList" :key="item" :label="item" :value="item" />
        </el-select>
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.writeBackTargetDatabase')}：`" prop="database">
        <el-input v-model="formData.database" :placeholder="t('common.placeHolder')" :id="`write-back-modal-database`" />
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.writeBackTargetTable')}：`" prop="table">
        <el-input v-model="formData.table" :placeholder="t('common.placeHolder')" :id="`write-back-modal-table`" />
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.writeBackTargetTags')}：`" prop="tags">
        <template v-for="(tag, index) in formData.tags" :key="index">
          <el-input v-model="formData.tags[index].tagName" class="w-[80px]" :placeholder="t('common.placeHolder')" :id="`write-back-modal-tags-${index}`" />
          <span class="p-[8px]">：</span>
          <el-input v-model="formData.tags[index].tagValue" :placeholder="t('common.placeHolder')" :id="`write-back-modal-tag-value-${index}`" />
        </template>
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.writeBackTargetMeasurement')}：`" prop="measurement">
        <el-input v-model="formData.fieldName" :placeholder="t('common.placeHolder')" :id="`write-back-modal-measurement`" />
      </base-form-item>
    </el-form>
    <div class="exits-tip" v-if="measurementExist">
      <el-icon color="#495AD4" class="m-l-0 m-r-8" size="18">
        <i-ep-warning-filled />
      </el-icon>
      <p class="leading-[18px]">
        {{ t('aiAnalysis.measurementExist') }}
      </p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" :id="`write-back-modal-cancel`">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" :id="`write-back-modal-confirm`">
          {{ measurementExist ? t('common.confirmAndContinue') : t('common.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    saveLoading: boolean;
    database: string;
    table: string;
    tags: string[];
    fieldName: string;
    modelIdList: string[];
    nameList: string[];
  }>(),
  {},
);

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', payload: string, modelId: string): void;
}>();

// 测点已存在
const measurementExist = ref(false);

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const formData = reactive<{
  database: string;
  table: string;
  tags: { tagName: string; tagValue: string }[];
  fieldName: string;
  modelId: string;
}>({
  database: '',
  table: '',
  tags: [],
  fieldName: '',
  modelId: '',
});
const formRules = reactive({
  database: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || !value.trim()) {
          return callback(new Error(t('search.newNameTip')));
        }
        // if (value && props.nameList.some((item) => item === value)) {
        //   return callback(new Error(t('search.templateNameRepeatTip')));
        // }
        return callback();
      },
      trigger: 'blur',
    },
  ],
  modelId: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
});

function handleCancel() {
  dialogVisible.value = false;
}

function handleConfirm() {
  formRef.value?.validate((valid) => {
    if (valid) {
      // if (measurementExist.value) {
      //   emit('handleSave', formData.name, formData.modelId);
      // } else {
      //   getMeasurement(formData.name).then((res) => {
      //     if (res.data?.measurements.length && res.data?.measurements.some((item) => item.timeseries === formData.name)) {
      //       measurementExist.value = true;
      //     } else {
      //       emit('handleSave', formData.name, formData.modelId);
      //     }
      //   });
      // }
    }
  });
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
    }
  },
);
</script>

<style lang="scss" scoped>
.type-input-disabled {
  :deep(.el-input__inner) {
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
  }
}

.exits-tip {
  padding: 8px 6px 8px 8px;
  border-radius: 2px;
  background: #f7f8fc;
  display: flex;
  flex-direction: row;
}
</style>
