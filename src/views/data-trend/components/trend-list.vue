<template>
  <div class="path-title-box" v-if="isExpand">
    <h4 class="path-list-title">{{ t('dataTrend.choosedMeasurement') }}</h4>
    <el-tooltip
      placement="top-start"
      effect="light"
      trigger="hover"
      :content="canReadWriteSchemaData ? t('dataTrend.overMeasurementTip') : t('common.noAuth')"
      :disabled="canReadWriteSchemaData ? pathList.length !== 10 : false"
      popper-class="tooltip-box-width"
    >
      <el-button link :class="[(pathList.length === 10 || !canReadWriteSchemaData) ? 'hover-btn-disabled' : '', 'p-0']" @click="handleAdd" id="trend-add-path"><i-custom-new-trend /></el-button>
    </el-tooltip>
  </div>

  <auth-tooltip :is-disabled="canReadWriteSchemaData">
    <el-checkbox
      v-if="isExpand"
      class="m-b-8"
      v-model="isCheckAll"
      :indeterminate="isIndeterminate"
      :label="t('common.allChoose')"
      :key="listKey"
      :disabled="!allCheckAbled || !canReadWriteSchemaData"
      @change="handleCheckedAll"
      id="trend-path-checkbox"
    />
  </auth-tooltip>

  <h4 v-if="!isExpand" class="collapse-title">{{ t('dataTrend.choosedMeasurement') }}</h4>

  <div class="path-list-box" v-if="isExpand">
    <auth-container :is-auth="canReadWriteSchemaData" style="height: 100%">
      <div class="list-empty-wrapper" v-if="!pathList.length">
        <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
        <span class="data-empty-text">{{ t('common.noData') }}</span>
      </div>
      <ul class="list-box" v-else :key="listKey">
        <li v-for="(item, index) in pathList" :key="item.path" :class="['path-item-box']">
          <div class="path-text-box">
            <el-checkbox v-if="item.disabled" :checked="false" :disabled="true" class="m-r-8" :id="`trend-path-checkbox-${index}-false`" />
            <el-checkbox v-else :checked="item.checked" @change="val => handleChecked(val, item, index)" class="m-r-8" :id="`trend-path-checkbox-${index}-true`" />
            <div class="path-text"><text-tooltip :content="item.path" /></div>
          </div>
          <div class="path-detail-box">
            <div class="path-detail-item">
              <span class="detail-label">{{t('common.color')}}：</span>
              <el-color-picker v-model="item.color" :disabled="item.disabled" color-format="hex" :predefine="predefineColors" @change="val => handleChangeColor(val, item, index)" :id="`trend-path-color-${index}`" />
            </div>
            <div class="path-detail-item">
              <span class="detail-label">{{t('common.lineWidth')}}：</span>
              <el-input-number
                v-model.number="item.width"
                :disabled="item.disabled"
                :min="1"
                :max="10"
                step-strictly
                controls-position="right"
                style="width: 40px;"
                @change="val => handleChangeWidth(val, item, index)"
                @blur="ev => handleBlurWidth(ev, item, index)"
                :id="`trend-path-input-${index}`"
              />
            </div>
          </div>
          <el-icon size="14" class="delete-icon" @click="handleDel(item, index)" :id="`trend-path-${index}-del`"><i-custom-close-circle /></el-icon>
        </li>
      </ul>
    </auth-container>
  </div>

  <el-icon :class="['expand-icon', !isExpand ? 'collapse-icon' : '']" size="24" @click="handleExpand" id="trend-path-expand">
    <i-custom-arrow-right-expand />
  </el-icon>

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
import type { CheckboxValueType } from 'element-plus';
import ModalPath from './modal-path.vue';

const props = defineProps<{
  modelValue: Trend.LineObj[];
  isExpand: boolean;
  dataTab: 'running' | 'history';
  aggregation: 'avg' | 'max_value' | 'min_value' | 'last_value' | string;
  canReadWriteSchemaData: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:isExpand', isExpand: boolean): void;
  (event: 'handleSelect', payload: string): void;
  (event: 'handleOperate', payload: 'add' | 'del' | 'detail', data: string): void;
  (event: 'handleOperateAll'): void;
}>();

const { t } = useI18n();
const listKey = ref(0);
const pathList = useVModel(props, 'modelValue');
const isExpand = useVModel(props, 'isExpand', emit);
const isCheckAll = ref(false);
const isIndeterminate = computed(() => {
  if (pathList.value.length === 0) return false;
  const allLength = pathList.value.length;
  const checkedLength = pathList.value.filter((item) => item.checked).length;
  if (allLength === 0 || checkedLength === 0) {
    isCheckAll.value = false;
    return false;
  }
  if (checkedLength === allLength) {
    isCheckAll.value = true;
  } else {
    isCheckAll.value = false;
  }
  return checkedLength > 0 && checkedLength < allLength;
});

const allCheckAbled = computed(() => pathList.value.length > 0 && pathList.value.filter((item) => !item.disabled).length > 0);

const predefineColors = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff', '#8AC211'];

const current = ref('');
const pathVisible = ref(false);
const editPathList = ref<string[]>([]);
const defaultColor = ref('');

function handleAdd() {
  if (!props.canReadWriteSchemaData) return;
  if (pathList.value.length === 10) return;
  editPathList.value = pathList.value.map((item) => item.path);
  const existedColor = pathList.value.map((item) => item.color);
  const diffArr = difference(predefineColors, existedColor);
  [defaultColor.value] = diffArr;
  pathVisible.value = true;
}

function handleCheckedAll(val: CheckboxValueType) {
  pathList.value.forEach((item) => {
    if (!item.disabled) {
      item.checked = !!val;
    }
  });
  nextTick(() => {
    listKey.value++;
  });
  emit('handleOperateAll');
}

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

function handleDel(data: Trend.LineObj, index: number) {
  pathList.value.splice(index, 1);
  emit('handleOperate', 'del', data.path);
}

function handleExpand() {
  isExpand.value = !isExpand.value;
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
  margin-bottom: 16px;

  .path-list-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}

.collapse-title{
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
  color: #495AD4;
  margin: 14px 5px 0;
}

.hover-btn-disabled, .hover-btn-disabled:focus{
  cursor: not-allowed !important;
  opacity: 0.8;
}

.path-list-box{
  border-radius: 2px;
  background: #FFF;
  overflow-y: auto;
  flex: 1;

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

.path-item-box{
  border-radius: 2px;
  background: #FFF;
  border: 1px solid #DFE1ED;
  margin-top: -1px;
  padding-top: 10px;
  height: 84px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;

  &:first-child{
    margin-top: 0;
  }

  .delete-icon{
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 4px;
    display: none;
  }

  &:hover .delete-icon{
    display: block;
  }
}

.path-text-box{
  display: flex;
  align-items: center;
  margin-left: 8px;
  margin-bottom: 8px;

  .path-text{
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #424561;
    width: 145px;
    display: inline-flex;
  }
}

.path-detail-box{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 32px;

  .path-detail-item{
    display: flex;
    align-items: center;

    .detail-label{
      font-size: 12px;
      font-weight: 400;
      line-height: 12px;
      color: #131926;
    }

    :deep(.el-input__inner) {
      height: 22px !important;
    }

    :deep(.el-input-number.is-controls-right .el-input-number__increase, .el-input-number.is-controls-right .el-input-number__decrease){
      --el-input-number-controls-height: 11px !important;
    }
  }
}

.expand-icon{
  position: absolute;
  bottom: 0;
  left: 16px;
  cursor: pointer;
  color: #A0A3B8;

  &:hover{
    color: #495AD4;
  }

  &.collapse-icon{
    left: 0;
    transform: rotate(-180deg);
  }
}
</style>
