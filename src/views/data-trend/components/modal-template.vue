<template>
  <el-dialog :title="source === 'trend' ? t('dataTrend.saveTrend') : t('spectrum.saveSpectrum')" v-model="dialogVisible" width="480px" align-center>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="left" @submit.prevent>
      <base-form-item :label="`${t('search.name')}：`" prop="name">
        <el-input v-model="formData.name" :placeholder="t('common.placeHolder')" maxlength="25" show-word-limit :id="`${source}-template-modal-name`" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" :id="`${source}-template-modal-cancel`">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" :id="`${source}-template-modal-confirm`">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import dayjs from 'dayjs';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    saveLoading: boolean;
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

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const formRules = reactive({
  name: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || !value.trim()) {
          return callback(new Error(t('search.nameRuleTip')));
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

const formData = reactive<{
  name: string;
}>({
  name: '',
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
      formData.name =
        props.source === 'trend'
          ? t('dataTrend.trendTemplate', {
              time: dayjs().format('YYYYMMDDHHmmss'),
            })
          : t('spectrum.spectrumTemplate', {
              time: dayjs().format('YYYYMMDDHHmmss'),
            });
    }
  }
);
</script>
