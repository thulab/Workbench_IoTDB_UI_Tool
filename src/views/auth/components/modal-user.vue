<template>
  <el-dialog v-model="dialogVisible" :title="t('auth.addUser')" width="480px" align-center :close-on-click-modal="false" id="auth-user-modal">
    <el-form :label-width="locale === 'en' ? '150px' : '90px'" ref="formRef" :rules="rules" :model="formData" label-position="left" :key="formKey">
      <label><input type="password" autocomplete="new-password" hidden /></label>
      <base-form-item :label="`${t('auth.userName')}：`" prop="userName" :error="errorName">
        <el-input v-model.trim="formData.userName" maxlength="32" :placeholder="t('auth.userNamePlaceholder')" show-word-limit id="auth-user-modal-name" />
      </base-form-item>
      <base-form-item :label="`${t('auth.pwd')}：`" prop="password" required>
        <el-input v-model="formData.password" type="password" maxlength="32" autocomplete="off" :placeholder="t('auth.pwdPlaceholder')" show-password id="auth-user-modal-pwd" />
      </base-form-item>
      <base-form-item :label="`${t('auth.confirmPwd')}：`" prop="confirmPassword" required>
        <el-input v-model="formData.confirmPassword" type="password" maxlength="32" autocomplete="off" :placeholder="t('auth.confirmPwdAgain')" show-password id="auth-user-modal-pwd-again" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="auth-user-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm" id="auth-user-modal-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { AuthApi } from '@/api';

defineOptions({ name: 'ModalResetPassword' });
const formRef = ref<FormInstance>();

const props = defineProps<{
  visible: boolean;
  userList: Auth.DBUser[];
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  handleSave: [payload: string];
}>();

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const errorName = ref('');
const formKey = ref(0);

const formData = reactive({
  userName: '',
  password: '',
  confirmPassword: '',
});

const rules = reactive<FormRules>({
  userName: [
    {
      required: true,
      message: () => t('common.formRuleEmptyOperateShort'),
      trigger: ['blur', 'change'],
    },
    {
      min: 4,
      max: 32,
      message: () => t('auth.userNameLength'),
      trigger: ['blur', 'change'],
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: () => t('auth.userNameExg'),
      trigger: ['blur', 'change'],
    },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value && props.userList.some((item) => item.name === value)) {
          callback(new Error(t('auth.userExist')));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change'],
    },
  ],
  password: [
    {
      required: true,
      message: () => t('common.formRuleEmptyOperateShort'),
      trigger: ['blur', 'change'],
    },
    {
      min: 4,
      max: 32,
      message: () => t('auth.pwdLength'),
      trigger: ['blur', 'change'],
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: () => t('auth.pwdExg'),
      trigger: ['blur', 'change'],
    },
  ],
  confirmPassword: [
    {
      required: true,
      message: () => t('common.formRuleEmptyOperateShort'),
      trigger: ['blur', 'change'],
    },
    {
      min: 4,
      max: 32,
      message: () => t('auth.pwdLength'),
      trigger: ['blur', 'change'],
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: () => t('auth.pwdExg'),
      trigger: ['blur', 'change'],
    },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value !== formData.password) {
          callback(new Error(t('auth.pwdUnSame')));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change'],
    },
  ],
});
const { requestFn: addUser, loading } = useRequest(AuthApi.addUser);

const handleConfirm = () => {
  errorName.value = '';
  formRef.value?.validate((valid) => {
    if (valid) {
      addUser(formData.userName, formData.password)
        .then(() => {
          ElMessage.success({ message: t('auth.userSuccess'), grouping: true });
          dialogVisible.value = false;
          emit('handleSave', formData.userName);
        })
        .catch((err) => {
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
      formKey.value++;
    }
  }
);
</script>
