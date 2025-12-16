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
          clearable
        />
        <!-- <el-button
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
        <el-button link @click="handleAddDB()" :disabled="searching" id="db-tree-add-db" class="svg-button-hover-color m-l-16">
          <i-custom-add-db-border style="width: 24px; height: 24px" />
        </el-button> -->
      </div>
      <el-tree-v2
        ref="schemaTree"
        :data="filteredTreeData"
        style="background-color: #fff; overflow-y: auto"
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
          <div
            class="node-text"
            :id="`tree-node-content-${data.parentName || data.nodeName}`"
            :draggable="data.nodeType === 'DEVICE-MEASUREMENT'"
            @dblclick.stop="handleNodeDoubleClick(data)"
            @dragstart="handleNodeDragStart($event, data)"
          >
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
              <el-tag v-else-if="data.nodeType === 'DEVICE-MEASUREMENT'" disable-transitions type="success" effect="plain" class="tree-column-type-tag" style="width: auto">M</el-tag>
            </el-icon>
            <span class="node-label" :title="data.nodeName + (data.comment ? ` (${data.comment})` : '')"> {{ data.nodeName }}{{ data.comment ? ` (${data.comment})` : '' }} </span>
          </div>
          <!-- <el-dropdown v-if="data.nodeType === 'DATABASE'" trigger="click" @command="handleDatabaseOptionClick($event, data)">
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
                <el-dropdown-item command="addTable" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-add-border2-active class="m-r-8" />
                    <span>{{ t('dataManage.addTable') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="dbDelete" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-delete-active class="m-r-8" />
                    <span>{{ t('dataManage.deleteDb') }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown> -->
          <!-- <el-dropdown v-if="data.nodeType === 'TABLE'" trigger="click" @command="handleTableOptionClick($event, data)">
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
                <el-dropdown-item command="tableData">
                  <div class="node-text">
                    <i-custom-data class="m-r-8" />
                    <span>{{ t('dataManage.tableData') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="addCloumn" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-add-border2-active class="m-r-8" />
                    <span>{{ t('dataManage.newColumn') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="tableDelete" :disabled="data.database === 'information_schema'">
                  <div class="node-text">
                    <i-custom-delete-active class="m-r-8" />
                    <span>{{ t('dataManage.deleteTable') }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown> -->
          <el-button v-if="data.nodeType === 'TABLE'" class="button-style" @click.stop="handleAddMeasurements(data.database, data.nodeName)">
            <el-icon size="20"><i-custom-add /></el-icon>
          </el-button>
          <el-button v-if="data.nodeType === 'DEVICE-MEASUREMENT'" class="button-style" @click.stop="handleDeleteMeasurements(data)">
            <el-icon size="20"><i-custom-close /></el-icon>
          </el-button>
        </template>
      </el-tree-v2>
      <modal-add-db v-model:visible="modalAddDbVisible" @handle-save="handleRefresh" />
      <modal-add-table ref="addTableDialog" @handle-reload="handleRefresh" />
      <ModalTableMeasurement
        ref="modalTableMeasurementRef"
        v-model:visible="tableMeasurementVisible"
        :current-database="selectedDatabase"
        :current-table="selectedTable"
        @confirm="handleConfirmMeasurement"
      />
    </div>
  </auth-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useDbStore } from '@/stores';
import type { ElTreeV2 } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import ModalTableMeasurement from './modal-table-measurement.vue';
import ModalAddDb from '../../table-data/components/modal-add-db.vue';
import ModalAddTable from '../../table-data/components/modal-add-table.vue';
import type { TableTreeNodeData, SelectedMeasurement } from '@/types';

const props = withDefaults(
  defineProps<{
    namespace?: string;
  }>(),
  {
    namespace: 'default',
  },
);

const emit = defineEmits<{
  (event: 'handleNodeClick', nodeInfo: TableTreeNodeData): void;
  (event: 'updateDetail'): void;
  (event: 'updateSelectedMeasurements', payload: SelectedMeasurement[]): void;
  (event: 'deleteMeasurement', fullPath: string): void;
  (event: 'doubleClickMeasurement', fullPath: string): void;
}>();

const { t } = useI18n();
const schemaTree = ref<InstanceType<typeof ElTreeV2>>();
const searchText = ref('');
const searching = ref(false);
const currentNode = ref<TableTreeNodeData>();
const currentNodeShow = ref<TableTreeNodeData>();
const modalAddDbVisible = ref(false);
const treeHeight = ref(document.body.clientHeight - 150);
// const addTableDialog = ref<InstanceType<typeof ModalAddTable>>();
// const { requestFn: deleteDatabase } = useRequest(IoTDBApi.deleteDatabase);
// const { requestFn: deleteTables } = useRequest(IoTDBApi.deleteTables);

const { treeData, activeKeyList } = storeToRefs(useDbStore());
const { getDatabases /* setFirstLoad, setActiveList */ } = useDbStore();

const selectedMeasurementsData = ref<TableTreeNodeData[]>([]);
const tableMeasurementVisible = ref(false);
const selectedDatabase = ref<string>('');
const selectedTable = ref<string>('');
const selectedMeasurements = ref<SelectedMeasurement[]>([]);
const modalTableMeasurementRef = ref<InstanceType<typeof ModalTableMeasurement>>();

const treeProps = {
  value: 'id',
  label: 'nodeName',
  children: 'children',
};

function getStorageKey() {
  return `measurement-tree-${props.namespace}`;
}

function saveToStorage() {
  const dataToSave: Record<string, SelectedMeasurement[]> = {};
  selectedMeasurementsData.value.forEach((dbNode) => {
    dbNode.children?.forEach((tbNode) => {
      if (tbNode.children && tbNode.children.length > 0) {
        const key = `${dbNode.nodeName}.${tbNode.nodeName}`;
        const measurements = tbNode.children.map((child, index) => {
          return selectedMeasurements.value[index] || { device: [], measurement: child.nodeName };
        });
        dataToSave[key] = measurements;
      }
    });
  });
  window.sessionStorage.setItem(getStorageKey(), JSON.stringify(dataToSave));
}

function loadFromStorage(): Record<string, SelectedMeasurement[]> {
  const saved = window.sessionStorage.getItem(getStorageKey());
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  }
  return {};
}

const filteredTreeData = computed(() => {
  if (!searchText.value.trim()) {
    return selectedMeasurementsData.value;
  }
  const keyword = searchText.value.toLowerCase();
  return filterTreeData(selectedMeasurementsData.value, keyword);
});

function filterTreeData(data: TableTreeNodeData[], keyword: string): TableTreeNodeData[] {
  const result: TableTreeNodeData[] = [];
  data.forEach((node) => {
    const nodeCopy = cloneDeep(node);
    const isMatch = node.nodeName.toLowerCase().includes(keyword);
    if (node.children && node.children.length > 0) {
      const filteredChildren = filterTreeData(node.children, keyword);
      if (filteredChildren.length > 0) {
        nodeCopy.children = filteredChildren;
        result.push(nodeCopy);
      } else if (isMatch) {
        nodeCopy.children = [];
        result.push(nodeCopy);
      }
    } else if (isMatch) {
      result.push(nodeCopy);
    }
  });
  return result;
}

const handleConfirmMeasurement = (selected: SelectedMeasurement[]) => {
  selectedMeasurements.value = selected;
  console.log('Selected Measurements:', selectedMeasurements.value);
  addMeasurementsOfDbTbIntoTree();
  saveToStorage();
  tableMeasurementVisible.value = false;
  emit('updateSelectedMeasurements', selectedMeasurements.value);
};

function addMeasurementsOfDbTbIntoTree() {
  if (!selectedMeasurementsData.value) return;
  for (const dbNode of selectedMeasurementsData.value) {
    if (dbNode.nodeName === selectedDatabase.value) {
      for (const tbNode of dbNode.children || []) {
        if (tbNode.nodeName === selectedTable.value) {
          tbNode.children = [];
          for (const [index, meas] of selectedMeasurements.value.entries()) {
            let deviceName = '';
            for (const curTag of meas.device) {
              deviceName += `${curTag.value}.`;
            }
            deviceName = deviceName.slice(0, -1);
            tbNode.children.push({
              id: `${props.namespace}-${selectedDatabase.value}-${selectedTable.value}-${index}`,
              nodeName: `${deviceName}.${meas.measurement}`,
              nodeType: 'DEVICE-MEASUREMENT',
              parentName: tbNode.nodeName,
              database: dbNode.nodeName,
              children: [],
            });
          }
          console.log('Updated Data:', selectedMeasurementsData.value);
          selectedMeasurementsData.value = [...selectedMeasurementsData.value];
          return;
        }
      }
    }
  }
}

function handleAddMeasurements(database: string, table: string) {
  selectedDatabase.value = database;
  selectedTable.value = table;
  tableMeasurementVisible.value = true;
}

function handleNodeDoubleClick(data: TableTreeNodeData) {
  if (data.nodeType === 'DEVICE-MEASUREMENT') {
    emit('doubleClickMeasurement', `${data.database}.${data.parentName}.${data.nodeName}`);
  }
}

function handleNodeDragStart(event: DragEvent, data: TableTreeNodeData) {
  if (data.nodeType === 'DEVICE-MEASUREMENT') {
    const measurementFullPath = `${data.database}.${data.parentName}.${data.nodeName}`;
    event.dataTransfer?.setData('text/plain', measurementFullPath);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}

function handleDeleteMeasurements(nodeInfo: TableTreeNodeData) {
  if (!selectedMeasurementsData.value) return;
  for (const dbNode of selectedMeasurementsData.value) {
    if (dbNode.nodeName === nodeInfo.database) {
      for (const tbNode of dbNode.children || []) {
        if (tbNode.nodeName === nodeInfo.parentName) {
          tbNode.children = tbNode.children?.filter((child) => child.id !== nodeInfo.id);
          selectedMeasurementsData.value = [...selectedMeasurementsData.value];
          modalTableMeasurementRef.value?.removeMeasurement(Number(nodeInfo.id?.split('-').pop()));
          saveToStorage();
          const last = String(nodeInfo.id).split('-').pop();
          const index = last ? Number(last) : -1;
          if (index >= 0 && !Number.isNaN(index)) {
            emit('deleteMeasurement', `${nodeInfo.database}.${nodeInfo.parentName}.${nodeInfo.nodeName}`);
          }
          return;
        }
      }
    }
  }
}

// function showAddTableDialog(nodeInfo: TableTreeNodeData, addType: string) {
//   if (addTableDialog.value) {
//     addTableDialog.value?.open(nodeInfo, addType);
//   }
// }

const setDefaultTreeExpandKeys = async () => {
  await getDatabases();
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

function initSelectedMeasurementsData() {
  selectedMeasurementsData.value = [];
  const savedData = loadFromStorage();

  const result: TableTreeNodeData[] = [];
  treeData.value.forEach((dbNode) => {
    if (dbNode.nodeName === 'information_schema') {
      return;
    }
    const dbCopy: TableTreeNodeData = {
      id: `${props.namespace}-${dbNode.id}`,
      nodeName: dbNode.nodeName,
      nodeType: dbNode.nodeType,
      children: [],
    };
    if (dbNode.children) {
      dbNode.children.forEach((tableNode) => {
        const tableCopy: TableTreeNodeData = {
          id: `${props.namespace}-${tableNode.id}`,
          nodeName: tableNode.nodeName,
          nodeType: tableNode.nodeType,
          parentName: dbNode.nodeName,
          database: dbNode.nodeName,
          children: [],
        };

        const key = `${dbNode.nodeName}.${tableNode.nodeName}`;
        const savedMeasurements = savedData[key] || [];
        savedMeasurements.forEach((meas, index) => {
          let deviceName = '';
          for (const curTag of meas.device) {
            deviceName += `${curTag.value}.`;
          }
          deviceName = deviceName.slice(0, -1);
          tableCopy.children?.push({
            id: `${props.namespace}-${dbNode.nodeName}-${tableNode.nodeName}-${index}`,
            nodeName: `${deviceName}.${meas.measurement}`,
            nodeType: 'DEVICE-MEASUREMENT',
            parentName: tableNode.nodeName,
            database: dbNode.nodeName,
            children: [],
          });
        });

        dbCopy.children?.push(tableCopy);
      });
    }
    result.push(dbCopy);
  });
  selectedMeasurementsData.value = result;
}

onMounted(() => {
  setDefaultTreeExpandKeys();
  initSelectedMeasurementsData();
});

function handleSearch() {
  searching.value = true;
  setTimeout(() => {
    searching.value = false;
  }, 1000);
}

function handleRefresh() {
  emit('updateDetail');
}

function handleSelectNode(payload: Record<string, unknown>) {
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
    initSelectedMeasurementsData();
  },
);
defineExpose({
  getSelectedMeasurements: () => loadFromStorage(),
  clearAllMeasurements: () => {
    window.sessionStorage.removeItem(getStorageKey());
    initSelectedMeasurementsData();
  },
});
</script>

<style lang="scss" scoped>
.button-style {
  border: none;
  padding-right: 0 !important;
  padding-left: 0 !important;
  min-width: 30px !important;
  margin-right: 5px;
  background-color: transparent;
}

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

.node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
