<template>
  <el-dialog :title="t('search.rename')" v-model="dialogVisible" width="480px" align-center>
    <el-form ref="formRef" :model="formData" :rules="formRules" :label-width="locale === 'en' ? '104px' : '80px'" label-position="left">
      <base-form-item :label="`${t('search.oldName')}：`" prop="oldName" class="type-input-disabled el-form-item-not-mandatory">
        <el-input v-model="formData.oldName" disabled :id="`${source}-template-rename-modal-old`" />
      </base-form-item>
      <base-form-item :label="`${t('search.newName')}：`" prop="name">
        <el-input v-model="formData.name" :placeholder="t('common.placeHolder')" maxlength="25" show-word-limit :id="`${source}-template-rename-modal-name`" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" :id="`${source}-template-rename-modal-cancel`">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" :id="`${source}-template-rename-modal-confirm`">{{ t('common.confirm') }}</el-button>
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
    source?: string;
  }>(),
  {
    source: 'trend',
  }
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
