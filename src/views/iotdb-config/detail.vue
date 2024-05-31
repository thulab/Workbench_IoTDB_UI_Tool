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
    <auth-container :is-auth="canMaintain" style="flex: 1">
      <el-main class="p-0">
        <div class="editor-wrapper">
          <div class="editor-header">
            <el-select v-model="currentNode" :placeholder="t('common.all')" style="width: 256px" @change="handleChangeNode" id="iotdb-config-select-node">
              <el-option
                v-for="(item, index) in nodeList"
                :key="`${item.address}(${item.type})_${index}`"
                :value="item.nodeID"
                :id="`iotdb-config-node-select-${item.nodeID}`"
                :label="item.address ? `${item.address}(${item.type})` : t('common.all')"
              />
            </el-select>
          </div>
          <div style="flex: 1" class="flex">
            <div class="editor-box">
              <div class="flex-justify-between">
                <h4 class="editor-title">{{ t('common.edit') }}</h4>
                <el-button link @click="handleRefresh" id="iotdb-config-refresh" class="svg-button-hover-color">
                  <el-icon size="24"><i-custom-refresh /></el-icon>
                </el-button>
              </div>
              <div class="input-container" ref="inputContainer" id="inputContainer"></div>
              <div class="editor-operate-box">
                <el-button plain @click="handleEditCancel" id="iotdb-config-reset">{{ t('common.reset') }}</el-button>
                <el-button type="primary" :loading="saveLoading" @click="handleEditConfirm" id="iotdb-config-save">{{ t('common.ack') }}</el-button>
              </div>
            </div>
            <div class="preview-box m-l-16">
              <div class="flex-justify-between">
                <h4 class="editor-title">{{ t('search.template') }}</h4>
              </div>
              <div class="output-container" ref="outputContainer" id="outputContainer"></div>
            </div>
          </div>
        </div>
      </el-main>
    </auth-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useConnectionStore, useUserStore } from '@/stores';
import { iotdbShowAuth } from '@/utils/auth';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const { t, locale } = useI18n();
const router = useRouter();
const connectionStore = useConnectionStore();
const userStore = useUserStore();
const { canMaintain } = storeToRefs(userStore);
const currentNode = ref('');
const nodeList = ref<Dashboard.NodeItem[]>([]);
const saveLoading = ref(false);

const showVersionMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, '1.3.3'));

function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://timecho.com/docs/UserGuide/latest/Reference/Common-Config-Manual.html');
  } else {
    window.open('https://timecho.com/docs/zh/UserGuide/latest/Reference/Common-Config-Manual.html');
  }
}

function getNodeList() {}

// 刷新
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleRefresh() {
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
      .then(() => resolve(false))
      .catch(() => resolve(true));
  });
}

function handleChangeNode(val: string) {
  console.log(val);
}

function handleEditConfirm(row: any) {
  console.log(row, 'llll');
}

function handleEditCancel(row: any) {
  console.log(row, 'llll');
}

watch(
  () => showVersionMenu.value,
  (val) => {
    if (!val) {
      router.push({ name: 'Dashboard' });
    } else {
      getNodeList();
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
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.editor-header {
  margin: 8px 0;
}

.editor-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
}

.editor-box,
.preview-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #dfe1ed;
  padding: 8px;
  border-radius: 2px;
  box-sizing: border-box;
}

.input-container,
.output-container {
  flex: 1;
  overflow: auto;
  box-sizing: border-box;
}

.editor-operate-box {
  margin-top: 8px;
  text-align: right;
}
</style>
