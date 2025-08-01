<template>
  <div class="side-list-box">
    <div class="list-empty-wrapper" v-if="!pointLineData.length || !pathList.length">
      <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
      <span class="data-empty-text">{{ t('common.noData') }}</span>
    </div>
    <div class="cursor-list-wrapper" v-else>
      <ul class="cursor-list">
        <li v-for="(item, index) in pointList" :key="item.name" :class="['cursor-item-box']">
          <div class="cursor-text-box">
            <el-checkbox
              v-if="pointList.length !== 1"
              :checked="item.checked"
              class="m-r-4"
              :id="`trend-cursor-checkbox-${index}`"
              :disabled="pointDisabled(item)"
              @change="(val) => handleCheckDvalue(val, item)"
            />
            <!-- {{ pointTitle(index) }} -->
            {{ item.label }}：
          </div>
          <div class="cursor-point-data">
            <p style="display: inline-flex; width: 120px"><text-tooltip :content="`X: ${item.x}`" /></p>
            <p style="display: inline-flex; width: 120px"><text-tooltip :content="`Y: ${item.y}`" /></p>
          </div>
          <el-icon size="14" class="delete-icon" @click="handleDelPoint(item, index)" :id="`cursor-${index}-del`"><i-custom-close-circle /></el-icon>
        </li>
      </ul>
      <div v-if="pointCheckedData.length === 2" class="point-dvalue-box">
        <p style="display: inline-flex; width: 190px"><text-tooltip :content="`ΔX：${Math.abs(pointCheckedData[0].x - pointCheckedData[1].x)}`" /></p>
        <p style="display: inline-flex; width: 190px"><text-tooltip :content="`ΔY：${Math.abs(pointCheckedData[0].y - pointCheckedData[1].y)}`" /></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CheckboxValueType } from 'element-plus';
import type { LineObj } from '@/types';

interface PointData {
  name: string;
  label: string;
  x: number;
  y: number;
  disabled: boolean;
  checked: boolean;
  group: number;
  order: number;
}

interface MarkPointLine {
  path: string;
  name: string;
  value: number;
  xAxis: number;
  yAxis: number;
  label: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    formatter: string | Function;
    position: string;
    offset: number[];
  };
  group: number;
  order: number;
}

const props = defineProps<{
  pointList: PointData[];
  pointLineData: MarkPointLine[];
  pointCheckedData: PointData[];
  pathList: LineObj[];
}>();

const emit = defineEmits<{
  (event: 'handleDelPoint', data: PointData, payload: number): void;
  (event: 'handleOperate', payload: 'add' | 'del' | 'detail', data: string): void;
  (event: 'handleOperateAll'): void;
}>();

const { t } = useI18n();

// function pointTitle(i: number) {
//   if (props.pointList.length === 1) {
//     return 'D：';
//   }
//   return `D${i + 1}：`;
// }

function pointDisabled(item: PointData) {
  const flag = props.pointCheckedData.some((data) => data.name === item.name);
  return props.pointCheckedData.length === 2 && !flag;
}

function handleCheckDvalue(val: CheckboxValueType, data: PointData) {
  data.checked = val as boolean;
}

function handleDelPoint(data: PointData, index: number) {
  emit('handleDelPoint', data, index);
}
</script>

<style lang="scss" scoped>
.cursor-list-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;

  .cursor-list {
    flex: 1;
    overflow-y: auto;
  }
}

.cursor-item-box {
  display: flex;
  align-items: flex-start;
  position: relative;

  .delete-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 4px;
    display: none;
    cursor: pointer;
  }

  &:hover .delete-icon {
    display: block;
  }
}

.cursor-text-box {
  display: flex;
  align-items: center;
  margin: 0 0 4px 8px;
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
  color: #131926;
  width: 120px;
}

.cursor-point-data {
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
  color: #131926;
}

.point-dvalue-box {
  border-top: 1px dashed #dfe1ed;
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
  color: #131926;
  padding: 4px 0 0;
  margin: 0 8px;
}
</style>
