<template>
  <auth-container :is-auth="true" :content="'common.dataAuth'" style="height: 100%">
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

        <el-button
          link
          @click="
            setFirstLoad(true);
            handleRefresh();
          "
          :disabled="searching"
          id="db-tree-refresh"
          class="svg-button-hover-color m-l-16"
        >
          <i-custom-border-refresh style="width: 24px; height: 24px" />
        </el-button>
        <auth-tooltip :is-disabled="canCreateDatabaseWithTableModel" content="dataManage.needCreatePrivilege">
          <el-button link @click="handleAddDB()" :disabled="disableAddDbButton" id="db-tree-add-db" class="svg-button-hover-color m-l-16">
            <i-custom-add-db-border style="width: 24px; height: 24px" />
          </el-button>
        </auth-tooltip>
      </div>
      <el-tree-v2
        ref="schemaTree"
        :data="filterTreeData()"
        style="background-color: #fff"
        :props="treeProps"
        :indent="8"
        :item-size="28"
        :height="treeHeight"
        :expand-on-click-node="true"
        @current-change="handleSelectNode"
        node-key="id"
      >
        <!-- eslint-disable-next-line vue/no-unused-vars -->
        <template #default="{ node, data }">
          <div class="node-text" :id="`tree-node-content-${data.parentName || data.nodeName}`">
            <el-icon size="18" color="var(--el-color-primary)" class="m-r-[4px]">
              <i-custom-tree-db v-if="data.nodeType === 'DATABASE'" />
              <i-custom-table v-else-if="data.nodeType === 'TABLE'" />
              <div v-else-if="data.nodeType === 'TIME'" class="tree-column-icon-container">
                <el-icon size="14"><i-ep-key /></el-icon>
                <el-tag disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Time</el-tag>
              </div>
              <div v-else-if="data.nodeType === 'TAG'" class="tree-column-icon-container">
                <el-icon size="14"><i-ep-key /></el-icon>
                <el-tag disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Tag</el-tag>
              </div>
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
                    <span>{{ t('dataManage.dbSchema') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="addTable" :disabled="isInformationSchemaNode(data) || !canCreateTable(data)">
                  <el-tooltip
                    placement="top-start"
                    effect="light"
                    trigger="hover"
                    :content="t('dataManage.needCreatePrivilege')"
                    :disabled="canCreateTable(data) || isInformationSchemaNode(data)"
                    popper-class="tooltip-box-width"
                  >
                    <div class="node-text">
                      <i-custom-add-border2-active class="m-r-8" />
                      <span>{{ t('dataManage.addTable') }}</span>
                    </div>
                  </el-tooltip>
                </el-dropdown-item>
                <el-dropdown-item command="dbDelete" :disabled="isInformationSchemaNode(data) || !canDropDatabase(data)">
                  <el-tooltip
                    placement="top-start"
                    effect="light"
                    trigger="hover"
                    :content="t('dataManage.needDropPrivilege')"
                    :disabled="canDropDatabase(data) || isInformationSchemaNode(data)"
                    popper-class="tooltip-box-width"
                  >
                    <div class="node-text">
                      <i-custom-delete-active class="m-r-8" />
                      <span>{{ t('dataManage.deleteDb') }}</span>
                    </div>
                  </el-tooltip>
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
                    <span>{{ t('dataManage.tableSchema') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="tableData" :disabled="!isInformationSchemaNode(data) && !canViewTableData(data)">
                  <el-tooltip
                    placement="top-start"
                    effect="light"
                    trigger="hover"
                    :content="t('common.needQueryDataPermission')"
                    :disabled="isInformationSchemaNode(data) || canViewTableData(data)"
                    popper-class="tooltip-box-width"
                  >
                    <div class="node-text">
                      <i-custom-data class="m-r-8" />
                      <span>{{ t('dataManage.tableData') }}</span>
                    </div>
                  </el-tooltip>
                </el-dropdown-item>
                <el-dropdown-item command="addCloumn" :disabled="isInformationSchemaNode(data) || !canAlterColumn(data)">
                  <el-tooltip
                    placement="top-start"
                    effect="light"
                    trigger="hover"
                    :content="t('dataManage.needAlterPrivilege')"
                    :disabled="canAlterColumn(data) || isInformationSchemaNode(data)"
                    popper-class="tooltip-box-width"
                  >
                    <div class="node-text">
                      <i-custom-add-border2-active class="m-r-8" />
                      <span>{{ t('dataManage.newColumn') }}</span>
                    </div>
                  </el-tooltip>
                </el-dropdown-item>
                <el-dropdown-item command="tableDelete" :disabled="isInformationSchemaNode(data) || !canDropTable(data)">
                  <el-tooltip
                    placement="top-start"
                    effect="light"
                    trigger="hover"
                    :content="t('dataManage.needDropPrivilege')"
                    :disabled="canDropTable(data) || isInformationSchemaNode(data)"
                    popper-class="tooltip-box-width"
                  >
                    <div class="node-text">
                      <i-custom-delete-active class="m-r-8" />
                      <span>{{ t('dataManage.deleteTable') }}</span>
                    </div>
                  </el-tooltip>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-tree-v2>
      <modal-add-db v-model:visible="modalAddDbVisible" @handle-save="handleRefresh" />
      <modal-add-table ref="addTableDialog" @handle-reload="handleRefresh" />
    </div>
  </auth-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useDbStore, useConnectionStore, useUserStore } from '@/stores';
import { IoTDBApi } from '@/api';
import type { ElTreeV2 } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import ModalAddDb from './modal-add-db.vue';
import ModalAddTable from './modal-add-table.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import type { TableTreeNodeData } from '@/types';

const emit = defineEmits<{
  (event: 'handleNodeClick', nodeInfo: TableTreeNodeData): void;
  (event: 'updateDetail'): void;
}>();

const { t } = useI18n();
const schemaTree = ref<InstanceType<typeof ElTreeV2>>();
const searchText = ref('');
const searching = ref(false);
const currentNode = ref<TableTreeNodeData>();
const currentNodeShow = ref<TableTreeNodeData>();
const modalAddDbVisible = ref(false);
const treeHeight = ref(document.body.clientHeight - 116);
const addTableDialog = ref<InstanceType<typeof ModalAddTable>>();
const { requestFn: deleteDatabase } = useRequest(IoTDBApi.deleteDatabase);
const { requestFn: deleteTables } = useRequest(IoTDBApi.deleteTables);

const dbStore = useDbStore();
const { treeData, activeKeyList } = storeToRefs(dbStore);
const { getDatabases, setFirstLoad, setActiveList } = dbStore;

const userStore = useUserStore();
const { canCreateDatabaseWithTableModel, canManageDatabase, canWriteSchema, canReadWriteData } = storeToRefs(userStore);
const connectionStore = useConnectionStore();
const { isTableModel } = storeToRefs(connectionStore);

const disableAddDbButton = computed(() => searching.value || !canCreateDatabaseWithTableModel.value);

function canDropDatabase(node?: TableTreeNodeData) {
  if (!node) return false;
  if (isTableModel.value) return userStore.hasTableModelPrivilege('DROP', node.nodeName);
  return canManageDatabase.value;
}

function canDropTable(node?: TableTreeNodeData) {
  if (!node) return false;
  const dbName = node.database || node.parentName || '';
  if (isTableModel.value) return userStore.hasTableModelPrivilege('DROP', dbName, node.nodeName);
  return canWriteSchema.value;
}

function canCreateTable(node?: TableTreeNodeData) {
  if (!node) return false;
  if (isTableModel.value) return userStore.hasTableModelPrivilege('CREATE', node.nodeName);
  return canWriteSchema.value;
}

function canAlterColumn(node?: TableTreeNodeData) {
  if (!node) return false;
  const dbName = node.database || node.parentName || '';
  if (isTableModel.value) return userStore.hasTableModelPrivilege('ALTER', dbName, node.nodeName);
  return canWriteSchema.value;
}

function canViewTableData(node?: TableTreeNodeData) {
  if (!node) return false;
  if (isInformationSchemaNode(node)) return true;
  const dbName = node.database || node.parentName || '';
  if (isTableModel.value) return userStore.hasTableModelPrivilege('SELECT', dbName, node.nodeName);
  return canReadWriteData.value;
}

const treeProps = {
  value: 'id',
  label: 'nodeName',
  children: 'children',
};

function isInformationSchemaNode(node?: TableTreeNodeData) {
  return node?.nodeName === 'information_schema' || node?.database === 'information_schema' || node?.parentName === 'information_schema';
}

function showAddTableDialog(nodeInfo: TableTreeNodeData, addType: string) {
  if (addTableDialog.value) {
    addTableDialog.value?.open(nodeInfo, addType);
  }
}

const setDefaultTreeExpandKeys = async () => {
  await getDatabases();
  await nextTick();
  if (treeData.value && treeData.value.length) {
    let activeNode = treeData.value[0]!;
    if (activeKeyList.value.length) {
      if (activeKeyList.value.length === 2) {
        const activeDb = treeData.value.find((node) => node.id === activeKeyList.value[0]);
        const activeTable = activeDb?.children?.find((node) => node.id === activeKeyList.value[1]);
        if (activeTable) activeNode = activeTable;
      } else {
        const activeDb = treeData.value.find((node) => node.id === activeKeyList.value[0]);
        if (activeDb) activeNode = activeDb;
      }
    }
    currentNode.value = activeNode;
    if (currentNodeShow?.value?.id !== activeNode.id) {
      currentNodeShow.value = activeNode;
      emit('handleNodeClick', activeNode);
      setTimeout(() => {
        schemaTree.value?.setExpandedKeys(activeKeyList.value);
      }, 300);
    }
  }
};

function filterTreeData(): TableTreeNodeData[] {
  const searchTextLower = searchText.value.toLowerCase();

  const filterNode = (node: TableTreeNodeData): TableTreeNodeData | null => {
    const nodeCopy = cloneDeep(node);
    const isCurrentMatch = node.nodeName.toLowerCase().includes(searchTextLower);
    if (isCurrentMatch) {
      return nodeCopy;
    }

    nodeCopy.children = [];

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

  const result: TableTreeNodeData[] = [];
  treeData.value.forEach((dbNode) => {
    const filteredNode = filterNode(dbNode);
    if (filteredNode) {
      result.push(filteredNode);
    }
  });

  return result;
}

onMounted(() => {
  void setDefaultTreeExpandKeys();
});

function handleSearch() {
  searching.value = true;
  setTimeout(() => {
    searching.value = false;
  }, 1000);
}

async function handleRefresh() {
  setFirstLoad(true);
  await setDefaultTreeExpandKeys();
  emit('updateDetail');
}

function handleAddDB() {
  modalAddDbVisible.value = true;
}

// 删除数据库
function handleDelDb(dbNode: TableTreeNodeData) {
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
      setFirstLoad(true);
      if (currentNodeShow.value?.database === currentNode.value?.nodeName) {
        setDefaultTreeExpandKeys();
      } else {
        handleRefresh();
      }
    });
  });
}

function handleDelTable(tableNode: TableTreeNodeData) {
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
      setFirstLoad(true);
      if (currentNodeShow.value?.nodeName === currentNode.value?.nodeName) {
        setActiveList([`${currentNodeShow.value?.database}`]);
        setDefaultTreeExpandKeys();
      } else {
        handleRefresh();
      }
    });
  });
}

function handleDatabaseOptionClick(command: string, node: TableTreeNodeData) {
  currentNode.value = node;
  if (command === 'dbSchema') {
    currentNodeShow.value = cloneDeep(node);
    emit('handleNodeClick', currentNode.value);
  } else if (command === 'addTable') {
    showAddTableDialog(currentNode.value, 'addTable');
  } else if (command === 'dbDelete') {
    handleDelDb(node);
  }
}

function handleTableOptionClick(command: string, node: TableTreeNodeData) {
  currentNode.value = cloneDeep(node);
  if (command === 'tableData') {
    currentNodeShow.value = cloneDeep(node);
    currentNode.value.nodeType = 'TABLEDATA';
    emit('handleNodeClick', currentNode.value);
  } else if (command === 'tableSchema') {
    currentNodeShow.value = cloneDeep(node);
    emit('handleNodeClick', currentNode.value);
  } else if (command === 'addCloumn') {
    showAddTableDialog(currentNode.value, 'addColumn');
  } else if (command === 'tableDelete') {
    handleDelTable(node);
  }
}

function handleSelectNode(payload: { [key: string]: any }) {
  const data = payload as TableTreeNodeData;
  if (data && data.id && (data.nodeType === 'DATABASE' || data.nodeType === 'TABLE')) {
    currentNode.value = data;
    currentNodeShow.value = cloneDeep(data);
    emit('handleNodeClick', currentNode.value);
  }
}

watch(
  () => treeData.value,
  () => {
    setDefaultTreeExpandKeys();
  },
);
</script>
<style lang="scss" scoped>
.db-tree-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.search-refresh-box {
  padding: 8px;
  display: flex;
  align-items: center;
}

.node-text {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  display: flex;
  align-items: center;
  width: 100px;
  padding-right: 8px;
  flex: 1;
}

.tree-column-icon-container {
  display: flex;
  align-items: center;
  margin-left: -12px;
}

.tree-column-type-tag {
  font-style: normal;
  width: 28px;
  height: 16px;
  font-size: 10px;
  margin-right: 12px;
}

.lang-icon,
.svg-button-hover-color {
  &:focus-visible {
    outline: none;
  }
}
</style>
