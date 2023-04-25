<template>
  <el-container class="sql-container">
    <el-container>
      <el-header class="sqlheader">
        <div class="title flex">
          <div class="right-icon flex">
            <el-tooltip class="item" effect="light" content="保存" placement="top">
              <el-icon class="stop" @click="centerDialogVisible = true"><i-ep-document /></el-icon>
            </el-tooltip>
            <el-tooltip class="item" effect="light" content="运行" placement="top">
              <el-icon class="stop" @click="querySqlRun"><i-ep-video-play /></el-icon>
            </el-tooltip>
            <el-tooltip class="item" effect="light" content="取消" placement="top">
              <el-icon class="stop" @click="stopquery"><i-ep-circle-close /></el-icon>
            </el-tooltip>
            <el-tooltip class="item" effect="light" content="清空" placement="top">
              <el-icon class="stop" @click="deleteQuery"><i-ep-delete /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </el-header>
      <el-main class="backcolor">
        <div :style="{ height: `calc(100vh - ${183 + divwerHeight}px)` }">
          <code-editor
            v-show="codeMirrorReady"
            v-model:model-value="code"
            @ready="()=>codeMirrorReady = true"
            :style="{
              height: `calc(100vh - ${183 + divwerHeight}px)`,
              backgroundColor: '#f9fbfc',
            }" />
        </div>
      </el-main>
      <el-footer class="footer">
        <div :style="{ height: divwerHeight + 'px' }">
          <div class="tabs">
            <el-tabs v-model="activeName" class="tabs_nav">
              <div class="show_tips">
                <p>
                  默认查询 limit 100 slimit 10 &nbsp;<span v-if="rows">{{totalTips}}</span>
                </p>
                是否展示全部 &nbsp;
                <el-switch v-model="isShowAll" size="small" />
              </div>
              <el-tab-pane v-for="(item, index) of columnList" :key="index" :name="`t${index}`">
                <template #label>
                  <span
                  >运行结果{{ index + 1 }}
                    <el-icon class="iconmore green"><i-ep-more /></el-icon>
                  </span>
                </template>
                <div class="table_top_border"></div>
                <div class="tab_table" v-if="item && display">
                  <dynamic-table
                    ref="standTable"
                    :columns="item"
                    :table-data="tableDataPagination[index].list"
                    :max-height="maxTableHeight"
                    v-model:current-page="pageNums[index]"
                    v-model:page-size="pagination.pageSize"
                    :total="total[index]"
                    @load-data="getList(index)"
                    show-pagination
                  />
                </div>
                <div class="tab_table" v-else>
                  <span v-if="display">执行成功,该查询语句无数据返回</span>
                </div>
                <div class="header_messge flex">
                  <div>
                    <span @click="exportSql(index)">
                      <svg class="icon icon-1 icon-color" aria-hidden="true">
                        <use xlink:href="#icon-se-icon-download" />
                      </svg>
                      <span class="downloadchart">下载</span>
                    </span>
                    <span class="frist_span">最多下载10万条数据</span>
                  </div>
                  <div>
                    <span class="frist_span">查询时间：{{ timeList[index] }}</span>
                    <span class="frist_span">查询行数：{{ lineList[index] }}</span>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </el-footer>
    </el-container>
    <el-aside width="240px">
      <div class="el_aside_div">
        <div class="tabgad" v-if="codeMirrorReady">
          <el-tabs v-model="activeNameRight" class="tabs_nav_aside">
            <el-tab-pane label="函数" name="first">
              <side-function placeholder="device.inputfunction" @get-function="getFunction" />
            </el-tab-pane>
            <el-tab-pane label="数据" name="second">
              <!-- <side-data @get-function="getFunction" :id="serverId" :tree-list="treeList" /> -->
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-aside>
    <div class="footer_button">
      <el-dialog title="保存查询" v-model="centerDialogVisible" width="400px">
        <div class="dilog_div">
          <span>查询名称：</span><el-input style="width: 70%;" v-model="sqlName" />
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="centerDialog">取消</el-button>
            <el-button type="primary" @click="centerDialogOk">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </el-container>
</template>

<script lang="ts" setup>
import { useTableHeight } from '@/composition-api';
import { handleExport } from '@/utils/export';
import DynamicTable from '@/components/dynamic-table.vue';
import { SearchApi, StorageApi } from '@/api';
import sideFunction from './components/side-function.vue';
// import sideData from './components/side-data.vue';
import CodeEditor from './components/code-editor.vue';

const props = defineProps<{
  serverId: string;
  queryId?: string;
}>();

const { maxTableHeight } = useTableHeight(300);
const codeMirrorReady = ref(false);
const centerDialogVisible = ref(false);
const divwerHeight = ref(0);
const timeNumber = ref(0);
const sqlName = ref('new');
const display = ref(false);
const tabelNum = ref(0);
const standTable = ref(null);
const key = ref('1');
const activeName = ref<string | number>(0);
const activeNameRight = ref('first');
const runFlag = ref(true);
const rows = ref(0);
const columns = ref(0);
const lineList = ref<number[]>([]);
const timeList = ref<string[]>([]);

const code = ref('');
const isShowAll = ref(false);

const pageNums = reactive<number[]>([]);

const columnList = ref <Array<Array<DynamicTableColumn> | null>>([]);

const tableData = reactive<{ list: Array<Record<string, any> | null> }>({
  list: [] || null,
});
const treeList = reactive<{ list: Array<{
  label: string,
  value: string,
  decr: string,
  type: string,
}> }>({
  list: [],
});

const total = computed(() => tableData.list.map((item) => item?.list?.length));
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});

const { requestFn: getGroup } = useRequest(StorageApi.getStorageGroups);
const { requestFn: queryStop } = useRequest(SearchApi.queryStop);
const { requestFn: deleteQueryS } = useRequest(SearchApi.deleteQueryS);
const { requestFn: getSql } = useRequest(SearchApi.getSql);
const { requestFn: querySql } = useRequest(SearchApi.querySql);
const { requestFn: saveQuery } = useRequest(SearchApi.saveQuery);
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

function getFunction(val: string) {
  code.value += val;
}

function querySqlRun() {
  if (runFlag.value) {
    display.value = false;
    runFlag.value = false;
    divwerHeight.value = 430;
    timeNumber.value = Number(new Date());
    querySql(props.serverId, { sqls: code.value?.split('\n'), timestamp: timeNumber.value, isShowAll: isShowAll.value })
      .then((res) => {
        const { data } = res;
        activeName.value = 't0';
        columnList.value = [];
        tableData.list = [];
        const lengthArry = [];
        timeList.value = [];
        lineList.value = [];
        tabelNum.value = data.length;
        data.forEach((item) => {
          const length = <number[]>[];
          timeList.value.push(item.queryTime);
          lineList.value.push(item.line);
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
          lengthArry.push(length);
        });
        display.value = true;
        runFlag.value = true;
        rows.value = data[0].rows;
        columns.value = data[0].columns;
      })
      .finally(() => {
        runFlag.value = true;
      });
    setTimeout(() => {
      runFlag.value = true;
    }, 5000);
  } else {
    ElMessage.error(`查询正在运行中，请勿重复操作`);
  }
}
watch(isShowAll, () => {
  querySqlRun();
});
function centerDialog() {
  centerDialogVisible.value = false;
}
const getLocationId = (id: string | number) => {
  let locationId = '';
  locationId = `${props.serverId}connection:querylist:${id}query`;
  return locationId;
};
function centerDialogOk() {
  const id = !props.queryId ? null : props.queryId;
  const data = {
    connectionId: Number(props.serverId) * 1,
    id,
    queryName: sqlName.value,
    sqls: code.value,
  };
  saveQuery(props.serverId, data).then((res) => {
    if (res.code === '0') {
      ElMessage({
        type: 'success',
        message: '保存成功',
      });
      sqlName.value = data.queryName;
      centerDialogVisible.value = false;
      sqlName.value = '';
      code.value = '';
      const locationId = getLocationId(res.data);
    }
  });
}
function getSqlCode() {
  if (props.queryId) {
    getSql(props.serverId, props.queryId).then((res) => {
      const resData = res.data;
      sqlName.value = resData.queryName;
      code.value = resData.sqls;
    });
  }
}
function getGroupList() {
  getGroup(props.serverId).then((res) => {
    treeList.list = res.data.map((item) => ({
      label: item.groupName,
      value: item.groupName,
      decr: '',
      type: '',
    }));
  });
}
function stopquery() {
  queryStop(props.serverId, timeNumber.value).then(() => {});
}
function exportSql(i: number) {
  const codevalArr = code.value?.split('\n');
  exportDataSql(props.serverId, codevalArr[i]).then((res) => {
    if (res) {
      ElMessage({
        type: 'success',
        message: `导出成功`,
      });
      handleExport(res, 'export.CSV');
    } else {
      ElMessage({
        type: 'info',
        message: `导出未完成`,
      });
    }
  }).catch((err) => {
    ElMessage({
      type: 'error',
      message: err.message,
    });
  });
}
function deleteQuery() {
  ElMessageBox.confirm(`您确定要删除"${sqlName.value}"？删除后，该数据将会丢失，不可恢复`, `提示`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      if (!props.queryId) {
        code.value = '';
        return;
      }
      deleteQueryS(props.serverId, props.queryId).then(() => {
        ElMessage({
          type: 'success',
          message: `删除成功!`,
        });
      });
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: `取消删除!`,
      });
    });
}

const totalTips = computed(() => `现一共有${rows.value}行, ${columns.value}列`);
onMounted(() => {
  // getSqlCode();
  // getGroupList();
});

onActivated(() => {
  getSqlCode();
});

</script>

<style lang="scss" scoped>
.sql-container {
  // height: calc(100% - 44px);
}

.stop:hover {
  color: rgb(156 182 246);
}

.dilog_div {
  display: flex;
  align-items: center;
}

.el_aside_div {
  width: 240px;
  height: calc(100vh - 106px);
  box-sizing: border-box;
  position: absolute;
  border-left: 1px solid #ebeef5;
}

.downloadchart {
  font-size: 11px;
  color: var(--el-color-primary);
  margin-left: 5px;
  cursor: pointer;
}

.sqlheader {
  &.el-header {
    height: 35px !important;
    padding: 0;
  }
}

.footer {
  &.el-footer {
    padding: 0;
    height: 0 !important;
  }

  .divider {
    // width: 1px;
    height: 3px;
    background-color: #f9fafc;
    cursor: n-resize;

    &:hover {
      background-color: var(--el-color-primary) !important;
      height: 2px;
    }
  }

  .show_tips {
    height: 20px;
    display: flex;
    align-items: center;
    font-size: 12px;
    float: right;
    color: #606266;
    margin: 10px 20px 10px 0;
    z-index: 99999;
  }

  :deep(.tabs) {
    height: 40px;
    background: #fff;
    box-shadow: 0 0 2px #d2d2d2;

    .frist_span {
      color: #ccc;
      font-size: 11px;
      margin-left: 20px;
    }

    .header_messge {
      padding: 10px 23px;
    }

    .table_top_border {
      height: 1px;
      background: #eff0f4;
    }
  }
}

.el-tabs {
  :deep(.el-tabs__header) {
    padding: 0 20px;
    background: #fff;
    margin: 0;
  }
}

.title {
  padding: 10px 25px;
  color: black;
  font-size: 14px;
  border-bottom: 1px solid #ebeef5;
}

.right-icon {
  font-size: 16px;
  width: 100px;
}

.flex {
  display: flex;
  justify-content: space-between;
}

.container {
  position: relative;
}
</style>
<style lang="scss">
.backcolor.el-main {
  padding: 0;
  height: 100%;
}

// .tabs_nav .el-tabs__item {
//   padding: 5px 0 !important;
//   width: 100px;
//   font-size: 11px !important;
// }

// .tabs_nav_aside .el-tabs__item {
//   padding: 7px 0 !important;
//   width: 60px;
//   font-size: 11px !important;
// }

.tabs_nav .iconmore {
  font-size: 25px;
  width: 10px;
  overflow: hidden;
  line-height: 15px;
  position: absolute;
  top: 0;

  &.green {
    color: #00c300;
  }

  &.red {
    color: #ff2121;
  }
}

.icon.icon-color {
  color: var(--el-color-primary);
  vertical-align: -0.2em !important;
}

.footer_button {
  .el-dialog__footer {
    text-align: right;
  }
}
</style>
