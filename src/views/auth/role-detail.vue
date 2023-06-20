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
        <el-button type="primary" v-if="isView" :disabled="!currentRole" @click="pageType = 'edit'">编辑</el-button>
        <el-button type="primary" v-else @click="handleReset('view')">退出编辑</el-button>
      </el-header>
      <el-main class="p-x-16 p-t-0 p-b-16" v-loading="loading">
        <div class="table-list-box">
          <h4 class="table-box-title">全局</h4>
          <el-table :data="[authData.entityPrivileges]" style="width: 100%;" border>
            <el-table-column label="全选" align="center" width="58" fixed="left">
              <template #default="{ row }">
                <el-icon v-if="isView" size="21">
                  <i-custom-correct style="transform: translateY(3px);" v-if="row.length >= entityPrivilegesEnumKeys.length" />
                </el-icon>
                <template v-else>
                  <el-checkbox :checked="true" v-if="row.length >= entityPrivilegesEnumKeys.length" @change="val => handleCheckedEntity(val)" />
                  <el-checkbox :checked="false" v-else @change="val => handleCheckedEntity(val)" />
                </template>
              </template>
            </el-table-column>
            <el-table-column v-for="(column, index) in entityPrivilegesEnumGroup" :label="column.group" :key="column.group + '_' + index + '_column'" align="center">
              <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :width="col.width || 180">
                <template #default="{ row }">
                  <el-icon v-if="isView" size="21">
                    <i-custom-correct style="transform: translateY(3px);" v-if="row.includes(col.privileges)" />
                  </el-icon>
                  <template v-else>
                    <el-checkbox :checked="true" v-if="row.includes(col.privileges)" @change="val => handleCheckedEntity(val, col.privileges)" />
                    <el-checkbox :checked="false" v-else @change="val => handleCheckedEntity(val, col.privileges)" />
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
          <el-table :data="authData.pathPrivileges" style="width: 100%" tooltip-effect="light" border>
            <el-table-column label="路径名称" prop="path" align="center" width="193" show-overflow-tooltip />
            <el-table-column label="全选" align="center" width="193">
              <template #default="{ row, $index }">
                <el-icon v-if="isView" size="21">
                  <i-custom-correct style="transform: translateY(3px);" v-if="row.privileges.length >= pathPrivilegesEnumKeys.length" />
                </el-icon>
                <template v-else>
                  <!-- eslint-disable-next-line vue/max-len -->
                  <el-checkbox :checked="true" v-if="row.privileges.length >= pathPrivilegesEnumKeys.length" @change="val => handleCheckedPath(val, $index)" />
                  <el-checkbox :checked="false" v-else @change="val => handleCheckedPath(val, $index)" />
                </template>
              </template>
            </el-table-column>
            <el-table-column v-for="(column, index) in pathPrivilegesEnumGroup" :label="column.group" :key="column.group + '_' + index + '_column'" align="center">
              <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :min-width="col.width || 180">
                <template #default="{ row, $index }">
                  <el-icon v-if="isView" size="21">
                    <i-custom-correct style="transform: translateY(3px);" v-if="row.privileges.includes(col.privileges)" />
                  </el-icon>
                  <template v-else>
                    <el-checkbox :checked="true" v-if="row.privileges.includes(col.privileges)" @change="val => handleCheckedPath(val, $index, col.privileges)" />
                    <el-checkbox :checked="false" v-else @change="val => handleCheckedPath(val, $index, col.privileges)" />
                  </template>
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="操作" align="center" width="194" fixed="right">
              <template #default="{ row, $index }">
                <el-button v-if="row.path || (!row.path && !isView)" link @click="handleDelRow($index)" :disabled="isView">
                  <el-icon size="21"><i-custom-close /></el-icon>
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

          <el-button v-if="!isView" style="width: 100%;" class="m-t-24" @click="handleAddRow"><i-custom-add class="m-r-4" />添加路径</el-button>
        </div>
      </el-main>

      <el-footer v-if="!isView">
        <div class="operate-buttons">
          <el-button @click="handleReset('edit')">重置</el-button>
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
import type { CheckboxValueType } from 'element-plus';
import { useUserStore } from '@/stores/user.store';
import { AuthApi } from '@/api';
import RoleList from './components/role-list.vue';
import ModalPath from './components/modal-path.vue';

const currentRole = ref('');
const pathVisible = ref(false);
const editPathList = ref<string[]>([]);
const intitalEntityVals = ref<string[]>([]);
const intitalPathVals = ref<Array<{ path: string, privileges: string[] }>>([]);
const pageType = ref<'edit' | 'view'>('view');

const isView = computed(() => pageType.value === 'view');

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
    pathPrivileges: [{ path: '', privileges: [] }],
  },
});
const { requestFn: updateAuthByRole, loading: saveLoading } = useRequest(AuthApi.updateAuthByRole);

function getDetail() {
  getAuthByRole(currentRole.value).then(() => {
    intitalEntityVals.value = cloneDeep(authData.value.entityPrivileges);
    intitalPathVals.value = cloneDeep(authData.value.pathPrivileges);
    if (authData.value.pathPrivileges.length === 0) {
      authData.value.pathPrivileges.push({ path: '', privileges: [] });
    }
  });
}

// 添加行
function handleAddRow() {
  editPathList.value = authData.value.pathPrivileges.map((item) => item.path);
  pathVisible.value = true;
}

// 保存路径
function handleSavePath(path: string) {
  if (authData.value.pathPrivileges.length === 1 && !authData.value.pathPrivileges[0].path) {
    authData.value.pathPrivileges.splice(0, 1, { path, privileges: [] });
  } else {
    authData.value.pathPrivileges.push({ path, privileges: [] });
  }
}

// 删除行
function handleDelRow(index: number) {
  authData.value.pathPrivileges.splice(index, 1);
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
    authData.value.pathPrivileges.splice(index, 1, { path: authData.value.pathPrivileges[index].path, privileges: val ? [...pathPrivilegesEnumKeys.value] : [] });
  } else {
    const data: { path: string, privileges: string[] } = { ...authData.value.pathPrivileges[index] };
    if (val) {
      data.privileges.push(auth);
    } else {
      const i = data.privileges.findIndex((item) => item === auth);
      data.privileges.splice(i, 1);
    }
    authData.value.pathPrivileges.splice(index, 1, { ...data });
  }
}

// 重置
function handleReset(type: 'edit' | 'view') {
  pageType.value = type;
  getDetail();
}

// 更新权限
function handleSave() {
  const flag = authData.value.pathPrivileges.some((data) => !data.privileges.length || !data.path);
  if (flag) {
    ElMessage.error('存在权限为空的序列');
    return;
  }
  const cancelPathPrivileges: Array<{ path: string, privileges: string[] }> = [];
  const addPathPrivileges: Array<{ path: string, privileges: string[] }> = [];
  const initialPathKeys = intitalPathVals.value.map((data) => data.path) || [];
  const pathVals = authData.value.pathPrivileges.map((data) => data.path) || [];
  const delArr = difference(initialPathKeys, pathVals);
  delArr.forEach((path) => {
    const findData = intitalPathVals.value.find((data) => data.path === path);
    if (findData) {
      cancelPathPrivileges.push({ ...findData });
    }
  });
  authData.value.pathPrivileges.forEach((item) => {
    const sourcePrivileges = intitalPathVals.value.find((data) => data.path === item.path);
    if (sourcePrivileges) {
      const addVals = difference(item.privileges, sourcePrivileges.privileges);
      const cancelVals = difference(sourcePrivileges.privileges, item.privileges);
      if (addVals.length > 0) {
        addPathPrivileges.push({ path: item.path, privileges: addVals });
      }
      if (cancelVals.length > 0) {
        cancelPathPrivileges.push({ path: item.path, privileges: cancelVals });
      }
    } else {
      addPathPrivileges.push({ ...item });
    }
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
  }).catch(() => {
    pageType.value = 'edit';
    getDetail();
  });
}

watch(
  () => currentRole.value,
  (val, old) => {
    if (val !== old) {
      pageType.value = 'view';
      authData.value.entityPrivileges = [];
      authData.value.pathPrivileges = [{ path: '', privileges: [] }];
      pathVisible.value = false;
      if (val) {
        getDetail();
      } else {
        authData.value.pathPrivileges = [{ path: '', privileges: [] }];
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
