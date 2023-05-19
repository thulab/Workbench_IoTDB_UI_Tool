<template>
  <div class="sql-input-area">
    <div class="sql-title-box">
      <div class="sql-title-text">
        <span>SQL输入</span>
      </div>
      <div class="sql-right-icon-box">
        <el-button link @click="handleSave"><i-custom-sql-save />保存</el-button>
        <el-button link :disabled="!runFlag" @click="querySqlRun"><i-custom-sql-run />运行</el-button>
        <el-button link @click="stopquery"><i-custom-sql-abort />取消</el-button>
        <el-button link @click="emptyQuery"><i-custom-sql-empty />清空</el-button>
      </div>
    </div>

    <div style="height:50%">
      <code-editor
        v-show="codeMirrorReady"
        v-model:model-value="code"
        @ready="()=>codeMirrorReady = true"
        :style="{
          height: '300px',
          backgroundColor: '#f9fbfc',
        }" />
    </div>
  </div>
  <div>
    <div class="run-result-title-box">
      <h4 style="font-size: 14px;font-weight: 700;line-height: 20px;color:#495AD4;">执行结果</h4>
      <span class="run-result-tip"><i-custom-info-warning />默认最多查询1000行100列，如需查看更多数据请下载查看</span>
    </div>
    <div class="tabs" v-if="tableData.list && tableData.list.length > 0">
      <el-tabs v-model="activeName" type="card" class="tabs-nav-list">
        <el-tab-pane v-for="(item, index) of columnList" :key="index" :name="`t${index}`">
          <template #label>
            <span>运行结果{{ index + 1 }}</span>
          </template>
          <div class="run-result-infos">
            <ul>
              <li class="run-result-item">
                <i-custom-query-success v-if="sqlResult[index].status === true" />
                <i-custom-query-error v-else-if="sqlResult[index].status === false" />
                <i-custom-query-status v-else />
                查询状态：
                <span :style="{ color: sqlResult[index].status !== undefined ? sqlResult[index].status ? '#44C795' : '#D43030' : '#656A85' }">{{ formatSqlInfo('status', index) }}</span>
              </li>
              <li class="run-result-item"><i-custom-query-start-time />开始时间：{{ formatSqlInfo('startQueryTime', index) }}</li>
              <li class="run-result-item"><i-custom-query-time />查询耗时：{{ formatSqlInfo('queryTime', index) }}</li>
            </ul>
            <div class="run-result-buttons">
              <el-button link @click="handleCommandDown('refresh', index)"><i-custom-refresh />刷新</el-button>
              <el-dropdown :disabled="!sqlResult[index].status" class="more-icon m-l-12" @command="val => handleCommandDown(val, index)" v-show="sqlResult[index].status && tableDataPagination[index]?.list?.length > 0">
                <el-button link class="export-btn" :disabled="!sqlResult[index].status"><i-custom-download />下载<el-tooltip effect="light" content="excel格式导出时若数据量过大容易出现错误，推荐使用csv格式导出" placement="top"><i-custom-question class="export-tip" /></el-tooltip></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="csv">以.csv格式导出</el-dropdown-item>
                    <el-dropdown-item command="xlsx">以.xlsx格式导出</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="tab_table" v-if="sqlResult[index].status">
            <dynamic-table
              v-if="item"
              ref="standTable"
              :columns="item"
              :table-data="tableDataPagination[index].list || []"
              :max-height="300"
              v-model:current-page="pageNums[index]"
              v-model:page-size="pagination.pageSize"
              :total="total[index]"
              @load-data="getList(index)"
              show-pagination
            />
          </div>
          <div class="tab_table" v-if="sqlResult[index].errMsg">
            Msg: {{ sqlResult[index].errMsg }}
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs';
import { handleExport } from '@/utils/export';
import DynamicTable from '@/components/dynamic-table.vue';
import { SearchApi } from '@/api';
import { showErrorFn } from '@/composition-api/base/useRequest';
import CodeEditor from './code-editor.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg?raw';

const props = defineProps<{
  serverId: number;
  code: string;
}>();
const emit = defineEmits(['save', 'update:code']);

const code = useVModel(props, 'code');
const codeMirrorReady = ref(false);

const standTable = ref(null);

const pageNums = reactive<number[]>([]);

const columnList = ref <Array<Array<DynamicTableColumn> | null>>([]);

const tableData = reactive<{ list: Array<Record<string, any> | null> }>({
  list: [] || null,
});
const sqlResult = ref<Partial<Search.QuerySqlResponse>[]>([]);
const activeName = ref<string | number>(0);
const total = computed(() => tableData.list.map((item) => item?.list?.length));
const timeNumber = ref(0);
const currentQueryTime = ref('');
const display = ref(false);
const key = ref('1');
const runFlag = ref(true);

const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});

const { requestFn: queryStop } = useRequest(SearchApi.queryStop);
const { requestFn: querySql } = useRequest(SearchApi.querySql);
const { requestFn: exportDataSql } = useRequest(SearchApi.exportDataSql);

function getList(index: number) {
  return (value: any) => {
    pageNums[index] = value;
  };
}
const tableDataPagination = computed(() => tableData.list.map((item, index) => {
  nextTick(() => {
    key.value = `${Math.random() + Date.now()}`;
  });
  return {
    ...item,
    list: item?.list?.slice(((pageNums[index] || 1) - 1) * pagination.pageSize, (pageNums[index] || 1) * pagination.pageSize) as Record<string, any>[],
  };
}));

let controller = new AbortController();

// 执行sql
function querySqlRun() {
  if (!code.value.length) {
    ElMessage.error('请先输入语句再运行');
    return;
  }
  if (runFlag.value) {
    display.value = false;
    runFlag.value = false;
    timeNumber.value = Number(new Date());
    currentQueryTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
    columnList.value = []; // 列名
    tableData.list = []; // 值
    sqlResult.value = [];
    controller = new AbortController();
    querySql(props.serverId, { sqls: code.value?.split(';\n'), timestamp: timeNumber.value }, controller)
      .then((res) => {
        const { data } = res;
        activeName.value = 't0';
        columnList.value = []; // 列名
        tableData.list = []; // 值
        sqlResult.value = data || [];
        data.forEach((item) => {
          const length = <number[]>[];
          if (item.metaDataList) {
            columnList.value.push(item.metaDataList.map((eleitem, index) => ({
              label: eleitem,
              prop: `t${index}`,
              width: 'auto',
              fixed: index === 0 ? 'left' : false,
            })));
          } else {
            columnList.value.push(null);
          }
          if (item.valueList) {
            tableData.list.push({
              list: item.valueList.map((eleitem) => {
                const obj = <Record<string, string>>({});
                for (let i = 0; i < eleitem.length; i++) {
                  if (eleitem[i].length > length[i] || !length[i]) {
                    length[i] = eleitem[i].length;
                  }
                  obj[`t${i}`] = eleitem[i];
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
    ElMessage.error('查询正在运行中，请勿重复操作');
  }
}
// 查询结果
const formatSqlInfo = computed(() => (filed: string, index: number) => {
  const data: Partial<Search.QuerySqlResponse> = sqlResult.value[index];
  if (filed === 'status') {
    // eslint-disable-next-line no-nested-ternary
    return data.status === undefined ? '' : (data.status ? '查询成功' : '查询失败');
  } if (filed === 'startQueryTime') {
    return data.startQueryTime ? data.startQueryTime : currentQueryTime.value;
  } if (filed === 'queryTime') {
    return data.queryTime ? data.queryTime : '';
  }
  return '';
});

function handleSave() {
  emit('save');
}

// 停止
function stopquery() {
  controller.abort();
  runFlag.value = true;
  queryStop(props.serverId, timeNumber.value).then(() => {});
}
function exportSql(i: number, exportType: string) {
  const codevalArr = code.value?.split('\n');
  exportDataSql(props.serverId, codevalArr[i], exportType).then((res) => {
    if (res) {
      ElMessage.success('导出成功');
      handleExport(res, `export.${exportType}`);
    } else {
      ElMessage.info('导出未完成');
    }
  }).catch((err) => {
    if (err.message) {
      ElMessage.error(err.message);
    } else if (err.type === 'application/json') {
      err.text().then((str: string) => {
        const data = JSON.parse(str);
        showErrorFn(data);
      });
    } else {
      ElMessage.error('导出失败');
    }
  });
}
// 下载
function handleCommandDown(val: string, index: number) {
  if (val === 'refresh') {
    sqlResult.value[index].startQueryTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    columnList.value.splice(index, 1, []);
    tableData.list.splice(index, 1, {});
    sqlResult.value[index].sql = code.value?.split('\n')[index] || '';
    const { sql = '' } = sqlResult.value[index];
    querySql(props.serverId, { sqls: [sql], timestamp: dayjs(dayjs().format('YYYY-MM-DD HH:mm:ss')).valueOf() })
      .then((res) => {
        const { data } = res;
        sqlResult.value[index] = Object.assign(sqlResult.value[index], data[0]);
        data.forEach((item) => {
          const length = <number[]>[];
          if (item.metaDataList) {
            columnList.value.splice(index, 1, item.metaDataList.map((eleitem, i) => ({
              label: eleitem,
              prop: `t${i}`,
              width: 'auto',
              fixed: i === 0 ? 'left' : false,
            })));
          } else {
            columnList.value.splice(index, 1, null);
          }
          if (item.valueList) {
            tableData.list.splice(index, 1, {
              list: item.valueList.map((eleitem) => {
                const obj = <Record<string, string>>({});
                for (let i = 0; i < eleitem.length; i++) {
                  if (eleitem[i].length > length[i] || !length[i]) {
                    length[i] = eleitem[i].length;
                  }
                  obj[`t${i}`] = eleitem[i];
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
    exportSql(index, val);
  }
}

// 清空
function emptyQuery() {
  ElMessageBox.confirm('是否清空页面', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      code.value = '';
      tableData.list = [];
      columnList.value = [];
      sqlResult.value = [];
    });
}

</script>
<style lang="scss" scoped>
.sql-input-area {
  padding: 0 16px 16px ;
  margin-bottom: 16px;
  border-radius: 0 0 6px 6px;
  background-color: #fff;
}

.sql-title-box {
  display: flex;
  justify-content: space-between;
  padding: 12px 0  15px ;
}

.sql-title-text {
  display: flex;
  align-items: center;

  span {
    font-size: 14px;
    font-weight: 700;
    line-height: 20px;
    color:#495AD4;
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

  .el-button + .el-button {
    margin-left: 4px;
  }

  .el-button{
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656A85;

    svg{
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
  }
}

.run-result-title-box {
  display: flex;
  padding: 12px 0 12px 16px;
  margin-bottom: 12px;
  border-bottom: 1px solid #DFE1ED;

  .run-result-tip {
    align-self: flex-end;
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

.tabs{
  padding: 8px 16px;
}

.tabs-nav-list {
  :deep(.el-tabs__content) {
    padding: 16px;
    background-color: #F7F8FC;
    box-sizing: border-box;
  }

  :deep(.el-tabs__header) {
    height: 27px;
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

  .run-result-buttons{
    .el-button{
      font-size: 12px;
      font-weight: 300;
      line-height: 12px;
      color: #656A85;
    }
  }

  .export-btn{
    position: relative;
    padding: 0 12px;

    .export-tip{
      position: absolute;
      right: 2px;
      top: -4px;
    }
  }
}
</style>
