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

        <el-button link @click="handleRefresh" :disabled="searching" id="db-tree-refresh" class="svg-button-hover-color m-l-16">
          <i-custom-border-refresh style="width: 24px; height: 24px" />
        </el-button>
        <el-button link @click="handleAddDB()" :disabled="searching" id="db-tree-add-db" class="svg-button-hover-color m-l-16">
          <i-custom-add-db-border style="width: 24px; height: 24px" />
        </el-button>
      </div>
      <el-tree-v2
        ref="schemaTree"
        :data="filterTreeData()"
        style="background-color: #fff; overflow-y: auto"
        :props="treeProps"
        :indent="8"
        :item-size="28"
        :height="treeHeight"
        :expand-on-click-node="true"
      >
        <!-- eslint-disable-next-line vue/no-unused-vars -->
        <template #default="{ node, data }">
          <div class="node-text" :id="`tree-node-content-${data.parentName || data.nodeName}`">
            <el-icon size="18" color="var(--el-color-primary)" class="m-r-[4px]">
              <i-custom-tree-db v-if="data.nodeType === 'DATABASE'" />
              <i-custom-table v-else-if="data.nodeType === 'TABLE'" />
              <el-tag v-else-if="data.nodeType === 'TIME'" disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Time</el-tag>
              <el-tag v-else-if="data.nodeType === 'TAG'" disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Tag</el-tag>
              <el-tag v-else-if="data.nodeType === 'ATTRIBUTE'" disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Attr</el-tag>
              <el-tag v-else-if="data.nodeType === 'FIELD'" disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Field</el-tag>
            </el-icon>
            <text-tooltip :content="data.nodeName + (data.comment ? ` (${data.comment})` : '')" />
          </div>
          <el-dropdown v-if="data.nodeType === 'DATABASE'" trigger="click" @command="handleDatabaseOptionClick($event, data)">
            <span class="lang-icon m-r-20" @click.stop>
              <el-icon size="24" class="svg-button-hover-color"><i-custom-more /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="operate-dropdown">
                <el-dropdown-item command="dbSchema">
                  <div class="node-text">
                    <i-custom-structure class="m-r-8" />
                    <span>{{ t('dataManage.schema') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="addTable" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-add-border2-active class="m-r-8" />
                    <span>{{ t('dataManage.table') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="dbDelete" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-delete-active class="m-r-8" />
                    <span>{{ t('common.delete') }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown v-if="data.nodeType === 'TABLE'" trigger="click" @command="handleTableOptionClick($event, data)">
            <span class="lang-icon m-r-20" @click.stop>
              <el-icon size="24" class="svg-button-hover-color"><i-custom-more /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="operate-dropdown">
                <el-dropdown-item command="tableSchema">
                  <div class="node-text">
                    <i-custom-structure class="m-r-8" />
                    <span>{{ t('dataManage.schema') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="tableData">
                  <div class="node-text">
                    <i-custom-data class="m-r-8" />
                    <span>{{ t('dataManage.data') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="addCloumn" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-add-border2-active class="m-r-8" />
                    <span>{{ t('dataManage.column') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="tableDelete" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-delete-active class="m-r-8" />
                    <span>{{ t('common.delete') }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-tree-v2>
      <modal-add-db v-model:visible="modalAddDbVisible" :database-names="databaseNames" @handle-save="handleRefresh" />
      <modal-add-table ref="addTableDialog" @handle-reload="handleRefresh" />
    </div>
  </auth-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore, useDbStore } from '@/stores';
import { IoTDBApi } from '@/api';
import { type ElTreeV2 } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import ModalAddDb from './modal-add-db.vue';
import ModalAddTable from './modal-add-table.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const emit = defineEmits<{
  (event: 'handleNodeClick', nodeInfo: IoTDB.TreeNodeData): void;
  (event: 'uploadDetail'): void;
}>();

const { t } = useI18n();
const schemaTree = ref<InstanceType<typeof ElTreeV2>>();
const userStore = useUserStore();
const searchText = ref('');
const searching = ref(false);
const currentNode = ref<IoTDB.TreeNodeData>();
const modalAddDbVisible = ref(false);
const treeHeight = ref(document.body.clientHeight - 48 - 16 - 36 - 16 - 46);
const addTableDialog = ref<InstanceType<typeof ModalAddTable>>();
const { requestFn: deleteDatabase } = useRequest(IoTDBApi.deleteDatabase);
const { requestFn: deleteTables } = useRequest(IoTDBApi.deleteTables);

const { canReadWriteData } = storeToRefs(userStore);
const { treeData, databaseNames } = storeToRefs(useDbStore());
const { getDatabases } = useDbStore();

const treeProps = {
  value: 'nodeName',
  label: 'nodeName',
  children: 'children',
};

function showAddTableDialog(nodeInfo: IoTDB.TreeNodeData, addType: string) {
  if (addTableDialog.value) {
    addTableDialog.value?.open(nodeInfo, addType);
  }
}

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

function filterTreeData(): IoTDB.TreeNodeData[] {
  const searchTextLower = searchText.value.toLowerCase();

  const filterNode = (node: IoTDB.TreeNodeData): IoTDB.TreeNodeData | null => {
    const nodeCopy = cloneDeep(node);
    nodeCopy.children = [];

    const isCurrentMatch = node.nodeName.toLowerCase().includes(searchTextLower);

    if (node.children) {
      node.children.forEach((child) => {
        const filteredChild = filterNode(child);
        if (filteredChild) {
          nodeCopy.children?.push(filteredChild);
        }
      });
    }

    return isCurrentMatch || (nodeCopy.children && nodeCopy.children.length > 0) ? nodeCopy : null;
  };

  const result: IoTDB.TreeNodeData[] = [];
  treeData.value.forEach((dbNode) => {
    const filteredNode = filterNode(dbNode);
    if (filteredNode) {
      result.push(filteredNode);
    }
  });

  return result;
}

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
  emit('uploadDetail');
}

function handleAddDB() {
  modalAddDbVisible.value = true;
}

// 删除数据库
function handleDelDb(dbNode: IoTDB.TreeNodeData) {
  ElMessageBox.confirm(t('dataManage.delDbSingleTip'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'mesaurement-table-del-confirm',
    cancelButtonClass: 'mesaurement-table-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    deleteDatabase(dbNode.nodeName).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      handleRefresh();
    });
  });
}

function handleDelTable(tableNode: IoTDB.TreeNodeData) {
  ElMessageBox.confirm(t('dataManage.delTableSingleTip'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'mesaurement-table-del-confirm',
    cancelButtonClass: 'mesaurement-table-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    const delTableList = tableNode?.nodeName ? [tableNode.nodeName] : [];
    deleteTables(tableNode.database!, delTableList).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      handleRefresh();
    });
  });
}

function handleDatabaseOptionClick(command: string, node: IoTDB.TreeNodeData) {
  currentNode.value = node;
  if (command === 'dbSchema') {
    emit('handleNodeClick', currentNode.value);
  } else if (command === 'addTable') {
    showAddTableDialog(currentNode.value, 'addTable');
  } else if (command === 'dbDelete') {
    handleDelDb(node);
  }
}

function handleTableOptionClick(command: string, node: IoTDB.TreeNodeData) {
  currentNode.value = cloneDeep(node);
  if (command === 'tableData') {
    currentNode.value.nodeType = 'TABLEDATA';
    emit('handleNodeClick', currentNode.value);
  } else if (command === 'tableSchema') {
    emit('handleNodeClick', currentNode.value);
  } else if (command === 'addCloumn') {
    showAddTableDialog(currentNode.value, 'addColumn');
  } else if (command === 'tableDelete') {
    handleDelTable(node);
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

.tree-column-type-tag {
  font-style: normal;
  width: 28px;
  height: 16px;
  font-size: 10px;
  margin-right: 12px;
}
</style>
