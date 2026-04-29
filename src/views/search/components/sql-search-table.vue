<template>
  <div class="sql-container" data-testid="sql-search-table-page">
    <div class="sql-wrapper" data-testid="sql-search-shell">
      <div class="sql-search-wrapper">
        <div class="sql-tab-box" data-testid="sql-search-workspace">
          <el-tabs v-model="activiteSql" editable type="card" closable class="sql-tab-list" @tab-click="handleTabClick" @tab-remove="handleTabRemove" @tab-add="handleTabAdd" id="sql-search-top-tabs" data-testid="sql-search-top-tabs">
            <el-tab-pane v-for="(item, index) in sqlList" :key="`${item.id}_${item.queryName}`" :label="item.queryName" :name="item.id">
              <template #label>
                <span style="font-size: 12px; line-height: 1.2; display: flex; width: 118px" :id="`sql_tab_${index}`">
                  <text-tooltip :content="item.queryName" />
                </span>
              </template>
              <el-scrollbar :height="tabHeight">
                <sql-search
                  v-model:code="code[activiteSql]!"
                  :codeOriginal="codeOriginal[activiteSql]!"
                  @save="handleSave"
                  @revert="
                    () => {
                      code[activiteSql] = codeOriginal[activiteSql]!;
                    }
                  "
                  ref="sqlSearchRef"
                />
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
          <!-- <el-button size="small" circle class="add-tab-btn" @click="handleTabAdd"><i-ep-plus /></el-button> -->
        </div>
      </div>

      <div class="sql-search-aside" data-testid="sql-search-side-panel">
        <div v-if="codeMirrorReady">
          <h4 style="font-size: 12px; font-weight: 700; color: #495ad4; margin: 0 0 12px">{{ t('search.quickActions') }}</h4>
          <el-tabs v-model="activeNameSide" class="tabs-nav-aside" data-testid="sql-search-side-tabs">
            <el-tab-pane :label="t('measurement.measurement')" name="data">
              <side-table-schema @get-function="getFunction" />
            </el-tab-pane>
            <el-tab-pane :label="t('search.function')" name="function">
              <side-function @get-function="getFunction" />
            </el-tab-pane>
            <el-tab-pane :label="t('search.template')" name="template">
              <side-template ref="sqlListRef" @handle-sql-operate="handleSqlOperate" />
            </el-tab-pane>
          </el-tabs>
          <a :href="operatingLink" rel="noopener noreferrer" target="_blank" class="operate-link">
            <i-custom-question />
            {{ t('search.operatingInstructions') }}
          </a>
        </div>
      </div>
    </div>

    <el-dialog :title="t('search.saveTemplate')" v-model="nameDialogVisible" width="480px" align-center data-testid="sql-search-save-dialog">
      <el-form ref="saveFormRef" :model="saveForm" :rules="saveFormRules" label-position="left" @submit.prevent>
        <el-form-item :label="`${t('search.name')}：`" prop="sqlName">
          <el-input type="hidden" />
          <el-input v-model="saveForm.sqlName" :placeholder="t('common.placeHolder')" maxlength="25" show-word-limit id="sql-search-modal-save" data-testid="sql-search-modal-save" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleNameCancel" id="sql-search-modal-save-cancel" data-testid="sql-search-modal-save-cancel">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="saveLoading" @click="handleNameConfirm" id="sql-search-modal-save-confirm" data-testid="sql-search-modal-save-confirm">{{ t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog :title="t('search.rename')" v-model="renameDialogVisible" width="480px" align-center data-testid="sql-search-rename-dialog">
      <el-form ref="resaveFormRef" :model="resaveForm" :rules="resaveFormRules" :label-width="locale === 'en' ? '104px' : '80px'" label-position="left">
        <el-form-item :label="`${t('search.oldName')}：`" prop="oldSqlName" class="type-input-disabled el-form-item-not-mandatory">
          <el-input type="hidden" />
          <el-input v-model="resaveForm.oldSqlName" disabled id="sql-search-modal-resave-old" data-testid="sql-search-modal-resave-old" />
        </el-form-item>
        <el-form-item :label="`${t('search.newName')}：`" prop="sqlName">
          <el-input type="hidden" />
          <el-input v-model="resaveForm.sqlName" :placeholder="t('common.placeHolder')" maxlength="25" show-word-limit id="sql-search-modal-resave" data-testid="sql-search-modal-resave" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameDialogVisible = false" id="sql-search-modal-resave-cancel" data-testid="sql-search-modal-resave-cancel">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="saveLoading" @click="handleRenameConfirm" id="sql-search-modal-confirm" data-testid="sql-search-modal-confirm">{{ t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog :title="t('common.notice')" v-model="saveTipDialogVisible" width="480px" align-center data-testid="sql-search-unsaved-dialog">
      <span style="line-height: 24px" class="inline-flex items-center">
        <i-custom-message-warning class="m-r-4" />
        {{ t('common.unsaveContinueTip') }}
      </span>
      <template #footer>
        <el-button id="sql-search-modal-unsavetip-unsave" data-testid="sql-search-modal-unsavetip-unsave" class="left" @click="handleUnsave">{{ t('common.unsave') }}</el-button>
        <el-button @click="saveTipDialogVisible = false" id="sql-search-modal-unsavetip-cancel" data-testid="sql-search-modal-unsavetip-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleContiuneSave" id="sql-search-modal-unsavetip-confirm" data-testid="sql-search-modal-unsavetip-confirm">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { FormInstance, TabsPaneContext, TabPaneName, FormRules } from 'element-plus';
import dayjs from 'dayjs';
import { throttle } from 'lodash-es';
import { SearchApi } from '@/api';
import SideFunction from './side-function.vue';
import SideTableSchema from './side-table-schema.vue';
import SideTemplate from './side-template.vue';
import SqlSearch from './sql-search.vue';
import type { SqlList } from '@/types';

const { t, locale } = useI18n();
const sqlSearchRef = ref<Array<InstanceType<typeof SqlSearch>>>([]);
const codeMirrorReady = ref(true);
const nameDialogVisible = ref(false);
const renameDialogVisible = ref(false);
const saveTipDialogVisible = ref(false);

const { maxTableHeight: tabHeight } = useTableHeight(100);

const activiteSql = ref<string>(`_${dayjs().format('YYYY-MM-DD HH:mm:ss:SSS')}`);

const sqlList = ref<SqlList[]>([
  {
    id: activiteSql.value,
    queryName: t('search.queryTemplate', {
      time: dayjs().format('YYYYMMDDHHmmss'),
    }),
  },
]);
const activeNameSide = ref('function');

const code = reactive<Record<string, string>>({});
const codeOriginal = reactive<Record<string, string>>({});
code[activiteSql.value] = '';
// 用于存储初始状态
codeOriginal[activiteSql.value] = '';
const sqlListRef = ref<InstanceType<typeof SideTemplate>>();
const saveFormRef = ref<FormInstance>();
const resaveFormRef = ref<FormInstance>();
const saveFormRules = reactive<FormRules>({
  sqlName: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!value || !value.trim()) {
          return callback(new Error(t('search.nameRuleTip')));
        }
        return callback();
      },
      trigger: 'blur',
    },
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
const resaveFormRules = reactive<FormRules>({
  sqlName: [
    {
      required: true,
      validator: (rule, value, callback) => {
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

const normalizeTestIdSegment = (value: string | number) => `${value}`.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();

function syncTabTestIds() {
  const tabRoot = document.getElementById('sql-search-top-tabs');
  if (!tabRoot) return;

  const addButton = tabRoot.querySelector('.el-tabs__new-tab');
  addButton?.setAttribute('data-testid', 'sql-search-tab-add');

  const tabItems = tabRoot.querySelectorAll('.el-tabs__header .el-tabs__item');
  tabItems.forEach((tabItem, index) => {
    const sqlItem = sqlList.value[index];
    if (!sqlItem) return;

    const idSegment = normalizeTestIdSegment(sqlItem.id);
    tabItem.setAttribute('data-testid', `sql-search-tab-${idSegment}`);
    tabItem.setAttribute('data-testid-index', `sql-search-tab-index-${index}`);
    tabItem.setAttribute('data-sql-tab-index', `${index}`);
    const closeButton = tabItem.querySelector('.is-icon-close');
    closeButton?.setAttribute('data-testid', `sql-search-tab-close-${idSegment}`);
    closeButton?.setAttribute('data-testid-index', `sql-search-tab-close-index-${index}`);
    closeButton?.setAttribute('data-sql-tab-close-index', `${index}`);
  });
}

const operatingLink = computed(() => {
  // 根据当前语言环境返回对应的链接
  let link = locale.value === 'en' ? 'https://timecho.com/docs/' : 'https://timecho.com/docs/zh/';
  if (activeNameSide.value === 'function') {
    link += 'UserGuide/latest-Table/SQL-Manual/Basis-Function.html';
  } else {
    link += 'UserGuide/latest-Table/SQL-Manual/overview_timecho.html';
  }
  return link;
});

// 获取code
function getSqlCode() {
  if (code[activiteSql.value]) return;
  const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value;
  code[activiteSql.value] = '';
  codeOriginal[activiteSql.value] = '';
  // tableData.list = [];
  if (!id) return;
  getSql(id).then((res) => {
    const resData = res.data;
    code[activiteSql.value] = resData.sqls;
    codeOriginal[activiteSql.value] = resData.sqls;
  });
}

// 追加code
function getFunction(val: string) {
  // code[activiteSql.value] += val;
  const index = sqlList.value.findIndex((f) => `${f.id}` === `${activiteSql.value}`);
  if (index !== -1) {
    sqlSearchRef.value[index]!.insertContent(val);
  }
}

// 模板操作
function handleSqlOperate(val: string, data: SqlList) {
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
        queryName: t('search.queryTemplate', {
          time: dayjs().format('YYYYMMDDHHmmss'),
        }),
        id: currentSqlId,
      });
      activiteSql.value = currentSqlId;
      code[activiteSql.value] = '';
      codeOriginal[activiteSql.value] = '';
    }
  }
}

// 添加tab
const handleTabAdd = throttle(() => {
  const currentSqlId = `_${dayjs().unix()}`;
  sqlList.value.push({
    queryName: t('search.queryTemplate', {
      time: dayjs().format('YYYYMMDDHHmmss'),
    }),
    id: currentSqlId,
  });
  activiteSql.value = currentSqlId;
  code[activiteSql.value] = '';
  codeOriginal[activiteSql.value] = '';
}, 999);
// 点击tab
function handleTabClick(tab: TabsPaneContext) {
  if (tab.index) {
    const data = sqlList.value[tab.index as unknown as number]!;
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
  const current = sqlList.value[index]!;
  const id = `${targetName}`.charAt(0) === '_' ? null : (targetName as unknown as string);
  if (code[targetName]!.trim() !== codeOriginal[targetName]!.trim()) {
    if (!id) {
      activiteSql.value = targetName as string;
      saveForm.sqlName = current.queryName;
      saveSource.value = 'close';
      nameDialogVisible.value = true;
      nextTick(() => {
        saveFormRef.value?.clearValidate();
      });
    } else if (id) {
      activiteSql.value = targetName as string;
      saveForm.sqlName = current.queryName;
      saveSource.value = 'close';
      saveTipDialogVisible.value = true;
    }
  } else {
    const nextTab = sqlList.value[index + 1] || sqlList.value[index - 1]!;
    activiteSql.value = `${nextTab.id}`;
    sqlList.value.splice(index, 1);
  }
}

// 保存模板
function handleNameConfirm() {
  saveFormRef.value?.validate((valid) => {
    if (valid) {
      const normalizedName = saveForm.sqlName.trim();
      const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value;
      const data = {
        id,
        queryName: normalizedName,
        sqls: code[activiteSql.value]!,
      };
      saveQuery(data).then((res) => {
        if (res.code === 0) {
          ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
          nameDialogVisible.value = false;
          if (saveSource.value === 'save') {
            const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
            if (index !== -1) {
              sqlList.value.splice(index, 1, { id: `${res.data}`, queryName: normalizedName });
            }
            activiteSql.value = `${res.data}`;
            sqlListRef.value?.getQueryList();
          } else {
            code[activiteSql.value] = '';
            codeOriginal[activiteSql.value] = '';
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
function handleUnsave() {
  saveTipDialogVisible.value = false;
  code[activiteSql.value] = codeOriginal[activiteSql.value]!;
  const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
  const nextTab = sqlList.value[index + 1] || sqlList.value[index - 1];
  activiteSql.value = `${nextTab?.id}`;
  sqlList.value.splice(index, 1);
}

function handleContiuneSave() {
  const targetName = activiteSql.value;
  const id = activiteSql.value.charAt(0) === '_' ? null : activiteSql.value;
  const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
  saveQuery({
    id,
    queryName: saveForm.sqlName,
    sqls: code[targetName]!,
  }).then((res) => {
    if (res.code === 0) {
      saveTipDialogVisible.value = false;
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      // code[targetName] = '';
      delete code[targetName];
      delete codeOriginal[targetName];
      const nextTab = sqlList.value[index + 1] || sqlList.value[index - 1]!;
      activiteSql.value = `${nextTab.id}`;
      sqlList.value.splice(index, 1);
      sqlListRef.value?.getQueryList();
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
    codeOriginal[activiteSql.value] = '';
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
      const normalizedName = resaveForm.sqlName.trim();
      const { id } = resaveForm;
      const data = {
        id,
        queryName: normalizedName,
        sqls: code[id]!,
      };
      saveQuery(data).then((res) => {
        if (res.code === 0) {
          ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
          renameDialogVisible.value = false;
          const index = sqlList.value.findIndex((f) => `${f.id}` === `${id}`);
          if (index !== -1) {
            sqlList.value.splice(index, 1, { id: `${id}`, queryName: normalizedName });
          }
          sqlListRef.value?.getQueryList();
          // activiteSql.value = `${id}`;
        }
      });
    }
  });
}
// 保存
function handleSave() {
  const index = sqlList.value.findIndex((f) => `${f.id}` === activiteSql.value);
  const current = sqlList.value[index]!;
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
      sqls: code[activiteSql.value]!,
    }).then((res) => {
      if (res.code === 0) {
        ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
        codeOriginal[activiteSql.value] = code[activiteSql.value]!;
      }
    });
  }
}

function setStorage() {
  window.sessionStorage.setItem(
    'sqlSearchStorage',
    JSON.stringify({
      activiteSql: activiteSql.value,
      sqlList: sqlList.value,
      activeNameSide: activeNameSide.value,
      code: { ...code },
      codeOriginal: { ...codeOriginal },
    }),
  );
}

onBeforeUnmount(() => {
  setStorage();
});

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    if (!window.__isReload__) {
      setStorage();
    } else {
      window.sessionStorage.setItem('sqlSearchStorage', '');
    }
  });
  if (window.sessionStorage.getItem('sqlSearchStorage')) {
    const storageData = JSON.parse(window.sessionStorage.getItem('sqlSearchStorage') as string);
    activiteSql.value = storageData.activiteSql;
    sqlList.value = storageData.sqlList;
    activeNameSide.value = storageData.activeNameSide;
    const allCodeKeys = Object.keys(storageData.code);
    allCodeKeys.forEach((sql) => {
      code[sql] = storageData.code[sql];
    });
    const allCodeMirrorKeys = Object.keys(storageData.codeOriginal);
    allCodeMirrorKeys.forEach((sql) => {
      codeOriginal[sql] = storageData.codeOriginal[sql];
    });
  }
  nextTick(() => {
    syncTabTestIds();
  });
});

watch(activiteSql, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    getSqlCode();
  }
});

watch(
  () => sqlList.value.map((item) => `${item.id}:${item.queryName}`).join('|'),
  () => {
    nextTick(() => {
      syncTabTestIds();
    });
  },
  { immediate: true },
);
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
  width: calc(100% - 308px);
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
}

.sql-tab-box {
  width: 100%;
  height: 100%;
  position: relative;
  padding-bottom: 8px;

  .sql-tab-list {
    height: 100%;

    // width: calc(100% - 40px);
  }

  :deep(.el-tabs__header) {
    margin: 0;
    padding-right: 8px;
  }

  :deep(.el-tabs__content) {
    width: 100%;
  }

  :deep(.el-tabs__nav-next, .el-tabs__nav-prev) {
    line-height: 40px !important;
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
  padding: 10px 8px;
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
