<template>
  <el-container>
    <el-aside width="240px" class="role-list-wrapper">
      <role-list
        @handleSelect="val => currentRole = val"
      />
    </el-aside>
    <el-container class="role-details-wrapper p-0">
      <el-header class="detail-title-box">
        <h4 class="detail-title-text">权限详情</h4>
        <el-button type="primary" v-if="pageType === 'view'" :disabled="!currentRole" @click="pageType = 'edit'">编辑</el-button>
        <el-button type="primary" v-else @click="handleReset">退出编辑</el-button>
      </el-header>
      <el-main class="p-x-16 p-t-0 p-b-0" v-loading="loading">
        <div class="table-list-box">
          <h4 class="table-box-title">全局</h4>
          <el-table :data="[authData.entityPrivileges]" style="width: 100%;" border ref="entityTableRef">
            <el-table-column label="全选" align="center" width="58" fixed="left">
              <template #default="{ row }">
                <el-icon v-if="pageType === 'view'" size="24">
                  <i-custom-correct v-if="row.length >= entityPrivilegesEnumKeys.length" />
                </el-icon>
                <template v-else>
                  <el-checkbox :checked="row.length >= entityPrivilegesEnumKeys.length" v-if="row.length >= entityPrivilegesEnumKeys.length" @change="val => handleCheckedEntity(val)" />
                  <el-checkbox :checked="row.length >= entityPrivilegesEnumKeys.length" v-else @change="val => handleCheckedEntity(val)" />
                </template>
              </template>
            </el-table-column>
            <el-table-column v-for="(column, index) in entityPrivilegesEnumGroup" :label="column.group" :key="column.group + '_' + index + '_column'" align="center">
              <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :width="col.width || 180">
                <template #default="{ row }">
                  <el-icon v-if="pageType === 'view'" size="24">
                    <i-custom-correct v-if="row.includes(col.privileges)" />
                  </el-icon>
                  <template v-else>
                    <el-checkbox :checked="row.includes(col.privileges)" v-if="row.includes(col.privileges)" @change="val => handleCheckedEntity(val, col.privileges)" />
                    <el-checkbox :checked="row.includes(col.privileges)" v-else @change="val => handleCheckedEntity(val, col.privileges)" />
                  </template>
                </template>
              </el-table-column>
            </el-table-column>
            <template #empty>
              <div class="table-empty-wrapper">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">无数据</span>
              </div>
            </template>
          </el-table>
        </div>

        <div class="table-list-box">
          <h4 class="table-box-title">路径</h4>
          <el-table :data="pathData" style="width: 100%" tooltip-effect="light" border :max-height="maxTableHeight" ref="pathTableRef">
            <el-table-column label="路径名称" prop="path" align="center" width="193" show-overflow-tooltip />
            <el-table-column label="全选" align="center" width="193">
              <template #default="{ row, $index }">
                <el-icon v-if="pageType === 'view'" size="24">
                  <i-custom-correct v-if="row.list.length >= pathPrivilegesEnumKeys.length" />
                </el-icon>
                <template v-else>
                  <el-checkbox :checked="row.list.length >= pathPrivilegesEnumKeys.length" v-if="row.list.length >= pathPrivilegesEnumKeys.length" @change="val => handleCheckedPath(val, $index)" />
                  <el-checkbox :checked="row.list.length >= pathPrivilegesEnumKeys.length" v-else @change="val => handleCheckedPath(val, $index)" />
                </template>
              </template>
            </el-table-column>
            <el-table-column v-for="(column, index) in pathPrivilegesEnumGroup" :label="column.group" :key="column.group + '_' + index + '_column'" align="center">
              <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :min-width="col.width || 180">
                <template #default="{ row, $index }">
                  <el-icon v-if="pageType === 'view'" size="24">
                    <i-custom-correct v-if="row.list.includes(col.privileges)" />
                  </el-icon>
                  <template v-else>
                    <el-checkbox :checked="row.list.includes(col.privileges)" v-if="row.list.includes(col.privileges)" @change="val => handleCheckedPath(val, $index, col.privileges)" />
                    <el-checkbox :checked="row.list.includes(col.privileges)" v-else @change="val => handleCheckedPath(val, $index, col.privileges)" />
                  </template>
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="操作" align="center" width="194" fixed="right">
              <template #default="{ $index }">
                <el-button v-if="currentRole" link @click="handleDelRow($index)" :disabled="pageType === 'view'">
                  <el-icon size="24"><i-custom-close /></el-icon>
                </el-button>
              </template>
            </el-table-column>
            <template #empty>
              <div class="table-empty-wrapper">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">无数据</span>
              </div>
            </template>
          </el-table>

          <el-button v-if="pageType === 'edit'" style="width: 100%;" class="m-t-24" @click="handleAddRow"><i-custom-add class="m-r-4" />添加路径</el-button>
        </div>
      </el-main>

      <el-footer>
        <div class="operate-buttons" v-if="pageType === 'edit'">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSave" :loading="saveLoading">应用</el-button>
        </div>
      </el-footer>
    </el-container>

    <modal-path
      v-model:visible="pathVisible"
      :path-list="editPathList"
      @handleSave="handleSavePath"
    />
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { cloneDeep, difference } from 'lodash-es';
import type { CheckboxValueType, ElTable } from 'element-plus';
import { useUserStore } from '@/stores';
import { AuthApi } from '@/api';
import { useTableHeight } from '@/composition-api';
import RoleList from './components/role-list.vue';
import ModalPath from './components/modal-path.vue';

const entityTableRef = ref<InstanceType<typeof ElTable>>();
const pathTableRef = ref<InstanceType<typeof ElTable>>();
const currentRole = ref('');
const pathData = ref<Array<{ path: string, list: string[] }>>([]);
const pathVisible = ref(false);
const editPathList = ref<string[]>([]);
const intitalEntityVals = ref<string[]>([]);
const intitalPathVals = ref<Record<string, string[]>>({});
const pageType = ref('view');
const { maxTableHeight } = useTableHeight(440);

const userStore = useUserStore();
const {
  entityPrivilegesEnumGroup,
  entityPrivilegesEnumKeys,
  pathPrivilegesEnumGroup,
  pathPrivilegesEnumKeys,
} = storeToRefs(userStore);

const { requestFn: getAuthByRole, data: authData, loading } = useRequest(AuthApi.getAuthByRole, {
  initData: {
    roleName: '',
    entityPrivileges: [],
    pathPrivileges: {},
  },
});
const { requestFn: updateAuthByRole, loading: saveLoading } = useRequest(AuthApi.updateAuthByRole);

function getDetail() {
  getAuthByRole(currentRole.value).then(() => {
    intitalEntityVals.value = cloneDeep(authData.value.entityPrivileges);
    intitalPathVals.value = cloneDeep(authData.value.pathPrivileges);
    pathData.value = [];
    const pathArr = authData.value.pathPrivileges ? Object.keys(authData.value.pathPrivileges) : [];
    pathArr.forEach((item) => {
      pathData.value.push({ path: item, list: authData.value.pathPrivileges[item] });
    });
  });
}

// 添加行
function handleAddRow() {
  editPathList.value = pathData.value.map((item) => item.path);
  pathVisible.value = true;
}

// 保存路径
function handleSavePath(path: string) {
  pathData.value.push({ path, list: [] });
}

// 删除行
function handleDelRow(index: number) {
  pathData.value.splice(index, 1);
}

// 全局
function handleCheckedEntity(val: CheckboxValueType, auth?:string) {
  if (!auth) {
    if (val) {
      authData.value.entityPrivileges = entityPrivilegesEnumKeys.value.map((item) => item);
    } else {
      authData.value.entityPrivileges = [];
    }
  } else if (val) {
    authData.value.entityPrivileges.push(auth);
  } else {
    const index = authData.value.entityPrivileges.findIndex((path) => path === auth);
    authData.value.entityPrivileges.splice(index, 1);
  }
}

// 路径
function handleCheckedPath(val: CheckboxValueType, index: number, auth?:string) {
  if (!auth) {
    pathData.value.splice(index, 1, { path: pathData.value[index].path, list: val ? [...pathPrivilegesEnumKeys.value] : [] });
  } else {
    const data: { path: string, list: string[] } = { ...pathData.value[index] };
    if (val) {
      data.list.push(auth);
    } else {
      const i = data.list.findIndex((item) => item === auth);
      data.list.splice(i, 1);
    }
    pathData.value.splice(index, 1, { ...data });
  }
}

// 重置
function handleReset() {
  pageType.value = 'view';
  getDetail();
}

// 更新权限
function handleSave() {
  const cancelPathPrivileges: Record<string, string[]> = {};
  const addPathPrivileges: Record<string, string[]> = {};
  const initialPathKeys = intitalPathVals.value ? Object.keys(intitalPathVals.value) : [];
  const pathVals = pathData.value.map((data) => data.path);
  const delArr = difference(initialPathKeys, pathVals);
  delArr.forEach((path) => {
    cancelPathPrivileges[path] = pathData.value.find((data) => data.path === path)?.list || [];
  });
  pathData.value.forEach((item) => {
    const sourcePrivileges = intitalPathVals.value[item.path] || [];
    const addVals = difference(item.list, sourcePrivileges);
    const cancelVals = difference(sourcePrivileges, item.list);
    addPathPrivileges[item.path] = addVals;
    cancelPathPrivileges[item.path] = cancelVals;
  });

  const addEntityPrivileges = difference(authData.value.entityPrivileges, intitalEntityVals.value);
  const cancelEntityPrivileges = difference(intitalEntityVals.value, authData.value.entityPrivileges);

  const data = {
    roleName: currentRole.value,
    cancelEntityPrivileges,
    addEntityPrivileges,
    cancelPathPrivileges,
    addPathPrivileges,
  };
  updateAuthByRole(data).then(() => {
    ElMessage.success('保存成功');
    pageType.value = 'view';
    getDetail();
  });
}

watch(
  () => currentRole.value,
  (val, old) => {
    if (val !== old) {
      pageType.value = 'view';
      authData.value.entityPrivileges = [];
      authData.value.pathPrivileges = {};
      pathData.value = [];
      pathVisible.value = false;
      if (val) {
        getDetail();
      } else {
        pathData.value = [{ path: '', list: [] }];
      }
    }
  },
  {
    immediate: true,
  },
);
</script>

<style lang="scss" scoped>
.role-page-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.role-list-wrapper{
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.role-details-wrapper{
  margin-left: 16px;
  background-color: #fff;
  border-radius: 6px;
}

.detail-title-box{
  height: 48px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #DFE1ED;
  padding: 0 16px;
  box-sizing: border-box;

  .detail-title-text{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}

.table-list-box{
  margin-top: 32px;
  background-color: #F7F8FC;
  padding: 8px 16px 16px;

  .table-box-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
    margin-bottom: 8px;
  }

  :deep(.el-table) {
    --el-table-border: 1px solid #DFE1ED;
    --el-table-border-color: #DFE1ED;
  }

  :deep(.el-table th.el-table__cell) {
    background-color: #fff !important;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #424561;
  }
}

.operate-buttons{
  text-align: right;
  margin-top: 24px;
}
</style>
