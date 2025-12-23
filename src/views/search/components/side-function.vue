<template>
  <div class="search_div max-height">
    <el-tree :data="data" :props="defaultProps" accordion ref="treeRef">
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <el-tooltip class="item" effect="light" :disabled="node.level === 1" :content="data.label" placement="top" trigger="hover" :show-after="300">
            <span style="color: #131926; font-weight: 300" @dblclick="getFunction(node)">{{ node.level === 1 ? t(node.label) : data.value }}</span>
            <template #content>
              <div style="width: 200px">
                <p style="color: #131926; font-weight: 300">
                  {{ data.value }}
                </p>
                <p style="color: #131926; font-weight: 300">
                  {{ t(data.label) }}
                </p>
              </div>
            </template>
          </el-tooltip>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts" setup>
import type Node from 'element-plus/es/components/tree/src/model/node';
import type { ElTree } from 'element-plus';
import { useConnectionStore } from '@/stores';
import { functionTreeData, tableFunctionTreeData } from '@/constants';

const treeRef = ref<InstanceType<typeof ElTree> | null>(null);
const emit = defineEmits(['get-function']);

const connectionStore = useConnectionStore();
const { t } = useI18n();
const data = computed(() => (connectionStore.isTableModel ? tableFunctionTreeData : functionTreeData));
const filterText = ref('');
const tree = ref();

const defaultProps = {
  children: 'children',
  label: 'label',
};
watch(filterText, (newValue) => {
  tree.value.filter(newValue.toLocaleUpperCase());
});
function getFunction(node: Node) {
  if (node.level !== 1) {
    emit('get-function', node.data.value);
  }
}
</script>

<style lang="scss" scoped>
.search_div {
  font-size: 12px;
  padding: 8px 0 0;
  background: #fff;

  &.max-height {
    height: calc(100vh - 240px);
    overflow: auto;
  }
}

:deep(.el-tree-node__expand-icon) {
  color: #495ad4;
}

:deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent;
  cursor: default;
}

.elinputs {
  height: 30px;
  line-height: 30px;
}

.custom-tree-node {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}
</style>
<style lang="scss">
.elinputs {
  .el-input__inner {
    height: 30px;
    line-height: 30px;
  }

  .el-input__icon {
    line-height: 30px;
  }
}
</style>
