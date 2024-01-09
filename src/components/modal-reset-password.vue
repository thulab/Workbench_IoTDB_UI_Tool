<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="490px"
    align-center
    :close-on-click-modal="false"
    id="modal-reset-pwd"
  >
    <el-form label-width="90px" ref="formRef" :rules="rules" :model="formData" label-position="left" :key="formKey">
      <label><input type="password" autocomplete="new-password" hidden></label>
      <base-form-item label="用户名：" required>
        <el-text>{{ userName }}</el-text>
      </base-form-item>
      <base-form-item label="原始密码：" prop="rawPassword">
        <el-input v-model="formData.rawPassword" maxlength="32" autocomplete="off" placeholder="请输入原始密码" show-password id="modal-reset-pwd-input-raw-pwd" />
      </base-form-item>
      <base-form-item label="输入密码：" prop="password">
        <el-input v-model="formData.password" maxlength="32" autocomplete="off" placeholder="请输入密码" show-password id="modal-reset-pwd-input-pwd" />
      </base-form-item>
      <base-form-item label="确认密码：" prop="confirmPassword">
        <el-input v-model="formData.confirmPassword" maxlength="32" autocomplete="off" placeholder="请再次输入密码" show-password id="modal-reset-pwd-input-pwd-again" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="modal-reset-pwd-cancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm" id="modal-reset-pwd-confirm">确定</el-button>
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
  visible: boolean,
  userName: string,
  title: string,
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean],
  'handleSave':[],
}>();

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
      message: '请输入相应内容后进行操作',
      trigger: ['blur', 'change'],
    },
    {
      min: 4,
      max: 32,
      message: '字符长度不小于4，请重新输入',
      trigger: ['blur', 'change'],
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: '格式不符，请输入大小写字母、数字、特殊字符（!@#$%^&*()_+-=）',
      trigger: ['blur', 'change'],
    },
  ],
  password: [
    {
      required: true,
      message: '请输入相应内容后进行操作',
      trigger: ['blur', 'change'],
    },
    {
      min: 4,
      max: 32,
      message: '字符长度不小于4，请重新输入',
      trigger: ['blur', 'change'],
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: '格式不符，请输入大小写字母、数字、特殊字符（!@#$%^&*()_+-=）',
      trigger: ['blur', 'change'],
    },
  ],
  confirmPassword: [
    {
      required: true,
      message: '请输入相应内容后进行操作',
      trigger: ['blur', 'change'],
    },
    {
      min: 4,
      max: 32,
      message: '字符长度不小于4，请重新输入',
      trigger: ['blur', 'change'],
    },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
      message: '格式不符，请输入大小写字母、数字、特殊字符（!@#$%^&*()_+-=）',
      trigger: ['blur', 'change'],
    },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value !== formData.password) {
          callback(new Error('密码不一致，请重新输入'));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change'],
    },
  ],
});
const { requestFn: updateUser, loading } = useRequest(AuthApi.updateUser);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      updateUser(props.userName, formData.rawPassword, formData.password).then(() => {
        ElMessage.success(`${props.title}成功`);
        dialogVisible.value = false;
        if (userStore.userInfo.name === props.userName) {
          ElMessageBox.alert('密码已修改，请重新登录', '提示', {
            confirmButtonText: '确定',
            confirmButtonClass: 'reset-password-confirm',
            type: 'warning',
            showClose: false,
          }).finally(() => {
            UserApi.logout();
            window.location.href = `/login?timestamp=${new Date().getTime()}`;
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
