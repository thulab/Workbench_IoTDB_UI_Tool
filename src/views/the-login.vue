<template>
  <div class="login-wrapper">
    <el-form :hide-required-asterisk="true" :model="loginForm" :rules="rules" ref="formRef">
      <el-form-item prop="user">
        <el-input
          v-model="loginForm.user"
          autocomplete="off"
          placeholder="请输入账号">
          <template #prefix>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          type="password"
          minlength="4"
          maxlength="48"
          v-model="loginForm.password"
          autocomplete="off"
          placeholder="请输入密码"
        >
          <template #prefix>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submitForm">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { UserApi } from '@/api';

const router = useRouter();
const formRef = ref<FormInstance>();
const loginForm = reactive({
  user: '',
  password: '',
});

const { requestFn: login, loading } = useRequest(UserApi.login);

const validateuser = (rule: any, value: any, callback: any) => {
  if (value === '') {
    return callback(new Error('账号不能为空'));
  }
  if (value.length < 3 || value.length > 32) {
    return callback(new Error('用户名必须大于等于4个字符，小于等于32字符'));
  }
  return callback();
};

const validatepassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    return callback(new Error('密码不能为空'));
  }
  if (value.length < 3) {
    return callback(new Error('密码必须大于等于4位'));
  }
  return callback();
};

const rules = reactive<FormRules>({
  user: [
    {
      required: true,
      validator: validateuser,
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      validator: validatepassword,
      trigger: 'blur',
    },
  ],
});

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      login(loginForm.user, loginForm.password).then(() => {
        router.push({ path: '/' });
      });
    }
  });
};

</script>
