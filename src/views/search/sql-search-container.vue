<template>
  <el-container class="sql-container">
    <div class="sql-wrapper">
      <div class="sql-search-wrapper">
        <div class="sql-tab-box">
          <el-tabs v-model="activiteSql" type="card" closable class="sql-tab-list" @tab-click="handleTabClick" @tab-remove="handleTabRemove">
            <el-tab-pane v-for="(item, index) in sqlList" :key="item.id + '_' + index" :label="item.queryName" :name="item.id + '_' + index">
              <template #label>
                <text-tooltip :content="item.queryName" />
              </template>
            </el-tab-pane>
          </el-tabs>

          <el-button size="small" circle class="add-tab-btn" @click="handleTabAdd"><i-ep-plus /></el-button>
        </div>
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
            <h4>执行结果</h4>
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
      </div>

      <div class="sql-search-aside">
        <div v-if="codeMirrorReady">
          <h4 style="font-size: 14px;font-weight: 700;color: #495AD4;margin: 0 0 10px 16px;">快捷操作</h4>
          <el-tabs v-model="activeNameSide" class="tabs-nav-aside">
            <el-tab-pane label="测点" name="data">
              <side-data :server-id="serverId" @get-function="getFunction" />
            </el-tab-pane>
            <el-tab-pane label="函数" name="function">
              <side-function @get-function="getFunction" />
            </el-tab-pane>
            <el-tab-pane label="模板" name="template">
              <side-template ref="sqlListRef" :server-id="serverId" @handle-sql-operate="handleSqlOperate" />
            </el-tab-pane>
          </el-tabs>
          <a href="https://iotdb.apache.org/zh/UserGuide/V1.1.x/Query-Data/Overview.html" rel="noopener noreferrer" target="_blank" class="operate-link"><i-custom-question />操作说明</a>
        </div>
      </div>
    </div>

    <el-dialog title="保存模板" v-model="nameDialogVisible" width="400px">
      <el-form ref="saveFormRef" :model="saveForm" :rules="saveFormRules" label-position="left">
        <el-form-item label="名称：" prop="sqlName" :error="errorNameTip">
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

    <el-dialog title="重命名" v-model="renameDialogVisible" width="400px">
      <el-form ref="resaveFormRef" :model="resaveForm" label-width="100px" label-position="right">
        <el-form-item label="原名称：" prop="oldSqlName">
          <el-input v-model="resaveForm.oldSqlName" disabled />
        </el-form-item>
        <el-form-item label="新名称：" prop="sqlName" :error="errorRenameTip" inline-message>
          <el-input v-model="resaveForm.sqlName" placeholder="请输入" maxlength="25" @blur="handleInputRename" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleRenameConfirm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script lang="ts" setup>
import type { FormInstance, TabsPaneContext } from 'element-plus';
import { markRaw } from 'vue';
import dayjs from 'dayjs';
import { handleExport } from '@/utils/export';
import DynamicTable from '@/components/dynamic-table.vue';
import { SearchApi } from '@/api';
import { useServerStore } from '@/stores';
import { showErrorFn } from '@/composition-api/base/useRequest';
import SideFunction from './components/side-function.vue';
import SideData from './components/side-data.vue';
import SideTemplate from './components/side-template.vue';
import CodeEditor from './components/code-editor.vue';
// eslint-disable-next-line import/extensions
import ICustomMessageWarning from '~icons/custom/message-warning';

const serverStroe = useServerStore();
const serverId = serverStroe.currentServerId;

const codeMirrorReady = ref(false);
const nameDialogVisible = ref(false);
const renameDialogVisible = ref(false);
const timeNumber = ref(0);
const currentQueryTime = ref('');
const display = ref(false);
const standTable = ref(null);
const key = ref('1');
const activiteSql = ref<string>('_0');
const activeName = ref<string | number>(0);
// eslint-disable-next-line no-useless-escape
const sqlList = ref<Search.SqlList[]>([{ id: '', queryName: `查询${dayjs().format('YYYY-MM-DD HH:mm').replace(/\-|\:| /g, '')}` }]);
const activeNameSide = ref('function');
const runFlag = ref(true);
const sqlResult = ref<Partial<Search.QuerySqlResponse>[]>([]);

const code = ref('');
const sqlListRef = ref<InstanceType<typeof SideTemplate>>();
const saveFormRef = ref<FormInstance>();
const resaveFormRef = ref<FormInstance>();
const saveFormRules = reactive({
  sqlName: [
    { required: true, message: '请填写名称后保存', trigger: 'blur' },
  ],
});
const saveForm = reactive<{
  sqlName: string;
  id?: string;
}>({
  sqlName: '',
  id: '',
});
const resaveForm = reactive<{
  oldSqlName: string;
  sqlName: string;
  id: string;
}>({
  oldSqlName: '',
  sqlName: '',
  id: '',
});
const errorNameTip = ref('');
const errorRenameTip = ref('');

const pageNums = reactive<number[]>([]);

const columnList = ref <Array<Array<DynamicTableColumn> | null>>([]);

const tableData = reactive<{ list: Array<Record<string, any> | null> }>({
  list: [] || null,
});

const total = computed(() => tableData.list.map((item) => item?.list?.length));
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});

const { requestFn: queryStop } = useRequest(SearchApi.queryStop);
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
  const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value.split('_')[0];
  code.value = '';
  tableData.list = [];
  if (!id) return;
  getSql(serverId, id).then((res) => {
    const resData = res.data;
    code.value = resData.sqls;
  });
}

// 追加code
function getFunction(val: string) {
  code.value += val;
}

// 模板操作
function handleSqlOperate(val: string, data: Search.SqlList) {
  // eslint-disable-next-line eqeqeq
  const index = sqlList.value.findIndex((f) => f.id == data.id);
  const length = sqlList.value.length || 0;
  if (val === 'open') {
    if (index > -1) {
      activiteSql.value = `${data.id}_${index}`;
    } else {
      sqlList.value.push(data);
      activiteSql.value = `${data.id}_${length}`;
    }
  } else if (val === 'rename') {
    resaveForm.oldSqlName = data.queryName;
    resaveForm.sqlName = '';
    resaveForm.id = `${data.id}`;
    errorRenameTip.value = '';
    renameDialogVisible.value = true;
  } else if (index > -1) {
    const tabs = sqlList.value;
    let current = activiteSql.value;
    const ci = tabs[index + 1] ? index : index - 1;
    const nextTab = tabs[index + 1] || tabs[index - 1];
    current = `${nextTab.id}_${ci}`;
    activiteSql.value = current;
    sqlList.value.splice(index, 1);
  }
}
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
    querySql(serverId, { sqls: code.value?.split('\n'), timestamp: timeNumber.value }, controller)
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
// 添加tab
function handleTabAdd() {
  const currentSqlLength = sqlList.value.length || 0;
  const newTabName = `_${currentSqlLength}`;
  sqlList.value.push({
    // eslint-disable-next-line no-useless-escape
    queryName: `查询${dayjs().format('YYYY-MM-DD HH:mm').replace(/\-|\:| /g, '')}`,
    id: '',
  });
  activiteSql.value = newTabName;
}
// 点击tab
function handleTabClick(tab: TabsPaneContext) {
  if (tab.index) {
    const data = sqlList.value[tab.index as unknown as number];
    code.value = '';
    tableData.list = [];
    activiteSql.value = `${data.id}_${tab.index}`;
  }
}
// 删除tab
function handleTabRemove(targetName: string) {
  if (sqlList.value.length === 1) {
    ElMessage.info('只有一个页签不允许删除');
    return;
  }
  const tabs = sqlList.value;
  let current = activiteSql.value;
  const index = Number(targetName.split('_')[1] as unknown as number);
  const ci = tabs[index + 1] ? index : index - 1;
  const nextTab = tabs[index + 1] || tabs[index - 1];
  current = `${nextTab?.id || ''}_${ci}`;
  activiteSql.value = current;
  sqlList.value.splice(index, 1);
}

// 模板名称输入
function handleInputName() {
  errorNameTip.value = '';
}

// 新名称输入
function handleInputRename() {
  if (!resaveForm.sqlName.trim()) {
    errorRenameTip.value = '请填写名称后保存';
  } else if (resaveForm.sqlName === resaveForm.oldSqlName) {
    errorRenameTip.value = '与原名称相同，请重新输入';
  } else {
    errorRenameTip.value = '';
  }
}
// 保存模板
function handleNameConfirm() {
  errorNameTip.value = '';
  saveFormRef.value?.validate((valid) => {
    if (valid) {
      const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value.split('_')[0];
      const data = {
        serverId,
        id,
        queryName: saveForm.sqlName,
        sqls: code.value,
      };
      saveQuery(serverId, data).then((res) => {
        if (res.code === 0) {
          ElMessage.success('保存成功');
          nameDialogVisible.value = false;
          const index = activiteSql.value.split('_')[1] as unknown as number;
          sqlList.value.splice(index, 1, { id: `${res.data}`, queryName: saveForm.sqlName });
          activiteSql.value = `${res.data}_${index}`;
          sqlListRef.value?.getQueryList();
        }
      }).catch((err) => {
        errorNameTip.value = err.message;
      });
    }
  });
}
// 重命名
function handleRenameConfirm() {
  errorRenameTip.value = '';
  if (!resaveForm.sqlName.trim()) {
    errorRenameTip.value = '请填写名称后保存';
    return;
  } if (resaveForm.sqlName === resaveForm.oldSqlName) {
    errorRenameTip.value = '与原名称相同，请重新输入';
    return;
  }
  resaveFormRef.value?.validate((valid) => {
    if (valid) {
      const { id } = resaveForm;
      const data = {
        serverId: Number(serverId) * 1,
        id,
        queryName: resaveForm.sqlName,
        sqls: code.value,
      };
      saveQuery(serverId, data).then((res) => {
        if (res.code === 0) {
          ElMessage.success('保存成功');
          renameDialogVisible.value = false;
          const index = activiteSql.value.split('_')[1] as unknown as number;
          sqlList.value.splice(index, 1, { id: `${id}`, queryName: resaveForm.sqlName });
          sqlListRef.value?.getQueryList();
          activiteSql.value = `${id}_${index}`;
        }
      }).catch((err) => {
        errorRenameTip.value = err.message;
      });
    }
  });
}
// 保存
function handleSave() {
  const index = Number(activiteSql.value.split('_')[1] as unknown as number);
  const current = sqlList.value[index];
  saveForm.sqlName = current.queryName;
  errorNameTip.value = '';
  nameDialogVisible.value = true;
}
// 停止
function stopquery() {
  controller.abort();
  runFlag.value = true;
  queryStop(serverId, timeNumber.value).then(() => {});
}
function exportSql(i: number, exportType: string) {
  const codevalArr = code.value?.split('\n');
  exportDataSql(serverId, codevalArr[i], exportType).then((res) => {
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
    const { sql = '' } = sqlResult.value[index];
    querySql(serverId, { sqls: [sql], timestamp: dayjs(dayjs().format('YYYY-MM-DD HH:mm:ss')).valueOf() })
      .then((res) => {
        const { data } = res;
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
    icon: markRaw(ICustomMessageWarning),
  })
    .then(() => {
      code.value = '';
      tableData.list = [];
      columnList.value = [];
      sqlResult.value = [];
    });
}

onMounted(() => {

});

watch(
  activiteSql,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      getSqlCode();
    }
  },
);

</script>

<style lang="scss" scoped>
.sql-container{
  // margin: -20px;
  // background: #dfe1ed;
}

.sql-wrapper {
  width: 100%;
  position: relative;

  .el-button:focus-visible {
    outline: none;
  }
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

  :deep(.el-tabs--card > .el-tabs__header .el-tabs__nav) {
    border-radius: 6px 6px 0 0;
  }

  :deep(.el-tabs__item) {
    border-radius: 6px 6px 0 0;
    max-width: 200px;
  }

  :deep(.el-tabs__item.is-active) {
    background-color: var(--el-color-primary);
    color: #fff;
  }
}

.sql-search-aside {
  width: 240px;
  border-left: 1px solid #ebeef5;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;

  .operate-link{
    position: absolute;
    left: 8px;
    bottom: 0;
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656A85;
    display: flex;
    align-items: center;

    svg{
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
  }
}

.tabs-nav-aside {
  :deep(.el-tabs__header) {
    padding: 0 20px;
    background: #fff;
    margin: 0;
  }
}

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
    color: var(--el-color-primary)
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
  padding: 12px 0;
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

.tabs-nav-list {
  :deep(.el-tabs__content) {
    padding: 10px 16px 10px 0;
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
