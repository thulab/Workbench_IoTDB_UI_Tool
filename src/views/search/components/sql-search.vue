<template>
  <div class="sql-input-area">
    <div class="sql-title-box">
      <div class="sql-title-text">
        <span>{{ t('search.sqlInput') }}</span>
      </div>
      <div class="sql-right-icon-box">
        <el-button link @click="handleRevert" :disabled="code === codeOriginal" id="sql-search-operate-revert" class="svg-button-hover-color">
          <i-custom-revert />
          {{ t('common.reset') }}
        </el-button>
        <el-button link @click="handleSave" id="sql-search-operate-save" class="svg-button-hover-color">
          <i-custom-sql-save />
          {{ t('common.save') }}
        </el-button>
        <el-button link :disabled="!runFlag" @click="querySqlRun()" id="sql-search-operate-run" class="svg-button-hover-color">
          <i-custom-run-all />
          {{ t('search.runAll') }}
        </el-button>
        <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('search.selectRunTip')" :disabled="!!selectionCode" popper-class="tooltip-max-width">
          <el-button link :disabled="!runFlag || !selectionCode" @click="querySqlRun('part')" id="sql-search-operate-run-part" :class="!runFlag || !selectionCode ? '' : 'svg-button-hover-color'">
            <i-custom-run-part />
            {{ t('search.runPart') }}
          </el-button>
        </el-tooltip>
        <el-button link :disabled="runFlag" @click="stopquery" id="sql-search-operate-stop" :class="runFlag ? '' : 'svg-button-hover-color'">
          <i-custom-sql-abort />
          {{ t('common.cancel') }}
        </el-button>
        <el-button link @click="emptyQuery" id="sql-search-operate-empty" class="svg-button-hover-color">
          <i-custom-sql-empty />
          {{ t('common.clear') }}
        </el-button>
      </div>
    </div>

    <div>
      <code-editor
        v-show="codeMirrorReady"
        v-model:model-value="codeVal"
        @ready="() => (codeMirrorReady = true)"
        :style="{
          height: `${codeEditorHeight}px`,
          backgroundColor: '#f9fbfc',
        }"
        ref="codeEditorRef"
        @update="handleUpdate"
      />
    </div>
  </div>
  <div>
    <div class="run-result-title-box">
      <h4 style="font-size: 14px; font-weight: 700; line-height: 20px; color: #495ad4">{{ t('search.runResult') }}</h4>
      <span class="run-result-tip">
        <i-custom-info-warning />
        {{ connectionStore.isTableModel ? t('search.export1000RowTip') : t('search.export1000Tip') }}
      </span>
    </div>
    <div class="tabs" v-if="tableData.list && tableData.list.length > 0">
      <el-tabs v-model="activeName" type="card" class="tabs-nav-list" id="sql-search-result-tabs">
        <el-tab-pane v-for="(item, index) of columnList" :key="index" :name="`t${index}`">
          <template #label>
            <span>{{ t('search.runningResult') }}{{ index + 1 }}</span>
          </template>
          <div class="run-result-infos">
            <!-- <ul>
              <li class="run-result-item">
                <i-custom-query-success v-if="sqlResult[index]!.status === true" />
                <i-custom-query-error v-else-if="sqlResult[index]!.status === false" />
                <i-custom-query-status v-else />
                查询状态：
                <span :style="{ color: sqlResult[index]!.status !== undefined ? sqlResult[index]!.status ? '#44C795' : '#D43030' : '#656A85' }">{{ formatSqlInfo('status', index) }}</span>
              </li>
              <li class="run-result-item"><i-custom-query-start-time />开始时间：{{ formatSqlInfo('startQueryTime', index) }}</li>
              <li class="run-result-item"><i-custom-query-time />查询耗时：{{ formatSqlInfo('queryTime', index) }}</li>
            </ul> -->
            <div></div>
            <div class="run-result-buttons">
              <el-button link @click="handleCommandDown('refresh', index)" id="sql-search-refresh" class="svg-button-hover-color">
                <i-custom-refresh />
                {{ t('common.refresh') }}
              </el-button>
              <el-dropdown
                :disabled="!sqlResult[index]!.status"
                class="more-icon m-l-12"
                @command="(val) => handleCommandDown(val, index)"
                v-show="sqlResult[index]!.status && tableDataPagination[index]!.list?.length > 0"
                id="sql-search-download-dropdown"
              >
                <el-button link :class="['sql-export-button', !sqlResult[index]!.status ? '' : 'svg-button-hover-color']" :disabled="!sqlResult[index]!.status" id="sql-search-download">
                  <i-custom-download style="transform: translate(0, 0)" />
                  {{ t('common.export') }}
                  <el-tooltip effect="light" :content="t('common.exportTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question class="export-tip" /></el-tooltip>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="csv" id="sql-search-download-csv">{{ t('common.exportCSV') }}</el-dropdown-item>
                    <el-dropdown-item command="xlsx" id="sql-search-download-xlsx">{{ t('common.exportXLSX') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="tab_table" v-if="sqlResult[index]!.status">
            <dynamic-table
              v-if="item"
              ref="standTable"
              :columns="item"
              :table-data="tableDataPagination[index]!.list || []"
              :max-height="maxTableHeight"
              :height="maxTableHeight"
              v-model:current-page="pageNums[index]"
              v-model:page-size="pagination.pageSize"
              :total="total[index]"
              @load-data="getList(index)"
              show-pagination
            />
          </div>
          <div class="tab_table" v-if="sqlResult[index]!.errMsg">Msg: {{ sqlResult[index]!.errMsg }}</div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs';
import DynamicTable from '@/components/dynamic-table.vue';
import { SearchApi } from '@/api';
import CodeEditor from './code-editor.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import type { QuerySqlResponse } from '@/types';
import { useConnectionStore } from '@/stores';

const props = defineProps<{
  code: string;
  codeOriginal: string;
}>();
const emit = defineEmits(['save', 'update:code', 'revert']);

const { t } = useI18n();
const codeEditorRef = ref<InstanceType<typeof CodeEditor>>();
const codeVal = useVModel(props, 'code');
const codeMirrorReady = ref(false);
const connectionStore = useConnectionStore();

const standTable = ref(null);

const pageNums = reactive<number[]>([]);

const columnList = ref<Array<Array<globalThis.DynamicTableColumn> | null>>([]);

const tableData = reactive<{ list: Array<Record<string, any> | null> }>({
  list: [],
});
const sqlResult = ref<Partial<QuerySqlResponse>[]>([]);
const activeName = ref<string | number>(0);
const total = computed(() => tableData.list.map((item) => item?.list?.length));
const timeNumber = ref(0);
const currentQueryTime = ref('');
const display = ref(false);
const key = ref('1');
const runFlag = ref(true);
const selectionCode = ref('');

const codeEditorHeight = computed(() => {
  const height = document.documentElement.clientHeight / 3;
  return height;
});

const { maxTableHeight } = useTableHeight(codeEditorHeight.value + 370, undefined, 200);

const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});

const { requestFn: queryStop } = useRequest(SearchApi.queryStop);
const { requestFn: querySql } = useRequest(SearchApi.querySql);
const { requestFn: exportSqlData } = useRequest(SearchApi.exportSqlData);

function getList(index: number) {
  return (value: any) => {
    pageNums[index] = value;
  };
}
const tableDataPagination = computed(() =>
  tableData.list.map((item, index) => {
    nextTick(() => {
      key.value = `${Math.random() + Date.now()}`;
    });
    return {
      ...item,
      list: item?.list?.slice(((pageNums[index] || 1) - 1) * pagination.pageSize, (pageNums[index] || 1) * pagination.pageSize) as Record<string, any>[],
    };
  }),
);

const trimEnd = (str: string, char: string) => {
  if (str.endsWith(char)) {
    return trimEnd(str.slice(0, -1), char);
  }
  return str;
};

let controller = new AbortController();

// 执行sql
function querySqlRun(type?: string) {
  let codeStr = codeVal.value.replace(/(\/\*(\s|.)*?\*\/)|(--.*$)/gm, '').replace(/^\s+/gm, '');
  if (type === 'part') {
    codeStr = selectionCode.value;
  }
  if (!codeStr.length) {
    ElMessage.error({ message: t('search.runEmptyTip'), grouping: true });
    return;
  }
  if (runFlag.value) {
    const sqlsArr = codeStr
      ?.split(';\n')
      .map((item) => {
        let sql = item.trim();
        sql = trimEnd(sql, ';');
        return sql;
      })
      .filter((item) => item.length > 0);
    if (sqlsArr?.length > 50) {
      ElMessage.warning({ message: t('search.runOverTip'), grouping: true });
      return;
    }
    display.value = false;
    runFlag.value = false;
    timeNumber.value = Number(new Date());
    currentQueryTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
    columnList.value = []; // 列名
    tableData.list = []; // 值
    sqlResult.value = [];
    pagination.pageSize = 10;
    pageNums.length = 0;
    controller = new AbortController();
    querySql({ sqls: sqlsArr, timestamp: timeNumber.value }, controller)
      .then((res) => {
        const { data } = res;
        activeName.value = 't0';
        columnList.value = []; // 列名
        tableData.list = []; // 值
        sqlResult.value = data || [];
        data.forEach((item) => {
          // const length = <number[]>[];
          if (item.metaDataList) {
            columnList.value.push(
              item.metaDataList.map((eleitem, index) => ({
                label: eleitem,
                prop: `t${index}`,
                defaultValue: '-',
                width: 'auto',
                fixed: index === 0 ? 'left' : false,
              })),
            );
          } else {
            columnList.value.push(null);
          }
          if (item.valueList) {
            tableData.list.push({
              list: item.valueList.map((eleitem) => {
                const obj = <Record<string, string>>{};
                for (let i = 0; i < eleitem.length; i++) {
                  // if (eleitem[i]!.length > length[i] || !length[i]) {
                  //   length[i] = eleitem[i]!.length;
                  // }
                  obj[`t${i}`] = eleitem[i]!;
                }
                return obj;
              }),
            });
          } else {
            tableData.list.push(null);
          }
        });
        display.value = true;
        runFlag.value = true;
      })
      .finally(() => {
        runFlag.value = true;
      });
    setTimeout(() => {
      runFlag.value = true;
    }, 5000);
  } else {
    ElMessage.error({ message: t('search.runRepeatTip'), grouping: true });
  }
}
// // 查询结果
// const formatSqlInfo = computed(() => (filed: string, index: number) => {
//   const data: Partial<Search.QuerySqlResponse> = sqlResult.value[index];
//   if (filed === 'status') {
//     // eslint-disable-next-line no-nested-ternary
//     return data.status === undefined ? '' : (data.status ? '查询成功' : '查询失败');
//   } if (filed === 'startQueryTime') {
//     return data.startQueryTime ? data.startQueryTime : currentQueryTime.value;
//   } if (filed === 'queryTime') {
//     return data.queryTime ? data.queryTime : '';
//   }
//   return '';
// });

function handleSave() {
  emit('save');
}
function handleRevert() {
  emit('revert');
}

function handleUpdate() {
  selectionCode.value = codeEditorRef.value!.getSelectionText().trim();
}

// 停止
function stopquery() {
  controller.abort();
  runFlag.value = true;
  queryStop(timeNumber.value).then(() => {});
}
function exportSql(val: string, exportType: string) {
  exportSqlData(val).then((res) => {
    if (res.data) {
      let url = `/api/file/exportExcelSqlData?exportId=${encodeURI(res.data)}`;
      if (exportType === 'csv') {
        url = `/api/file/exportCSVSqlData?exportId=${encodeURI(res.data)}`;
      }
      window.open(url);
    } else {
      ElMessage.error({ message: t('common.fileDownError'), grouping: true });
    }
  });
}
// 下载
function handleCommandDown(val: string, index: number) {
  const { sql = '' } = sqlResult.value[index]!;
  if (val === 'refresh') {
    sqlResult.value[index]!.startQueryTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    columnList.value.splice(index, 1, []);
    tableData.list.splice(index, 1, {});
    querySql({ sqls: [sql], timestamp: dayjs(dayjs().format('YYYY-MM-DD HH:mm:ss')).valueOf() }).then((res) => {
      const { data } = res;
      sqlResult.value[index] = Object.assign(sqlResult.value[index]!, data[0]);
      data.forEach((item) => {
        // const length = <number[]>[];
        if (item.metaDataList) {
          columnList.value.splice(
            index,
            1,
            item.metaDataList.map((eleitem, i) => ({
              label: eleitem,
              prop: `t${i}`,
              width: 'auto',
              fixed: i === 0 ? 'left' : false,
            })),
          );
        } else {
          columnList.value.splice(index, 1, null);
        }
        if (item.valueList) {
          tableData.list.splice(index, 1, {
            list: item.valueList.map((eleitem) => {
              const obj = <Record<string, string>>{};
              for (let i = 0; i < eleitem.length; i++) {
                // if (eleitem[i]!.length > length[i]! || !length[i]) {
                //   length[i] = eleitem[i]!.length;
                // }
                obj[`t${i}`] = eleitem[i]!;
              }
              return obj;
            }),
          });
        } else {
          tableData.list.splice(index, 1, null);
        }
      });
    });
  } else if (val === 'csv' || val === 'xlsx') {
    exportSql(sql, val);
  }
}

// 清空
function emptyQuery() {
  ElMessageBox.confirm(t('search.emptyTip'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'empty-sql-confirm',
    cancelButtonClass: 'empty-sql-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    codeVal.value = '';
    selectionCode.value = '';
    tableData.list = [];
    columnList.value = [];
    sqlResult.value = [];
    pageNums.length = 0;
  });
}

function insertContent(val: string) {
  codeEditorRef.value?.insertContent(val);
}

defineExpose({ insertContent });
</script>
<style lang="scss">
.tab_table .data-empty-img {
  width: 80px !important;
  height: 80px !important;
}
</style>
<style lang="scss" scoped>
.sql-input-area {
  padding: 0 8px;
  margin-bottom: 8px;
  border-radius: 0 0 6px 6px;
  background-color: #fff;
}

.sql-title-box {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.sql-title-text {
  display: flex;
  align-items: center;

  span {
    font-size: 14px;
    font-weight: 700;
    line-height: 20px;
    color: #495ad4;
  }

  a {
    margin-left: 4px;
    display: flex;
    align-items: center;
    color: #808080;
  }
}

.sql-right-icon-box {
  display: flex;
  align-items: center;

  .el-button + .el-button {
    margin-left: 4px;
  }

  /* stylelint-disable-next-line no-descending-specificity */
  .el-button {
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656a85;

    svg {
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
  }
}

.run-result-title-box {
  display: flex;
  align-items: center;
  padding: 8px 0 8px 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #dfe1ed;

  .run-result-tip {
    // align-self: flex-end;
    margin: 0 0 0 12px;
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #808080;

    svg {
      color: #ccc;
      margin-right: 4px;
    }
  }
}

.tabs {
  padding: 8px;
}

.tabs-nav-list {
  margin-bottom: 8px;

  :deep(.el-tabs__content) {
    padding: 8px;
    background-color: #f7f8fc;
    box-sizing: border-box;
  }

  :deep(.el-tabs__header) {
    height: 27px;
    padding-right: 0 !important;
  }

  :deep(.el-tabs__nav) {
    border-radius: 6px 6px 0 0 !important;
  }

  :deep(.el-tabs__item) {
    border-radius: 6px 6px 0 0;
    height: 27px;
    font-size: 12px;
  }

  :deep(.el-tabs__item.is-active) {
    background-color: var(--el-color-primary);
    color: #fff;
  }
}

.run-result-infos {
  display: flex;
  justify-content: space-between;

  ul {
    display: flex;
    margin-bottom: 12px;

    .run-result-item {
      font-size: 12px;
      line-height: 12px;
      color: #131926;
      margin-right: 30px;
      display: flex;
      align-items: center;
    }
  }

  .run-result-buttons {
    .el-button {
      font-size: 12px;
      font-weight: 300;
      line-height: 12px;
      color: #656a85;
    }
  }

  .sql-export-button {
    position: relative;
    padding: 2px 12px;
    display: flex !important;
    align-items: center !important;

    .export-tip {
      align-self: flex-start;
    }

    &:hover {
      :deep(.export-tip path) {
        fill: rgb(66 69 97) !important;
      }
    }
  }

  .sql-export-button.el-button:focus {
    color: #656a85 !important;
  }
}
</style>
