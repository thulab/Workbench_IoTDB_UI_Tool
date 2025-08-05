<template>
  <el-dialog v-model="dialogVisible" :title="title" :width="locale === 'en' ? '540px' : '480px'" align-center :close-on-click-modal="false" id="modal-reset-pwd">
    <el-form :label-width="locale === 'en' ? '148px' : '90px'" ref="formRef" :rules="rules" :model="formData" label-position="left" :key="formKey">
      <label><input type="password" autocomplete="new-password" hidden /></label>
      <base-form-item :label="`${t('auth.userName')}：`" required>
        <el-text>{{ userName }}</el-text>
      </base-form-item>
      <base-form-item :label="`${t('auth.oldPwd')}：`" prop="rawPassword">
        <el-input v-model="formData.rawPassword" maxlength="32" autocomplete="off" :placeholder="t('auth.oldPwdTip')" show-password id="modal-reset-pwd-input-raw-pwd" />
      </base-form-item>
      <base-form-item :label="`${t('auth.inputPwd')}：`" prop="password">
        <el-input v-model="formData.password" maxlength="32" autocomplete="off" :placeholder="t('auth.pwdPlaceholder')" show-password id="modal-reset-pwd-input-pwd" />
      </base-form-item>
      <base-form-item :label="`${t('auth.confirmPwd')}：`" prop="confirmPassword">
        <el-input v-model="formData.confirmPassword" maxlength="32" autocomplete="off" :placeholder="t('auth.confirmPwdAgain')" show-password id="modal-reset-pwd-input-pwd-again" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="modal-reset-pwd-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm" id="modal-reset-pwd-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { AuthApi, UserApi } from '@/api';
import { useUserStore } from '@/stores';

defineOptions({ name: 'ModalResetPassword' });
const formRef = ref<FormInstance>();

const props = defineProps<{
  visible: boolean;
  userName: string;
  title: string;
  successTip: string;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  handleSave: [];
}>();

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const userStore = useUserStore();
const formKey = ref(0);

const formData = reactive({
  rawPassword: '',
  password: '',
  confirmPassword: '',
});

const rules = reactive<FormRules>({
  rawPassword: [
    {
      required: true,
      message: () => t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
    {
      min: 4,
      max: 32,
      message: () => t('auth.pwdLength'),
      trigger: 'blur',
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: () => t('auth.oldPwdReg'),
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: () => t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
    {
      min: 4,
      max: 32,
      message: () => t('auth.pwdLength'),
      trigger: 'blur',
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: () => t('auth.oldPwdReg'),
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    {
      required: true,
      message: () => t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
    {
      min: 4,
      max: 32,
      message: () => t('auth.pwdLength'),
      trigger: 'blur',
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: () => t('auth.oldPwdReg'),
      trigger: 'blur',
    },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.password) {
          callback(new Error(t('auth.pwdUnSame')));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});
const { requestFn: updateUser, loading } = useRequest(AuthApi.updateUser);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      updateUser(props.userName, formData.rawPassword, formData.password).then(() => {
        ElMessage.success({ message: `${props.successTip}`, grouping: true });
        dialogVisible.value = false;
        if (userStore.userInfo.name === props.userName) {
          ElMessageBox.alert(t('login.resetPwdLogin'), t('common.tip'), {
            confirmButtonText: t('common.confirm'),
            customClass: 'reset-password-message-box',
            confirmButtonClass: 'reset-password-confirm',
            type: 'warning',
            showClose: false,
          }).finally(() => {
            UserApi.logout();
            window.location.href = `/view/login?timestamp=${new Date().getTime()}`;
          });
        }
        emit('handleSave');
      });
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formKey.value++;
    }
  },
);
</script>
