<template>
  <div class="sql-container">
    <div class="sql-wrapper">
      <div class="sql-search-wrapper">
        <div class="sql-tab-box">
          <el-tabs v-model="activiteSql" editable type="card" closable class="sql-tab-list" @tab-click="handleTabClick" @tab-remove="handleTabRemove" @tab-add="handleTabAdd" id="sql-search-top-tabs">
            <el-tab-pane v-for="(item, index) in sqlList" :key="item.id" :label="item.queryName" :name="item.id">
              <template #label>
                <span style="font-size: 12px; line-height: 1.2; display: flex; width: 118px" :id="`sql_tab_${index}`"><text-tooltip :content="item.queryName" /></span>
              </template>
              <el-scrollbar :height="tabHeight">
                <sql-search v-model:code="code[activiteSql]" @save="handleSave" ref="sqlSearchRef" />
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
          <!-- <el-button size="small" circle class="add-tab-btn" @click="handleTabAdd"><i-ep-plus /></el-button> -->
        </div>
      </div>

      <div class="sql-search-aside">
        <div v-if="codeMirrorReady">
          <h4 style="font-size: 14px; font-weight: 700; color: #495ad4; margin: 0 0 12px">{{ t('search.quickActions') }}</h4>
          <el-tabs v-model="activeNameSide" class="tabs-nav-aside">
            <el-tab-pane :label="t('measurement.measurement')" name="data">
              <side-data @get-function="getFunction" />
            </el-tab-pane>
            <el-tab-pane :label="t('search.function')" name="function">
              <side-function @get-function="getFunction" />
            </el-tab-pane>
            <el-tab-pane :label="t('search.template')" name="template">
              <side-template ref="sqlListRef" @handle-sql-operate="handleSqlOperate" />
            </el-tab-pane>
          </el-tabs>
          <a href="https://www.timecho.com/docs/zh/UserGuide/latest/Reference/SQL-Reference.html" rel="noopener noreferrer" target="_blank" class="operate-link">
            <i-custom-question />
            {{ t('search.operatingInstructions') }}
          </a>
        </div>
      </div>
    </div>

    <el-dialog :title="t('search.saveTemplate')" v-model="nameDialogVisible" width="480px" align-center>
      <el-form ref="saveFormRef" :model="saveForm" :rules="saveFormRules" label-position="left" @submit.prevent>
        <el-form-item :label="`${t('search.name')}：`" prop="sqlName">
          <el-input type="hidden" />
          <el-input v-model="saveForm.sqlName" :placeholder="t('common.placeHolder')" maxlength="25" show-word-limit id="sql-search-modal-save" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleNameCancel" id="sql-search-modal-save-cancel">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="saveLoading" @click="handleNameConfirm" id="sql-search-modal-save-confirm">{{ t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog :title="t('search.rename')" v-model="renameDialogVisible" width="480px" align-center>
      <el-form ref="resaveFormRef" :model="resaveForm" :rules="resaveFormRules" :label-width="locale === 'en' ? '104px' : '80px'" label-position="left">
        <el-form-item :label="`${t('search.oldName')}：`" prop="oldSqlName" class="type-input-disabled el-form-item-not-mandatory">
          <el-input type="hidden" />
          <el-input v-model="resaveForm.oldSqlName" disabled id="sql-search-modal-resave-old" />
        </el-form-item>
        <el-form-item :label="`${t('search.newName')}：`" prop="sqlName">
          <el-input type="hidden" />
          <el-input v-model="resaveForm.sqlName" :placeholder="t('common.placeHolder')" maxlength="25" show-word-limit id="sql-search-modal-resave" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameDialogVisible = false" id="sql-search-modal-resave-cancel">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="saveLoading" @click="handleRenameConfirm" id="sql-search-modal-confirm">{{ t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { FormInstance, TabsPaneContext, TabPaneName } from 'element-plus';
import dayjs from 'dayjs';
import { throttle } from 'lodash-es';
import { SearchApi } from '@/api';
import SideFunction from './components/side-function.vue';
import SideData from './components/side-data.vue';
import SideTemplate from './components/side-template.vue';
import SqlSearch from './components/sql-search.vue';

const { t, locale } = useI18n();
const sqlSearchRef = ref<Array<InstanceType<typeof SqlSearch>>>([]);
const codeMirrorReady = ref(true);
const nameDialogVisible = ref(false);
const renameDialogVisible = ref(false);

const { maxTableHeight: tabHeight } = useTableHeight(125);

const activiteSql = ref<string>(`_${dayjs().format('YYYY-MM-DD HH:mm:ss:SSS')}`);

// eslint-disable-next-line no-useless-escape
const sqlList = ref<Search.SqlList[]>([
  {
    id: activiteSql.value,
    queryName: `${t('common.query')} ${dayjs()
      .format('YYYY-MM-DD HH:mm:ss')
      // eslint-disable-next-line no-useless-escape
      .replace(/\-|\:| /g, '')}`,
  },
]);
const activeNameSide = ref('function');

const code = reactive<Record<string, string>>({});
code[activiteSql.value] = '';
const sqlListRef = ref<InstanceType<typeof SideTemplate>>();
const saveFormRef = ref<FormInstance>();
const resaveFormRef = ref<FormInstance>();
const saveFormRules = reactive({
  sqlName: [{ required: true, message: () => t('search.nameRuleTip'), trigger: 'blur' }],
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
const resaveFormRules = reactive({
  sqlName: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || !value.trim()) {
          return callback(new Error(t('search.newNameTip')));
        }
        if (value === resaveForm.oldSqlName) {
          return callback(new Error(t('search.nameRepeatTip')));
        }
        return callback();
      },
      trigger: 'blur',
    },
  ],
});
const saveSource = ref('save');

const { requestFn: getSql } = useRequest(SearchApi.getSql);
const { requestFn: saveQuery, loading: saveLoading } = useRequest(SearchApi.saveQuery);

// 获取code
function getSqlCode() {
  if (code[activiteSql.value]) return;
  const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value;
  code[activiteSql.value] = '';
  // tableData.list = [];
  if (!id) return;
  getSql(id).then((res) => {
    const resData = res.data;
    code[activiteSql.value] = resData.sqls;
  });
}

// 追加code
function getFunction(val: string) {
  // code[activiteSql.value] += val;
  const index = sqlList.value.findIndex((f) => `${f.id}` === `${activiteSql.value}`);
  if (index !== -1) {
    sqlSearchRef.value[index].insertContent(val);
  }
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
    renameDialogVisible.value = true;
    nextTick(() => {
      resaveFormRef.value?.clearValidate();
    });
  } else if (index > -1) {
    const nextTab = sqlList.value[index + 1] || sqlList.value[index - 1];
    if (nextTab) {
      activiteSql.value = `${nextTab.id}`;
      sqlList.value.splice(index, 1);
    } else {
      const currentSqlId = `_${dayjs().unix()}`;
      sqlList.value.splice(index, 1, {
        // eslint-disable-next-line no-useless-escape
        queryName: `${t('common.query')} ${dayjs().format('YYYYMMDDHHmmss')}`,
        id: currentSqlId,
      });
      activiteSql.value = currentSqlId;
      code[activiteSql.value] = '';
    }
  }
}

// 添加tab
const handleTabAdd = throttle(() => {
  const currentSqlId = `_${dayjs().unix()}`;
  sqlList.value.push({
    // eslint-disable-next-line no-useless-escape
    queryName: `${t('common.query')} ${dayjs().format('YYYYMMDDHHmmss')}`,
    id: currentSqlId,
  });
  activiteSql.value = currentSqlId;
  code[activiteSql.value] = '';
}, 999);
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
    ElMessage.info({ message: t('search.deleteTabTip'), grouping: true });
    return;
  }
  const index = sqlList.value.findIndex((f) => `${f.id}` === `${targetName}`);
  const current = sqlList.value[index];
  const id = `${targetName}`.charAt(0) === '_' ? null : (targetName as unknown as string);
  if (!id) {
    activiteSql.value = targetName as string;
    saveForm.sqlName = current.queryName;
    saveSource.value = 'close';
    nameDialogVisible.value = true;
    nextTick(() => {
      saveFormRef.value?.clearValidate();
    });
  } else {
    saveQuery({
      id,
      queryName: current.queryName,
      sqls: code[targetName],
    }).then((res) => {
      if (res.code === 0) {
        ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
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

// 保存模板
function handleNameConfirm() {
  saveFormRef.value?.validate((valid) => {
    if (valid) {
      const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value;
      const data = {
        id,
        queryName: saveForm.sqlName,
        sqls: code[activiteSql.value],
      };
      saveQuery(data).then((res) => {
        if (res.code === 0) {
          ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
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
  resaveFormRef.value?.validate((valid) => {
    if (valid) {
      const { id } = resaveForm;
      const data = {
        id,
        queryName: resaveForm.sqlName,
        sqls: code[activiteSql.value],
      };
      saveQuery(data).then((res) => {
        if (res.code === 0) {
          ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
          renameDialogVisible.value = false;
          const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
          sqlList.value.splice(index, 1, { id: `${id}`, queryName: resaveForm.sqlName });
          sqlListRef.value?.getQueryList();
          activiteSql.value = `${id}`;
        }
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
    nameDialogVisible.value = true;
    nextTick(() => {
      saveFormRef.value?.clearValidate();
    });
  } else {
    saveQuery({
      id,
      queryName: current.queryName,
      sqls: code[activiteSql.value],
    }).then((res) => {
      if (res.code === 0) {
        ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      }
    });
  }
}

watch(activiteSql, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    getSqlCode();
  }
});
</script>

<style lang="scss" scoped>
.sql-container {
  width: 100%;
  position: relative;
  height: 100%;
  overflow: hidden;
}

.sql-wrapper {
  width: 100%;
  position: relative;
  height: 100%;

  .el-button:focus-visible {
    outline: none;
  }
}

.sql-search-wrapper {
  width: calc(100% - 316px);
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

.type-input-disabled {
  :deep(.el-input__inner) {
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
  }
}

.sql-search-aside {
  width: 300px;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  padding: 10px 16px;
  box-sizing: border-box;

  .operate-link {
    position: absolute;
    left: 8px;
    bottom: 12px;
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #495ad4;
    display: flex;
    align-items: center;

    svg {
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
  }
}

.tabs-nav-aside {
  // width: 207px;

  :deep(.el-tabs__header) {
    background: #fff;
    margin: 0;
  }

  :deep(.el-tabs__item) {
    padding: 0 !important;
    width: 89px;
  }

  :deep(.el-tabs__active-bar) {
    border-radius: 2px 2px 0 0;
  }
}
</style>
