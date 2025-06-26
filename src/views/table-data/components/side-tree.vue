<template>
  <auth-container :is-auth="canReadWriteData" :content="'common.dataAuth'" style="height: 100%">
    <div class="db-tree-wrapper">
      <div class="search-refresh-box">
        <el-input
          :placeholder="t('measurement.searchPlaceholder')"
          v-model="searchText"
          :disabled="searching"
          id="measurement-tree-input"
          @keyup.enter="handleSearch"
          class="measurement-tree-search-input"
        />

        <el-button link @click="handleRefresh()" :disabled="searching" id="db-tree-refresh" class="svg-button-hover-color m-l-16">
          <i-custom-border-refresh style="width: 24px; height: 24px" />
        </el-button>
        <el-button link @click="handleAddDB()" :disabled="searching" id="db-tree-add-db" class="svg-button-hover-color m-l-16">
          <i-custom-border-refresh style="width: 24px; height: 24px" />
        </el-button>
      </div>
      <el-tree-v2 ref="schemaTree" :data="treeData" style="background-color: #fff; overflow-y: auto" :props="treeProps" :indent="8" :item-size="28" :height="treeHeight" :expand-on-click-node="true">
        <!-- eslint-disable-next-line vue/no-unused-vars -->
        <template #default="{ node, data }">
          <div class="node-text" :id="`tree-node-content-${data.parentName || data.nodeName}`">
            <el-icon size="18" color="var(--el-color-primary)" class="m-r-[4px]">
              <i-custom-tree-db v-if="data.nodeType === 'DATABASE'" />
              <i-custom-table v-else-if="data.nodeType === 'TABLE'" />
              <i-custom-tree-time v-else-if="data.nodeType === 'TIME'" />
              <i-custom-tag v-else-if="data.nodeType === 'TAG'" />
              <i-custom-attr v-else-if="data.nodeType === 'ATTRIBUTE'" />
              <i-custom-field v-else-if="data.nodeType === 'FIELD'" />
            </el-icon>
            <text-tooltip :content="data.nodeName + (data.comment ? ` (${data.comment})` : '')" />
          </div>
          <el-dropdown v-if="data.nodeType === 'DATABASE'" @command="handleDatabaseOptionClick($event, data)">
            <span class="lang-icon m-r-20">
              <i-custom-field />
            </span>
            <template #dropdown>
              <el-dropdown-menu class="operate-dropdown">
                <el-dropdown-item command="dbSchema">
                  <div class="node-text">
                    <i-custom-field class="m-r-8" />
                    <span>{{ t('dataManage.schema') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="addTable">
                  <div class="node-text">
                    <i-custom-field class="m-r-8" />
                    <span>{{ t('dataManage.table') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="dbDelete" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-field class="m-r-8" />
                    <span>{{ t('common.delete') }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown v-if="data.nodeType === 'TABLE'" @command="handleTableOptionClick($event, data)">
            <span class="lang-icon m-r-20">
              <i-custom-attr />
            </span>
            <template #dropdown>
              <el-dropdown-menu class="operate-dropdown">
                <el-dropdown-item command="tableSchema">
                  <div class="node-text">
                    <i-custom-field class="m-r-8" />
                    <span>{{ t('dataManage.schema') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="tableData">
                  <div class="node-text">
                    <i-custom-field class="m-r-8" />
                    <span>{{ t('dataManage.data') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="addCloumn">
                  <div class="node-text">
                    <i-custom-field class="m-r-8" />
                    <span>{{ t('dataManage.column') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="tableDelete">
                  <div class="node-text">
                    <i-custom-field class="m-r-8" />
                    <span>{{ t('common.delete') }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-tree-v2>
      <modal-add-db v-model:visible="modalAddDbVisible" :database-names="databaseNames" @handle-save="handleRefresh" />
    </div>
  </auth-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore, useDbStore } from '@/stores';
import { type ElTreeV2 } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import ModalAddDb from './modal-add-db.vue';

const emit = defineEmits<{
  (event: 'handleNodeClick', nodeInfo: IoTDB.TreeNodeData): void;
}>();

const { t } = useI18n();
const schemaTree = ref<InstanceType<typeof ElTreeV2>>();
const userStore = useUserStore();
const searchText = ref('');
const searching = ref(false);
const currentNode = ref<IoTDB.TreeNodeData | null>(null);
const modalAddDbVisible = ref(false);
const treeHeight = ref(document.body.clientHeight - 48 - 16 - 36 - 16 - 46);

const { canReadWriteData } = storeToRefs(userStore);
const { treeData, databaseNames } = storeToRefs(useDbStore());
const { getDatabases } = useDbStore();

const treeProps = {
  value: 'nodeName',
  label: 'nodeName',
  children: 'children',
};

const setDefaultTreeExpandKeys = async () => {
  await getDatabases();
  if (treeData.value && treeData.value.length) {
    const firstNode = treeData.value[0];
    currentNode.value = firstNode;
    emit('handleNodeClick', firstNode);
    setTimeout(() => {
      const expandedKeys = [firstNode.nodeName];
      schemaTree.value?.setExpandedKeys(expandedKeys);
    }, 300);
  }
};

onMounted(() => {
  setDefaultTreeExpandKeys();
});

function handleSearch() {
  searching.value = true;
  setTimeout(() => {
    searching.value = false;
  }, 1000);
}

function handleRefresh() {
  getDatabases();
}

function handleAddDB() {
  modalAddDbVisible.value = true;
}

function handleDatabaseOptionClick(command: string, node: IoTDB.TreeNodeData) {
  currentNode.value = node;
  emit('handleNodeClick', currentNode.value);
}

function handleTableOptionClick(command: string, node: IoTDB.TreeNodeData) {
  currentNode.value = cloneDeep(node);
  if (command === 'tableData') {
    currentNode.value.nodeType = 'TABLEDATA';
    emit('handleNodeClick', currentNode.value);
  }
  if (command === 'tableSchema') {
    emit('handleNodeClick', currentNode.value);
  }
}
</script>
<style lang="scss" scoped>
.db-tree-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.search-refresh-box {
  padding: 16px;
  display: flex;
  align-items: center;
}

.node-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  display: flex;
  align-items: center;
  width: 100px;
  padding-right: 8px;
  flex: 1;
}
</style>
