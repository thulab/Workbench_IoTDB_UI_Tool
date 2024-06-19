<template>
  <el-container class="page-container p-0">
    <el-header class="detail-title-box">
      <h4 class="detail-title-text">{{ t('page.config') }}</h4>
      <div class="operate-buttons">
        <el-button link class="svg-button-hover-color" @click="handleDoc" id="iotdb-config-doc">
          <el-icon size="24"><i-custom-model-doc /></el-icon>
        </el-button>
      </div>
    </el-header>
    <auth-container :is-auth="canMaintain" :content="'common.maintainAuth'" style="flex: 1; overflow: hidden">
      <el-container class="p-0" style="width: 100%; height: 100%">
        <el-main class="editor-wrapper">
          <div class="editor-box">
            <div class="flex-justify-between m-b-6">
              <h4 class="editor-title">{{ t('common.edit') }}</h4>
              <div class="flex-justify-between node-select-box">
                <span class="search-from-label">{{ t('dashboard.node') }}：</span>
                <el-select v-model="currentNode" :placeholder="t('common.all')" style="width: 280px" @change="handleChangeNode" id="iotdb-config-select-node">
                  <el-option
                    v-for="(item, index) in nodeList"
                    :key="`${item.address}(${item.type})_${index}`"
                    :value="item.nodeID"
                    :id="`iotdb-config-node-select-${item.nodeID}`"
                    :label="`${item.address}(${item.type})`"
                    :disabled="!['running', 'readonly'].includes(item.status.toLocaleLowerCase())"
                  >
                    <el-tooltip
                      placement="top-start"
                      effect="light"
                      trigger="hover"
                      :content="t('iotdbConfig.nodeTip')"
                      popper-class="tooltip-box-width"
                      :disabled="['running', 'readonly'].includes(item.status.toLocaleLowerCase())"
                    >
                      {{ `${item.address}(${item.type})` }}
                    </el-tooltip>
                  </el-option>
                </el-select>
                <el-button link @click="handleRefresh" id="iotdb-config-refresh" class="svg-button-hover-color m-l-16 p-0" style="height: 24px !important">
                  <el-icon size="24"><i-custom-refresh /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-loading="configLoading" class="input-container">
              <monaco-editor ref="inputEditor" />
            </div>
            <div class="editor-operate-box">
              <el-button plain @click="handleReset" id="iotdb-config-reset">{{ t('common.reset') }}</el-button>
              <el-button type="primary" :loading="saveLoading" :disabled="!configData" @click="handleConfirm" id="iotdb-config-save">{{ t('iotdbConfig.nodeEffect') }}</el-button>
              <el-button type="primary" :loading="allSaveLoading" :disabled="!configData" @click="handleAllConfirm" id="iotdb-config-all-save">{{ t('iotdbConfig.allEffect') }}</el-button>
            </div>
          </div>
          <div class="preview-box m-l-16">
            <div class="flex-justify-between m-b-6">
              <h4 class="editor-title">{{ t('search.template') }}</h4>
            </div>
            <monaco-editor class="output-container" ref="outputEditor" :read-only="true" />
          </div>
        </el-main>
      </el-container>
    </auth-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { isEqual } from 'lodash-es';
import { useConnectionStore, useUserStore } from '@/stores';
import { iotdbShowAuth } from '@/utils/auth';
import { DashboardApi, ConfigApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import MonacoEditor from './components/monaco-editor.vue';

const { t, locale } = useI18n();
const router = useRouter();
const connectionStore = useConnectionStore();
const userStore = useUserStore();
const { canMaintain } = storeToRefs(userStore);
const currentNode = ref('');
const clusterType = ref<'master' | 'slave'>('master');
const masterNodes = ref<Dashboard.NodeItem[]>([]);
const slaveNodes = ref<Dashboard.NodeItem[]>([]);
const searchFormData = reactive({
  orderBy: ['type', 'type'],
  asc: ['asc', 'asc'],
});
const saveLoading = ref(false);
const allSaveLoading = ref(false);
const inputEditor = ref<InstanceType<typeof MonacoEditor>>();
const outputEditor = ref<InstanceType<typeof MonacoEditor>>();
const configData = ref('');
const templateData = ref('');

const showWithVersionMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, '1.3.3'));

const nodeList = computed(() => {
  if (clusterType.value === 'slave') {
    return slaveNodes.value;
  }
  return masterNodes.value;
});

const isEqualConfig = () => {
  return isEqual(configData.value, inputEditor.value?.getContent());
};

const { requestFn: getSystemInfo } = useRequest(DashboardApi.getSystemInfo);
const { requestFn: getConfigFile, loading: configLoading } = useRequest(ConfigApi.getConfigFile);
const { requestFn: getConfigTemplate } = useRequest(ConfigApi.getConfigTemplate);
const { requestFn: updateConfigs } = useRequest(ConfigApi.updateConfigs);

function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://timecho.com/docs/UserGuide/latest/Reference/Common-Config-Manual.html');
  } else {
    window.open('https://timecho.com/docs/zh/UserGuide/latest/Reference/Common-Config-Manual.html');
  }
}

// 获取节点
function getNodeList() {
  return getSystemInfo(searchFormData.orderBy, searchFormData.asc).then((res) => {
    masterNodes.value = res.data.masterNodeInfo.nodes || [];
    if (res.data.slaveNodeInfo) {
      slaveNodes.value = res.data.slaveNodeInfo.nodes || [];
    } else {
      slaveNodes.value = [];
    }
  });
}

// 获取模板配置
function getTemplate() {
  getConfigTemplate()
    .then((res) => {
      templateData.value = res.data || '';
      outputEditor.value?.setContent(templateData.value);
    })
    .catch(() => {
      templateData.value = '';
    });
}

// 获取节点配置
function getConfigDetail() {
  getConfigFile(currentNode.value)
    .then((res) => {
      configData.value = res.data || '';
      inputEditor.value?.setContent(configData.value);
    })
    .catch(() => {
      configData.value = '';
    });
}

function handleChangeValid() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(t('iotdbConfig.continueTip'), t('common.notice'), {
      confirmButtonText: t('common.continue'),
      cancelButtonText: t('common.giveup'),
      confirmButtonClass: 'iotdb-config-continue-confirm',
      cancelButtonClass: 'iotdb-config-continue-cancel',
      type: 'warning',
      icon: markRaw(ICustomMessageWarning as unknown as object),
      closeOnClickModal: false,
      closeOnPressEscape: false,
    })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

// 刷新
async function handleRefresh() {
  if (!configData.value || isEqualConfig()) {
    getConfigDetail();
    return;
  }
  const flag = await handleChangeValid();
  if (!flag) return;
  getConfigDetail();
}

// 切换节点
function handleChangeNode() {
  // 获取节点对应的配置文件
  getConfigDetail();
}

// 节点更新
function handleConfirm() {
  saveLoading.value = true;
  updateConfigs(configData.value, inputEditor.value?.getContent()!, currentNode.value)
    .then(() => {
      ElMessage.success({ message: t('common.updateSuccess'), grouping: true });
      getConfigDetail();
    })
    .finally(() => {
      saveLoading.value = false;
    });
}

// 全部节点更新
function handleAllConfirm() {
  allSaveLoading.value = true;
  updateConfigs(configData.value, inputEditor.value?.getContent()!)
    .then(() => {
      ElMessage.success({ message: t('common.updateSuccess'), grouping: true });
      getConfigDetail();
    })
    .finally(() => {
      allSaveLoading.value = false;
    });
}

function handleReset() {
  // 恢复至编辑文件最初状态
  getConfigDetail();
}

function initDetail() {
  if (sessionStorage.getItem('configStorage')) {
    const data = JSON.parse(sessionStorage.getItem('configStorage') as string);
    if (data.node) {
      const flag = nodeList.value.some((item) => `${item.nodeID}` === `${data.node}`);
      if (flag) {
        currentNode.value = data.node;
        if (!data.configData && !data.content) {
          getConfigDetail();
        } else {
          configData.value = data.configData;
          inputEditor.value?.setContent(data.content || '');
        }
      } else {
        currentNode.value = nodeList.value[0].nodeID;
        getConfigDetail();
      }
    } else {
      currentNode.value = nodeList.value[0].nodeID;
      getConfigDetail();
    }
  } else {
    currentNode.value = nodeList.value[0].nodeID;
    getConfigDetail();
  }
}

function setStorage() {
  sessionStorage.setItem(
    'configStorage',
    JSON.stringify({
      content: inputEditor.value?.getContent(),
      configData: configData.value,
      node: currentNode.value,
    })
  );
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    // eslint-disable-next-line no-underscore-dangle
    if (!window.__isReload__) {
      setStorage();
    } else {
      sessionStorage.setItem('configStorage', '');
    }
  });
});

onBeforeUnmount(() => {
  setStorage();
});

watch(
  () => showWithVersionMenu.value,
  (val) => {
    if (!val) {
      router.push({ name: 'Dashboard' });
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => showWithVersionMenu.value && canMaintain.value,
  (val) => {
    if (val) {
      nextTick(() => {
        getTemplate();
        getNodeList().then(() => {
          initDetail();
        });
      });
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => connectionStore.connectionIsMaster,
  (val, old) => {
    if (val !== old && (val === true || val === false)) {
      clusterType.value = val ? 'master' : 'slave';
    }
  },
  {
    immediate: true,
  }
);

watch(locale, () => {
  window.location.reload();
});
</script>

<style lang="scss" scoped>
.detail-title-box {
  height: 41px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dfe1ed;
  padding: 0 16px;
  box-sizing: border-box;

  .detail-title-text {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }
}

.editor-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.editor-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 24px;
  color: #495ad4;
}

.search-from-label {
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #131926;
}

.node-select-box {
  :deep(.el-select) {
    height: 24px !important;
  }

  :deep(.el-select__suffix) {
    height: 22px !important;
  }

  :deep(.el-select__wrapper) {
    line-height: 22px !important;
    min-height: 22px !important;
  }
}

.editor-box,
.preview-box {
  width: 50%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.input-container,
.output-container {
  flex: 1;
  overflow: auto;
  box-sizing: border-box;
}

.output-container {
  // margin-bottom: 36px;
}

.editor-operate-box {
  margin-top: 8px;
  text-align: right;
}
</style>
