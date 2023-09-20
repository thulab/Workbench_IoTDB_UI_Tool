<template>
  <el-dialog
    title="实例管理"
    v-model="dialogVisible"
    width="780px"
    align-center
    :close-on-click-modal="false"
    id="connection-modal"
  >
    <el-container class="connection-wrapper">
      <el-aside width="240px" class="connection-list-wrapper">
        <div class="connection-list-title">
          <h4>实例列表</h4>
          <div>
            <el-button link class="m-r-8" @click="getList" id="connection-side-refresh"><i-custom-border-refresh /></el-button>
            <el-button link style="margin: 0;" @click="handleAddConnection" id="connection-side-add"><i-custom-new-connection /></el-button>
          </div>
        </div>
        <el-input placeholder="请输入实例名称" v-model="filterText" id="connection-list-input" @keyup.enter="handleFilter" class="connection-search-input">
          <template #prefix>
            <i-custom-search-icon class="remote-select-search-icon" />
          </template>
        </el-input>
        <div class="connection-list-box">
          <div class="list-empty-wrapper" v-if="!filterList.length">
            <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
            <span class="data-empty-text">暂无数据</span>
          </div>
          <ul class="list-box" v-else>
            <li v-for="item in filterList" :key="item.id" :class="['connection-item-box', current === item.id && 'connection-item-box-active']" @click="e => handleSelect(item, e)">
              <span class="connection-item-text">
                <el-icon size="30" style="margin-right: 4px;">
                  <i-custom-connection-cluster v-if="item.type === 1" />
                  <i-custom-connection-double-live v-else-if="item.type === 2" />
                  <i-custom-connection-stand-alone v-else />
                </el-icon>
                <text-tooltip :content="item.name" />
              </span>
              <el-popconfirm
                confirm-button-text="确定"
                cancel-button-text="取消"
                title="是否删除该实例？"
                :icon="ICustomError"
                width="200"
                @confirm="handleDelete(item)"
              >
                <template #reference>
                  <div class="connection-item-delete-box">
                    <i-custom-delete class="connection-item-delete" />
                    <i-custom-delete-active class="connection-item-delete-active" />
                  </div>
                </template>
              </el-popconfirm>
            </li>
          </ul>
        </div>
      </el-aside>
      <el-main class="connection-detail-wrapper" v-if="!editType" />
      <el-main class="connection-detail-wrapper" v-if="editType">
        <div class="connection-operate-buttons">
          <h4 class="connection-detail-title">实例详情</h4>
          <div>
            <el-button v-if="isView" type="primary" @click="handleEdit(true)" id="connection-detail-edit">编辑</el-button>
            <el-button v-else type="primary" @click="handleEdit(false)" id="connection-detail-view">退出编辑</el-button>
          </div>
        </div>
        <el-scrollbar>
          <el-form ref="formRef" :model="formData" label-position="left" label-width="140px" :key="formKey">
            <base-form-item label="连接类型：" prop="type" :rules="requiredRules" class="base-form-box">
              <el-radio-group v-model="formData.type" @change="val => handleChangeType(val as 0 | 1 | 2)">
                <el-radio :label="0">单机版</el-radio>
                <el-radio :label="1">集群版</el-radio>
                <el-radio :label="2">双活版</el-radio>
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
                      <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 162px" :id="`connection-modal-master-${index}-host`" />
                    </base-form-item>
                    <span class="ip-port-divider">:</span>
                    <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].port`" :rules="requiredRules">
                      <el-input v-model.trim="item.port" placeholder="请输入端口号" style="width: 100px" :id="`connection-modal-master-${index}-port`" />
                    </base-form-item>
                  </div>
                </div>
              </div>
              <base-form-item label="Prometheus 信息：" prop="masterCluster.prometheusUrl" class="optional-form-item base-form-box">
                <template #label>
                  Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                </template>
                <el-input v-model="formData.masterCluster.prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" id="connection-modal-prometheusUrl" />
              </base-form-item>
              <base-form-item label="用户名：" prop="username" :rules="requiredRules" class="base-form-box">
                <el-input v-model="formData.username" placeholder="请输入用户名" id="connection-modal-username" />
              </base-form-item>
              <base-form-item label="密码：" prop="password" class="optional-form-item base-form-box" :error="errorPwd">
                <el-input v-model="formData.password" placeholder="请输入密码" show-password autocomplete="off" id="connection-modal-password" />
              </base-form-item>
            </template>
            <!-- 集群版 -->
            <template v-if="formData.type === 1">
              <div class="ip-port-box base-form-box">
                <span class="form-label">实例信息：</span>
                <div class="ip-port-list">
                  <div class="ip-port-item" v-for="(item, index) in formData.masterCluster.hostAndPortVOS" :key="`${index}_master_host_port`">
                    <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].host`" :rules="requiredRules">
                      <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 162px" :id="`connection-modal-master-${index}-host`" />
                    </base-form-item>
                    <span class="ip-port-divider">:</span>
                    <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].port`" :rules="requiredRules">
                      <el-input v-model.trim="item.port" placeholder="请输入端口号" style="width: 100px" :id="`connection-modal-master-${index}-port`" />
                    </base-form-item>
                    <el-button link v-if="index === 0" @click="handleAddHost('master')" id="connection-ip-add-master" class="m-l-6" :disabled="isDisabledMasterHosts"><el-icon size="26"><i-custom-add-border /></el-icon></el-button>
                    <el-button link v-if="index !== 0" @click="handleDelHost('master', index)" :id="'connection-ip-del-master' + index" class="m-l-6"><el-icon size="26"><i-custom-delete /></el-icon></el-button>
                  </div>
                </div>
              </div>
              <base-form-item label="Prometheus 信息：" prop="masterCluster.prometheusUrl" class="optional-form-item base-form-box">
                <template #label>
                  Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                </template>
                <el-input v-model="formData.masterCluster.prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" id="connection-modal-prometheusUrl" />
              </base-form-item>
              <base-form-item label="用户名：" prop="username" :rules="requiredRules" class="base-form-box">
                <el-input v-model="formData.username" placeholder="请输入用户名" id="connection-modal-username" />
              </base-form-item>
              <base-form-item label="密码：" prop="password" class="optional-form-item base-form-box" :error="errorPwd">
                <el-input v-model="formData.password" placeholder="请输入密码" show-password autocomplete="off" id="connection-modal-password" />
              </base-form-item>
            </template>
            <!-- 双活版 -->
            <template v-if="formData.type === 2">
              <base-form-item label="用户名：" prop="username" :rules="requiredRules" class="base-form-box">
                <el-input v-model="formData.username" placeholder="请输入用户名" id="connection-modal-username" />
              </base-form-item>
              <base-form-item label="密码：" prop="password" class="optional-form-item base-form-box" :error="errorPwd">
                <el-input v-model="formData.password" placeholder="请输入密码" show-password autocomplete="off" id="connection-modal-password" />
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
                          <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 162px" :id="`connection-modal-master-${index}-host`" />
                        </base-form-item>
                        <span class="ip-port-divider">:</span>
                        <base-form-item label="" :prop="`masterCluster.hostAndPortVOS[${index}].port`" :rules="requiredRules">
                          <el-input v-model.trim="item.port" placeholder="请输入端口号" style="width: 100px" :id="`connection-modal-master-${index}-port`" />
                        </base-form-item>
                        <el-button link v-if="index === 0" @click="handleAddHost('master')" id="connection-ip-add-master" class="m-l-6" :disabled="isDisabledMasterHosts"><el-icon size="26"><i-custom-add-border /></el-icon></el-button>
                        <el-button link v-if="index !== 0" @click="handleDelHost('master', index)" :id="'connection-ip-del-master' + index" class="m-l-6"><el-icon size="26"><i-custom-delete /></el-icon></el-button>
                      </div>
                    </div>
                  </div>
                  <base-form-item label="Prometheus 信息：" prop="masterCluster.prometheusUrl" class="optional-form-item m-b-0">
                    <template #label>
                      Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                    </template>
                    <el-input v-model="formData.masterCluster.prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" id="connection-modal-prometheusUrl" />
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
                          <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 162px" :id="`connection-modal-slave-${index}-host`" />
                        </base-form-item>
                        <span class="ip-port-divider">:</span>
                        <base-form-item label="" :prop="`slaveCluster.hostAndPortVOS[${index}].port`" :rules="requiredRules">
                          <el-input v-model.trim="item.port" placeholder="请输入端口号" style="width: 100px" :id="`connection-modal-slave-${index}-port`" />
                        </base-form-item>
                        <el-button link v-if="index === 0" @click="handleAddHost('slave')" id="connection-ip-add-slave" class="m-l-6" :disabled="isDisabledSlaveHosts"><el-icon size="26"><i-custom-add-border /></el-icon></el-button>
                        <el-button link v-if="index !== 0" @click="handleDelHost('slave', index)" :id="'connection-ip-del-slave' + index" class="m-l-6"><el-icon size="26"><i-custom-delete /></el-icon></el-button>
                      </div>
                    </div>
                  </div>
                  <base-form-item label="Prometheus 信息：" prop="slaveCluster.prometheusUrl" class="optional-form-item m-b-0">
                    <template #label>
                      Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                    </template>
                    <el-input v-model="formData.slaveCluster.prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" id="connection-modal-prometheusUrl" />
                  </base-form-item>
                </el-collapse-item>
              </el-collapse>
            </template>
          </el-form>
        </el-scrollbar>
        <div class="connection-form-buttons" v-if="!isView">
          <el-button plain @click="handleTest('test')">测试</el-button>
          <div>
            <el-button plain @click="handleReset">重置</el-button>
            <el-button type="primary" :disabled="!isCanSave" @click="handleSave">保存</el-button>
            <el-button type="primary" v-if="isToggle" @click="handleTest('login')">保存连接</el-button>
          </div>
        </div>
      </el-main>
    </el-container>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { cloneDeep, isEqual, assign } from 'lodash-es';
import { ConnectionApi } from '@/api';
import { useUserStore, useConnectionStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ICustomError from '~icons/custom/error.svg';

const props = defineProps<{
  visible: boolean;
  isToggle?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const userStore = useUserStore();
const connectionStore = useConnectionStore();
const dialogVisible = useVModel(props, 'visible', emit);
const filterText = ref('');
const isView = ref(true);
const formKey = ref(0);
const editType = ref<'add' | 'edit' | 'view' | ''>('');
const activeNames = ref<string[]>(['masterCluster', 'slaveCluster']);
const formRef = ref<FormInstance>();
const requiredRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
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
const sourceData = cloneDeep(formData);
const connectionList = ref<Connection.ConnectionItem[]>([]);
let filterList: Connection.ConnectionItem[] = cloneDeep(connectionList.value);
const current = ref<string | number>('');
const errorPwd = ref('');
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
    return isEqual(formData, sourceData);
  }
  return true;
});

const { requestFn: getConnectionList } = useRequest(ConnectionApi.getConnectionList);
const { requestFn: getConnectionDetail } = useRequest(ConnectionApi.getConnectionDetail);
const { requestFn: deleteConnection } = useRequest(ConnectionApi.deleteConnection);
const { requestFn: saveConnection } = useRequest(ConnectionApi.saveConnection);
const { requestFn: testConnection } = useRequest(ConnectionApi.testConnection);
const { requestFn: loginByConnection } = useRequest(ConnectionApi.loginByConnection);

function handleAddConnection() {
  editType.value = 'add';
  isView.value = false;
}

function handleChangeType(type: 0 | 1 | 2) {
  formRef.value?.resetFields();
  errorPwd.value = '';
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
  formData.slaveCluster = {
    hostAndPortVOS: [
      { host: '', port: '' },
    ],
    prometheusUrl: '',
  };
}

function getDetail(id: number) {
  handleChangeType(0);
  getConnectionDetail(id).then((res) => {
    assign(formData, res.data);
  });
}

function handleReset() {
  handleChangeType(0);
  if (filterList.length) {
    current.value = +filterList[0].id;
    getDetail(current.value);
  } else {
    current.value = '';
  }
}

// 获取实例列表
function getList() {
  getConnectionList().then((res) => {
    connectionList.value = res.data || [];
    filterList = cloneDeep(connectionList.value);
    if (filterList.length) {
      current.value = +filterList[0].id;
      getDetail(current.value);
    }
  });
}

function handleFilter() {
  const res = connectionList.value.filter((item) => item.name.includes(filterText.value));
  filterList = cloneDeep(res);
}

const canStopPropagation = (e: HTMLElement):boolean => {
  const { classList } = e;

  if (classList.contains('connection-item-delete-box')
      || classList.contains('connection-item-delete')
      || classList.contains('connection-item-delete-active')) {
    return true;
  }
  if ((e.tagName === 'path' || e.tagName === 'g') && e.parentElement) {
    return canStopPropagation(e.parentElement);
  }
  return false;
};

function handleDelete(item: Connection.ConnectionItem) {
  ElMessageBox.confirm('是否删除该实例？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      deleteConnection(+item.id).then(() => {
        ElMessage.success('删除成功');
        getList();
      });
    });
}

// 选择
function handleSelect(item: Connection.ConnectionItem, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  current.value = +item.id;
  getDetail(current.value);
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

function handleEdit(flag: boolean) {
  isView.value = flag;
}

function handleTest(type: 'test' | 'login') {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (!formData.password) {
        errorPwd.value = '当前实例密码未填写，请编辑后进行连接';
      } else {
        errorPwd.value = '';
        if (type === 'test') {
          testConnection(formData).then(() => {
            ElMessage.success('连接成功');
            getList();
          });
        } else {
          loginByConnection(formData).then(() => {
            userStore.setUser(formData.username);
            sessionStorage.setItem('nologin', '0');
            connectionStore.setConnection({
              id: formData.id,
              type: formData.type,
              name: formData.name,
              username: formData.username,
            });
            dialogVisible.value = false;
            window.location.reload();
          });
        }
      }
    }
  });
}

function handleSave() {
  formRef.value?.validate((valid) => {
    if (valid) {
      saveConnection(formData).then(() => {
        ElMessage.success('连接成功');
        getList();
      });
    }
  });
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      handleChangeType(0);
      editType.value = '';
      filterText.value = '';
      formKey.value++;
      isView.value = true;
    }
  },
);

</script>

<style scoped lang="scss">
.connection-list-wrapper{
  height: 510px;
  border-radius: 6px;
  border: 1px solid #DFE1ED;
  margin-right: 8px;
}

.connection-list-title{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 0;

  h4{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}

.connection-search-input{
  padding: 20px 16px 16px;
}

.connection-list-box{
  border-radius: 2px;
  background: #FFF;
  height: calc(100% - 104px);
  overflow-y: auto;

  .list-empty-wrapper{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .data-empty-img{
      width: 150px;
      height: 150px;
      margin-bottom: 16px;
    }

    .data-empty-text{
      font-size: 14px;
      color: #131926;
      line-height: 21px;
    }
  }
}

.connection-item-box{
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 300;
  color: #131926;
  padding-left: 8px;
  box-sizing: border-box;
  cursor: pointer;
  position: relative;

  .connection-item-text{
    width: 200px;
    display: inline-flex;
    align-items: center;
    line-height: 1.2;
  }

  .connection-item-delete-box{
    position: absolute;
    top: 10px;
    right: 4px;
    display: none;

    svg{
      width: 16px;
      height: 16px;
    }

    .connection-item-delete-active{
      display: none;
    }

    &:hover {
      .connection-item-delete{
        display: none;
      }

      .connection-item-delete-active{
        display: block;
      }
    }
  }

  &:hover{
    background-color: #F7F8FC;
    color: #495AD4;

    .connection-item-delete-box{
      display: block;
    }
  }
}

.connection-item-box-active{
  background-color: #F7F8FC;
  color: #495AD4;
}

.connection-detail-wrapper{
  width: 500px;
  height: 510px;
  border-radius: 6px;
  border: 1px solid #DFE1ED;
  padding: 10px 9px;
  display: flex;
  flex-direction: column;

  .connection-operate-buttons{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 7px 16px;
  }

  .connection-detail-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
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
}
</style>
