<template>
  <div class="side-list-box">
    <div class="list-empty-wrapper" v-if="!pathList.length">
      <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
      <span class="data-empty-text">{{ t('common.noData') }}</span>
    </div>
    <ul class="list-box" v-else :key="listKey">
      <li v-for="(item, index) in pathList" :key="item.path" :class="['path-item-box']">
        <div class="path-text-box">
          <el-checkbox v-if="item.disabled" :checked="false" :disabled="true" class="m-r-8" :id="`trend-path-checkbox-${index}-false`" />
          <el-checkbox v-else :checked="item.checked" @change="(val) => handleChecked(val, item, index)" class="m-r-8" :id="`trend-path-checkbox-${index}-true`" />
          <div class="path-text"><text-tooltip :content="item.path" /></div>
        </div>
        <div class="path-detail-box">
          <div class="path-detail-item">
            <span class="detail-label">{{ t('common.color') }}：</span>
            <el-color-picker
              v-model="item.color"
              :disabled="item.disabled"
              color-format="hex"
              :predefine="predefineColors"
              @change="(val) => handleChangeColor(val, item, index)"
              :id="`trend-path-color-${index}`"
            />
          </div>
          <div class="path-detail-item">
            <span class="detail-label">{{ t('common.lineWidth') }}：</span>
            <el-input-number
              v-model.number="item.width"
              :disabled="item.disabled"
              :min="1"
              :max="10"
              step-strictly
              controls-position="right"
              style="width: 40px"
              @change="(val) => handleChangeWidth(val, item, index)"
              @blur="(ev) => handleBlurWidth(ev, item, index)"
              :id="`trend-path-input-${index}`"
            />
          </div>
        </div>
        <!-- <el-icon size="14" class="delete-icon svg-button-hover-color" @click="handleDel(item, index)" :id="`trend-path-${index}-del`"><i-custom-close-circle /></el-icon> -->
      </li>
    </ul>
  </div>

  <modal-path v-model:visible="pathVisible" :path-list="editPathList" :predefine-colors="predefineColors" :default-color="defaultColor" @handleSave="handleSavePath" />
</template>

<script setup lang="ts">
import type { CheckboxValueType } from 'element-plus';
import ModalPath from './modal-path.vue';

const props = defineProps<{
  modelValue: Trend.LineObj[];
  dataTab: 'running' | 'history';
  aggregation: 'avg' | 'max_value' | 'min_value' | 'last_value' | string;
}>();

const emit = defineEmits<{
  (event: 'handleSelect', payload: string): void;
  (event: 'handleOperate', payload: 'add' | 'del' | 'detail', data: string): void;
  (event: 'handleOperateAll'): void;
}>();

const { t } = useI18n();
const listKey = ref(0);
const pathList = useVModel(props, 'modelValue');

const predefineColors = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#8AC211'];

const current = ref('');
const pathVisible = ref(false);
const editPathList = ref<string[]>([]);
const defaultColor = ref('');

// 弃用
function handleSavePath(data: Trend.LineObj) {
  pathList.value.push({ ...data, checked: true, disabled: false });
  emit('handleOperate', 'add', data.path);
}

function handleChecked(val: CheckboxValueType, data: Trend.LineObj, index: number) {
  pathList.value.splice(index, 1, { ...data, checked: val as boolean });
  emit('handleOperate', 'detail', data.path);
}
function handleChangeColor(val: string | null, data: Trend.LineObj, index: number) {
  pathList.value.splice(index, 1, { ...data, color: val as string });
  emit('handleOperate', 'detail', data.path);
}

function handleBlurWidth(ev: FocusEvent, data: Trend.LineObj, index: number) {
  const val = (ev?.target as unknown as { value: string | null | undefined })?.value || '';
  let width = 2;
  if (val) {
    width = +val;
  }
  pathList.value.splice(index, 1, { ...data, width: width as number });
}

function handleChangeWidth(val: number | undefined, data: Trend.LineObj, index: number) {
  pathList.value.splice(index, 1, { ...data, width: val as number });
  emit('handleOperate', 'detail', data.path);
}

watch(
  () => current.value,
  (val) => {
    emit('handleSelect', val);
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.path-title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .path-list-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }
}

.collapse-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
  color: #495ad4;
  margin: 14px 5px 0;
}

.hover-btn-disabled,
.hover-btn-disabled:focus {
  cursor: not-allowed !important;
  opacity: 0.8;
}

.path-item-box {
  border-radius: 2px;
  background: #fff;
  border: 1px solid #dfe1ed;
  margin-top: -1px;
  padding-top: 10px;
  height: 84px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;

  &:first-child {
    margin-top: 0;
  }

  .delete-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 4px;
    display: none;
  }

  &:hover .delete-icon {
    display: block;
  }
}

.path-text-box {
  display: flex;
  align-items: center;
  margin-left: 8px;
  margin-bottom: 8px;

  .path-text {
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #424561;
    width: 145px;
    display: inline-flex;
  }
}

.path-detail-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 32px;

  .path-detail-item {
    display: flex;
    align-items: center;

    .detail-label {
      font-size: 12px;
      font-weight: 400;
      line-height: 12px;
      color: #131926;
    }

    :deep(.el-input__inner) {
      height: 22px !important;
    }

    :deep(.el-input-number.is-controls-right .el-input-number__increase, .el-input-number.is-controls-right .el-input-number__decrease) {
      --el-input-number-controls-height: 11px !important;
    }
  }
}
</style>
