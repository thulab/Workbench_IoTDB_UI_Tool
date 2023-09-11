<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建用户"
    width="490px"
    align-center
    :close-on-click-modal="false"
    id="auth-user-modal"
  >
    <el-form label-width="90px" ref="formRef" :rules="rules" :model="formData" label-position="left">
      <label><input type="password" autocomplete="new-password" hidden></label>
      <base-form-item label="用户名：" prop="userName" :error="errorName">
        <el-input v-model.trim="formData.userName" maxlength="32" placeholder="请输入用户名" show-word-limit id="auth-user-modal-name" />
      </base-form-item>
      <base-form-item label="输入密码：" prop="password" required>
        <el-input v-model="formData.password" maxlength="32" autocomplete="off" placeholder="请输入密码" show-password id="auth-user-modal-pwd" />
      </base-form-item>
      <base-form-item label="确认密码：" prop="confirmPassword" required>
        <el-input v-model="formData.confirmPassword" maxlength="32" autocomplete="off" placeholder="请再次输入密码" show-password id="auth-user-modal-pwd-again" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="auth-user-modal-cancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm" id="auth-user-modal-confirm">确定</el-button>
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
  visible: boolean,
  userList: Auth.DBUser[],
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean],
  'handleSave':[],
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const errorName = ref('');

const formData = reactive({
  userName: '',
  password: '',
  confirmPassword: '',
});

const rules = reactive<FormRules>({
  userName: [
    {
      required: true,
      message: '请输入相应内容后进行操作',
      trigger: 'blur',
    },
    {
      min: 4,
      max: 32,
      message: '字符长度不小于4，请重新输入',
      trigger: 'blur',
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: '格式不符，请输入大小写字母、数字、特殊字符（!@#$%^&*()_+-=）',
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: '请输入相应内容后进行操作',
      trigger: 'blur',
    },
    {
      min: 4,
      max: 32,
      message: '字符长度不小于4，请重新输入',
      trigger: 'blur',
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: '格式不符，请输入大小写字母、数字、特殊字符（!@#$%^&*()_+-=）',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value === '') {
          callback(new Error('请输入相应内容后进行操作'));
        } else if (value !== formData.password) {
          callback(new Error('密码不一致，请重新输入'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});
const { requestFn: addUser, loading } = useRequest(AuthApi.addUser);

const handleConfirm = () => {
  errorName.value = '';
  formRef.value?.validate((valid) => {
    if (valid) {
      addUser(formData.userName, formData.password).then(() => {
        ElMessage.success('新建用户成功');
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
