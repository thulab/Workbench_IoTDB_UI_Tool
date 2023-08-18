<template>
  <div class="page-container">
    <div class="search-form-wrapper">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" label-width="78px" size="default" inline :disabled="getListLoading">
        <base-form-item label="测点选择：" prop="path" class="m-r-40">
          <template #label>
            测点选择：<el-tooltip effect="light" content="仅展示100条搜索结果，如有需要请精确搜索" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
          </template>
          <timeseries-select v-model="searchFormData.path" :is-show-view-btn="true" />
        </base-form-item>
        <base-form-item label="查询时间：" prop="datetimerange" style="margin-right: 0;">
          <el-date-picker
            v-model="searchFormData.datetimerange"
            type="datetimerange"
            range-separator="～"
            unlink-panels
            :disabled-date="disabledDate"
            :shortcuts="shortcutsDaterange"
            :clearable="false"
            :prefix-icon="ICustomCalender"
            id="statistic-search-datetimerange"
          />
        </base-form-item>
      </el-form>
      <div class="search-form-buttons">
        <el-button @click="handleReset" :disabled="getListLoading" id="statistic-search-reset">重置</el-button>
        <el-button type="primary" @click="handleSearch" id="statistic-search-search">{{getListLoading ? '取消查询' : '查询'}}</el-button>
      </div>
    </div>

    <div class="page-table-details">
      <div class="page-info-box">
        <h4 class="page-info-title">查询详情</h4>
        <div class="page-detail-buttons">
          <el-dropdown class="m-r-16" :disabled="getListLoading" @command="val => handleCommandDown(val)">
            <el-button class="export-btn" id="statistic-search-download" :disabled="getListLoading">导出<el-tooltip effect="light" content="excel格式最大支持下载量为2G，csv无限制，推荐使用csv格式导出" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="csv">以.csv格式导出</el-dropdown-item>
                <el-dropdown-item command="xlsx">以.xlsx格式导出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button link @click="handleSearch" :disabled="getListLoading" id="statistic-search-refresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        v-loading="getListLoading"
        style="width: 100%;"
        :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
        :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
        tooltip-effect="light"
        ref="tableRef"
        :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
      >
        <el-table-column label="测点名称" prop="timeseries" width="160" align="center" show-overflow-tooltip />
        <el-table-column label="最小值" prop="dataType" width="140" align="center" show-overflow-tooltip />
        <el-table-column label="最小值时间" prop="encoding" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column label="最大值" prop="value" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column label="最大值时间" prop="valueTime" min-width="200" align="center" show-overflow-tooltip />
        <el-table-column label="平均值" prop="valueTime" min-width="200" align="center" show-overflow-tooltip />
        <el-table-column label="总和" prop="valueTime" min-width="200" align="center" show-overflow-tooltip />
        <template #empty>
          <div class="table-empty-wrapper">
            <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
            <span class="data-empty-text">暂无数据</span>
          </div>
        </template>
      </el-table>

      <el-pagination
        v-if="totalCount > 0"
        v-model:currentPage="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        class="m-t-20"
        layout="prev, pager, next, sizes, jumper"
        background
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        @size-change="onChangePageSize"
        @current-change="onChangePage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, SingleOrRange, DateModelType } from 'element-plus';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash-es';
import { useTableHeight } from '@/composition-api';
import {
  getStartAndEnd, today, getOneInterval, getOneIntervalNow,
} from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';

const { maxTableHeight } = useTableHeight(280);

const searchFormRef = ref<FormInstance>();
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const searchFormData = reactive({
  path: [] as string[],
  datetimerange: getOneIntervalNow(7) as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
});
let copySearchFormData = cloneDeep(searchFormData);
const shortcutsDaterange = [
  {
    text: '今天',
    value: () => getStartAndEnd(0),
  },
  {
    text: '昨天',
    value: () => getOneInterval(1),
  },
  {
    text: '最近7天',
    value: () => getOneIntervalNow(7),
  },
];
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const getListLoading = ref(false);
const tableData = ref<Array<Record<string, any>>>([]);

const controller = new AbortController();

function getListData() {

}

// 重置
function handleReset() {
  searchFormRef.value?.resetFields();
  searchFormData.datetimerange = getOneIntervalNow(7) as [DateModelType, DateModelType];
}

// 查询
function handleSearch() {
  if (getListLoading.value) {
    controller.abort();
    return;
  }
  pagination.pageNum = 1;
  copySearchFormData = cloneDeep(searchFormData);
  getListData();
}

function onChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
  getListData();
}

function onChangePage(page: number) {
  pagination.pageNum = page;
  getListData();
}

// 下载
function handleCommandDown(val: string) {
  const startTime = dayjs(copySearchFormData.datetimerange[0]).valueOf();
  const endTime = dayjs(copySearchFormData.datetimerange[1]).valueOf();
  console.log(val, startTime, endTime);
  // exportData({
  //   measurements: copySearchFormData.path,
  //   startTime,
  //   endTime,
  // }).then((res) => {
  //   let url = `/api/file/exportExcelData?exportId=${res.data}`;
  //   if (exportType === 'csv') {
  //     url = `/api/file/exportCSVData?exportId=${res.data}`;
  //   }
  //   window.open(url);
  // });
}

onMounted(() => {
  handleReset();
  handleSearch();
});

</script>

<style lang="scss" scoped>
.page-container {
  .el-button:focus-visible {
    outline: none;
  }
}

.search-form-wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  height: 50px;
}

.page-table-details {
  padding: 16px 16px 10px;
  border-radius: 2px;
  background: #f7f8fc;

  .page-info-title {
    font-size: 14px;
    line-height: 21px;
    color: #495ad4;
    font-weight: 700;
  }

  .page-info-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .export-btn{
    position: relative;

    svg{
      position: absolute;
      right: 4px;
      top: 2px;
    }
  }
}
</style>
