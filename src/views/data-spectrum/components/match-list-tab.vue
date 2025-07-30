<template>
  <div class="flex flex-col" style="height: 100%">
    <div class="side-list-box list-empty-wrapper" v-if="!matchList?.length">
      <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
      <span class="data-empty-text">{{ t('common.noData') }}</span>
    </div>
    <div v-else class="flex flex-col">
      <div class="flex-justify-between p-b-4">
        <span class="detail-total">{{ t('spectrum.total', { total: sortedData.length }) }}</span>
        <el-button type="primary" class="m-r-8" :disabled="!sortedData.length" link @click="handleSave" id="download-match-data">
          {{ t('spectrum.download') }}
        </el-button>
      </div>
      <div class="side-list-box">
        <div class="path-text-box flex-justify-between">
          <el-checkbox v-model="allChecked" :indeterminate="isIndeterminate" @change="handleAllChecked" class="m-r-8" :id="`match-list-checkbox-all`">{{ t('common.allChoose') }}</el-checkbox>
          <el-select id="match-list-order" v-model:model-value="order" style="width: 168px" @change="handleOrderChange">
            <el-option :label="t('spectrum.ascByDistance')" :value="0" id="`match-list-order-ascByDistance" />
            <el-option :label="t('spectrum.descByDistance')" :value="1" id="`match-list-order-descByDistance" />
            <el-option :label="t('spectrum.ascByTime')" :value="2" id="`match-list-order-ascByTime" />
            <el-option :label="t('spectrum.descByTime')" :value="3" id="`match-list-order-descByTime" />
          </el-select>
        </div>
        <ul class="list-box" :style="{ height: `${maxTableHeight}px`, maxHeight: `${maxTableHeight}px` }" :key="listKey">
          <el-checkbox-group v-model="checkedItem" @change="handleCheckedChange">
            <li v-for="(item, index) in paginatedData" :key="index" :class="['path-item-box']">
              <div class="path-text-box">
                <el-checkbox :key="index" :value="index" class="m-r-0" :id="`match-list-checkbox-${index}-true`" />
                <div class="path-text" style="width: 105px">{{ t('spectrum.matchResult', { val: item.resultNum }) }}</div>
                <div class="path-text">{{ t('spectrum.distance', { val: index + 1 }) }}: {{ item.matchScore }}</div>
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
      </div>
      <div class="detail-pager">
        <el-pagination
          :page-size="pageSize"
          @current-change="handleCurrentChange"
          v-model:current-page="currentPage"
          size="small"
          :background="true"
          :pager-count="5"
          layout="prev, pager, next"
          :total="sortedData.length"
        />
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
      return sortedList?.sort((a, b) => a.distance - b.distance).map((item, index) => ({ ...item, resultNum: index + 1, matchScore: 100 - item.distance }));
    case 1:
      return sortedList?.sort((a, b) => b.distance - a.distance).map((item, index) => ({ ...item, resultNum: index + 1, matchScore: 100 - item.distance }));
    case 2:
      return sortedList?.sort((a, b) => a.startTime - b.startTime).map((item, index) => ({ ...item, resultNum: index + 1, matchScore: 100 - item.distance }));
    case 3:
      return sortedList?.sort((a, b) => b.startTime - a.startTime).map((item, index) => ({ ...item, resultNum: index + 1, matchScore: 100 - item.distance }));
    default:
      return matchList.value.map((item, index) => ({ ...item, resultNum: index + 1, matchScore: 100 - item.distance }));
  }
});

const currentPage = ref(1);
const { maxTableHeight } = useTableHeight(398);
const pageSize = ref(10);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return sortedData.value.slice(start, end);
});

const emit = defineEmits<{
  (event: 'handleCheckChange', payload: Search.MatchItem[]): void;
  (event: 'handleSave', times: Search.MatchItem[]): void;
}>();

const { t } = useI18n();
const listKey = ref(0);
const allChecked = ref(true);
const isIndeterminate = ref(false);

function notifyCheckChange() {
  const checkData = paginatedData.value.filter((item, index) => checkedItem.value.includes(index));
  emit('handleCheckChange', checkData);
}

function handleAllChecked(val: CheckboxValueType) {
  checkedItem.value = val ? paginatedData.value.map((i, index) => index) : [];
  isIndeterminate.value = false;
  notifyCheckChange();
}

function handleCheckedChange(value: CheckboxValueType[]) {
  const checkedCount = value.length;
  allChecked.value = checkedCount === paginatedData.value.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < paginatedData.value.length;
  notifyCheckChange();
}

function selectAll() {
  allChecked.value = true;
  isIndeterminate.value = false;
  handleAllChecked(true);
}
function handleOrderChange() {
  currentPage.value = 1;
  selectAll();
}
function handleCurrentChange() {
  selectAll();
}

function handleSave() {
  const times = [...matchList.value]?.sort((a, b) => a.startTime - b.startTime);
  emit('handleSave', times);
}

watch(
  () => matchList.value,
  () => {
    selectAll();
  },
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
    display: inline-block;
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
  justify-content: center;
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
