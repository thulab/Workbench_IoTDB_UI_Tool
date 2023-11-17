<template>
  <el-main class="connection-detail-wrapper">
    <div class="connection-operate-buttons">
      <h4 class="connection-detail-title">实例详情</h4>
    </div>
    <el-scrollbar v-loading="detailLoading">
      <el-form ref="formRef" :model="formData" label-position="left" label-width="140px" :key="formKey" :disabled="!isShowSave">
        <label><input type="password" autocomplete="new-password" hidden></label>
        <base-form-item label="连接类型：" prop="type" :rules="requiredRules" class="base-form-box">
          <el-radio-group v-model="formData.type" @change="val => handleChangeType(val as 0 | 1 | 2)" :disabled="editType !== 'add'">
            <el-radio :label="0">单机</el-radio>
            <el-radio :label="1">集群</el-radio>
            <el-radio :label="2">双活</el-radio>
          </el-radio-group>
        </base-form-item>
        <base-form-item label="实例名称：" prop="name" :rules="requiredRules" class="base-form-box">
          <el-input v-model="formData.name" placeholder="请输入实例名称" maxlength="50" show-word-limit id="connection-modal-name" />
        </base-form-item>
        <!-- 单机版 -->
        <template v-if="formData.type === 0">
          <div class="ip-port-box base-form-box">
            <span class="form-label">实例信息：</span>
            <div class="ip-port-list">
              <div class="ip-port-item" v-for="(item, index) in formData.masterCluster.hostAndPortVOS" :key="`${index}_master_host_port`">
                <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].host`" :rules="requiredRules">
                  <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 169px" :id="`connection-modal-master-${index}-host`" />
                </base-form-item>
                <span class="ip-port-divider">:</span>
                <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].port`" :rules="requiredPortRules">
                  <el-input v-model.number="item.port" placeholder="请输入端口号" style="width: 100px" :id="`connection-modal-master-${index}-port`" />
                </base-form-item>
              </div>
            </div>
          </div>
          <base-form-item label="Prometheus 信息：" prop="masterCluster.prometheusUrl" class="optional-form-item base-form-box">
            <template #label>
              Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
            </template>
            <el-input v-model="formData.masterCluster.prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" id="connection-modal-prometheusUrl-stand-alone" />
          </base-form-item>
          <base-form-item label="用户名：" prop="username" :rules="requiredUserRules" class="base-form-box">
            <el-input v-model="formData.username" placeholder="请输入用户名" maxlength="32" id="connection-modal-username" />
          </base-form-item>
          <base-form-item label="密码：" prop="password" class="optional-form-item base-form-box" :error="errorPwd">
            <el-input v-model="formData.password" placeholder="请输入密码" show-password autocomplete="off" id="connection-modal-password-stand-alone" />
          </base-form-item>
        </template>
        <!-- 集群版 -->
        <template v-if="formData.type === 1">
          <div class="ip-port-box base-form-box">
            <span class="form-label">实例信息：</span>
            <div class="ip-port-list">
              <div class="ip-port-item" v-for="(item, index) in formData.masterCluster.hostAndPortVOS" :key="`${index}_master_host_port`">
                <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].host`" :rules="requiredRules">
                  <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 169px" :id="`connection-modal-master-${index}-host`" />
                </base-form-item>
                <span class="ip-port-divider">:</span>
                <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].port`" :rules="requiredPortRules">
                  <el-input v-model.number="item.port" placeholder="请输入端口号" style="width: 100px" :id="`connection-modal-master-${index}-port`" />
                </base-form-item>
                <el-button link v-if="index === 0 && editType !== 'view'" @click="handleAddHost('master')" id="connection-ip-add-master" class="m-l-6" :disabled="isDisabledMasterHosts"><el-icon size="26"><i-custom-add-border /></el-icon></el-button>
                <el-button link v-if="index !== 0 && editType !== 'view'" @click="handleDelHost('master', index)" :id="'connection-ip-del-master' + index" class="m-l-6"><el-icon size="26"><i-custom-delete /></el-icon></el-button>
              </div>
            </div>
          </div>
          <base-form-item label="Prometheus 信息：" prop="masterCluster.prometheusUrl" class="optional-form-item base-form-box">
            <template #label>
              Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
            </template>
            <el-input v-model="formData.masterCluster.prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" id="connection-modal-prometheusUrl-double-live" />
          </base-form-item>
          <base-form-item label="用户名：" prop="username" :rules="requiredUserRules" class="base-form-box">
            <el-input v-model="formData.username" placeholder="请输入用户名" maxlength="32" id="connection-modal-username" />
          </base-form-item>
          <base-form-item label="密码：" prop="password" class="optional-form-item base-form-box" :error="errorPwd">
            <el-input v-model="formData.password" placeholder="请输入密码" show-password autocomplete="off" id="connection-modal-password-double-live" />
          </base-form-item>
        </template>
        <!-- 双活版 -->
        <template v-if="formData.type === 2">
          <base-form-item label="用户名：" prop="username" :rules="requiredUserRules" class="base-form-box">
            <el-input v-model="formData.username" placeholder="请输入用户名" maxlength="32" id="connection-modal-username" />
          </base-form-item>
          <base-form-item label="密码：" prop="password" class="optional-form-item base-form-box" :error="errorPwd">
            <el-input v-model="formData.password" placeholder="请输入密码" show-password autocomplete="off" id="connection-modal-password-cluster" />
          </base-form-item>

          <el-collapse v-model="activeNames" class="connection-cluster-box">
            <el-collapse-item title="主集群信息" name="masterCluster">
              <template #title>
                <h4 class="connection-cluster-title">主集群信息</h4>
              </template>
              <div class="ip-port-box">
                <span class="form-label">实例信息：</span>
                <div class="ip-port-list">
                  <div class="ip-port-item" v-for="(item, index) in formData.masterCluster.hostAndPortVOS" :key="`${index}_master_host_port`">
                    <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].host`" :rules="requiredRules">
                      <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 169px" :id="`connection-modal-master-${index}-host`" />
                    </base-form-item>
                    <span class="ip-port-divider">:</span>
                    <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].port`" :rules="requiredPortRules">
                      <el-input v-model.number="item.port" placeholder="请输入端口号" style="width: 100px" :id="`connection-modal-master-${index}-port`" />
                    </base-form-item>
                    <el-button link v-if="index === 0 && editType !== 'view'" @click="handleAddHost('master')" id="connection-ip-add-master" class="m-l-6" :disabled="isDisabledMasterHosts"><el-icon size="26"><i-custom-add-border /></el-icon></el-button>
                    <el-button link v-if="index !== 0 && editType !== 'view'" @click="handleDelHost('master', index)" :id="'connection-ip-del-master' + index" class="m-l-6"><el-icon size="26"><i-custom-delete /></el-icon></el-button>
                  </div>
                </div>
              </div>
              <base-form-item label="Prometheus 信息：" prop="masterCluster.prometheusUrl" class="optional-form-item m-b-0 p-r-28">
                <template #label>
                  Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                </template>
                <el-input v-model="formData.masterCluster.prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" id="connection-modal-prometheusUrl-master-cluster" />
              </base-form-item>
            </el-collapse-item>
            <el-collapse-item title="备集群信息" name="slaveCluster" v-if="formData.slaveCluster">
              <template #title>
                <h4 class="connection-cluster-title">备集群信息</h4>
              </template>
              <div class="ip-port-box">
                <span class="form-label">实例信息：</span>
                <div class="ip-port-list">
                  <div class="ip-port-item" v-for="(item, index) in formData.slaveCluster.hostAndPortVOS" :key="`${index}_slave_host_port`">
                    <base-form-item label="" :prop="`slaveCluster.hostAndPortVOS[${index}].host`" :rules="requiredRules">
                      <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 169px" :id="`connection-modal-slave-${index}-host`" />
                    </base-form-item>
                    <span class="ip-port-divider">:</span>
                    <base-form-item label="" :prop="`slaveCluster.hostAndPortVOS[${index}].port`" :rules="requiredPortRules">
                      <el-input v-model.number="item.port" placeholder="请输入端口号" style="width: 100px" :id="`connection-modal-slave-${index}-port`" />
                    </base-form-item>
                    <el-button link v-if="index === 0 && editType !== 'view'" @click="handleAddHost('slave')" id="connection-ip-add-slave" class="m-l-6" :disabled="isDisabledSlaveHosts"><el-icon size="26"><i-custom-add-border /></el-icon></el-button>
                    <el-button link v-if="index !== 0 && editType !== 'view'" @click="handleDelHost('slave', index)" :id="'connection-ip-del-slave' + index" class="m-l-6"><el-icon size="26"><i-custom-delete /></el-icon></el-button>
                  </div>
                </div>
              </div>
              <base-form-item label="Prometheus 信息：" prop="slaveCluster.prometheusUrl" class="optional-form-item m-b-0 p-r-28">
                <template #label>
                  Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                </template>
                <el-input v-model="formData.slaveCluster.prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" id="connection-modal-prometheusUrl-slave-cluster" />
              </base-form-item>
            </el-collapse-item>
          </el-collapse>
        </template>
      </el-form>
    </el-scrollbar>
    <div class="connection-form-buttons">
      <el-button plain v-if="isShowSave" @click="handleTest('test')" :loading="testLoading">测试</el-button>
      <div>
        <el-button plain v-if="isShowSave" @click="handleReset">重置</el-button>
        <el-button type="primary" v-if="isShowSave" :disabled="!isCanSave" :loading="saveLoading" @click="handleSave">保存</el-button>
        <el-button type="primary" v-if="isToggle && current !== connectionStore.connectionInfo.data.id" :loading="connectLoading" @click="handleTest('login')">连接实例</el-button>
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
    message: '请输入内容后操作',
    trigger: ['blur', 'change'],
  },
]);
const requiredUserRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
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
    message: '格式不符，请重新输入',
    trigger: ['blur', 'change'],
  },
]);
const requiredPortRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
    trigger: ['blur', 'change'],
  },
  {
    validator: (rule: any, value: any, callback: any) => {
      if (!/^\+?[1-9][0-9]*$/.test(`${value}`)) {
        return callback(new Error('输入有误'));
      }
      if (value > 65535) {
        return callback(new Error('输入有误'));
      }
      return callback();
    },
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

const isDisabledMasterHosts = computed(() => {
  const hosts = formData.masterCluster.hostAndPortVOS;
  const flag = hosts.some((item) => !item.host || !item.port);
  return flag;
});

const isDisabledSlaveHosts = computed(() => {
  const hosts = formData.slaveCluster?.hostAndPortVOS || [];
  const flag = hosts.some((item) => !item.host || !item.port);
  return flag;
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
const { requestFn: testConnection } = useRequest(ConnectionApi.testConnection);
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
    ElMessageBox.confirm('当前内容未填写完整，是否继续填写？', '注意', {
      confirmButtonText: '继续',
      cancelButtonText: '放弃',
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

function handleAddHost(type: 'master' | 'slave') {
  if (type === 'master') {
    formData.masterCluster.hostAndPortVOS.push({ host: '', port: '' });
  } else {
    formData.slaveCluster?.hostAndPortVOS.push({ host: '', port: '' });
  }
}

function handleDelHost(type: 'master' | 'slave', index: number) {
  if (type === 'master') {
    formData.masterCluster.hostAndPortVOS.splice(index, 1);
  } else {
    formData.slaveCluster?.hostAndPortVOS.splice(index, 1);
  }
}

function handleTest(type: 'test' | 'login') {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (!formData.password) {
        errorPwd.value = '请填写密码后进行操作';
      } else {
        errorPwd.value = '';
        if (type === 'test') {
          testLoading.value = true;
          testConnection({ ...formData, id: editType.value === 'add' ? '' : formData.id }).then(() => {
            ElMessage.success('连接成功');
          }).finally(() => {
            testLoading.value = false;
          });
        } else {
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
      }
    }
  });
}

function handleSave() {
  formRef.value?.validate((valid) => {
    if (valid) {
      saveLoading.value = true;
      saveConnection({ ...formData, id: editType.value === 'add' ? '' : formData.id }).then((res) => {
        ElMessage.success('保存成功');
        emit('handleRefreshList', +res.data);
      }).finally(() => {
        saveLoading.value = false;
      });
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
  }

  .ip-port-list{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;

    :deep(.el-form-item__label) {
      width: 0 !important;
      padding: 0 !important;
    }
  }

  .ip-port-item{
    display: flex;

    .ip-port-divider{
      width: 28px;
      text-align: center;
      margin-top: 5px;
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

  :deep(.el-collapse-item__content){
    padding: 10px 8px !important;
    background-color: #F7F8FC;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
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
