<template>
  <auth-container :is-auth="canReadWriteSchema" :content="'common.schemaAuth'" style="height: 100%">
    <div class="measurement-tree-wrapper">
      <div class="search-refresh-box">
        <el-input
          :placeholder="t('measurement.searchPlaceholder')"
          v-model="searchText"
          :disabled="searching"
          id="measurement-tree-input"
          @keyup.enter="handleSearch"
          class="measurement-tree-search-input"
        />

        <el-button link @click="handleRefresh()" :disabled="searching" id="measurement-tree-refresh" class="svg-button-hover-color m-l-16">
          <i-custom-border-refresh style="width: 24px; height: 24px" />
        </el-button>
      </div>

      <div class="measurement-tree-box" v-loading="initialLoading || searchLoading">
        <virtualized-tree
          ref="measurementTree"
          :data="treeData"
          :props="treeProps"
          :indent="8"
          :item-size="28"
          :height="treeHeight"
          :expand-on-click-node="true"
          :default-expanded-keys="[expandNode]"
          @node-expand="handleNodeClick"
          @node-click="handleNodeClick"
          @node-collapse="handleNodeCollapse"
          @handle-click-more="handleClickMore"
        >
          <!-- eslint-disable-next-line vue/no-unused-vars -->
          <template #default="{ node, data }">
            <div v-if="data.nodeType !== 'PAGE'" class="node-text" :id="`tree-node-content-${data.nodePath}`">
              <el-icon size="16" v-if="data.nodeType === 'DATABASE' && data.node !== 'root'"><i-custom-storage-num /></el-icon>
              <el-icon size="16" v-if="data.nodeType === 'TIMESERIES'"><i-custom-measure-num /></el-icon>
              {{ data.node }}
            </div>
            <!-- eslint-disable-next-line vue/max-len -->
            <!-- <i-custom-more v-if="data.nodeType !== 'PAGE'" :id="`tree-node-dropdown-${data.nodePath}`" class="more-icon svg-button-hover-color" @click="(e: MouseEvent) => handleClickMore(e, data)" /> -->
            <div class="tree-node-operation-buttons" v-if="data.nodeType === 'PAGE'">
              <el-button type="primary" @click="(e) => handleNext(e, data)" :id="`tree-node-${data.nodePath}-more`" class="svg-button-hover-color">
                {{ t('common.viewMore') }}
              </el-button>
              <el-button @click="(e) => handleAll(e, data)" :id="`tree-node-${data.nodePath}-all`" class="svg-button-hover-color">
                {{ t('common.viewAll') }}
              </el-button>
            </div>
          </template>
        </virtualized-tree>
      </div>

      <context-menu v-show="isShowContextMenu" ref="contextMenuRef" :clicked-node-data="clickedNodeData" @handle-command="(val) => handleCommand(val, clickedNodeData)" />

      <modal-database v-model:visible="databaseVisible" @handleSave="handleRefresh()" />
      <modal-measurement v-model:visible="measurementVisible" :device-name="currentDatabase" @handleSave="handleRefresh()" />
    </div>
  </auth-container>
</template>

<script setup lang="ts">
import type { TreeNode, TreeNodeData } from 'element-plus/es/components/tree-v2/src/types';
import { debounce, cloneDeep } from 'lodash-es';
import { StorageApi } from '@/api';
import useMenuStore from '@/stores/menu';
import VirtualizedTree from '@/components/tree-v2/virtualized-tree.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ContextMenu from './context-menu.vue';
import ModalDatabase from './modal-database.vue';
import ModalMeasurement from './modal-measurement.vue';

const treeProps = {
  value: 'nodePath',
  label: 'nodePath',
  children: 'pageChildren',
};

const props = defineProps<{
  canReadWriteSchema: boolean;
  currentNode: string;
}>();

const emit = defineEmits<{
  (event: 'handleChangeNode', path: string, type: string): void;
}>();

const pageSize = 10;

const { t } = useI18n();
const menuStore = useMenuStore();
const isCollapse = computed((): boolean => menuStore.isCollapse);
const searchText = ref('');
const measurementTree = ref<InstanceType<typeof VirtualizedTree>>();
const databaseVisible = ref(false);
const measurementVisible = ref(false);
const currentDatabase = ref('');
const initialLoading = ref(false);
const expandNode = ref('root');
const isShowContextMenu = ref(false);
const contextMenuRef = ref<InstanceType<typeof ContextMenu>>();
const contextMenuTimer = ref();
const clickedNodeData = reactive<StorageDevice.TreeNodeData>({
  node: '',
  nodePath: '',
  parentPath: '',
  nodeType: '',
});
// 216+16 菜单宽度+MainPaddingLeft  39 下拉框宽度的一半 = 267
// 40+16+39 = 95
const insertWidth = computed(() => (isCollapse.value ? 95 : 267));
const loadingNode: StorageDevice.TreeNodeData = {
  node: '',
  nodePath: 'loading',
  nodeType: 'loading',
  parentPath: '',
};

// DATABASE, SG INTERNAL, INTERNAL, DEVICE, TIMESERIES
const treeData = ref<Array<StorageDevice.TreeNodeData>>([
  {
    node: 'root',
    nodePath: 'root',
    nodeType: 'DATABASE',
    parentPath: '',
    children: [cloneDeep(loadingNode)],
    pageChildren: [],
  },
]);
const isSearchResult = ref(false);
const searchResults = ref<Array<Array<StorageDevice.TreeNodeData>>>([]);
const searching = ref(false);
const searchLoading = ref(false);
const dealingStatus = ref(false);

const { requestFn: getNextNodeInfos } = useRequest(StorageApi.getNextNodeInfos);
const { requestFn: deletePaths } = useRequest(StorageApi.deletePaths);

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

function fillChildLoading(data: StorageDevice.TreeNodeData[]) {
  data.forEach((item) => {
    if (!item.children && item.nodeType !== 'TIMESERIES') {
      item.pageChildren = [
        {
          ...loadingNode,
          parentPath: item.nodePath,
        },
      ];
    }
  });
  return data;
}

function getTreeData() {
  initialLoading.value = true;
  treeData.value = [];
  getNextNodeInfos('root')
    .then((res) => {
      const data = res.data || [];
      const rootTotal = Math.ceil(data.length / pageSize);
      const cloneData = fillChildLoading(cloneDeep(data));
      treeData.value = [
        {
          node: 'root',
          nodePath: 'root',
          nodeType: 'DATABASE',
          parentPath: '',
          children: cloneDeep(cloneData),
          pageChildren: cloneData.slice(0, 1 * pageSize),
          pageNum: 1,
          totalPage: rootTotal,
        },
      ];
      if (rootTotal > 1) {
        treeData.value[0].pageChildren?.push({
          node: 'root',
          nodePath: 'root__PAGE',
          nodeType: 'PAGE',
          parentPath: '',
          pageNum: 1,
          totalPage: rootTotal,
        });
      }
    })
    .finally(() => {
      initialLoading.value = false;
      expandNode.value = 'root';
      measurementTree.value?.virtualizedTreeRef?.setExpandedKeys(['root']);
    });
}

// 递归源数据查找节点添加pagechildren
function recursionFindCurrentByOrigin(path: string, data: Array<StorageDevice.TreeNodeData>) {
  const result = data.find((item) => item.nodePath === path);
  if (result) return result;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (path.startsWith(`${item.nodePath}.`)) {
      return recursionFindCurrentByOrigin(path, item.children!);
    }
  }
  return result;
}

// 递归查找节点添加children
function recursionFindParent(path: string, data: Array<StorageDevice.TreeNodeData>) {
  const result = data.find((item) => item.nodePath === path);
  if (result) return result;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (path.startsWith(`${item.nodePath}.`)) {
      return recursionFindParent(path, item.pageChildren!);
    }
  }
  return result;
}

function fillTreeLoading(nodes: Array<StorageDevice.TreeNodeData>) {
  nodes.forEach((node) => {
    if (node && !node.pageChildren && node.children && node.children.length > 0) {
      node.pageChildren = [
        {
          ...loadingNode,
          parentPath: node.nodePath,
        },
      ];
    }
    if (node.children) {
      fillTreeLoading(node.children);
    }
  });
}

// 获取搜索结果合并树
function mergeAndUpdateData(data: Array<StorageDevice.TreeNodeData>) {
  data.forEach((item) => {
    if (item.children) {
      let node = recursionFindCurrentByOrigin(item.nodePath, treeData.value);
      if (!node) {
        node = recursionFindCurrentByOrigin(item.parentPath, treeData.value);
        if (node) {
          if (!node.children) {
            node.children = [];
          }
          node?.children?.push(item);
        }
        return;
      }
      mergeAndUpdateData(item.children);
    } else {
      const node = recursionFindCurrentByOrigin(item.parentPath, treeData.value);
      node?.children?.push(item);
    }
  });
}

function internalDealData(dealingData: Array<StorageDevice.TreeNodeData>) {
  if (treeData.value.length === 0) {
    treeData.value = dealingData;
  } else {
    // 合并处理 找到父节点，合并children 还是 父节点追加 children
    mergeAndUpdateData(dealingData);
  }
  if (!searchResults.value.length) {
    dealingStatus.value = false;
  } else {
    internalDealData(searchResults.value.pop()!);
  }
}

function handleDealData() {
  if (!dealingStatus.value && searchResults.value.length) {
    dealingStatus.value = true;
    const dealingData: Array<StorageDevice.TreeNodeData> = searchResults.value.pop()!;
    internalDealData(dealingData);
    expandNode.value = 'root';
    measurementTree.value?.virtualizedTreeRef?.setData(treeData.value);
    measurementTree.value?.virtualizedTreeRef?.setExpandedKeys(['root']);
  }
}

function handleData(data: string) {
  searchLoading.value = false;
  if (data === 'all_done') {
    searching.value = false;
    // console.log('all_done', treeData.value);
  } else {
    // console.log('Received data:', JSON.parse(data));
    const childrenData = JSON.parse(data).children || [];
    const rootTotal = Math.ceil(childrenData.length / pageSize);
    fillTreeLoading(childrenData);
    const dealData = [
      {
        node: 'root',
        nodePath: 'root',
        nodeType: 'DATABASE',
        parentPath: '',
        children: cloneDeep(childrenData),
        pageChildren: childrenData.slice(0, 1 * pageSize),
        pageNum: 1,
        totalPage: rootTotal,
      },
    ];
    if (rootTotal > 1) {
      dealData[0].pageChildren?.push({
        node: 'root',
        nodePath: 'root__PAGE',
        nodeType: 'PAGE',
        parentPath: '',
        pageNum: 1,
        totalPage: rootTotal,
      });
    }
    searchResults.value.push(dealData);
    handleDealData();
  }
}

async function subscribeToSSE() {
  try {
    searchLoading.value = true;
    treeData.value = [];
    StorageApi.getSSEData(searchText.value, handleData);
  } catch (error) {
    searchLoading.value = false;
    console.error('Error subscribing to SSE:', error);
  }
}

function handleSearch() {
  if (searchText.value.trim()) {
    searching.value = true;
    isSearchResult.value = true;
    subscribeToSSE();
  } else {
    isSearchResult.value = false;
    getTreeData();
  }

  emit('handleChangeNode', 'root', 'DATABASE');
}

function handleRefresh(unforce?: boolean) {
  if (unforce) {
    handleSearch();
  } else {
    searchText.value = '';
    emit('handleChangeNode', 'root', 'DATABASE');
    isSearchResult.value = false;
    getTreeData();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleClickMore(e: MouseEvent, key: string) {
  if (contextMenuTimer.value) {
    clearTimeout(contextMenuTimer.value);
    contextMenuTimer.value = undefined;
  }
  const data: TreeNodeData = measurementTree.value?.virtualizedTreeRef?.getNode(key)?.data!;
  if (data.nodeType === 'PAGE') return;
  clickedNodeData.node = data.node;
  clickedNodeData.nodePath = data.nodePath;
  clickedNodeData.nodeType = data.nodeType;
  clickedNodeData.parentPath = data.parentPath;
  isShowContextMenu.value = true;
  contextMenuRef.value!.$el.style.inset = `${e.clientY - 52}px auto auto ${e.clientX - insertWidth.value}px`;
}

function handleCommand(val: string, data: TreeNodeData) {
  if (val === 'database') {
    databaseVisible.value = true;
  } else if (val === 'measurement') {
    currentDatabase.value = data.nodePath;
    measurementVisible.value = true;
  } else {
    ElMessageBox.confirm(data.nodeType !== 'TIMESERIES' ? t('measurement.deleteMeasurementTip') : t('measurement.deleteMeasurementSingle'), t('common.notice'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: 'del-tree-node-confirm',
      cancelButtonClass: 'del-tree-node-cancel',
      type: 'warning',
      icon: ICustomMessageWarning,
    }).then(() => {
      deletePaths(data.nodePath, data.nodeType).then(() => {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        handleRefresh();
      });
    });
  }
}

function handleNodeCollapse(data: TreeNodeData, node: TreeNode) {
  if (data.nodeType === 'PAGE') {
    expandNode.value = node.parent?.data.nodePath;
    measurementTree.value?.virtualizedTreeRef?.expandNode(node.parent!);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleNodeClick(data: TreeNodeData, node: TreeNode, e: MouseEvent) {
  if (data.nodeType === 'PAGE') {
    e?.stopPropagation();
    return;
  }
  if (data.nodePath === expandNode.value) return;
  if (['DATABASE', 'TIMESERIES'].includes(data.nodeType)) {
    if (props.currentNode !== data.nodePath) {
      emit('handleChangeNode', data.nodePath, data.nodeType);
    }
  }
  expandNode.value = data.nodePath;
  if (isSearchResult.value) {
    const originTreeData = cloneDeep(recursionFindCurrentByOrigin(data.nodePath, treeData.value)?.children || []);
    const dataPathTotal = Math.ceil(originTreeData.length / pageSize);
    data.pageChildren = originTreeData.slice(0, 1 * pageSize);
    data.pageNum = 1;
    data.totalPage = dataPathTotal;
    if (dataPathTotal > 1) {
      data.pageChildren?.push({
        node: data.node,
        nodePath: `${data.nodePath}__PAGE`,
        nodeType: 'PAGE',
        parentPath: data.parentPath || '',
        pageNum: 1,
        totalPage: dataPathTotal,
      });
    }
    measurementTree.value?.virtualizedTreeRef?.setData(treeData.value);
    return;
  }
  const children = measurementTree.value?.virtualizedTreeRef?.getNode(data.nodePath)?.children;
  if (!children || (children[0].data as TreeNodeData).nodeType !== 'loading') return;
  getNextNodeInfos(data.nodePath).then((res) => {
    const list = res.data || [];
    // 展示点开操作查看的data 都在pageChildren 属性，需找到对应的children 上追加子节点
    const originTreeData = recursionFindCurrentByOrigin(data.nodePath, treeData.value)!;
    const cloneData = fillChildLoading(cloneDeep(list));
    originTreeData.children = cloneDeep(cloneData);
    const dataPathTotal = Math.ceil(cloneData.length / pageSize);

    data.pageChildren = cloneData.slice(0, 1 * pageSize);
    data.pageNum = 1;
    data.totalPage = dataPathTotal;
    if (dataPathTotal > 1) {
      data.pageChildren?.push({
        node: data.node,
        nodePath: `${data.nodePath}__PAGE`,
        nodeType: 'PAGE',
        parentPath: data.parentPath || '',
        pageNum: 1,
        totalPage: dataPathTotal,
      });
    }
    measurementTree.value?.virtualizedTreeRef?.setData(treeData.value);
  });
}

// 查看更多--下一页
function handleNext(e: MouseEvent, data: TreeNodeData) {
  e.stopPropagation();
  const originTreeData = recursionFindCurrentByOrigin(`${data.parentPath ? `${data.parentPath}.` : ''}${data.node}`, treeData.value)!;
  const currentTreeData = recursionFindParent(`${data.parentPath ? `${data.parentPath}.` : ''}${data.node}`, treeData.value)!;
  currentTreeData.pageChildren!.pop();
  currentTreeData.pageChildren = currentTreeData.pageChildren?.concat(originTreeData.children!.slice(data.pageNum * pageSize, (data.pageNum + 1) * pageSize));
  currentTreeData.pageNum = data.pageNum + 1;
  let currentTotalPage = currentTreeData.totalPage!;
  if (isSearchResult.value) {
    currentTotalPage = Math.ceil(originTreeData.children!.length / pageSize);
  }
  if (currentTreeData.pageNum! < currentTotalPage) {
    currentTreeData.pageChildren!.push({
      node: data.node,
      nodePath: `${data.nodePath}__PAGE`,
      nodeType: 'PAGE',
      parentPath: data.parentPath || '',
      pageNum: currentTreeData.pageNum || 1,
      totalPage: currentTotalPage,
    });
  }
  measurementTree.value?.virtualizedTreeRef?.setData(treeData.value);
}

// 查看全部
function handleAll(e: MouseEvent, data: TreeNodeData) {
  e.stopPropagation();
  const originTreeData = recursionFindCurrentByOrigin(`${data.parentPath ? `${data.parentPath}.` : ''}${data.node}`, treeData.value)!;
  const currentTreeData = recursionFindParent(`${data.parentPath ? `${data.parentPath}.` : ''}${data.node}`, treeData.value)!;
  currentTreeData.pageChildren!.pop();
  currentTreeData.pageChildren = currentTreeData.pageChildren?.concat(originTreeData.children!.slice(data.pageNum * pageSize));
  measurementTree.value?.virtualizedTreeRef?.setData(treeData.value);
}

function onMouseDown() {
  contextMenuTimer.value = setTimeout(() => {
    isShowContextMenu.value = false;
  }, 200);
}

// function handleScroll(scrollLeft: number) {
//   const iconList = document.querySelectorAll('.more-icon');
//   iconList.forEach((icon: any) => {
//     icon.style.left = scrollLeft;
//   });
// }

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

watch(
  () => isShowContextMenu.value,
  (newVal) => {
    if (newVal) {
      document.addEventListener('mousedown', onMouseDown);
    } else {
      document.removeEventListener('mousedown', onMouseDown);
    }
  }
);

watch(
  () => props.canReadWriteSchema,
  (val) => {
    if (val) {
      isSearchResult.value = false;
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
  font-size: 12px;
  font-weight: 300;
  line-height: 1.5;
  display: flex;
  align-items: center;
  padding-right: 8px;
}

.el-tree-node:focus {
  color: #495ad4;
}

.more-icon {
  padding: 0 8px 0 4px;
  width: 16px;
  height: 16px;
  position: absolute;
  left: 212px;
  background-color: #fff;
}

:deep(.el-tree-node__content:hover),
:deep(.el-tree-node:focus) {
  .more-icon {
    background-color: #f7f8fc !important;
  }
}

.tree-node-operation-buttons {
  display: flex;

  :deep(.el-button) {
    height: 20px !important;
  }
}
</style>
