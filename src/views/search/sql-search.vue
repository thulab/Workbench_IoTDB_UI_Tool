<template>
  <el-container class="sql-container">
    <div class="sql-wrapper">
      <div class="sql-search-wrapper">
        <div class="sql-tab-box">
          <el-tabs v-model="activiteSql" type="card" closable class="sql-tab-list" @tab-click="handleTabClick" @tab-remove="handleTabRemove">
            <el-tab-pane v-for="(item, index) in sqlList" :key="item.id+'_'+index" :label="item.queryName" :name="item.id+'_'+index"></el-tab-pane>
          </el-tabs>

          <el-button size="small" circle class="add-tab-btn" @click="handleTabAdd"><i-ep-plus /></el-button>
        </div>
        <div class="sql-title-box">
          <h4>SQL输入</h4>
          <div class="sql-right-icon-box">
            <el-tooltip effect="light" content="保存" placement="top">
              <el-icon @click="nameDialogVisible = true"><i-ep-document /></el-icon>
            </el-tooltip>
            <el-tooltip effect="light" content="运行" placement="top">
              <el-icon @click="querySqlRun"><i-ep-video-play /></el-icon>
            </el-tooltip>
            <el-tooltip  effect="light" content="取消" placement="top">
              <el-icon @click="stopquery"><i-ep-circle-close /></el-icon>
            </el-tooltip>
            <el-tooltip effect="light" content="清空" placement="top">
              <el-icon @click="deleteQuery"><i-ep-delete /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <div :style="{ height: `calc(100vh - ${200 + divwerHeight}px)` }">
          <code-editor
            v-show="codeMirrorReady"
            v-model:model-value="code"
            @ready="()=>codeMirrorReady = true"
            :style="{
              height: `calc(100vh - ${200 + divwerHeight}px)`,
              backgroundColor: '#f9fbfc',
            }" />
        </div>

        <div :style="{ height: divwerHeight + 'px' }">
          <div class="run-result-title-box">
            <h4>执行结果</h4>
            <span class="run-result-tip"><i-ep-info-filled />默认显示100行1000列，如需查看更多数据请下载查看</span>
          </div>
          <div class="tabs">
            <el-tabs v-model="activeName" class="tabs_nav">
              <el-tab-pane v-for="(item, index) of columnList" :key="index" :name="`t${index}`">
                <template #label>
                  <span
                  >运行结果{{ index + 1 }}
                    <el-icon class="iconmore green"><i-ep-more /></el-icon>
                  </span>
                </template>
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
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>

      <div class="sql-search-aside">
        <div v-if="codeMirrorReady">
          <el-tabs v-model="activeNameSide" class="tabs-nav-aside">
            <el-tab-pane label="测点" name="data">
              <!-- <side-data @get-function="getFunction" :id="serverId" :tree-list="treeList" /> -->
            </el-tab-pane>
            <el-tab-pane label="函数" name="function">
              <side-function @get-function="getFunction" />
            </el-tab-pane>
            <el-tab-pane label="模板" name="template">
              <side-template @get-function="getFunction" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <el-dialog title="保存模板" v-model="nameDialogVisible" width="400px">
      <el-form ref="saveFormRef" :model="saveForm" :rules="saveFormRules" label-position="left">
        <el-form-item label="查询名称：" prop="sqlName" :error="errorNameTip">
          <el-input v-model="saveForm.sqlName" placeholder="请输入" maxlength="25" @blur="handleInputName" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="nameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleNameConfirm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script lang="ts" setup>
import type { FormInstance, TabPaneName, TabsPaneContext } from 'element-plus';
import dayjs from 'dayjs';
import { useTableHeight } from '@/composition-api';
import { handleExport } from '@/utils/export';
import DynamicTable from '@/components/dynamic-table.vue';
import { SearchApi, StorageApi } from '@/api';
import sideFunction from './components/side-function.vue';
import sideData from './components/side-data.vue';
import sideTemplate from './components/side-template.vue';
import CodeEditor from './components/code-editor.vue';

const props = defineProps<{
  serverId?: string;
  queryId?: string;
}>();

const { maxTableHeight } = useTableHeight(300);
const codeMirrorReady = ref(false);
const nameDialogVisible = ref(false);
const divwerHeight = ref(430);
const timeNumber = ref(0);
const sqlName = ref('new');
const display = ref(false);
const tabelNum = ref(0);
const standTable = ref(null);
const key = ref('1');
const activiteSql = ref<string>('_0');
const activeName = ref<string | number>(0);
const sqlList = ref<Search.SqlList[]>([{id: '', queryName: `查询${dayjs().format('YYYY-MM-DD HH:mm:ss.SSS').replace(/\-|\:| /g, '')}`}]);
const activeNameSide = ref('function');
const runFlag = ref(true);
const rows = ref(0);
const columns = ref(0);
const lineList = ref<number[]>([]);
const timeList = ref<string[]>([]);

const code = ref('');
const saveFormRef = ref<FormInstance>();
const saveFormRules = reactive({
  sqlName: [
    { required: true, message: '请填写名称后保存', trigger: 'blur', },
  ],
});
const saveForm = reactive<{
  sqlName: string;
}>({
  sqlName: '',
});
const errorNameTip = ref('');

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
const totalTips = computed(() => `现一共有${rows.value}行, ${columns.value}列`);

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

// 获取code
function getSqlCode() {
  if (props.queryId) {
    getSql(props.serverId, props.queryId).then((res) => {
      const resData = res.data;
      sqlName.value = resData.queryName;
      code.value = resData.sqls;
    });
  }
}
// 获取存储组
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

function getFunction(val: string) {
  code.value += val;
}

// 执行sql
function querySqlRun() {
  if (runFlag.value) {
    display.value = false;
    runFlag.value = false;
    timeNumber.value = Number(new Date());
    querySql(props.serverId, { sqls: code.value?.split('\n'), timestamp: timeNumber.value })
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
// 添加tab
function handleTabAdd() {
  let currentSqlLength = sqlList.value.length || 0;
  const newTabName = `_${currentSqlLength}`;
  sqlList.value.push({
    queryName: `查询${dayjs().format('YYYY-MM-DD HH:mm:ss.SSS').replace(/\-|\:| /g, '')}`,
    id: '',
  })
  activiteSql.value = newTabName
}
// 点击tab
function handleTabClick(tab: TabsPaneContext) {
  if (tab.index) {
    const data = sqlList.value[tab.index as unknown as number];
    code.value = '';
    tableData.list = [];
    activiteSql.value = `${data.id}_${tab.index}`;
    getSqlCode();
  }
}
// 删除tab
function handleTabRemove(targetName: string) {
  if (sqlList.value.length === 1) {
    ElMessage.info('只有一个页签不允许删除');
    return;
  }
  const tabs = sqlList.value
  let current = activiteSql.value
  let index = targetName.split('_')[1] as unknown as number;
  let ci = tabs[index + 1] ? index : index-1
  const nextTab = tabs[index + 1] || tabs[index - 1]
  current = `${nextTab.id}_${ci}`
  activiteSql.value = current
  sqlList.value.splice(index, 1);
}

// 模板名称输入
function handleInputName() {
  errorNameTip.value = '';
}
// 保存模板
function handleNameConfirm() {
  errorNameTip.value = '';
  saveFormRef.value?.validate((valid) => {
    if (valid) {
      const id = !props.queryId ? null : props.queryId;
      const data = {
        connectionId: Number(props.serverId) * 1,
        id,
        queryName: saveForm.sqlName,
        sqls: code.value,
      };
      saveQuery(props.serverId, data).then((res) => {
        if (res.code === '0') {
          ElMessage.success('保存成功');
          nameDialogVisible.value = false;
        }
      }).catch(err => {
        errorNameTip.value = err.message;
      });
    }
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
// 清空
function deleteQuery() {
  ElMessageBox.confirm(`是否清空页面`, `清空提示`, {
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
          message: `清空成功!`,
        });
      });
    })
}

onMounted(() => {
  // getSqlCode();
  // getGroupList();
});

</script>

<style lang="scss" scoped>
.sql-wrapper {
  width: 100%;
  position: relative;
}

.sql-search-wrapper {
  width: calc(100% - 241px);
}

.sql-tab-box {
  width: 100%;
  position: relative;

  .sql-tab-list {
    width: calc(100% - 40px);
  }

  :deep(.el-tabs__header) {
    margin: 0;
  }

  .add-tab-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }
}

.sql-search-aside {
  width: 240px;
  border-left: 1px solid #ebeef5;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.tabs-nav-aside {
  :deep(.el-tabs__header) {
    padding: 0 20px;
    background: #fff;
    margin: 0;
  }
}

.sql-title-box {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
}

.sql-right-icon-box {
  display: flex;

  .el-icon {
    margin: 0 0 0 16px;
  }
}

.run-result-title-box {
  display: flex;
  padding-top: 12px;

  .run-result-tip {
    align-self: flex-end;
    margin: 0 0 0 12px;
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #808080;

    svg {
      color: #ccc;
    }
  }
}
</style>
