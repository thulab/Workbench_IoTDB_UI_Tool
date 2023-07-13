<template>
  <div class="login-wrapper">
    <div class="login-side-img">
      <img src="@/assets/login-bg.png" alt="">
    </div>
    <div class="login-form-wrapper">
      <div class="login-form-container">
        <div class="login-logo-box">
          <i-custom-logo-timecho class="timecho-logo" />
          <i-custom-logo-title class="title-logo" />
        </div>
        <h5 class="login-title">账号密码登录</h5>
        <el-form :hide-required-asterisk="true" :model="loginForm" :rules="rules" ref="formRef" class="login-form-box">
          <label><input type="password" autocomplete="new-password" hidden></label>
          <el-form-item prop="user">
            <el-input
              v-model="loginForm.user"
              autocomplete="off"
              placeholder="请输入账号"
              maxlength="32"
              @keyup.enter="submitForm"
            >
              <template #prefix>
                <el-icon size="30"><i-custom-user-name /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              :type="pwdType"
              v-model="loginForm.password"
              show-password
              autocomplete="off"
              placeholder="请输入密码"
              @keyup.enter="submitForm"
            >
              <template #prefix>
                <el-icon size="30"><i-custom-password /></el-icon>
              </template>
              <!-- <template #suffix>
                <el-icon size="30" @click="handleChangePwdType">
                  <i-custom-password-hide v-if="pwdType === 'password'" />
                  <i-custom-password-show v-else />
                </el-icon>
              </template> -->
            </el-input>
          </el-form-item>
          <el-form-item class="m-b-0">
            <el-button class="login-button" type="primary" :loading="loading" @click="submitForm">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
      <p class="right-text">copyrightⒸ Timecho</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { UserApi } from '@/api';
import { useUserStore } from '@/stores';

const router = useRouter();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loginForm = reactive({
  user: '',
  password: '',
});
const pwdType = ref('password');
const loading = ref(false);

const { requestFn: login } = useRequest(UserApi.login);

const validateuser = (rule: any, value: any, callback: any) => {
  if (value === '') {
    return callback(new Error('用户名不能为空'));
  }
  if (value.length < 3) {
    return callback(new Error('用户名必须大于等于4位'));
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleChangePwdType() {
  if (pwdType.value === 'password') {
    pwdType.value = 'text';
  } else {
    pwdType.value = 'password';
  }
  formRef.value?.clearValidate('password');
}

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true;
      login(loginForm.user, loginForm.password).then(() => {
        userStore.setUser(loginForm.user);
        router.push({ path: '/' });
        sessionStorage.setItem('nologin', '0');
      }).catch(() => {
        loading.value = false;
      });
    }
  });
};

onMounted(() => {
  userStore.setUser('');
});

onUnmounted(() => {
  loading.value = false;
});

</script>

<style lang="scss" scoped>
.login-wrapper{
  background-color: #495AD4;
  height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  min-width: 1300px;
  min-height: 640px;
}

.login-side-img {
  flex: 0 0 60%;
  display: flex;
  justify-content: center;

  img {
    width: 564px;
  }
}

.login-form-wrapper{
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  position: relative;
}

.login-form-container{
  width: 480px;
  height: 540px;
  border-radius: 6px;
  background: #FFF;
  padding: 40px 60px;
  box-sizing: border-box;
}

.login-logo-box{
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 30px 0 76px;

  .timecho-logo{
    width: 37px;
    height: 30px;
    margin-right: 20px;
  }

  .title-logo{
    width: 137px;
    height: 26px;
  }
}

.login-title{
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  color: #495AD4;
  text-align: center;
  padding: 0 0 2px;
  position: relative;

  &::after{
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 120px;
    height: 2px;
    transform: translateX(-50%);
    border-radius: 2px 2px 0 0;
    background: #495AD4;
    content: '';
    display: block;
  }
}

.login-form-box{
  margin: 36px 0 0;

  :deep(.el-form-item--default) {
    margin-bottom: 36px;
  }

  :deep(.el-input) {
    height: 36px !important;
  }
}

.login-button{
  width: 100%;
  margin-top: 84px;
  border-radius: 4px;
  height: 36px !important;
  font-size: 14px !important;
}

.right-text{
  position: absolute;
  bottom: 32px;
  left: 183px;
  font-size: 12px;
  font-weight: 300;
  line-height: 18px;
  color: #fff;
}
</style>
