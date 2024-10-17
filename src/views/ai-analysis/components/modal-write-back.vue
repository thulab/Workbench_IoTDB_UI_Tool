<template>
  <el-dialog :title="t('aiAnalysis.writeBack')" v-model="dialogVisible" width="480px" align-center>
    <el-form ref="formRef" :model="formData" :rules="formRules" :label-width="locale === 'en' ? '104px' : '110px'" label-position="right">
      <base-form-item :label="`${t('aiAnalysis.sourceName')}：`" prop="oldName" class="type-input-disabled el-form-item-not-mandatory">
        <el-input v-model="formData.oldName" disabled :id="`write-back-modal-old`" />
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.newName')}：`" prop="name">
        <el-input v-model="formData.name" :placeholder="t('common.placeHolder')" show-word-limit :id="`write-back-modal-name`" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" :id="`write-back-modal-cancel`">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" :id="`write-back-modal-confirm`">{{ t('common.confirm') }}</el-button>
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
    oldName: string;
    nameList: string[];
  }>(),
  {}
);

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', payload: string): void;
}>();

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const formData = reactive<{
  oldName: string;
  name: string;
}>({
  oldName: '',
  name: '',
});
const formRules = reactive({
  name: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || !value.trim()) {
          return callback(new Error(t('search.newNameTip')));
        }
        if (value === formData.oldName) {
          return callback(new Error(t('search.nameRepeatTip')));
        }
        // if (value && props.nameList.some((item) => item === value)) {
        //   return callback(new Error(t('search.templateNameRepeatTip')));
        // }
        return callback();
      },
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
      emit('handleSave', formData.name);
    }
  });
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.oldName = props.oldName;
    }
  }
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
</style>
