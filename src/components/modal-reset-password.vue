<template>
  <el-dialog
    v-model="dialogVisible"
    title="重置密码"
    width="480px"
    :close-on-click-modal="false">
    <el-form label-width="100px" ref="formRef" :model="formData">
      <label><input type="password" autocomplete="new-password" hidden></label>
      <base-form-item label="用户名">
        <el-text>{{ userName }}</el-text>
      </base-form-item>
      <base-form-item label="密码" prop="password" required>
        <el-input v-model="formData.password" maxlength="48" autocomplete="off" placeholder="请输入密码" show-password />
      </base-form-item>
      <base-form-item label="确认密码" prop="confirmPassword" required>
        <el-input v-model="formData.confirmPassword" maxlength="48" autocomplete="off" placeholder="请再次输入密码" />
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
import type { FormInstance } from 'element-plus';
import { AuthApi } from '@/api';

defineOptions({ name: 'ModalResetPassword' });
const formRef = ref<FormInstance>();

const props = defineProps<{
  visible: boolean,
  userName: string,
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean]
}>();

const dialogVisible = useVModel(props, 'visible', emit);

const formData = reactive({
  password: '',
  confirmPassword: '',
});

const { requestFn: resetPassword, loading } = useRequest(AuthApi.resetPassword);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      resetPassword(formData.password, formData.confirmPassword).then(() => {
        ElMessage.success('重置密码成功');
        dialogVisible.value = false;
        emit('update:visible', false);
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
