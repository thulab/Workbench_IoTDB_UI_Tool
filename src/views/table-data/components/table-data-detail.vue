<template>
  <el-container class="page-container">
    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px); align-items: center">
        <i-custom-field class="m-r-8" />
        <text-tooltip :content="`${currentNode?.nodeName}`" />
      </div>
      <span class="m-l-8">{{ t('dataManage.data') }}</span>
    </h4>
    <el-header class="search-form-wrapper p-0" style="height: auto">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline>
        <base-form-item prop="path" :label="t('dataManage.columnName')">
          <columns-select
            v-model="searchFormData.columns"
            :disabled-select="getListLoading"
            :placeholder="t('dataManage.selectColumnPlaceholder')"
            :view-text="t('dataManage.columnsSelected')"
            :current-node="currentNode"
            id="data-search-path"
            @handle-change-path="handleChangePath"
          />
        </base-form-item>
        <el-form-item :label="`${t('search.searchTime')}：`" prop="time">
          <div class="search-time-wrapper">
            <el-date-picker
              v-model="searchFormData.datetimerange"
              type="datetimerange"
              range-separator="-"
              unlink-panels
              :disabled-date="disabledDate"
              :shortcuts="shortcutsDaterange"
              :clearable="false"
              :prefix-icon="ICustomCalender"
              :start-placeholder="t('search.startTime')"
              :end-placeholder="t('search.endTime')"
              id="data-search-datetimerange"
              :disabled="getListLoading"
            />
          </div>
        </el-form-item>
      </el-form>
      <div class="search-form-buttons">
        <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
          <el-button @click="handleReset(true)" :disabled="getListLoading || !canReadWriteData" id="data-search-reset">{{ t('common.reset') }}</el-button>
        </auth-tooltip>
        <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
          <el-button type="primary" :disabled="!canReadWriteData" @click="handleSearch" id="data-search-search">{{ getListLoading ? t('common.cancelQuery') : t('common.query') }}</el-button>
        </auth-tooltip>
      </div>
    </el-header>

    <el-main class="page-table-details">
      <div class="page-info-box">
        <h4 class="page-info-title">
          {{ t('common.searchDetail') }}
          <span class="run-result-tip">
            <i-custom-info-warning />
            {{ t('search.export1000RowTip') }}
          </span>
        </h4>
        <div class="page-detail-buttons">
          <auth-tooltip :is-disabled="canReadWriteData" :content="'common.dataAuth'">
            <el-button type="primary" :disabled="!canReadWriteData" @click="handleSearch" id="data-search-search">{{ t('dataManage.dataInsert') }}</el-button>
          </auth-tooltip>
          <auth-tooltip :is-disabled="canWriteData" :content="'common.dataAuthAnother'">
            <el-button type="primary" :disabled="!canReadWriteData" @click="handleSearch" id="data-search-search">{{ t('common.batchDelete') }}</el-button>
          </auth-tooltip>
        </div>
      </div>

      <auth-container :is-auth="canReadWriteData" style="height: 100%" :content="'common.dataAuth'">
        <div v-loading="getListLoading">
          <dynamic-table
            :columns="columns"
            :table-data="tableDataPagination"
            :height="maxTableHeight"
            :max-height="maxTableHeight"
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :total="tableData.length"
            :show-pagination="true"
          />
          <div class="table-error-wrapper" v-if="searchDetailInfos.errMsg">Msg: {{ searchDetailInfos.errMsg }}</div>
        </div>
        <sql-preview ref="sqlPreviewRef" style="margin: 8px 0 0; background-color: #fff" />
      </auth-container>
    </el-main>

    <modal-import v-model:visible="importVisible" @handle-close="handleImportClose" />
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { cloneDeep } from 'lodash-es';
import { useTableHeight, useShortcutsDate } from '@/composition-api';
import { TableDataApi } from '@/api';
import { todayNow } from '@/utils/date';
import { useUserStore } from '@/stores';
import DynamicTable from '@/components/dynamic-table.vue';
import SqlPreview from '@/components/sql-preview.vue';
import ICustomCalender from '~icons/custom/calender.svg';
import ColumnsSelect from './columns-select.vue';

const props = defineProps<{
  currentNode: IoTDB.TreeNodeData;
}>();

const sqlPreviewRef = ref<InstanceType<typeof SqlPreview>>();

const { t } = useI18n();
const route = useRoute();
const userStore = useUserStore();
const { canReadWriteData, canWriteData } = storeToRefs(userStore);
const { maxTableHeight } = useTableHeight(440);

const searchFormRef = ref<FormInstance>();
const firstLoad = ref(true);

const currentQueryTime = ref('');
// const errorDeviceTip = ref('');
const searchFormData = reactive({
  columns: [] as string[],
  time: todayNow(),
  datetimerange: [],
  // asc: 'asc',
});
let copySearchFormData = cloneDeep(searchFormData);

const { shortcutsDaterange } = useShortcutsDate();

const disabledDate = (time: number) => time < new Date('1970-1-1').getTime();

const searchDetailInfos = ref<Partial<Search.QueryDataResult>>({});
const hasNext = ref(false);
const columns = ref<DynamicTableColumn[]>([]);
const tableData = ref<Record<string, any>[]>([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  columnSize: 100,
  columnNum: 1,
  totalColumnPage: 0,
  totalColumnCount: 0,
});
const importVisible = ref(false);
// const tableHeight = computed(() => (tableData.value.length > 0 ? maxTableHeight.value : maxTableHeight.value ));

const getListLoading = ref(false);

const columnsSelected = ref<string[]>([]);

// // 查询结果
// const formatSqlInfo = computed(() => function (filed: string) {
//   const data: Partial<Search.QueryDataResult> = searchDetailInfos?.value;
//   if (filed === 'status') {
//     // eslint-disable-next-line no-nested-ternary
//     return data.status === undefined ? '' : (data.status ? '查询成功' : '查询失败');
//   } if (filed === 'startQueryTime') {
//     return currentQueryTime.value;
//   } if (filed === 'queryTime') {
//     return data.status ? data.queryTime : '';
//   }
//   return '';
// });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

function handleAppendSql(sql: string) {
  sqlPreviewRef.value?.appendSql(sql);
}

const { requestFn: getList } = useRequest(TableDataApi.getTableData);
// const { requestFn: exportData } = useRequest(SearchApi.exportData);

let controller = new AbortController();

function getListData() {
  firstLoad.value = false;
  columns.value = [];
  tableData.value = [];

  const startTime = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[0]).valueOf() : undefined;
  const endTime = copySearchFormData.datetimerange.length === 2 ? dayjs(copySearchFormData.datetimerange[1]).valueOf() : undefined;

  searchDetailInfos.value.status = undefined;
  searchDetailInfos.value.queryTime = '';
  currentQueryTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  getListLoading.value = true;
  controller = new AbortController();
  getList(
    {
      database: props.currentNode.database!,
      tableName: props.currentNode.nodeName!,
      columnNames: copySearchFormData.columns && copySearchFormData.columns.length > 0 ? ['time', ...copySearchFormData.columns] : undefined,
      startTime,
      endTime,
      size: 1000,
      page: pagination.pageNum,
    },
    controller
  )
    .then((res) => {
      // eslint-disable-next-line no-undef
      const list: DynamicTableColumn[] = [];
      res.data?.value.metaDataList?.forEach((item: string, index: number) => {
        list.push({
          label: item,
          prop: `t${index}`,
          defaultValue: '-',
          fixed: index === 0 ? 'left' : undefined,
          sortable: false,
          // formatHeader: formatTimeseries,
        });
      });
      columns.value = list;
      tableData.value = res.data?.value.valueList?.map((item: any[]) => {
        const obj = {} as Record<string, string>;
        item.forEach((childItem, index) => {
          obj[`t${index}`] = childItem;
        });
        return obj;
      });
      hasNext.value = res.data?.value.hasNext;
      searchDetailInfos.value = res.data.value || {};
      handleAppendSql(res.data.sql);
    })
    .finally(() => {
      getListLoading.value = false;
    });
}

function handleChangePath(columnsVal: string[]) {
  columnsSelected.value = columnsVal;
  searchFormData.columns = columnsVal;
  copySearchFormData.columns = columnsVal;
  if (firstLoad.value) {
    getListData();
  }
}

// 重置
function handleReset(force?: boolean) {
  //  不知道为啥不生效了
  // searchFormRef.value?.resetFields();
  searchFormData.columns = [];
  searchFormData.time = todayNow();
  searchFormData.datetimerange = [];
  pagination.pageNum = 1;
  if (force) {
    copySearchFormData = cloneDeep(searchFormData);
    getListLoading.value = false;
    sessionStorage.setItem('dataSearchStorage', '');
    getListData();
  }
}

// 查询
function handleSearch() {
  // if (!searchFormData.path.length) {
  //   errorDeviceTip.value = '请输入测点名称后进行搜索';
  //   return;
  // }
  // errorDeviceTip.value = '';
  if (getListLoading.value) {
    controller.abort();
    return;
  }
  pagination.pageNum = 1;
  copySearchFormData = cloneDeep(searchFormData);
  getListData();
}

// 列
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function queryData(columnNum?: number) {
  pagination.pageSize = 10;
  pagination.pageNum = 1;
  pagination.columnNum = columnNum || 1;
  pagination.columnSize = 100;
  getListData();
}

// 导入物理量
function handleImportClose(reload: boolean) {
  if (reload) {
    handleSearch();
  }
}

function setStorage() {
  sessionStorage.setItem(
    'dataSearchStorage',
    JSON.stringify({
      ...copySearchFormData,
    })
  );
}

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    // eslint-disable-next-line no-underscore-dangle
    if (!window.__isReload__) {
      setStorage();
    } else {
      sessionStorage.setItem('dataSearchStorage', '');
    }
  });
  //   if (!canReadWriteData.value) return;
  //   firstLoad.value = true;
  //   handleReset();
  //   if (route.query.measurement) {
  //     searchFormData.path = [route.query.measurement] as string[];
  //     handleSearch();
  //   } else {
  //     handleSearch();
  //   }
});

onBeforeUnmount(() => {
  setStorage();
});

watch(
  () => canReadWriteData.value,
  (val) => {
    if (val) {
      firstLoad.value = true;
      getListLoading.value = false;
      if (route.query.measurement) {
        handleReset();
        searchFormData.columns = [route.query.measurement] as string[];
        handleSearch();
        return;
      }
      if (sessionStorage.getItem('dataSearchStorage')) {
        const searchData = JSON.parse(sessionStorage.getItem('dataSearchStorage') as string);
        searchFormData.columns = searchData.path;

        searchFormData.datetimerange = searchData.datetimerange;
        handleSearch();
        return;
      }
      handleReset();
      handleSearch();
    } else if (route.query.measurement) {
      handleReset();
      searchFormData.columns = [route.query.measurement] as string[];
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.info-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
  padding: 14px 0 6px;
  border-bottom: 1px solid #dfe1ed;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.page-container {
  background-color: #fff;
  border-radius: 6px;
  padding: 16px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .el-button:focus-visible {
    outline: none;
  }
}

.search-time-wrapper {
  display: flex;
  align-items: center;

  :deep(.el-input__inner, .el-range-input, .el-select__input-wrapper, .el-select__placeholder) {
    color: #656a85 !important;
  }

  .search-time-list {
    display: flex;
    margin-right: 12px;
    border-radius: 12px;
    background-color: #f0f1fa;
    padding: 4px;

    .search-time-type {
      padding: 3px 9px;
      cursor: pointer;
      border-radius: 12px;
      background-color: transparent;
      font-size: 12px;
      line-height: 12px;
      color: #656a85;
    }

    .search-time-active {
      background-color: #495ad4;
      color: #fff;
    }
  }
}

.table-empty-wrapper {
  flex: 1;
}

:deep(.el-select-v2__selection) {
  flex-wrap: nowrap;
}

.page-table-details {
  padding: 8px 16px;
  border-radius: 2px;
  background: #f7f8fc;
  display: flex;
  flex: 1;
  flex-direction: column;

  .page-info-title {
    display: flex;
    font-size: 14px;
    line-height: 20px;
    color: #495ad4;

    .run-result-tip {
      align-self: flex-end;
      margin: 0 0 0 12px;
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #808080;
      font-weight: 400;

      svg {
        color: #ccc;
        margin-right: 4px;
      }
    }
  }

  .page-info-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .run-result-list {
    display: flex;

    .run-result-item {
      font-size: 12px;
      line-height: 12px;
      color: #131926;
      margin-right: 30px;
      display: flex;
      align-items: center;
    }
  }
}

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 24px;

  .btn-prev,
  .btn-next,
  .btn-first {
    margin: 0 8px 0 0;
    padding: 6px 4px;
    min-width: 56px;
  }
}

.table-error-wrapper {
  min-height: 200px;
  padding: 16px 24px;
  font-size: 12px;
  font-weight: 300;
  line-height: 24px;
  color: #424561;
}
</style>
