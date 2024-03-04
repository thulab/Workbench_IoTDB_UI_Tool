<template>
  <el-main class="connection-detail-wrapper">
    <div class="connection-operate-buttons">
      <h4 class="connection-detail-title">{{ t('connection.detail') }}</h4>
    </div>
    <el-scrollbar v-loading="detailLoading">
      <el-form ref="formRef" :model="formData" label-position="left" label-width="140px" :key="formKey">
        <label><input type="password" autocomplete="new-password" hidden></label>
        <base-form-item :label="`${t('connection.type')}：`" prop="type" :rules="requiredRules" class="base-form-box">
          <el-radio-group v-model="formData.type" @change="val => handleChangeType(val as 0 | 1 | 2)" :disabled="editType !== 'add' || !isShowSave" id="connection-modal-type">
            <el-radio :label="0" id="connection-modal-type-0">{{ t('common.standAlone') }}</el-radio>
            <el-radio :label="1" id="connection-modal-type-1">{{ t('common.cluster') }}</el-radio>
            <el-radio :label="2" id="connection-modal-type-2">{{ t('common.doubleAlive') }}</el-radio>
          </el-radio-group>
        </base-form-item>
        <base-form-item :label="`${t('connection.name')}：`" prop="name" :rules="requiredRules" class="base-form-box">
          <el-input v-model="formData.name" :placeholder="t('connection.namePlaceholder')" maxlength="50" show-word-limit id="connection-modal-name" :disabled="!isShowSave" />
        </base-form-item>
        <!-- 单机版 -->
        <template v-if="formData.type === 0">
          <div class="ip-port-box base-form-box">
            <span class="form-label">{{ t('connection.info') }}：<el-tooltip effect="light" :content="t('connection.connectionIpTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></span>
            <host-port
              v-model="formData.masterCluster.hostAndPortVOS"
              :form-key="'masterCluster.hostAndPortVOS'"
              :is-disabled="isShowSave"
            />
          </div>
          <prometheus
            v-model="formData.masterCluster.prometheusUrl"
            :form-key="'masterCluster.prometheusUrl'"
            :class-name="'optional-form-item base-form-box'"
          />
          <user-pwd
            v-model:username.local="formData.username"
            v-model:password.local="formData.password"
            v-model:errorPwd.local="errorPwd"
            :is-disabled="isShowSave"
          />
        </template>
        <!-- 集群版 -->
        <template v-if="formData.type === 1">
          <div class="ip-port-box base-form-box">
            <span class="form-label">{{ t('connection.info') }}：<el-tooltip effect="light" :content="t('connection.connectionIpTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></span>
            <host-port
              v-model="formData.masterCluster.hostAndPortVOS"
              :form-key="'masterCluster.hostAndPortVOS'"
              :is-disabled="isShowSave"
              :show-operate="true"
            />
          </div>
          <prometheus
            v-model="formData.masterCluster.prometheusUrl"
            :form-key="'masterCluster.prometheusUrl'"
            :class-name="'optional-form-item base-form-box'"
          />
          <user-pwd
            v-model:username.local="formData.username"
            v-model:password.local="formData.password"
            v-model:errorPwd.local="errorPwd"
            :is-disabled="isShowSave"
          />
        </template>
        <!-- 双活版 -->
        <template v-if="formData.type === 2">
          <user-pwd
            v-model:username.local="formData.username"
            v-model:password.local="formData.password"
            v-model:errorPwd.local="errorPwd"
            :is-disabled="isShowSave"
          />
          <el-collapse v-model="activeNames" class="connection-cluster-box">
            <el-collapse-item :title="t('connection.masterInfo')" name="masterCluster">
              <template #title>
                <h4 class="connection-cluster-title">{{ t('connection.masterInfo') }}</h4>
              </template>
              <div class="ip-port-box">
                <span class="form-label">{{ t('connection.info') }}：<el-tooltip effect="light" :content="t('connection.connectionIpTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></span>
                <host-port
                  v-model="formData.masterCluster.hostAndPortVOS"
                  :form-key="'masterCluster.hostAndPortVOS'"
                  :is-disabled="isShowSave"
                  :show-operate="true"
                />
              </div>
              <prometheus
                v-model="formData.masterCluster.prometheusUrl"
                :form-key="'masterCluster.prometheusUrl'"
                :class-name="'optional-form-item m-b-0 p-r-28'"
              />
            </el-collapse-item>
            <el-collapse-item :title="t('connection.slaveInfo')" name="slaveCluster" v-if="formData.slaveCluster">
              <template #title>
                <h4 class="connection-cluster-title">{{t('connection.slaveInfo')}}</h4>
              </template>
              <div class="ip-port-box">
                <span class="form-label">{{ t('connection.info') }}：<el-tooltip effect="light" :content="t('connection.connectionIpTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></span>
                <host-port
                  v-model="formData.slaveCluster.hostAndPortVOS"
                  :form-key="'slaveCluster.hostAndPortVOS'"
                  :is-disabled="isShowSave"
                  :show-operate="true"
                />
              </div>
              <prometheus
                v-model="formData.slaveCluster.prometheusUrl"
                :form-key="'slaveCluster.prometheusUrl'"
                :class-name="'optional-form-item m-b-0 p-r-28'"
              />
            </el-collapse-item>
          </el-collapse>
        </template>
      </el-form>
    </el-scrollbar>
    <div class="connection-form-buttons">
      <el-button plain @click="handleTest" id="connection-modal-test" :loading="testLoading">{{ t('common.test') }}</el-button>
      <div>
        <el-button plain v-if="isShowSave" @click="handleReset" id="connection-modal-reset">{{ t('common.reset') }}</el-button>
        <el-button type="primary" :disabled="!isCanSave" :loading="saveLoading" @click="handleSave" id="connection-modal-save">{{ t('common.save') }}</el-button>
        <el-button type="primary" v-if="isToggle && current !== connectionStore.connectionInfo.data.id" :loading="connectLoading" id="connection-modal-login" @click="handleTestLogin">{{ t('connection.connection') }}</el-button>
      </div>
    </div>
  </el-main>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { cloneDeep, isEqual, assign } from 'lodash-es';
import { useRoute, useRouter } from 'vue-router';
import { ConnectionApi } from '@/api';
import { useUserStore, useConnectionStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

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

const { t } = useI18n();
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
    message: t('common.formRuleEmptyOperate'),
    trigger: ['blur', 'change'],
  },
]);
const formData = reactive<Connection.ConnectionDetail>({
  id: '',
  type: 0,
  name: '',
  username: '',
  password: '',
  masterCluster: {
    hostAndPortVOS: [
      { host: '', port: '' },
    ],
    prometheusUrl: '',
  },
  slaveCluster: {
    hostAndPortVOS: [
      { host: '', port: '' },
    ],
    prometheusUrl: '',
  },
});
let sourceData = cloneDeep(formData);
const errorPwd = ref('');
const testLoading = ref(false);
const connectLoading = ref(false);
const saveLoading = ref(false);

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
const { requestFn: testConnection } = useRequest(ConnectionApi.testConnection);
const { requestFn: testPrometheus } = useRequest(ConnectionApi.testPrometheus);
const { requestFn: loginByConnection } = useRequest(ConnectionApi.loginByConnection);

function handleChangeType(type: 0 | 1 | 2) {
  formRef.value?.resetFields();
  errorPwd.value = '';
  formData.id = editType.value === 'add' ? '' : formData.id;
  formData.type = type;
  formData.name = '';
  formData.username = '';
  formData.password = '';
  formData.masterCluster = {
    hostAndPortVOS: [
      { host: '', port: '' },
    ],
    prometheusUrl: '',
  };
  formData.slaveCluster = type === 0 ? null : {
    hostAndPortVOS: [
      { host: '', port: '' },
    ],
    prometheusUrl: '',
  };
}

function handleChangeConnection() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    }).then(() => resolve(false)).catch(() => resolve(true));
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
  detailLoading.value = true;
  // handleChangeType(0);
  getConnectionDetail(id).then((res) => {
    assign(formData, res.data);
    formData.password = '';
    sourceData = cloneDeep(formData);
  }).finally(() => {
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
    formData.masterCluster = cloneDeep(sourceData.masterCluster);
    if (sourceData.slaveCluster) {
      formData.slaveCluster = cloneDeep(sourceData.slaveCluster);
    } else {
      formData.slaveCluster = null;
    }
  } else {
    handleChangeType(0);
  }
}

function handleTestConnnection() {
  testLoading.value = true;
  testConnection({ ...formData, id: editType.value === 'add' ? '' : formData.id }).then(() => {
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
  }).finally(() => {
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
      errorPwd.value = '';

      connectLoading.value = true;
      loginByConnection({ ...formData, id: editType.value === 'add' ? '' : formData.id }).then((res) => {
        formData.id = res.data;
        userStore.setUser(formData.username);
        sessionStorage.setItem('nologin', '0');
        connectionStore.setConnection({
          ...formData,
          password: '',
        });
        if (route.name === 'Login') {
          router.push({ path: '/' });
        } else {
          window.location.reload();
        }
      }).finally(() => {
        connectLoading.value = false;
      }).catch((err) => {
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
    doubleAlive: formData.type === 2,
  }).then(() => {
    ElMessage.success({
      message: successMsg,
      grouping: true,
    });
  }).finally(() => {
    testLoading.value = false;
  });
}

function handleTest() {
  formRef.value?.validate((valid) => {
    if (valid) {
      // 验证当前登陆的Prometheus
      if (!isShowSave.value) {
        handleTestPrometheus();
        return;
      }
      if (!formData.password) {
        errorPwd.value = t('connection.pwdEmptyTip');
      } else {
        errorPwd.value = '';
        // 测试连接
        handleTestConnnection();
      }
    }
  });
}

function handleSaveConnection() {
  saveLoading.value = true;
  saveConnection({ ...formData, id: editType.value === 'add' ? '' : formData.id }).then((res) => {
    ElMessage.success(t('common.saveSuccess'));
    emit('handleRefreshList', +res.data);
  }).finally(() => {
    saveLoading.value = false;
  });
}

// 保存prometheus 直接生效
function handleSavePrometheus() {
  saveLoading.value = true;
  savePrometheus({
    id: formData.id,
    prometheusUrlMaster: formData.masterCluster.prometheusUrl,
    prometheusUrlSlave: formData.slaveCluster?.prometheusUrl || '',
  }).then(() => {
    ElMessage.success(t('common.saveSuccess'));
    window.location.reload();
  }).finally(() => {
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

defineExpose({
  getDetail, isCanSave, handleChangeType, resetOperateLoading, handleChangeConnection,
});
</script>

<style scoped lang="scss">

.connection-operate-buttons{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 10px;
  flex: 0 0 28px;
}

.connection-detail-title{
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495AD4;
}

.el-scrollbar{
  padding: 0 9px;
}

.base-form-box{
  padding: 0 36px 0 7px;
}

.ip-port-box{
  display: flex;

  .form-label{
    height: 28px !important;
    color: #424561 !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 21px !important;
    display: inline-flex;
    justify-content: flex-start;
    align-items: center !important;
    flex: 0 0 auto;
    position: relative;
    padding: 0 8px 0 0;
    width: 140px;
    box-sizing: border-box;

    &::before{
      content: "*";
      color: var(--el-color-danger);
      margin-right: 4px;
    }

    svg{
      transform: translate(-60%, -80%);
    }
  }
}

.optional-form-item{
  :deep(.el-form-item__label){
    padding-left: 9px;
  }
}

.el-collapse{
  border-top: none;
  border-bottom: none;
}

.connection-cluster-box{
  .connection-cluster-title{
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

  .el-collapse-item{
    margin-bottom: 8px;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: none;

    .el-collapse-item__content{
      padding: 10px 8px !important;
      background-color: #F7F8FC;
    }
  }
}

.connection-form-buttons{
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
