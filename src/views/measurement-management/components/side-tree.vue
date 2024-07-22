<template>
  <auth-container :is-auth="canReadWriteSchema" :content="'common.schemaAuth'">
    <div class="measurement-tree-wrapper">
      <div class="search-refresh-box">
        <el-input :placeholder="t('measurement.searchPlaceholder')" v-model="searchText" id="measurement-tree-input" @keyup.enter="handleSearch" class="measurement-tree-search-input" />

        <el-button link @click="handleRefresh" id="measurement-tree-refresh" class="svg-button-hover-color m-l-16">
          <i-custom-border-refresh style="width: 24px; height: 24px" />
        </el-button>
      </div>

      <div class="measurement-tree-box" v-loading="initialLoading">
        <el-tree-v2
          ref="measurementTree"
          style="max-width: 240px"
          :data="paginationTree"
          :props="treeProps"
          :indent="8"
          :item-size="28"
          :height="treeHeight"
          :expand-on-click-node="true"
          :default-expanded-keys="[expandNode]"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <!-- <div :style="`display: flex; width: ${nodeTextWidth(node)}px;`">
              <text-tooltip :content="data.node" />
            </div> -->
            <div v-if="data.nodeType !== 'PAGE'" class="node-text" :style="{ width: `${nodeTextWidth(node, data)}px` }">
              <el-icon size="16" v-if="data.nodeType === 'DATABASE' && data.node !== 'root'"><i-custom-storage-num /></el-icon>
              <el-icon size="16" v-if="data.nodeType === 'TIMESERIES'"><i-custom-measure-num /></el-icon>
              {{ data.node }}
            </div>
            <el-dropdown
              v-if="data.nodeType !== 'PAGE' && data.nodePath !== 'root.__system'"
              trigger="click"
              :id="`tree-node-dropdown-${data.nodePath}`"
              class="more-icon svg-button-hover-color"
              @command="(val) => handleCommand(val, data)"
            >
              <i-custom-more
                @click="
                  (e) => {
                    e.stopPropagation();
                  }
                "
                class="more-icon svg-button-hover-color"
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="database" v-if="data.node === 'root' || data.nodeType === 'SG INTERNAL'" :id="`tree-node-dropdown-new-database-${data.nodePath}`">
                    {{ t('measurement.newDataBase') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="measurement" v-if="data.nodeType !== 'TIMESERIES'" :id="`tree-node-dropdown-new-measurement-${data.nodePath}`">
                    {{ t('measurement.newMeasurement') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" v-if="data.node !== 'root'" :id="`tree-node-dropdown-delete-${data.inodePathd}`">
                    {{ t('common.delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div class="tree-node-operation-buttons" v-if="data.nodeType === 'PAGE'">
              <el-button type="primary" @click="(e) => handleNext(e, data)" :id="`tree-node-${data.nodePath}-more`" class="svg-button-hover-color">
                {{ t('common.viewMore') }}
              </el-button>
              <el-button @click="(e) => handleAll(e, data)" :id="`tree-node-${data.nodePath}-all`" class="svg-button-hover-color">
                {{ t('common.viewAll') }}
              </el-button>
            </div>
          </template>
        </el-tree-v2>
      </div>

      <modal-database v-model:visible="databaseVisible" @handleSave="handleRefresh" />
      <modal-measurement v-model:visible="measurementVisible" :device-name="currentDatabase" @handleSave="handleRefresh" />
    </div>
  </auth-container>
</template>

<script setup lang="ts">
import type { ElTreeV2 } from 'element-plus';
import type { TreeNode, TreeNodeData } from 'element-plus/es/components/tree-v2/src/types';
import { debounce, cloneDeep } from 'lodash-es';
import { useRoute } from 'vue-router';
import { StorageApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalDatabase from './modal-database.vue';
import ModalMeasurement from './modal-measurement.vue';

const treeProps = {
  value: 'nodePath',
  label: 'nodePath',
  children: 'children',
};

const props = defineProps<{
  canReadWriteSchema: boolean;
}>();

const emit = defineEmits<{
  (event: 'handleChangeNode', path: string, type: string): void;
}>();

const pageSize = 2;

const { t } = useI18n();
const route = useRoute();
const searchText = ref('');
const measurementTree = ref<InstanceType<typeof ElTreeV2>>();
const databaseVisible = ref(false);
const measurementVisible = ref(false);
const currentDatabase = ref('');
const initialLoading = ref(false);
const expandNode = ref((route.query.databse as string) || 'root');

// DATABASE, SG INTERNAL, INTERNAL, DEVICE, TIMESERIES
const treeData = ref<Array<StorageDevice.TreeNodeData>>([
  {
    node: 'root',
    nodePath: 'root',
    nodeType: 'DATABASE',
    parentPath: '',
    children: [],
  },
]);

const paginationTree = ref<Array<StorageDevice.TreeNodeData>>([
  {
    node: 'root',
    nodePath: 'root',
    nodeType: 'DATABASE',
    parentPath: '',
    children: [],
  },
]);

const { requestFn: getNextNodeInfos } = useRequest(StorageApi.getNextNodeInfos);
const { requestFn: deleteDatabase } = useRequest(StorageApi.deleteDatabase);
const { requestFn: deleteMeasurements } = useRequest(StorageApi.deleteMeasurements);

const treeHeight = ref(document.body.clientHeight - 48 - 100);

const onResize = debounce(() => {
  // 48 header
  // 100 = 32(padding)+60(search)+8(scrollbar)
  treeHeight.value = document.body.clientHeight - 48 - 100;
}, 500);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nodeTextWidth(node: TreeNode, data: TreeNodeData) {
  // 44 = 24 展开收缩 + 16 右侧更多操作 + 4 文字与操作icon间距
  // 8 缩进大小
  // 根据类型 减去 icon 大小
  let width = 240 - 44 - ((+node.level! || 1) - 1) * 8;
  if ((data.nodeType === 'DATABASE' && data.node !== 'root') || data.nodeType === 'TIMESERIES') {
    width -= 16;
  }
  return width;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTreeData() {
  initialLoading.value = true;
  getNextNodeInfos('root')
    .then((res) => {
      const data = res.data || [];
      treeData.value = [
        {
          node: 'root',
          nodePath: 'root',
          nodeType: 'DATABASE',
          parentPath: '',
          children: cloneDeep(data),
        },
      ];
      const rootTotal = Math.ceil(data.length / pageSize);
      paginationTree.value = [
        {
          node: 'root',
          nodePath: 'root',
          nodeType: 'DATABASE',
          parentPath: '',
          children: data.slice(0, 1 * pageSize),
          pageNum: 1,
          totalPage: rootTotal,
        },
      ];
      if (rootTotal > 1) {
        paginationTree.value[0].children?.push({
          node: 'root',
          nodePath: 'root',
          nodeType: 'PAGE',
          parentPath: '',
          pageNum: 1,
          totalPage: rootTotal,
        });
      }
    })
    .finally(() => {
      initialLoading.value = false;
    });
}

function handleSearch() {}

function handleRefresh() {
  expandNode.value = 'root';
  emit('handleChangeNode', 'root', 'DATABASE');
  getTreeData();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleCommand(val: string, data: TreeNodeData) {
  if (val === 'database') {
    databaseVisible.value = true;
  } else if (val === 'measurement') {
    currentDatabase.value = data.nodePath;
    measurementVisible.value = true;
  } else if (data.nodeType === 'DATABASE') {
    ElMessageBox.confirm(t('measurement.deleteMeasurementTip'), t('common.notice'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: 'del-databse-confirm',
      cancelButtonClass: 'del-databse-cancel',
      type: 'warning',
      icon: ICustomMessageWarning,
    }).then(() => {
      deleteDatabase(data.nodePath).then(() => {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        handleRefresh();
      });
    });
  } else {
    ElMessageBox.confirm(t('measurement.deleteMeasurementSingle'), t('common.notice'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: 'del-mesaurement-confirm',
      cancelButtonClass: 'del-mesaurement-cancel',
      type: 'warning',
      icon: ICustomMessageWarning,
    }).then(() => {
      deleteMeasurements([data.nodePath]).then(() => {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        handleRefresh();
      });
    });
  }
}

// 递归查找节点添加children
function recursionFindParent(parentPath: string, data?: Array<StorageDevice.TreeNodeData>) {
  if (!data) data = treeData.value;
  let result = data.find((item) => item.nodePath === parentPath);
  if (result) return result;
  data.forEach((item) => {
    if (parentPath.startsWith(`${item.nodePath}.`)) {
      result = recursionFindParent(parentPath, item.children);
    }
  });
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleNodeClick(data: TreeNodeData, node: TreeNode, e: MouseEvent) {
  if (['DATABASE', 'TIMESERIES'].includes(data.nodeType)) {
    emit('handleChangeNode', data.nodePath, data.nodeType);
  }
  expandNode.value = data.nodePath;
  if (measurementTree.value?.getNode(data.nodePath)?.children) return;
  const originTreeData = recursionFindParent(data.nodePath, treeData.value)!;
  getNextNodeInfos(data.nodePath).then((res) => {
    const list = res.data || [];
    originTreeData.children = cloneDeep(list);
    const dataPathTotal = Math.ceil(list.length / pageSize);
    data.children = list.slice(0, 1 * pageSize);
    data.pageNum = 1;
    data.totalPage = dataPathTotal;
    if (dataPathTotal > 1) {
      data.children?.push({
        node: data.node,
        nodePath: data.nodePath,
        nodeType: 'PAGE',
        parentPath: data.parentPath || '',
        pageNum: 1,
        totalPage: dataPathTotal,
      });
    }
    measurementTree.value?.setData(paginationTree.value);
  });
}

// 查看更多--下一页
function handleNext(e: MouseEvent, data: TreeNodeData) {
  e.stopPropagation();
  const currentTreeData = recursionFindParent(data.nodePath, paginationTree.value)!;
  const originTreeData = recursionFindParent(data.nodePath, treeData.value)!;
  currentTreeData.children!.pop();
  currentTreeData.children = currentTreeData.children?.concat(originTreeData.children!.slice(data.pageNum * pageSize, (data.pageNum + 1) * pageSize));
  currentTreeData.pageNum = data.pageNum + 1;
  if (currentTreeData.pageNum! < currentTreeData.totalPage!) {
    currentTreeData.children!.push({
      node: data.node,
      nodePath: data.nodePath,
      nodeType: 'PAGE',
      parentPath: data.parentPath || '',
      pageNum: currentTreeData.pageNum || 1,
      totalPage: currentTreeData.totalPage,
    });
  }
  measurementTree.value?.setData(paginationTree.value);
}

// 查看全部
function handleAll(e: MouseEvent, data: TreeNodeData) {
  e.stopPropagation();
  const currentTreeData = recursionFindParent(data.nodePath, paginationTree.value)!;
  const originTreeData = recursionFindParent(data.nodePath)!;
  currentTreeData.children!.pop();
  currentTreeData.children = cloneDeep(originTreeData.children);
  measurementTree.value?.setData(paginationTree.value);
}

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

watch(
  () => props.canReadWriteSchema,
  (val) => {
    if (val) {
      getTreeData();
    }
  },
  {
    immediate: true,
  }
);

defineExpose({ handleRefresh });
</script>
<style lang="scss" scoped>
.measurement-tree-wrapper {
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

.measurement-tree-box {
  flex: 1;

  // overflow: hidden;
}

.node-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 300;
  line-height: 1.5;
  display: flex;
  align-items: center;
}

.el-tree-node:focus {
  color: #495ad4;
}

:deep(.el-tree-node__content) {
  position: relative !important;
}

.more-icon {
  width: 16px;
  height: 16px;
  position: absolute;
  right: 0;
}

.tree-node-operation-buttons {
  display: flex;

  :deep(.el-button) {
    height: 20px !important;
  }
}
</style>
