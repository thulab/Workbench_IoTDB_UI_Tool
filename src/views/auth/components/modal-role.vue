<template>
  <el-dialog
    :title="t('auth.addRole')"
    v-model="dialogVisible"
    width="490px"
    align-center
    :close-on-click-modal="false"
    id="auth-role-modal"
  >
    <el-form ref="formRef" :model="formData" class="m-t-14 m-b-34" @submit.prevent>
      <base-form-item :label="`${t('auth.roleName')}：`" prop="name" :rules="requiredRules" :error="errorName">
        <el-input v-model.trim="formData.name" :placeholder="t('auth.roleNamePlaceholder')" maxlength="32" show-word-limit id="auth-role-modal-name" />
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="auth-role-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm" id="auth-role-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { AuthApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  list: string[];
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const errorName = ref('');

const formRef = ref<FormInstance>();
const formData = reactive({
  name: '',
});

const requiredRules = ref([
  {
    required: true,
    message: t('common.formRuleEmpty'),
    trigger: 'blur',
  },
  {
    min: 4,
    max: 32,
    message: t('auth.roleNameLength'),
    trigger: 'blur',
  },
  {
    pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
    message: t('auth.roleNameExg'),
    trigger: 'blur',
  },
  {
    validator: (rule: any, value: any, callback: any) => {
      if (value && props.list.some((item) => item === value)) {
        callback(new Error(t('auth.roleExist')));
      } else {
        callback();
      }
    },
    trigger: 'blur',
  },
]);

const { requestFn: saveRole, loading } = useRequest(AuthApi.saveRole);

const handleConfirm = () => {
  errorName.value = '';
  formRef.value?.validate((valid) => {
    if (valid) {
      saveRole(formData.name).then(() => {
        ElMessage.success(t('common.createSuccess'));
        dialogVisible.value = false;
        emit('handleSave');
      }).catch((err) => {
        if (err.code === 1360) {
          errorName.value = err.message;
        }
      });
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      errorName.value = '';
      formRef.value?.resetFields();
    }
  },
);

</script>
