<template>
  <div class="login-wrapper">
    <div class="login-side-img">
      <img src="@/assets/login-bg.png" alt="">
    </div>
    <div class="login-form-wrapper">
      <div class="login-form-container">
        <div class="login-logo-box">
          <i-custom-timecho-logo class="title-logo" />
          <!-- <i-custom-logo-title class="title-logo" /> -->
        </div>
        <h5 class="login-title">账号密码登录</h5>
        <el-form :hide-required-asterisk="true" :model="loginForm" :rules="rules" ref="formRef" class="login-form-box">
          <label><input type="password" autocomplete="new-password" hidden></label>
          <div class="connection-box">
            <el-form-item prop="connection" class="connection-form-item">
              <el-icon size="30" class="connection-icon"><i-custom-connection /></el-icon>
              <el-select
                v-model="loginForm.connection"
                placeholder="请选择所要连接的实例"
                id="login-connection"
                style="width: 292px;"
              >
                <el-option-group
                  v-for="group in connectionOptions"
                  :key="group.label"
                  :label="group.label"
                >
                  <el-option
                    v-for="item in group.options"
                    :key="item.id"
                    :label="`${item.name}(用户名:${item.username})`"
                    :value="item.id"
                  />
                </el-option-group>
              </el-select>
            </el-form-item>
            <el-button type="primary" class="m-l-12" @click="handleSelectConnection">编辑</el-button>
          </div>
          <el-form-item prop="user">
            <el-input
              v-model="loginForm.user"
              autocomplete="off"
              placeholder="请输入用户名"
              maxlength="32"
              @keyup.enter="submitForm"
              id="login-user"
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
              id="login-pwd"
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
          <el-form-item prop="captcha">
            <el-input
              v-model="loginForm.captcha"
              autocomplete="off"
              placeholder="请输入验证码"
              @keyup.enter="submitForm"
              id="login-captcha"
            >
              <template #prefix>
                <el-icon size="30"><i-custom-verification-code /></el-icon>
              </template>
              <template #suffix>
                <the-captcha ref="captchaRef" :height="30" :width="100" @update:code="val=>captcha = val" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item class="m-b-0">
            <el-button class="login-button" type="primary" :loading="loading" @click="submitForm" id="login-submit">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
      <p class="right-text">copyrightⒸ Timecho</p>
    </div>

    <modal-connection
      v-model:visible="connectionVisible"
    />
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { UserApi, ConnectionApi } from '@/api';
import { useUserStore, useConnectionStore } from '@/stores';
import ModalConnection from '@/components/modal-connection.vue';
import TheCaptcha from '@/components/the-captcha.vue';

const router = useRouter();
const userStore = useUserStore();
const connectionStore = useConnectionStore();
const formRef = ref<FormInstance>();
const captchaRef = ref<InstanceType<typeof TheCaptcha> | null>(null);
const loginForm = reactive<{
  connection: string | number;
  user: string;
  password: string;
  captcha: string;
}
>({
  connection: '',
  user: '',
  password: '',
  captcha: '',
});
const pwdType = ref('password');
const loading = ref(false);
const connectionVisible = ref(false);
const connectionList = ref<Connection.ConnectionItem[]>([]);
const connectionOptions = ref<Array<{ label: string, options: Array<Connection.ConnectionItem> }>>([]);

const captcha = ref('');

const { requestFn: login } = useRequest(UserApi.login);
const { requestFn: getConnectionList } = useRequest(ConnectionApi.getConnectionList);

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

const validateCaptcha = (rule: any, value: string, callback: any) => {
  if (value === '') {
    return callback(new Error('验证码不能为空'));
  }
  if (value.toLowerCase() !== captcha.value.toLowerCase()) {
    return callback(new Error('验证码输入错误'));
  }
  return callback();
};

const rules = reactive<FormRules>({
  connection: [
    {
      required: true,
      message: '请选择连接实例',
      trigger: 'blur',
    },
  ],
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
  captcha: [
    {
      required: true,
      validator: validateCaptcha,
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

// 获取实例列表
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getList() {
  getConnectionList().then((res) => {
    connectionList.value = res.data || [];
    const standAloneList: Connection.ConnectionItem[] = [];
    const doubleLiveList: Connection.ConnectionItem[] = [];
    const clusterList: Connection.ConnectionItem[] = [];
    connectionList.value.forEach((item) => {
      if (item.type === 1) {
        clusterList.push(item);
      } else if (item.type === 2) {
        doubleLiveList.push(item);
      } else {
        standAloneList.push(item);
      }
    });
    connectionOptions.value = [
      { label: '单机版', options: standAloneList },
      { label: '集群版', options: clusterList },
      { label: '双活版', options: doubleLiveList },
    ];
    if (connectionList.value.length) {
      loginForm.connection = +connectionList.value[0].id;
      loginForm.user = connectionList.value[0].username;
    }
  });
}

function handleSelectConnection() {
  connectionVisible.value = true;
}

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true;
      login(loginForm.user, loginForm.password, +loginForm.connection).then(() => {
        userStore.setUser(loginForm.user);
        const connectionData = connectionList.value.find((item) => item.id === loginForm.connection);
        if (connectionData) {
          connectionStore.setConnection(connectionData);
        }
        router.push({ path: '/' });
        sessionStorage.setItem('nologin', '0');
      }).catch(() => {
        captchaRef.value?.onRefresh();
        loading.value = false;
      });
    } else if (captcha.value.toLowerCase() !== loginForm.captcha.toLowerCase()) {
      captchaRef.value?.onRefresh();
    }
  });
};

onMounted(() => {
  userStore.clearUserStore();
  sessionStorage.setItem('UserStore', '');
  sessionStorage.setItem('nologin', '1');
  getList();
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
  margin: 30px 0 40px;

  .timecho-logo{
    width: 37px;
    height: 30px;
    margin-right: 20px;
  }

  .title-logo{
    width: 137px;
    height: 30px;
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
    margin-bottom: 24px;
  }

  :deep(.el-input) {
    height: 36px !important;
  }
}

.connection-box{
  display: flex;

  :deep(.el-button) {
    height: 36px !important;
  }

  :deep(.el-select .el-input__suffix) {
    background-color: #fff;
  }

  .connection-form-item{
    position: relative;

    .connection-icon{
      position: absolute;
      z-index: 1;
      left: 5px;
      top: 4px;
    }

    :deep(.el-input__wrapper){
      padding-left: 39px;
    }
  }
}

.login-button{
  width: 100%;
  margin-top: 24px;
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
