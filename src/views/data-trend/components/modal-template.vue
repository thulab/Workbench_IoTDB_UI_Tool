<template>
  <el-dialog :title="t('search.saveTemplate')" v-model="dialogVisible" width="480px" align-center>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="left" @submit.prevent>
      <base-form-item :label="`${t('search.name')}：`" prop="name">
        <el-input v-model="formData.name" :placeholder="t('common.placeHolder')" maxlength="25" show-word-limit id="trend-template-modal-name" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" id="trend-template-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" id="trend-template-modal-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', payload: Trend.LineObj): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const formRules = reactive({
  name: [{ required: true, message: () => t('search.nameRuleTip'), trigger: 'blur' }],
});
const formData = reactive<{
  name: string;
  id?: string;
}>({
  name: '',
  id: '',
});
const saveLoading = ref(false);

function handleCancel() {
  dialogVisible.value = false;
}

function handleConfirm() {
  formRef.value?.validate((valid) => {
    if (valid) {
      // TODO 保存的内容为用户输入的搜索条件、测点名称、趋势图及其操作
      saveLoading.value = true;
      saveLoading.value = false;
      dialogVisible.value = false;
    }
  });
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      saveLoading.value = false;
    }
  }
);
</script>
