<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="480px"
    align-center
    :close-on-click-modal="false">
    <el-form label-width="100px" ref="formRef" :rules="rules" :model="formData" label-position="left">
      <label><input type="password" autocomplete="new-password" hidden></label>
      <base-form-item label="用户名：">
        <el-text>{{ userName }}</el-text>
      </base-form-item>
      <base-form-item label="输入密码：" prop="password" required>
        <el-input v-model="formData.password" maxlength="32" autocomplete="off" placeholder="请输入密码" show-password />
      </base-form-item>
      <base-form-item label="确认密码：" prop="confirmPassword" required>
        <el-input v-model="formData.confirmPassword" maxlength="32" autocomplete="off" placeholder="请再次输入密码" show-password />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">确定</el-button>
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

const formData = reactive({
  password: '',
  confirmPassword: '',
});

const rules = reactive<FormRules>({
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
      pattern: /^[A-Za-z][A-Za-z0-9_]+$/,
      message: '请以字母开头，只能包含字母、数字和下划线',
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
const { requestFn: updateUser, loading } = useRequest(AuthApi.updateUser);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      updateUser(props.userName, formData.password).then(() => {
        ElMessage.success(`${props.title}成功`);
        dialogVisible.value = false;
        if (userStore.userInfo.name === props.userName) {
          ElMessageBox.confirm('密码已修改，请重新登录', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }).then(() => {
            UserApi.logout();
            window.location.href = `/login?timestamp=${new Date().getTime()}`;
          });
        }
        emit('handleSave');
      });
    } else {
      ElMessage.error('存在必填项未编辑或必填项输入规则有误');
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
    }
  },
);
</script>
