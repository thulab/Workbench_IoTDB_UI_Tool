<template>
  <div class="path-title-box">
    <h4 class="path-list-title">已选测点</h4>
    <el-tooltip
      placement="top-start"
      effect="light"
      trigger="hover"
      content="最多同时展示10条测点趋势"
      :disabled="pathList.length !== 10"
    >
      <el-button link :class="[pathList.length === 10 && 'hover-btn-disabled', 'p-0']" @click="handleAdd"><i-custom-new-trend /></el-button>
    </el-tooltip>
  </div>

  <div class="path-list-box">
    <div class="list-empty-wrapper" v-if="!pathList.length">
      <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
      <span class="data-empty-text">暂无测点</span>
    </div>
  </div>

  <modal-path
    v-model:visible="pathVisible"
    :path-list="editPathList"
    :predefine-colors="predefineColors"
    :default-color="defaultColor"
    @handleSave="handleSavePath"
  />
</template>

<script setup lang="ts">
import { difference } from 'lodash-es';
import ModalPath from './modal-path.vue';

const props = defineProps<{
  modelValue: Trend.LineObj[];
}>();
const pathList = useVModel(props, 'modelValue');

const emit = defineEmits<{
  (event: 'handleSelect', payload: string): void;
}>();

const predefineColors = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#8AC211'];

const current = ref('');
const pathVisible = ref(false);
const editPathList = ref<string[]>([]);
const defaultColor = ref('');

function handleAdd() {
  if (pathList.value.length === 10) return;
  editPathList.value = pathList.value.map((item) => item.path);
  const existedColor = pathList.value.map((item) => item.color);
  const diffArr = difference(predefineColors, existedColor);
  [defaultColor.value] = diffArr;
  pathVisible.value = true;
}

function handleSavePath(data: Trend.LineObj) {
  pathList.value.push(data);
}

watch(
  () => current.value,
  (val) => {
    emit('handleSelect', val);
  },
  {
    immediate: true,
  },
);

</script>

<style lang="scss" scoped>
.path-title-box{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  .path-list-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}

.path-list-box{
  border-radius: 2px;
  background: #FFF;
  border: 1px solid #DFE1ED;
  height: calc(100% - 52px);
  overflow-y: auto;

  .list-empty-wrapper{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .data-empty-img{
      width: 150px;
      height: 150px;
      margin-bottom: 16px;
    }

    .data-empty-text{
      font-size: 14px;
      color: #131926;
      line-height: 21px;
    }
  }
}

</style>
