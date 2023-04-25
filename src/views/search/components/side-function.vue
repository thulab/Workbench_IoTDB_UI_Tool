<template>
  <div>
    <div class="search_div">
      <el-input v-model="filterText" :placeholder="$t(placeholder)" class="elinputs">
        <template #suffix><i-ep-search /></template>
      </el-input>
    </div>
    <div class="search_div maxheight">
      <el-tree :data="data" :props="defaultProps" accordion :filter-node-method="filterNode" ref="tree">
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <el-tooltip class="item" effect="light" :content="data.label" placement="top">
              <span @dblclick="getFunction(node)">{{ node.level === 1 ? node.label : data.value }}</span>
            </el-tooltip>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch, ref } from 'vue';
import {
  functionTreeData,
} from '@/constants';

defineProps<{
  placeholder: string;
}>();

const emit = defineEmits(['get-function']);

const data = functionTreeData;
const filterText = ref('');
const tree = ref();
interface Tree {
  value: string
  label: string
  children?: Tree[]
}
const defaultProps = {
  children: 'children',
  label: 'label',
};
watch(filterText, (newValue) => {
  tree.value.filter(newValue.toLocaleUpperCase());
});
function getFunction(node: any) {
  if (node.level !== 1) {
    emit('get-function', node.data.value);
  }
}
function filterNode(value: string, node: Tree) {
  if (!value) return true;
  return node.label.indexOf(value) !== -1;
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
