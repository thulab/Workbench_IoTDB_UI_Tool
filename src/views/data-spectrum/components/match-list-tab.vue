<template>
  <div class="side-list-box">
    <div class="list-empty-wrapper" v-if="!matchList?.length">
      <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
      <span class="data-empty-text">{{ t('common.noData') }}</span>
    </div>
    <div v-else class="flex flex-col">
      <div class="path-text-box flex-justify-between">
        <el-checkbox :checked="allChecked" :indeterminate="isIndeterminate" @change="handleAllChecked" class="m-r-8" :id="`match-list-checkbox-all`">{{ t('common.allChoose') }}</el-checkbox>
        <el-select id="match-list-order" v-model:model-value="order" style="width: 128px" @change="handleOrderChange">
          <el-option :label="t('spectrum.descByDistance')" :value="0" id="`match-list-order-descByDistance" />
          <el-option :label="t('spectrum.ascByDistance')" :value="1" id="`match-list-order-ascByDistance" />
          <el-option :label="t('spectrum.descByTime')" :value="2" id="`match-list-order-descByTime" />
          <el-option :label="t('spectrum.ascByTime')" :value="3" id="`match-list-order-ascByTime" />
        </el-select>
      </div>
      <ul class="list-box" :style="{ height: `${maxTableHeight}px`, maxHeight: `${maxTableHeight}px` }" :key="listKey">
        <el-checkbox-group v-model="checkedItem" @change="handleCheckedChange">
          <li v-for="(item, index) in paginatedData" :key="index" :class="['path-item-box']">
            <div class="path-text-box">
              <el-checkbox :key="index" :value="index" class="m-r-8" :id="`match-list-checkbox-${index}-true`" />
              <div class="path-text">{{ t('spectrum.matchResult', { val: index + 1 }) }}</div>
              <div class="path-text" style="width: 100%">{{ t('spectrum.distance', { val: index + 1 }) }}: {{ item.dtwValue }}</div>
            </div>
            <div class="path-text-box">
              <div class="path-time">
                <span class="detail-label">{{ t('spectrum.startTime') }}：{{ formatDate(item.startTime) }}</span>
              </div>
            </div>
            <div class="path-text-box">
              <div class="path-time">
                <span class="detail-label">{{ t('spectrum.endTime') }}：{{ formatDate(item.endTime) }}</span>
              </div>
            </div>
          </li>
        </el-checkbox-group>
      </ul>
      <div class="detail-pager">
        <span class="detail-total">{{ t('aiAnalysis.total', { total: sortedData.length }) }}</span>
        <el-pagination :page-size="pageSize" v-model:current-page="currentPage" size="small" :background="true" :pager-count="5" layout="prev, pager, next" :total="sortedData.length" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CheckboxValueType } from 'element-plus';
import { formatDate } from '@/utils/date';

const matchList = defineModel<Search.MatchItem[]>('modelValue', { default: [] });
const checkedItem = ref<number[]>([]);
const order = ref(0);
const sortedData = computed(() => {
  const sortedList = [...matchList.value]; // create a copy of the array
  switch (order.value) {
    case 0:
      return sortedList?.sort((a, b) => b.dtwValue - a.dtwValue);
    case 1:
      return sortedList?.sort((a, b) => a.dtwValue - b.dtwValue);
    case 2:
      return sortedList?.sort((a, b) => b.startTime - a.startTime);
    case 3:
      return sortedList?.sort((a, b) => a.startTime - b.startTime);
    default:
      return matchList.value;
  }
});

const currentPage = ref(1);
const { maxTableHeight } = useTableHeight(390);
const pageSize = ref(10);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return sortedData.value.slice(start, end);
});

// const emit = defineEmits<{
//   (event: 'handleOperate', data: string): void;
// }>();

const { t } = useI18n();
const listKey = ref(0);
const allChecked = ref(true);
const isIndeterminate = ref(false);
function handleAllChecked(val: CheckboxValueType) {
  checkedItem.value = val ? paginatedData.value.map((i, index) => index) : [];
  isIndeterminate.value = false;
}

function handleCheckedChange(value: CheckboxValueType[]) {
  const checkedCount = value.length;
  allChecked.value = checkedCount === paginatedData.value.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < paginatedData.value.length;
}
function handleOrderChange() {
  allChecked.value = true;
  checkedItem.value = paginatedData.value.map((i, index) => index);
}
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
  background: #fff;
  border: none;
  margin-top: -1px;
  padding-top: 10px;
  height: 90px;
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
    width: 100px;
    display: inline-flex;
  }

  .path-time {
    margin-left: 22px;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #424561;
    display: inline-flex;
  }
}

.path-detail-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 12px 0 32px;

  &:lang(en) {
    margin: 0 8px;
  }

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

.detail-pager {
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-total {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #495ad4;
}

.el-pagination--small {
  --el-pagination-button-width-small: 20px;
  --el-pagination-button-height-small: 20px;

  :deep(.btn-prev),
  :deep(.btn-next),
  :deep(.el-pager li) {
    margin: 0 2px !important;
  }
}

.list-box {
  overflow: auto;
}
</style>
