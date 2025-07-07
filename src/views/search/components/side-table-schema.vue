<template>
  <div class="search_div max-height">
    <el-tree-v2
      ref="schemaTree"
      :data="treeData"
      style="background-color: #fff; overflow-y: auto"
      :props="treeProps"
      :indent="8"
      :item-size="28"
      :height="maxTableHeight"
      :expand-on-click-node="false"
    >
      <!-- eslint-disable-next-line vue/no-unused-vars -->
      <template #default="{ node, data }">
        <div class="node-text" :id="`tree-node-content-${data.parentName || data.nodeName}`" @dblclick="(event) => handleNodeClick(data.nodeName, event)">
          <el-icon size="18" color="var(--el-color-primary)" class="m-r-[4px]">
            <i-custom-tree-db v-if="data.nodeType === 'DATABASE'" />
            <i-custom-table v-else-if="data.nodeType === 'TABLE'" />
            <div v-else-if="data.nodeType === 'TIME'" class="tree-column-icon-container">
              <el-icon size="14"><i-ep-key /></el-icon>
              <el-tag disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Time</el-tag>
            </div>
            <div v-else-if="data.nodeType === 'TAG'" class="tree-column-icon-container">
              <el-icon size="14"><i-ep-key /></el-icon>
              <el-tag disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Time</el-tag>
            </div>
            <el-tag v-else-if="data.nodeType === 'ATTRIBUTE'" disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Attr</el-tag>
            <el-tag v-else-if="data.nodeType === 'FIELD'" disable-transitions type="primary" effect="dark" class="tree-column-type-tag">Field</el-tag>
          </el-icon>
          <text-tooltip :content="data.nodeName + (data.comment ? ` (${data.comment})` : '')" />
        </div>
      </template>
    </el-tree-v2>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useDbStore } from '@/stores';
import { type ElTreeV2 } from 'element-plus';

const { maxTableHeight } = useTableHeight(220);

const emit = defineEmits(['get-function']);

const schemaTree = ref<InstanceType<typeof ElTreeV2>>();
const currentNode = ref<IoTDB.TreeNodeData | null>(null);

const { treeData } = storeToRefs(useDbStore());
const { getDatabases } = useDbStore();

const treeProps = {
  value: 'id',
  label: 'nodeName',
  children: 'children',
};

const setDefaultTreeExpandKeys = async () => {
  await getDatabases();
  if (treeData.value && treeData.value.length) {
    const firstNode = treeData.value[0];
    currentNode.value = firstNode;
    setTimeout(() => {
      const expandedKeys = [firstNode.nodeName];
      schemaTree.value?.setExpandedKeys(expandedKeys);
    }, 300);
  }
};
// 模拟双击
const handleNodeClick = (name: string, event: MouseEvent) => {
  if (name) emit('get-function', name);
  event.stopPropagation();
  event.preventDefault();
};

onMounted(() => {
  setDefaultTreeExpandKeys();
});
</script>

<style lang="scss" scoped>
.search_div {
  padding: 20px 0;
  background: #fff;

  &.maxheight {
    height: 65vh;
    overflow: hidden auto;
  }
}

.node-text {
  font-size: 12px;
  font-weight: 300;
  line-height: 1.5;
  display: flex;
  align-items: center;
  padding-right: 8px;
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
</style>
