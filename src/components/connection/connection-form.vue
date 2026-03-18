<template>
  <el-main class="connection-detail-wrapper">
    <div class="connection-operate-buttons">
      <h4 class="connection-detail-title">{{ t('connection.detail') }}</h4>
    </div>
    <el-scrollbar v-loading="detailLoading">
      <el-form ref="formRef" :model="formData" label-position="left" :label-width="locale === 'en' ? '150px' : '150px'" :key="formKey">
        <label><input type="password" autocomplete="new-password" hidden /></label>
        <base-form-item :label="`${t('connection.type')}：`" prop="type" :rules="requiredRules" class="base-form-box">
          <el-radio-group v-model="formData.type" @change="(val) => handleChangeType(val as 0 | 1 | 2)" :disabled="editType !== 'add' || !isShowSave" id="connection-modal-type">
            <el-radio :value="0" id="connection-modal-type-0">{{ t('common.standAlone') }}</el-radio>
            <el-radio :value="1" id="connection-modal-type-1">{{ t('common.cluster') }}</el-radio>
            <el-radio :value="2" id="connection-modal-type-2">{{ t('common.doubleAlive') }}</el-radio>
          </el-radio-group>
        </base-form-item>
        <base-form-item :label="`${t('connection.name')}：`" prop="name" :rules="requiredRules" class="base-form-box">
          <el-input v-model="formData.name" :placeholder="t('connection.namePlaceholder')" maxlength="50" show-word-limit id="connection-modal-name" :disabled="!isShowSave" />
        </base-form-item>
        <!-- 单机版 -->
        <template v-if="formData.type === 0">
          <div class="ip-port-box base-form-box">
            <span class="form-label" :style="{ width: locale === 'en' ? '150px' : '150px' }">
              {{ t('connection.info') }}：
              <el-tooltip effect="light" :content="t('connection.connectionIpTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
            </span>
            <host-port v-model="formData.masterCluster.hostAndPortVOS" :form-key="'masterCluster.hostAndPortVOS'" :is-disabled="isShowSave" />
          </div>
          <prometheus-input
            v-model="formData.masterCluster.prometheusUrl"
            v-model:username="formData.masterCluster.prometheusUsername"
            v-model:password="formData.masterCluster.prometheusPassword"
            :form-key="'masterCluster.prometheusUrl'"
            :form-key-username="'masterCluster.prometheusUsername'"
            :form-key-password="'masterCluster.prometheusPassword'"
            :class-name="'el-form-item-not-mandatory base-form-box p-r-28'"
          />
          <user-pwd v-model:username.local="formData.username" v-model:password.local="formData.password" v-model:errorPwd.local="errorPwd" :is-disabled="isShowSave" />
        </template>
        <!-- 集群版 -->
        <template v-if="formData.type === 1">
          <div class="ip-port-box base-form-box">
            <span class="form-label" :style="{ width: locale === 'en' ? '150px' : '150px' }">
              {{ t('connection.info') }}：
              <el-tooltip effect="light" :content="t('connection.connectionIpTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
            </span>
            <host-port v-model="formData.masterCluster.hostAndPortVOS" :form-key="'masterCluster.hostAndPortVOS'" :is-disabled="isShowSave" :show-operate="true" />
          </div>
          <prometheus-input
            v-model="formData.masterCluster.prometheusUrl"
            v-model:username="formData.masterCluster.prometheusUsername"
            v-model:password="formData.masterCluster.prometheusPassword"
            :form-key="'masterCluster.prometheusUrl'"
            :form-key-username="'masterCluster.prometheusUsername'"
            :form-key-password="'masterCluster.prometheusPassword'"
            :class-name="'el-form-item-not-mandatory base-form-box p-r-28'"
          />
          <user-pwd v-model:username.local="formData.username" v-model:password.local="formData.password" v-model:errorPwd.local="errorPwd" :is-disabled="isShowSave" />
        </template>
        <!-- 双活版 -->
        <template v-if="formData.type === 2">
          <user-pwd v-model:username.local="formData.username" v-model:password.local="formData.password" v-model:errorPwd.local="errorPwd" :is-disabled="isShowSave" />
          <el-collapse v-model="activeNames" class="connection-cluster-box">
            <el-collapse-item :title="t('connection.masterInfo')" name="masterCluster">
              <template #title>
                <h4 class="connection-cluster-title">{{ t('connection.masterInfo') }}</h4>
              </template>
              <div class="ip-port-box">
                <span class="form-label" :style="{ width: locale === 'en' ? '150px' : '150px' }">
                  {{ t('connection.info') }}：
                  <el-tooltip effect="light" :content="t('connection.connectionIpTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                </span>
                <host-port v-model="formData.masterCluster.hostAndPortVOS" :form-key="'masterCluster.hostAndPortVOS'" :is-disabled="isShowSave" :show-operate="true" />
              </div>
              <prometheus-input
                v-model="formData.masterCluster.prometheusUrl"
                v-model:username="formData.masterCluster.prometheusUsername"
                v-model:password="formData.masterCluster.prometheusPassword"
                :form-key="'masterCluster.prometheusUrl'"
                :form-key-username="'masterCluster.prometheusUsername'"
                :form-key-password="'masterCluster.prometheusPassword'"
                :class-name="'el-form-item-not-mandatory p-r-28'"
              />
            </el-collapse-item>
            <el-collapse-item :title="t('connection.slaveInfo')" name="slaveCluster" v-if="formData.slaveCluster">
              <template #title>
                <h4 class="connection-cluster-title">{{ t('connection.slaveInfo') }}</h4>
              </template>
              <div class="ip-port-box">
                <span class="form-label" :style="{ width: locale === 'en' ? '150px' : '150px' }">
                  {{ t('connection.info') }}：
                  <el-tooltip effect="light" :content="t('connection.connectionIpTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                </span>
                <host-port v-model="formData.slaveCluster.hostAndPortVOS" :form-key="'slaveCluster.hostAndPortVOS'" :is-disabled="isShowSave" :show-operate="true" />
              </div>
              <prometheus-input
                v-model="formData.slaveCluster.prometheusUrl"
                v-model:username="formData.slaveCluster.prometheusUsername"
                v-model:password="formData.slaveCluster.prometheusPassword"
                :form-key="'slaveCluster.prometheusUrl'"
                :form-key-username="'slaveCluster.prometheusUsername'"
                :form-key-password="'slaveCluster.prometheusPassword'"
                :class-name="'el-form-item-not-mandatory  p-r-28'"
              />
            </el-collapse-item>
          </el-collapse>
        </template>
        <base-form-item prop="type" :rules="requiredRules" class="base-form-box">
          <template #label>
            {{ t('connection.defaultModel') }}：
            <el-tooltip effect="light" :content="tooltipContent" raw-content placement="top" popper-class="tooltip-box-width tooltip-box-white-space"> <i-custom-question /></el-tooltip>
          </template>
          <el-radio-group v-model="formData.model" @change="(val) => handleChangeDefaultModel(val as 'tree' | 'table')" id="connection-modal-type">
            <el-radio value="tree" id="connection-modal-type-0">{{ t('connection.treeModel') }}</el-radio>
            <el-radio value="table" id="connection-modal-type-1">{{ t('connection.tableModel') }}</el-radio>
          </el-radio-group>
        </base-form-item>
        <base-form-item :label="`${t('connection.useSsl')}：`" prop="name" class="base-form-box">
          <el-switch
            v-model="formData.useSsl"
            @change="
              (val) => {
                if (!val) {
                  formData.trustStorePassword = '';
                  uploadFileInfo = undefined;
                }
              }
            "
            inline-prompt
            size="default"
            style="--el-switch-on-color: #495ad4; --el-switch-off-color: #f0f1fa"
            :style="{ color: formData.useSsl ? '#fff' : '#424561' }"
            :class="[{ 'switch-off': !formData.useSsl }]"
            :active-text="t('connection.enableSsl')"
            :inactive-text="t('connection.disableSsl')"
          />
        </base-form-item>
        <el-row v-if="formData.useSsl" class="p-r-28">
          <el-col :span="15">
            <el-form-item class="el-input p-l-[7px]" :label="`${t('connection.trustStore')}：`" label-position="right" prop="file" :error="errorTS">
              <el-upload
                :limit="1"
                :auto-upload="false"
                :show-file-list="true"
                class="upload-ts m-l-[0] m-r-[8px]"
                :on-change="handleUploadChange"
                :on-remove="handleUploadRemove"
                :http-request="customUpload"
              >
                <div class="el-input__wrapper">{{ t('common.clickUploadTS') }}</div>
              </el-upload>
            </el-form-item>
          </el-col>
          <el-col :span="9">
            <base-form-item :label="`${t('connection.trustStorePassword')}：`" label-width="50px" label-position="right" :error="errorTSPwd">
              <el-input v-model="formData.trustStorePassword" :placeholder="t('connection.tspPlaceholder')" show-password autocomplete="off" class="trust-store-password-input" />
            </base-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-scrollbar>
    <div class="connection-form-buttons">
      <el-button plain @click="handleTest" id="connection-modal-test" :loading="testLoading">{{ t('common.test') }}</el-button>
      <div>
        <el-button plain v-if="isShowSave" @click="handleReset" id="connection-modal-reset">{{ t('common.reset') }}</el-button>
        <el-button type="primary" :disabled="!isCanSave" :loading="saveLoading" @click="handleSave" id="connection-modal-save">{{ t('common.save') }}</el-button>
        <el-button type="primary" v-if="isToggle && current !== connectionStore.connectionInfo.data.id" :loading="connectLoading" id="connection-modal-login" @click="handleTestLogin">
          {{ t('connection.connection') }}
        </el-button>
      </div>
    </div>
  </el-main>
</template>

<script lang="ts" setup>
import type { FormInstance, UploadProps } from 'element-plus';
import { cloneDeep, isEqual, assign } from 'lodash-es';
import { useRoute, useRouter } from 'vue-router';
import { ConnectionApi } from '@/api';
import { useUserStore, useConnectionStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import type { ConnectionDetail } from '@/types';

const props = defineProps<{
  editType: string;
  current: string | number;
  isToggle?: boolean;
  detailLoading: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:editType', val: string): void;
  (event: 'update:detailLoading', val: boolean): void;
  (event: 'handleRefreshList', val: number): void;
}>();

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const connectionStore = useConnectionStore();
const editType = useVModel(props, 'editType', emit);
const detailLoading = useVModel(props, 'detailLoading', emit);
const activeNames = ref<string[]>(['masterCluster', 'slaveCluster']);
const formRef = ref<FormInstance>();
const formKey = ref(0);
const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: 'blur',
  },
]);
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
const formData = reactive<ConnectionDetail>({
  id: '',
  type: 0,
  name: '',
  username: '',
  password: '',
  model: 'tree',
  masterCluster: {
    hostAndPortVOS: [{ host: '', port: '' }],
    prometheusUrl: '',
    prometheusUsername: '',
    prometheusPassword: '',
  },
  slaveCluster: {
    hostAndPortVOS: [{ host: '', port: '' }],
    prometheusUrl: '',
    prometheusUsername: '',
    prometheusPassword: '',
  },
  useSsl: false,
  trustStorePassword: '',
});
let sourceData = cloneDeep(formData);
const errorPwd = ref('');
const errorTS = ref('');
const errorTSPwd = ref('');
const testLoading = ref(false);
const connectLoading = ref(false);
const saveLoading = ref(false);

const tooltipContent = computed(() => {
  let link = 'https://www.timecho.com/docs/zh/UserGuide/latest/Background-knowledge/Data-Model-and-Terminology_timecho.html';
  if (locale.value === 'en') {
    link = 'https://www.timecho.com/docs/UserGuide/latest/Background-knowledge/Data-Model-and-Terminology_timecho.html';
  }
  return t('connection.defaultModelTip', { link: `<a href="${link}" class="c-[var(--el-color-primary)] text-3" target="_blank">${t('connection.modelDesc')}</a>` });
});

const isCanSave = computed(() => {
  if (formData.id) {
    const formDataStr = JSON.stringify(formData);
    const sourceDataStr = JSON.stringify(sourceData);
    return !isEqual(formDataStr, sourceDataStr);
  }
  return true;
});

const isShowSave = computed(() => props.current !== connectionStore.connectionInfo.data.id || route.name === 'Login');

const { requestFn: getConnectionDetail } = useRequest(ConnectionApi.getConnectionDetail);
const { requestFn: saveConnection } = useRequest(ConnectionApi.saveConnection);
const { requestFn: savePrometheus } = useRequest(ConnectionApi.savePrometheus);
const { requestFn: switchModel } = useRequest(ConnectionApi.switchModel);
const { requestFn: testConnection } = useRequest(ConnectionApi.testConnection);
const { requestFn: testPrometheus } = useRequest(ConnectionApi.testPrometheus);
const { requestFn: loginByConnection } = useRequest(ConnectionApi.loginByConnection);

function handleChangeDefaultModel(model: 'tree' | 'table') {
  formData.model = model;
}

function handleChangeType(type: 0 | 1 | 2) {
  formRef.value?.resetFields();
  errorPwd.value = '';
  errorTS.value = '';
  errorTSPwd.value = '';
  formData.id = editType.value === 'add' ? '' : formData.id;
  formData.type = type;
  formData.name = '';
  formData.username = '';
  formData.password = '';
  formData.masterCluster = {
    hostAndPortVOS: [{ host: '', port: '' }],
    prometheusUrl: '',
    prometheusUsername: '',
    prometheusPassword: '',
  };
  formData.slaveCluster =
    type === 0
      ? null
      : {
          hostAndPortVOS: [{ host: '', port: '' }],
          prometheusUrl: '',
          prometheusUsername: '',
          prometheusPassword: '',
        };
  formData.useSsl = false;
  formData.trustStorePassword = '';
  uploadFileInfo.value = undefined;
  handleChangeDefaultModel('tree');
}

function handleChangeConnection() {
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(editType.value === 'add' ? t('common.continueTip') : t('common.unsaveTip'), t('common.notice'), {
      confirmButtonText: t('common.continue'),
      cancelButtonText: t('common.giveup'),
      confirmButtonClass: 'connection-form-continue-confirm',
      cancelButtonClass: 'connection-form-continue-cancel',
      type: 'warning',
      icon: ICustomMessageWarning,
      closeOnClickModal: false,
      closeOnPressEscape: false,
    })
      .then(() => resolve(false))
      .catch(() => resolve(true));
  });
}

function resetOperateLoading() {
  testLoading.value = false;
  connectLoading.value = false;
  saveLoading.value = false;
}

function getDetail(id: number) {
  editType.value = 'edit';
  resetOperateLoading();
  errorPwd.value = '';
  errorTS.value = '';
  errorTSPwd.value = '';
  uploadFileInfo.value = undefined;
  detailLoading.value = true;
  // handleChangeType(0);
  getConnectionDetail(id)
    .then((res) => {
      assign(formData, res.data);
      formData.model = res.data.model || 'tree';
      formData.password = '';
      formData.trustStorePassword = '';
      formData.useSsl = res.data.useSsl;
      sourceData = cloneDeep(formData);
    })
    .finally(() => {
      detailLoading.value = false;
    });
}

function handleReset() {
  if (editType.value === 'edit') {
    formData.id = sourceData.id;
    formData.type = sourceData.type;
    formData.name = sourceData.name;
    formData.username = sourceData.username;
    formData.password = '';
    formData.model = sourceData.model;
    formData.masterCluster = cloneDeep(sourceData.masterCluster);
    if (sourceData.slaveCluster) {
      formData.slaveCluster = cloneDeep(sourceData.slaveCluster);
    } else {
      formData.slaveCluster = null;
    }
    formData.useSsl = sourceData.useSsl;
    formData.trustStorePassword = '';
    uploadFileInfo.value = undefined;
  } else {
    handleChangeType(0);
  }
}

function handleTestConnnection() {
  testLoading.value = true;
  // if (formData.useSsl && !uploadFileInfo.value) {
  //   testLoading.value = false;
  //   return;
  // }
  testConnection({ ...formData, id: editType.value === 'add' ? '' : formData.id }, uploadFileInfo.value)
    .then(() => {
      let successMsg = t('connection.iotdbSuccess');
      if (formData.type === 2) {
        if (formData.masterCluster.prometheusUrl && formData.slaveCluster?.prometheusUrl) {
          successMsg = t('connection.allSuccess');
        } else if (formData.masterCluster.prometheusUrl) {
          successMsg = t('connection.masterSuccess');
        } else if (formData.slaveCluster?.prometheusUrl) {
          successMsg = t('connection.slaveSuccess');
        }
      } else if (formData.masterCluster.prometheusUrl) {
        successMsg = t('connection.singleSuccess');
      }
      ElMessage.success({
        message: successMsg,
        grouping: true,
      });
    })
    .finally(() => {
      testLoading.value = false;
    });
}

function handleTestLogin() {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (!formData.password) {
        errorPwd.value = t('connection.pwdEmptyTip');
        return;
      }
      if (formData.useSsl) {
        if (!formData.trustStorePassword) {
          errorTSPwd.value = t('connection.pwdEmptyTip');
        }
        if (!uploadFileInfo.value) {
          errorTS.value = t('login.trustStoreTip');
        }
        return;
      }
      errorPwd.value = '';
      errorTS.value = '';
      errorTSPwd.value = '';

      connectLoading.value = true;
      loginByConnection({ ...formData, id: editType.value === 'add' ? '' : formData.id }, uploadFileInfo.value)
        .then((res) => {
          formData.id = res.data;
          userStore.setUser(formData.username);
          window.sessionStorage.setItem('nologin', '0');
          connectionStore.setConnection({
            ...formData,
            password: '',
          });
          window.sessionStorage.setItem('dataSearchStorage', '');
          window.sessionStorage.setItem('statisticSearchStorage', '');
          window.sessionStorage.setItem('sqlSearchStorage', '');
          // window.sessionStorage.setItem('dataTrendStorage', '');
          window.sessionStorage.setItem('dataSpectrumStorage', '');
          window.sessionStorage.setItem('configStorage', '');
          window.sessionStorage.setItem('aiVisualizationStorage', '');
          window.sessionStorage.setItem('newTreeDataRunningTrendStorage', '');
          window.sessionStorage.setItem('newTreeDataHistoryTrendStorage', '');
          window.sessionStorage.setItem('newTableDataRunningTrendStorage', '');
          window.sessionStorage.setItem('newTableDataHistoryTrendStorage', '');
          window.sessionStorage.setItem('measurement-tree-history', '');
          window.sessionStorage.setItem('measurement-tree-running', '');
          if (route.name === 'Login') {
            router.push({ name: 'Dashboard' });
          } else {
            window.__isReload__ = true;
            window.location.reload();
          }
        })
        .finally(() => {
          connectLoading.value = false;
        })
        .catch((err) => {
          if (editType.value === 'add') {
            if (err.data) {
              editType.value = 'edit';
              emit('handleRefreshList', +err.data);
            }
          }
        });
    }
  });
}

function handleTestPrometheus() {
  let successMsg = t('connection.prometheusSuccess');
  if (formData.type === 2) {
    if (formData.masterCluster.prometheusUrl && formData.slaveCluster?.prometheusUrl) {
      successMsg = t('connection.allPrometheusSuccess');
    } else if (formData.masterCluster.prometheusUrl) {
      successMsg = t('connection.masterPrometheusSuccess');
    } else if (formData.slaveCluster?.prometheusUrl) {
      successMsg = t('connection.slavePrometheusSuccess');
    } else {
      successMsg = '';
    }
  } else if (!formData.masterCluster.prometheusUrl) {
    successMsg = '';
  }
  if (!successMsg) return;
  testLoading.value = true;
  testPrometheus({
    prometheusUrlMaster: formData.masterCluster.prometheusUrl,
    prometheusUrlSlave: formData.slaveCluster?.prometheusUrl || '',
    prometheusUsernameMaster: formData.masterCluster.prometheusUsername,
    prometheusUsernameSlave: formData.slaveCluster?.prometheusUsername || '',
    prometheusPasswordMaster: formData.masterCluster.prometheusPassword,
    prometheusPasswordSlave: formData.slaveCluster?.prometheusPassword || '',
    doubleAlive: formData.type === 2,
  })
    .then(() => {
      ElMessage.success({
        message: successMsg,
        grouping: true,
      });
    })
    .finally(() => {
      testLoading.value = false;
    });
}

function handleTest() {
  let checkValid = true;
  formRef.value?.validate((valid) => {
    if (valid) {
      // 验证当前登陆的Prometheus
      if (!isShowSave.value) {
        handleTestPrometheus();
        return;
      }
      if (!formData.password) {
        errorPwd.value = t('connection.pwdEmptyTip');
        checkValid = false;
      }
      if (formData.useSsl) {
        if (!formData.trustStorePassword) {
          errorTSPwd.value = t('connection.pwdEmptyTip');
          checkValid = false;
        }
        if (!uploadFileInfo.value) {
          errorTS.value = t('login.trustStoreTip');
          checkValid = false;
        }
      }
      if (!checkValid) return;
      errorPwd.value = '';
      errorTS.value = '';
      errorTSPwd.value = '';
      // 测试连接
      handleTestConnnection();
    }
  });
}

function handleSaveConnection() {
  saveLoading.value = true;
  saveConnection({ ...formData, id: editType.value === 'add' ? '' : formData.id })
    .then((res) => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      emit('handleRefreshList', +res.data);
    })
    .finally(() => {
      saveLoading.value = false;
    });
}

// 保存prometheus 直接生效
function handleSavePrometheus() {
  saveLoading.value = true;
  savePrometheus({
    id: formData.id,
    model: formData.model!,
    prometheusUrlMaster: formData.masterCluster.prometheusUrl,
    prometheusUsernameMaster: formData.masterCluster.prometheusUsername,
    prometheusPasswordMaster: formData.masterCluster.prometheusPassword,
    prometheusUrlSlave: formData.slaveCluster?.prometheusUrl || '',
    prometheusUsernameSlave: formData.slaveCluster?.prometheusUsername || '',
    prometheusPasswordSlave: formData.slaveCluster?.prometheusPassword || '',
  })
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      if (formData.model !== connectionStore.model) {
        switchModel(formData.model!).then(() => {
          window.__isReload__ = true;
          window.location.reload();
        });
      } else {
        window.__isReload__ = true;
        window.location.reload();
      }
    })
    .finally(() => {
      saveLoading.value = false;
    });
}

function handleSave() {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (!isShowSave.value) {
        handleSavePrometheus();
      } else {
        handleSaveConnection();
      }
    }
  });
}

onMounted(() => {
  formKey.value++;
  activeNames.value = ['masterCluster', 'slaveCluster'];
});

watch(
  () => props.current,
  () => {
    formKey.value++;
    activeNames.value = ['masterCluster', 'slaveCluster'];
  },
  {
    immediate: true,
  },
);

watch(locale, () => {
  nextTick(() => {
    formRef.value?.clearValidate();
  });
});

defineExpose({
  getDetail,
  isCanSave,
  handleChangeType,
  resetOperateLoading,
  handleChangeConnection,
  handleChangeDefaultModel,
});
</script>

<style scoped lang="scss">
.trust-store-password-input {
  padding-right: 8px;
}

.upload-ts {
  flex: 1;
}

.connection-operate-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 10px;
  flex: 0 0 28px;
}

.connection-detail-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
}

.el-scrollbar {
  padding: 0 9px;
}

.base-form-box {
  padding: 0 36px 0 7px;
}

.ip-port-box {
  display: flex;

  .form-label {
    height: 28px !important;
    color: #424561 !important;
    font-size: 12px !important;
    font-weight: 400 !important;
    line-height: 21px !important;
    display: inline-flex;
    justify-content: flex-start;
    align-items: center !important;
    flex: 0 0 auto;
    position: relative;
    padding: 0 8px 0 0;
    box-sizing: border-box;

    &::before {
      content: '*';
      color: var(--el-color-danger);
      margin-right: 4px;
    }

    svg {
      transform: translate(-4px, -80%);
    }
  }
}

.el-collapse {
  border-top: none;
  border-bottom: none;
}

.connection-cluster-box {
  .connection-cluster-title {
    width: calc(100% - 40px);
    font-size: 14px;
    line-height: 21px;
    color: #424561;
    font-weight: 400;
    text-align: left;
  }

  :deep(.el-collapse-item__header) {
    border-bottom: none;
  }

  .el-collapse-item {
    margin-bottom: 8px;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: none;

    .el-collapse-item__content {
      padding: 10px 8px 1px !important;
      background-color: #f7f8fc;
    }
  }
}

.connection-form-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding: 0 9px 10px;
}
</style>
<style lang="scss">
.is-message-box {
  z-index: 9990 !important;
}
</style>
