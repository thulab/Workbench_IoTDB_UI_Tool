<template>
  <el-container class="sql-container">
    <div class="sql-wrapper">
      <div class="sql-search-wrapper">
        <div class="sql-tab-box">
          <el-tabs v-model="activiteSql" editable type="card" closable class="sql-tab-list" @tab-click="handleTabClick" @tab-remove="handleTabRemove" @tab-add="handleTabAdd">
            <el-tab-pane v-for="item in sqlList" :key="item.id" :label="item.queryName" :name="item.id">
              <template #label>
                <text-tooltip :content="item.queryName" />
              </template>
              <sql-search :server-id="serverId" v-model:code="code[activiteSql]" @save="handleSave" />
            </el-tab-pane>
          </el-tabs>
          <!-- <el-button size="small" circle class="add-tab-btn" @click="handleTabAdd"><i-ep-plus /></el-button> -->
        </div>
      </div>

      <div class="sql-search-aside">
        <div v-if="codeMirrorReady">
          <h4 style="font-size: 14px;font-weight: 700;color: #495AD4;margin: 0 0 12px;">快捷操作</h4>
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
          <a href="https://www.timecho.com/docs/zh/UserGuide/V1.0.x/Reference/SQL-Reference.html" rel="noopener noreferrer" target="_blank" class="operate-link"><i-custom-question />操作说明</a>
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
          <el-button @click="handleNameCancel">取消</el-button>
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
import type { FormInstance, TabsPaneContext, TabPaneName } from 'element-plus';
import dayjs from 'dayjs';
import { debounce } from 'lodash-es';
import { SearchApi } from '@/api';
import { useServerStore } from '@/stores';
import SideFunction from './components/side-function.vue';
import SideData from './components/side-data.vue';
import SideTemplate from './components/side-template.vue';
import SqlSearch from './components/sql-search.vue';

const serverStroe = useServerStore();
const serverId = serverStroe.currentServerId;

const codeMirrorReady = ref(true);
const nameDialogVisible = ref(false);
const renameDialogVisible = ref(false);

const activiteSql = ref<string>(`_${dayjs().format('YYYY-MM-DD HH:mm:ss:SSS')}`);

// eslint-disable-next-line no-useless-escape
const sqlList = ref<Search.SqlList[]>([{ id: activiteSql.value, queryName: `查询${dayjs().format('YYYY-MM-DD HH:mm:ss').replace(/\-|\:| /g, '')}` }]);
const activeNameSide = ref('function');

const code = reactive<Record<string, string>>({});
code[activiteSql.value] = '';
const sqlListRef = ref<InstanceType<typeof SideTemplate>>();
const saveFormRef = ref<FormInstance>();
const resaveFormRef = ref<FormInstance>();
const saveFormRules = reactive({
  sqlName: [
    { required: true, message: '请填写名称后确定', trigger: 'blur' },
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
const saveSource = ref('save');

const { requestFn: getSql } = useRequest(SearchApi.getSql);
const { requestFn: saveQuery } = useRequest(SearchApi.saveQuery);

// 获取code
function getSqlCode() {
  if (code[activiteSql.value]) return;
  const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value;
  code[activiteSql.value] = '';
  // tableData.list = [];
  if (!id) return;
  getSql(serverId, id).then((res) => {
    const resData = res.data;
    code[activiteSql.value] = resData.sqls;
  });
}

// 追加code
function getFunction(val: string) {
  code[activiteSql.value] += val;
}

// 模板操作
function handleSqlOperate(val: string, data: Search.SqlList) {
  const index = sqlList.value.findIndex((f) => `${f.id}` === `${data.id}`);
  if (val === 'open') {
    if (index > -1) {
      activiteSql.value = `${data.id}`;
    } else {
      sqlList.value.push({ ...data, id: `${data.id}` });
      activiteSql.value = `${data.id}`;
    }
  } else if (val === 'rename') {
    resaveForm.oldSqlName = data.queryName;
    resaveForm.sqlName = '';
    resaveForm.id = `${data.id}`;
    errorRenameTip.value = '';
    renameDialogVisible.value = true;
  } else if (index > -1) {
    const nextTab = sqlList.value[index + 1] || sqlList.value[index - 1];
    activiteSql.value = `${nextTab.id}`;
    sqlList.value.splice(index, 1);
  }
}

// 添加tab
const handleTabAdd = debounce(() => {
  const currentSqlId = `_${dayjs().unix()}`;
  sqlList.value.push({
    // eslint-disable-next-line no-useless-escape
    queryName: `查询${dayjs().format('YYYYMMDDHHmmss')}`,
    id: currentSqlId,
  });
  activiteSql.value = currentSqlId;
  code[activiteSql.value] = '';
}, 300);
// 点击tab
function handleTabClick(tab: TabsPaneContext) {
  if (tab.index) {
    const data = sqlList.value[tab.index as unknown as number];
    // code.value = '';
    // tableData.list = [];
    activiteSql.value = `${data.id}`;
  }
}
// 删除tab
function handleTabRemove(targetName: TabPaneName) {
  if (sqlList.value.length === 1) {
    ElMessage.info('只有一个页签不允许删除');
    return;
  }
  const index = sqlList.value.findIndex((f) => `${f.id}` === `${targetName}`);
  const current = sqlList.value[index];
  const id = `${targetName}`.charAt(0) === '_' ? null : activiteSql.value;
  if (!id) {
    activiteSql.value = targetName as string;
    saveForm.sqlName = current.queryName;
    saveSource.value = 'close';
    errorNameTip.value = '';
    nameDialogVisible.value = true;
  } else {
    saveQuery(serverId, {
      serverId,
      id,
      queryName: current.queryName,
      sqls: code[targetName],
    }).then((res) => {
      if (res.code === 0) {
        ElMessage.success('保存成功');
        // code[targetName] = '';
        delete code[targetName];
        const nextTab = sqlList.value[index + 1] || sqlList.value[index - 1];
        activiteSql.value = `${nextTab.id}`;
        sqlList.value.splice(index, 1);
        sqlListRef.value?.getQueryList();
      }
    });
  }
}

// 模板名称输入
function handleInputName() {
  errorNameTip.value = '';
}

// 新名称输入
function handleInputRename() {
  if (!resaveForm.sqlName.trim()) {
    errorRenameTip.value = '请填写名称后确定';
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
      const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value;
      const data = {
        serverId,
        id,
        queryName: saveForm.sqlName,
        sqls: code[activiteSql.value],
      };
      saveQuery(serverId, data).then((res) => {
        if (res.code === 0) {
          ElMessage.success('保存成功');
          nameDialogVisible.value = false;
          if (saveSource.value === 'save') {
            const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
            sqlList.value.splice(index, 1, { id: `${res.data}`, queryName: saveForm.sqlName });
            activiteSql.value = `${res.data}`;
            sqlListRef.value?.getQueryList();
          } else {
            code[activiteSql.value] = '';
            // delete code[activiteSql.value];
            const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
            const nextTab = sqlList.value[index + 1] || sqlList.value[index - 1];
            activiteSql.value = `${nextTab?.id}`;
            sqlList.value.splice(index, 1);
            sqlListRef.value?.getQueryList();
          }
        }
      }).catch((err) => {
        errorNameTip.value = err.message;
      });
    }
  });
}
// 取消保存模板
function handleNameCancel() {
  if (saveSource.value === 'save') {
    nameDialogVisible.value = false;
  } else {
    nameDialogVisible.value = false;
    // delete code[activiteSql.value];
    code[activiteSql.value] = '';
    const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
    const nextTab = sqlList.value[index + 1] || sqlList.value[index - 1];
    activiteSql.value = `${nextTab?.id}`;
    sqlList.value.splice(index, 1);
  }
}
// 重命名
function handleRenameConfirm() {
  errorRenameTip.value = '';
  if (!resaveForm.sqlName.trim()) {
    errorRenameTip.value = '新名称为空，请重新输入';
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
        sqls: code[activiteSql.value],
      };
      saveQuery(serverId, data).then((res) => {
        if (res.code === 0) {
          ElMessage.success('保存成功');
          renameDialogVisible.value = false;
          const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
          sqlList.value.splice(index, 1, { id: `${id}`, queryName: resaveForm.sqlName });
          sqlListRef.value?.getQueryList();
          activiteSql.value = `${id}`;
        }
      }).catch((err) => {
        errorRenameTip.value = err.message;
      });
    }
  });
}
// 保存
function handleSave() {
  const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
  const current = sqlList.value[index];
  const id = `${current.id}`.charAt(0) === '_' ? null : `${current.id}`;
  if (!id) {
    saveForm.sqlName = current.queryName;
    saveSource.value = 'save';
    errorNameTip.value = '';
    nameDialogVisible.value = true;
  } else {
    saveQuery(serverId, {
      serverId,
      id,
      queryName: current.queryName,
      sqls: code[activiteSql.value],
    }).then((res) => {
      if (res.code === 0) {
        ElMessage.success('保存成功');
      }
    });
  }
}

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
  width: calc(100% - 256px);
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
}

.sql-tab-box {
  width: 100%;
  position: relative;

  .sql-tab-list {
    // width: calc(100% - 40px);
  }

  :deep(.el-tabs__header) {
    margin: 0;
    padding-right: 16px;
  }

  :deep(.el-tabs__content) {
    width: 100%;
  }

  :deep(.el-tabs__nav-prev.is-disabled),
  :deep(.el-tabs__nav-next.is-disabled) {
    cursor: not-allowed;
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
    max-width: 240px;
  }

  :deep(.el-tabs__item.is-active) {
    background-color: var(--el-color-primary);
    color: #fff;
  }
}

.sql-search-aside {
  width: 240px;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  padding: 10px 16px;
  box-sizing: border-box;

  .operate-link{
    position: absolute;
    left: 8px;
    bottom: 12px;
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
    background: #fff;
    margin: 0;
  }

  :deep(.el-tabs__item) {
    padding: 0 20px !important;
  }
}

</style>
