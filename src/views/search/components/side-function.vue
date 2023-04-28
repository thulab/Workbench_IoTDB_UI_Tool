<template>
  <div class="search_div maxheight">
    <el-tree :data="data" :props="defaultProps" accordion ref="treeRef">
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <el-tooltip class="item" effect="light" :content="data.label" placement="top">
            <span @dblclick="getFunction(node)">{{ node.level === 1 ? node.label : data.value }}</span>
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

const data = functionTreeData;
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
  padding: 20px 20px 0;
  background: #fff;

  &.maxheight {
    height: calc(100vh - 289px);
    overflow: auto;
  }
}

.elinputs {
  height: 30px;
  line-height: 30px;
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
