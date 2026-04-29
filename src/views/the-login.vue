<template>
  <div class="login-wrapper" data-testid="login-page">
    <div class="login-side-img">
      <img src="@/assets/login-bg.png" alt="" />
    </div>
    <div class="login-form-wrapper">
      <div class="login-form-container" :style="{ height: isUseCaptcha ? '604px' : '550px' }" data-testid="login-form-container">
        <!-- eslint-disable-next-line vue/no-constant-condition -->
        <el-icon v-show="true" id="login-language" data-testid="login-language" class="login-language-icon" size="30" @click="handleChangeLang"><i-custom-language-border /></el-icon>
        <div class="login-logo-box">
          <i-custom-timecho-logo-en v-if="locale === 'en'" class="title-logo" />
          <i-custom-timecho-logo v-else class="title-logo" />
          <span class="logo-version login">{{ t('common.versionTips') }}</span>
          <!-- <i-custom-logo-title class="title-logo" /> -->
        </div>
        <h5 class="login-title">{{ t('login.title') }}</h5>
        <el-form :hide-required-asterisk="true" :model="loginForm" :rules="rules" ref="formRef" class="login-form-box" data-testid="login-form">
          <label><input type="password" autocomplete="new-password" hidden /></label>
          <div class="connection-box">
            <el-form-item prop="connection">
              <el-select
                v-model="loginForm.connection"
                :placeholder="t('login.connectionTip')"
                id="login-connection"
                data-testid="login-connection"
                style="width: 292px"
                fit-input-width
                placement="bottom-start"
                :loading="connectionLoading"
                @change="handleChangeConnection"
              >
                <template #prefix>
                  <el-icon size="30" style="margin-left: -6px"><i-custom-connection /></el-icon>
                </template>
                <el-option-group v-for="group in realConnectionOptions" :key="group.label" :label="group.label">
                  <el-option v-for="item in group.options" :key="item.id" :label="`${item.name}(${t('login.userName')}:${item.username})`" :value="item.id" :id="`login-connection-select-${item.id}`">
                    <div style="display: flex; width: 240px">
                      <text-tooltip :content="`${item.name}(${t('login.userName')}:${item.username})`" />
                    </div>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
            <el-button type="primary" class="m-l-12" id="login-connection-edit" data-testid="login-connection-edit" @click="handleSelectConnection">{{ t('common.edit') }}</el-button>
          </div>
          <el-form-item prop="user">
            <el-input v-model="loginForm.user" autocomplete="off" :placeholder="t('auth.userNamePlaceholder')" maxlength="32" @keyup.enter="submitForm" id="login-user" data-testid="login-user">
              <template #prefix>
                <el-icon size="30"><i-custom-user-name /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input :type="pwdType" v-model="loginForm.password" show-password autocomplete="off" :placeholder="t('auth.pwdPlaceholder')" @keyup.enter="submitForm" id="login-pwd" data-testid="login-password">
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
          <el-row v-if="loginForm.useSsl">
            <el-col :span="12">
              <el-form-item prop="file">
                <el-upload
                  :limit="1"
                  :auto-upload="false"
                  :show-file-list="true"
                  class="el-input el-input__wrapper m-l-[0] m-r-[8px]"
                  :on-change="handleUploadChange"
                  :on-remove="handleUploadRemove"
                  :http-request="customUpload"
                >
                  <div>{{ uploadFileInfo ? '' : t('common.clickUploadTS') }}</div>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="trustStorePassword">
                <el-input v-model="loginForm.trustStorePassword" :placeholder="t('connection.tspPlaceholder')" show-password autocomplete="off" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item prop="model">
            <el-radio-group v-model="loginForm.model" @change="(val) => handleChangeDefaultModel(val as 'tree' | 'table')" id="connection-modal-type" data-testid="login-model-type">
              <el-radio value="tree" id="connection-modal-type-0" data-testid="login-model-tree">{{ t('connection.treeModel') }}</el-radio>
              <el-radio value="table" id="connection-modal-type-1" data-testid="login-model-table">{{ t('connection.tableModel') }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item prop="captcha" v-if="isUseCaptcha">
            <el-input v-model="loginForm.captcha" autocomplete="off" :placeholder="t('login.captchaTip')" @keyup.enter="submitForm" id="login-captcha" data-testid="login-captcha">
              <template #prefix>
                <el-icon size="30"><i-custom-verification-code /></el-icon>
              </template>
              <template #suffix>
                <the-captcha ref="captchaRef" :height="30" :width="100" @update:code="(val) => (captcha = val)" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item class="m-b-0">
            <el-button class="login-button" type="primary" :loading="loading" @click="submitForm" id="login-submit" data-testid="login-submit">{{ t('login.login') }}</el-button>
          </el-form-item>
        </el-form>
      </div>
      <p class="right-text">
        copyrightⒸ Timecho <br />
        Workbench V{{ appVersion }}
      </p>
    </div>

    <modal-connection v-model:visible="connectionVisible" @handleClose="getList" />
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules, FormItemRule, UploadProps } from 'element-plus';
import { UserApi, ConnectionApi } from '@/api';
import { useUserStore } from '@/stores';
import useAppStore from '@/stores/app';
import ModalConnection from '@/components/modal-connection.vue';
import TheCaptcha from '@/components/the-captcha.vue';
import { useLangSwitch } from '@/composition-api';
import type { ConnectionItem } from '@/types';

const { t, locale } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();
const formRef = ref<FormInstance>();
const captchaRef = ref<InstanceType<typeof TheCaptcha> | null>(null);
const loginForm = reactive<{
  connection: string | number;
  user: string;
  password: string;
  model: 'tree' | 'table';
  useSsl: boolean;
  trustStorePassword: string;
  captcha: string;
}>({
  connection: '',
  user: '',
  password: '',
  model: 'tree',
  useSsl: false,
  trustStorePassword: '',
  captcha: '',
});
const pwdType = ref('password');
const loading = ref(false);
const isUseCaptcha = ref(false);

const connectionVisible = ref(false);
const connectionList = ref<ConnectionItem[]>([]);
const connectionOptions = ref<Array<{ label: string; options: Array<ConnectionItem> }>>([]);
const connectionLoading = ref(false);

const captcha = ref('');
const realConnectionOptions = computed(() => connectionOptions.value.filter((item) => item.options.length > 0));
const appVersion = computed(() => appStore.AppVersion);
const { handleLangCommand } = useLangSwitch(useI18n());

const { requestFn: login } = useRequest(UserApi.login);
const { requestFn: logout } = useRequest(UserApi.logout);
const { requestFn: loginCaptcha } = useRequest(UserApi.loginCaptcha);
const { requestFn: getConnectionList } = useRequest(ConnectionApi.getConnectionList);
const { requestFn: getConnectionDetail } = useRequest(ConnectionApi.getConnectionDetail);

const uploadFileInfo = ref<File>();
const handleUploadChange: UploadProps['onChange'] = (uploadFile) => {
  uploadFileInfo.value = uploadFile.raw;
};
const handleUploadRemove: UploadProps['onRemove'] = () => {
  uploadFileInfo.value = undefined;
};
const customUpload: UploadProps['httpRequest'] = () => {
  return new Promise(() => {});
};

const validateuser: FormItemRule['validator'] = (rule, value, callback) => {
  if (value === '') {
    return callback(new Error(t('login.userNameTip')));
  }
  if (value.length < 3) {
    return callback(new Error(t('login.userNameLengthTip')));
  }
  return callback();
};

const validatepassword: FormItemRule['validator'] = (rule, value, callback) => {
  if (value === '') {
    return callback(new Error(t('login.pwdTip')));
  }
  if (value.length < 3) {
    return callback(new Error(t('login.pwdLengthTip')));
  }
  return callback();
};

const validateCaptcha = (rule: any, value: string, callback: any) => {
  if (value === '') {
    return callback(new Error(t('login.captchaEmptyTip')));
  }
  if (value.toLowerCase() !== captcha.value.toLowerCase()) {
    return callback(new Error(t('login.captchaErrorTip')));
  }
  return callback();
};

const validateTSpassword: FormItemRule['validator'] = (rule, value, callback) => {
  if (value === '') {
    return callback(new Error(t('login.trustStorePwdTip')));
  }
  return callback();
};

const validateTSFile: FormItemRule['validator'] = (rule, value, callback) => {
  if (!uploadFileInfo.value) {
    return callback(new Error(t('login.trustStoreTip')));
  }
  return callback();
};

const rules = reactive<FormRules>({
  connection: [
    {
      required: true,
      message: () => t('login.connectionEmptyTip'),
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
  trustStorePassword: [
    {
      required: true,
      validator: validateTSpassword,
      trigger: 'blur',
    },
  ],
  file: [
    {
      required: true,
      validator: validateTSFile,
      trigger: 'blur',
    },
  ],
});

function handleChangeDefaultModel(model: 'tree' | 'table') {
  loginForm.model = model;
}

// function handleChangePwdType() {
//   if (pwdType.value === 'password') {
//     pwdType.value = 'text';
//   } else {
//     pwdType.value = 'password';
//   }
//   formRef.value?.clearValidate('password');
// }

// 获取实例列表

function getList() {
  connectionLoading.value = true;
  getConnectionList()
    .then((res) => {
      connectionList.value = res.data || [];
      const standAloneList: ConnectionItem[] = [];
      const doubleLiveList: ConnectionItem[] = [];
      const clusterList: ConnectionItem[] = [];
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
        { label: t('common.standAlone'), options: standAloneList },
        { label: t('common.cluster'), options: clusterList },
        { label: t('common.doubleAlive'), options: doubleLiveList },
      ];
      // 默认选中第一个
      // if (connectionList.value.length) {
      //   const firstConnection = connectionOptions.value.find((item) => item.options.length);
      //   if (firstConnection) {
      //     loginForm.connection = firstConnection?.options[0]!.id;
      //     loginForm.user = firstConnection?.options[0]!.username;
      //   }
      // }
    })
    .finally(() => {
      connectionLoading.value = false;
    });
}

function getCaptcha() {
  loginCaptcha().then((res) => {
    isUseCaptcha.value = res.data;
  });
}

function getDetail(id: number) {
  getConnectionDetail(id)
    .then((res) => {
      loginForm.model = res.data.model || 'tree';
      loginForm.useSsl = res.data.useSsl || false;
    })
    .finally(() => {});
}

function handleChangeConnection(val: number) {
  const data = connectionList.value.find((item) => item.id === val);
  if (data) {
    loginForm.user = data.username;
    getDetail(+data.id);
  }
}

function handleSelectConnection() {
  connectionVisible.value = true;
}

function handleChangeLang() {
  const lang = window.localStorage.getItem('lang');
  if (lang && lang === 'cn') {
    handleLangCommand('1');
  } else {
    handleLangCommand('0');
  }
  getList();
}

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true;
      login(loginForm.user, loginForm.password, +loginForm.connection, loginForm.model, loginForm.useSsl, loginForm.trustStorePassword, uploadFileInfo.value)
        .then(async () => {
          await userStore.setUser(loginForm.user);
          if (window.sessionStorage.getItem('iotdbVersion')?.indexOf('1.') === 0) {
            ElMessageBox.alert(t('login.versionTip'), t('common.tip'), {
              confirmButtonText: t('common.confirm'),
              type: 'warning',
            }).finally(() => {
              // 退出登录，刷新页面;
              logout().then(() => {
                userStore.setUser('');
                window.location.href = `/view/login?timestamp=${new Date().getTime()}`;
              });
            });
          } else {
            router.push({ name: 'Dashboard' });
            window.sessionStorage.setItem('nologin', '0');
          }
        })
        .catch(() => {
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
  // window.sessionStorage.setItem('UserStore', '');
  // window.sessionStorage.setItem('ConnectionStore', '');
  // window.sessionStorage.setItem('iotdbVersion', '');
  // window.sessionStorage.setItem('nologin', '1');
  // window.sessionStorage.setItem('EnumStore', '');
  window.sessionStorage.clear();
  window.sessionStorage.setItem('nologin', '1');
  getList();
  getCaptcha();
});

onUnmounted(() => {
  loading.value = false;
  connectionOptions.value = [];
  connectionLoading.value = false;
});

watch(locale, () => {
  nextTick(() => {
    formRef.value?.clearValidate();
  });
});
</script>

<style lang="scss" scoped>
.login-wrapper {
  background-color: #495ad4;
  height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  min-width: 1440px;
  min-height: 700px;
}

.login-side-img {
  flex: 0 0 60%;
  display: flex;
  justify-content: center;

  img {
    width: 564px;
  }
}

.login-form-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  position: relative;
}

.login-form-container {
  width: 480px;
  border-radius: 6px;
  background: #fff;
  padding: 40px 60px;
  box-sizing: border-box;
  position: relative;
}

.login-language-icon {
  position: absolute;
  top: 20px;
  right: 20px;
}

.login-logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 30px 0 20px;

  .timecho-logo {
    width: 37px;
    height: 30px;
    margin-right: 20px;
  }

  .title-logo {
    width: 137px;
    height: 30px;
  }
}

.login-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  color: #495ad4;
  text-align: center;
  padding: 0 0 2px;
  position: relative;

  &::after {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 120px;
    height: 2px;
    transform: translateX(-50%);
    border-radius: 2px 2px 0 0;
    background: #495ad4;
    content: '';
    display: block;
  }
}

.login-form-box {
  margin: 36px 0 0;

  :deep(.el-form-item--default) {
    margin-bottom: 24px;
  }

  :deep(.el-input) {
    height: 36px !important;
  }
}

.connection-box {
  display: flex;

  :deep(.el-button) {
    height: 36px !important;
  }

  :deep(.el-select) {
    height: 36px !important;
  }

  :deep(.el-select__wrapper) {
    height: 36px !important;
  }

  :deep(.el-select .el-select__suffix) {
    background-color: #fff;
    width: 20px;
  }
}

.login-button {
  width: 100%;
  border-radius: 4px;
  height: 36px !important;
  font-size: 12px !important;
}

.right-text {
  position: absolute;
  bottom: 32px;
  left: 183px;
  font-size: 12px;
  font-weight: 300;
  line-height: 18px;
  text-align: center;
  color: #fff;
}

:deep(.el-select-dropdown__item) {
  color: #424561;
  font-size: 12px;
  font-weight: 400;
}

:deep(.el-select-dropdown__item.selected) {
  color: #495ad4;
}

:deep(.el-select-group__title) {
  color: #656a85;
  font-size: 12px;
  font-weight: 300;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: #f7f8fc;
}

.el-select-group__wrap:not(:last-of-type)::after {
  background-color: #dfe1ed;
}
</style>
