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
    <auth-container :is-auth="canMaintain" style="flex: 1; overflow: hidden">
      <el-container class="p-0" style="width: 100%; height: 100%" v-loading="loading">
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
                    :label="item.address"
                  />
                </el-select>
                <el-button link @click="handleRefresh" id="iotdb-config-refresh" class="svg-button-hover-color m-l-16 p-0" style="height: 24px !important">
                  <el-icon size="24"><i-custom-refresh /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="input-container" ref="inputContainer" id="inputContainer"></div>
            <div class="editor-operate-box">
              <el-button plain @click="handleEditCancel" id="iotdb-config-reset">{{ t('common.reset') }}</el-button>
              <el-button type="primary" :loading="saveLoading" @click="handleEditConfirm" id="iotdb-config-save">{{ t('common.ack') }}</el-button>
            </div>
          </div>
          <div class="preview-box m-l-16">
            <div class="flex-justify-between m-b-6">
              <h4 class="editor-title">{{ t('search.template') }}</h4>
            </div>
            <div class="output-container" ref="outputContainer" id="outputContainer"></div>
          </div>
        </el-main>
      </el-container>
    </auth-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { useConnectionStore, useUserStore } from '@/stores';
import { iotdbShowAuth } from '@/utils/auth';
import { DashboardApi } from '@/api';
// import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

// eslint-disable-next-line no-restricted-globals
(self as any).MonacoEnvironment = {
  getWorker(_: any, label: any) {
    if (label === 'json') {
      return new JsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HtmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

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
// const inputEditor = ref<IStandaloneCodeEditor>();
// const outputEditor = ref<IStandaloneCodeEditor>();
const inputEditor = ref();
const outputEditor = ref();
const inputContainer = ref<HTMLElement>();
const outputContainer = ref<HTMLElement>();
const initJSONValue = ref('');

const showVersionMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, '1.3.3'));

const nodeList = computed(() => {
  if (clusterType.value === 'slave') {
    return slaveNodes.value;
  }
  return masterNodes.value;
});

const { requestFn: getSystemInfo, loading } = useRequest(DashboardApi.getSystemInfo);

function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://timecho.com/docs/UserGuide/latest/Reference/Common-Config-Manual.html');
  } else {
    window.open('https://timecho.com/docs/zh/UserGuide/latest/Reference/Common-Config-Manual.html');
  }
}

function getNodeList() {
  return getSystemInfo(searchFormData.orderBy, searchFormData.asc).then((res) => {
    masterNodes.value = res.data.masterNodeInfo.nodes || [];
    if (res.data.slaveNodeInfo) {
      slaveNodes.value = res.data.slaveNodeInfo.nodes || [];
    } else {
      slaveNodes.value = [];
    }
    currentNode.value = nodeList.value[0].nodeID;
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
      icon: ICustomMessageWarning,
      closeOnClickModal: false,
      closeOnPressEscape: false,
    })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

// 刷新
async function handleRefresh() {
  const flag = await handleChangeValid();
  if (!flag) return;
  console.log('handleRefresh');
}

function handleChangeNode(val: string) {
  // 获取节点对应的配置文件
  console.log(val);
}

function handleEditConfirm() {
  saveLoading.value = true;
  setTimeout(() => {
    saveLoading.value = false;
  }, 500);
}

function handleEditCancel() {
  // 恢复至编辑文件最初状态
  console.log('handleEditCancel');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSQL = () => {
  if (!inputEditor.value || !outputEditor.value) {
    return;
  }
  const inputJSON = JSON.parse(toRaw(inputEditor.value).getValue());
  if (!inputJSON) {
    return;
  }

  toRaw(outputEditor.value).setValue(inputJSON);
};

// 调用执行
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const importAndCal = (val: string) => {
  if (inputEditor.value) {
    toRaw(inputEditor.value).setValue(val);
    inputEditor.value!.getAction('editor.action.formatDocument')!.run();
  }
};

const initEditor = () => {
  if (inputContainer.value) {
    const initValue = localStorage.getItem('draft') ?? initJSONValue.value;
    inputEditor.value = monaco.editor.create(inputContainer.value, {
      value: initValue,
      language: 'json',
      theme: 'vs',
      formatOnPaste: true,
      automaticLayout: true,
      fontSize: 12,
      lineHeight: 24,
      contextmenu: false,
      wordBreak: 'keepAll',
      defaultColorDecorators: true,
      scrollBeyondLastLine: false,
      // 默认加载不聚焦，设置false 初次渲染第一行会有光标聚焦样式，即有一圈边框。
      renderLineHighlightOnlyWhenFocus: true,
      scrollbar: {
        horizontalScrollbarSize: 4,
        verticalScrollbarSize: 4,
      },
      minimap: {
        enabled: false,
      },
    });
    setTimeout(() => {
      if (inputEditor.value) {
        inputEditor.value!.getAction('editor.action.formatDocument')!.run();
      }
    }, 500);
    setInterval(() => {
      if (inputEditor.value) {
        localStorage.setItem('draft', toRaw(inputEditor.value).getValue());
      }
    }, 3000);
  }
  if (outputContainer.value) {
    outputEditor.value = monaco.editor.create(outputContainer.value, {
      value: '',
      language: 'sql',
      theme: 'vs',
      formatOnPaste: true,
      automaticLayout: true,
      fontSize: 12,
      lineHeight: 24,
      contextmenu: false,
      wordBreak: 'keepAll',
      defaultColorDecorators: true,
      scrollBeyondLastLine: false,
      // 默认加载不聚焦，设置false 初次渲染第一行会有光标聚焦样式，即有一圈边框。
      renderLineHighlightOnlyWhenFocus: true,
      scrollbar: {
        horizontalScrollbarSize: 4,
        verticalScrollbarSize: 4,
      },
      minimap: {
        enabled: false,
      },
      readOnly: true,
    });
  }
};

watch(
  () => showVersionMenu.value,
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
  () => showVersionMenu.value && canMaintain.value,
  (val) => {
    if (val) {
      getNodeList().then(() => {
        console.log('getConfig');
      });
      setTimeout(() => {
        console.log('initEditor');
        initEditor();
      }, 300);
    }
  },
  {
    immediate: true,
  }
);
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
  border: 1px solid #dfe1ed;
  border-radius: 2px;
}

.editor-operate-box {
  margin-top: 8px;
  text-align: right;
}
</style>
<style lang="scss">
.monaco-editor {
  // --vscode-editorGutter-background: #f0f1fa !important;
  // --vscode-editorLineNumber-foreground: #676c99 !important;
  // --vscode-editorLineNumber-activeForeground: #495ad4 !important;
  --vscode-editor-background: #f7f8fc !important;

  .monaco-scrollable-element {
    box-sizing: border-box;
    margin: 5px;
    width: calc(100% - 69px) !important;
    height: calc(100% - 10px) !important;
  }

  // .decorationsOverviewRuler {
  //   display: none !important;
  // }
}
</style>
