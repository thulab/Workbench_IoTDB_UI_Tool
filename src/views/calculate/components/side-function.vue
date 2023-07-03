<template>
  <div class="search_div maxheight">
    <el-tree :data="data" :props="defaultProps" accordion ref="treeRef">
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <el-tooltip class="item" effect="light" :disabled="node.level === 1" :content="data.label" placement="top" trigger="hover" :show-after="300">
            <span style="color: #131926;font-weight: 300;" @dblclick="getFunction(node)">{{ node.level === 1 ? node.label : data.value }}</span>
            <template #content>
              <div style="width: 200px;">
                <p style="color: #131926;font-weight: 300;">
                  {{ data.value }}
                </p>
                <p style="color: #131926;font-weight: 300;">
                  {{ data.label }}
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
import {
  functionTreeData,
} from '@/constants';

const treeRef = ref<InstanceType<typeof ElTree> | null>(null);
const emit = defineEmits(['get-function']);

const data = functionTreeData.filter((item) => item.value !== 'sqlSearch.Aggregate');
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
  font-size: 14px;
  background: #fff;
  height: 166px;

  &.maxheight {
    overflow: auto;
  }
}

:deep(.el-tree-node__expand-icon){
  color: #495AD4;
}

:deep(.el-tree-node__expand-icon.is-leaf){
  color: transparent;
  cursor: default;
}

.custom-tree-node{
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
