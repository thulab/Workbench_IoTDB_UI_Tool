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
        <button
          @click="handleResetMeasurements"
          class="reset-button h-[24px] w-[24px] box-border p-[0]! bg-white cursor-pointer rounded-[4px] flex justify-center items-center ml-[16px]"
          :disabled="selectedMeasurements.length === 0"
          :style="selectedMeasurements.length === 0 ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'"
        >
          <i-custom-refresh />
        </button>
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
        <template #default="{ data }">
          <div
            class="node-text"
            :id="`tree-node-content-${data.parentName || data.nodeName}`"
            :draggable="data.nodeType === 'DEVICE-MEASUREMENT'"
            @dblclick.stop="handleNodeDoubleClick(data)"
            @dragstart="handleNodeDragStart($event, data)"
          >
            <el-icon size="18" color="var(--el-color-primary)" :class="data.nodeType === 'DEVICE-MEASUREMENT' ? 'm-l-[-18px]' : 'm-r-[4px]'">
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
              <!-- <el-tag v-else-if="data.nodeType === 'DEVICE-MEASUREMENT'" disable-transitions type="success" effect="plain" class="tree-column-type-tag" style="width: auto">M</el-tag> -->
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
            <el-icon size="20"><i-custom-add-border2 /></el-icon>
          </el-button>
          <el-button v-if="data.nodeType === 'DEVICE-MEASUREMENT'" class="button-style" @click.stop="handleDeleteMeasurements(data)">
            <el-icon size="20"><i-custom-delete /></el-icon>
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
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

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
  (event: 'reset-graph'): void;
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
        const measurements: SelectedMeasurement[] = [];
        tbNode.children.forEach((child) => {
          // 从 selectedMeasurements 中找到对应的测点数据
          const deviceName = child.nodeName.includes('.') ? child.nodeName.substring(0, child.nodeName.lastIndexOf('.')) : '';
          const measurementName = child.nodeName.includes('.') ? child.nodeName.substring(child.nodeName.lastIndexOf('.') + 1) : child.nodeName;

          const matchedMeasurement = selectedMeasurements.value.find((m) => {
            return m.database === dbNode.nodeName && m.tableName === tbNode.nodeName && m.device.map((d) => d.value).join('.') === deviceName && m.measurement === measurementName;
          });

          if (matchedMeasurement) {
            measurements.push(matchedMeasurement);
          } else {
            // 如果找不到匹配的，使用默认结构
            // const device = deviceName ? deviceName.split('.').map((value) => ({ value })) : [];
            // measurements.push({ device, measurement: measurementName });
            measurements.push({
              database: dbNode.nodeName,
              tableName: tbNode.nodeName,
              device: deviceName
                ? deviceName.split('.').map((value) => ({
                    variable: '',
                    value,
                  }))
                : [],
              condition: '',
              measurement: measurementName,
            });
          }
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

function handleResetMeasurements() {
  ElMessageBox.confirm(t('dataTrend.resetMeasurementTip'), t('common.warmTip'), {
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      selectedMeasurements.value = [];
      selectedMeasurementsData.value = [];
      saveToStorage();
      initSelectedMeasurementsData();
      emit('reset-graph');
    })
    .catch(() => {
      // do nothing on cancel
    });
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
  for (const meas of selected) {
    if (
      selectedMeasurements.value.findIndex(
        (m) =>
          m.database === meas.database && m.tableName === meas.tableName && m.device.map((d) => d.value).join('.') === meas.device.map((d) => d.value).join('.') && m.measurement === meas.measurement,
      ) === -1
    ) {
      selectedMeasurements.value.push(meas);
    }
  }
  // selectedMeasurements.value = selected;
  addMeasurementsOfDbTbIntoTree();
  saveToStorage();
  tableMeasurementVisible.value = false;
  emit('updateSelectedMeasurements', selectedMeasurements.value);
};

// selectedMeasurements -> selectedMeasurementsData
function addMeasurementsOfDbTbIntoTree() {
  if (!selectedMeasurementsData.value) return;
  for (const dbNode of selectedMeasurementsData.value) {
    if (dbNode.nodeName === selectedDatabase.value) {
      for (const tbNode of dbNode.children || []) {
        if (tbNode.nodeName === selectedTable.value) {
          tbNode.children = [];
          for (const meas of selectedMeasurements.value) {
            let deviceName = '';
            for (const curTag of meas.device) {
              deviceName += `${curTag.value}.`;
            }
            deviceName = deviceName.slice(0, -1);
            tbNode.children.push({
              id:
                deviceName === ''
                  ? `${props.namespace}-${selectedDatabase.value}-${selectedTable.value}-${meas.measurement}`
                  : `${props.namespace}-${selectedDatabase.value}-${selectedTable.value}-${deviceName}-${meas.measurement}`,
              nodeName: deviceName === '' ? meas.measurement : `${deviceName}.${meas.measurement}`,
              nodeType: 'DEVICE-MEASUREMENT',
              parentName: tbNode.nodeName,
              database: dbNode.nodeName,
              children: [],
            });
          }
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

          // 同时从 selectedMeasurements 中删除对应的测点
          const deviceName = nodeInfo.nodeName.includes('.') ? nodeInfo.nodeName.substring(0, nodeInfo.nodeName.lastIndexOf('.')) : '';
          const measurementName = nodeInfo.nodeName.includes('.') ? nodeInfo.nodeName.substring(nodeInfo.nodeName.lastIndexOf('.') + 1) : nodeInfo.nodeName;

          selectedMeasurements.value = selectedMeasurements.value.filter((m) => {
            return !(m.database === nodeInfo.database && m.tableName === nodeInfo.parentName && m.device.map((d) => d.value).join('.') === deviceName && m.measurement === measurementName);
          });

          modalTableMeasurementRef.value?.removeMeasurement(Number(nodeInfo.id?.split('-').pop()));
          saveToStorage();

          emit('deleteMeasurement', `${nodeInfo.database}.${nodeInfo.parentName}.${nodeInfo.nodeName}`);
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

  // 恢复 selectedMeasurements 数组
  const restoredMeasurements: SelectedMeasurement[] = [];

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

          // 添加到恢复的测点列表中
          restoredMeasurements.push({
            database: dbNode.nodeName,
            tableName: tableNode.nodeName,
            device: meas.device,
            condition: meas.condition,
            measurement: meas.measurement,
          });
        });

        dbCopy.children?.push(tableCopy);
      });
    }
    result.push(dbCopy);
  });

  selectedMeasurementsData.value = result;
  selectedMeasurements.value = restoredMeasurements;
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
  const data = payload as unknown as TableTreeNodeData;
  if (data && data.id && (data.nodeType === 'DATABASE' || data.nodeType === 'TABLE')) {
    currentNode.value = data;
    currentNodeShow.value = cloneDeep(data);
    emit('handleNodeClick', currentNode.value);
  }
}

function findTableNode(tree: TableTreeNodeData[], database: string, tableName: string): TableTreeNodeData | null {
  for (const dbNode of tree) {
    if (dbNode.nodeType === 'DATABASE' && dbNode.nodeName === database && dbNode.children) {
      for (const tableNode of dbNode.children) {
        if (tableNode.nodeType === 'TABLE' && tableNode.nodeName === tableName) {
          return tableNode;
        }
      }
    }
  }
  return null;
}

function restoreTemplateData(measurements: SelectedMeasurement[]) {
  for (const m of measurements) {
    const tableNode = findTableNode(selectedMeasurementsData.value, m.database, m.tableName);

    if (!tableNode) continue;

    if (!tableNode.children) {
      tableNode.children = [];
    }

    let deviceName = '';
    for (const curTag of m.device) {
      deviceName += `${curTag.value}.`;
    }
    deviceName = deviceName.slice(0, -1);

    // 去重：防止重复插入
    const exists = tableNode.children.some((child) => child.nodeType === 'DEVICE-MEASUREMENT' && child.nodeName === (deviceName === '' ? m.measurement : `${deviceName}.${m.measurement}`));

    if (exists) continue;

    tableNode.children.push({
      id: deviceName === '' ? `${props.namespace}-${m.database}-${m.tableName}-${m.measurement}` : `${props.namespace}-${m.database}-${m.tableName}-${deviceName}-${m.measurement}`,
      nodeName: deviceName === '' ? m.measurement : `${deviceName}.${m.measurement}`,
      database: m.database,
      parentName: m.tableName,
      nodeType: 'DEVICE-MEASUREMENT',
    });
  }
}

const restoreSelectedMeasurements = (measurements: SelectedMeasurement[]) => {
  // 先清空现有的测点数据
  selectedMeasurements.value = [];

  // 清空现有树结构中的测点，但保留数据库和表结构
  selectedMeasurementsData.value.forEach((dbNode) => {
    if (dbNode.children) {
      dbNode.children.forEach((tbNode) => {
        tbNode.children = [];
      });
    }
  });

  // 设置新的测点数据
  selectedMeasurements.value = measurements;
  restoreTemplateData(measurements);
  saveToStorage();

  // 确保数据结构更新
  selectedMeasurementsData.value = [...selectedMeasurementsData.value];

  emit('updateSelectedMeasurements', selectedMeasurements.value);
};

watch(
  () => treeData.value,
  () => {
    setDefaultTreeExpandKeys();
    // 只有在 selectedMeasurementsData 为空时才初始化，避免覆盖模板恢复的数据
    if (selectedMeasurementsData.value.length === 0) {
      initSelectedMeasurementsData();
    }
  },
);

defineExpose({
  restoreSelectedMeasurements,
  getSelectedMeasurements: () => loadFromStorage(),
  clearAllMeasurements: () => {
    window.sessionStorage.removeItem(getStorageKey());
    initSelectedMeasurementsData();
  },
});
</script>

<style lang="scss" scoped>
.reset-button {
  border: 1px solid #dfe1ed;
}

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
  padding: 8px;
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
