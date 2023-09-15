<template>
  <el-container>
    <el-aside width="240px" class="role-list-wrapper">
      <role-list
        :can-manage-role="canManageRole"
        @handleSelect="val => currentRole = val"
      />
    </el-aside>
    <el-container class="role-details-wrapper">
      <el-main class="p-0" v-loading="loading">
        <el-scrollbar>
          <div class="detail-title-box">
            <h4 class="detail-title-text">用户详情</h4>
            <auth-tooltip v-if="isView" :is-disabled="canManageRole">
              <el-button type="primary" :disabled="!currentRole || !canManageRole" @click="pageType = 'edit'" id="auth-role-edit">编辑</el-button>
            </auth-tooltip>
            <el-button type="primary" v-else @click="handleReset('view')" id="auth-role-view">退出编辑</el-button>
          </div>
          <div class="detail-user-list">
            拥有用户：<el-tag :closable="!isView" type="info" v-for="(item, index) in userList" :key="item" @close="handleDeleteUser(index)" @click="showAuthDetail(item)" :id="`auth-user-${item}-${index}`">{{ item }}</el-tag>
            <auth-tooltip :is-disabled="canManageUser">
              <el-button link :disabled="!canManageUser" @click="handleAddUser" v-if="!isView" id="auth-user-add-role">
                <el-icon size="24px" class="m-l-16"><i-custom-user-role-add /></el-icon>
              </el-button>
            </auth-tooltip>
          </div>
          <div class="detail-title-box">
            <h4 class="detail-title-text">权限详情<span class="tip-text"><i-custom-info-warning />移除父级路径权限时其包含的子路径权限会同步移除，请谨慎操作</span></h4>
          </div>
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
                <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :width="calcColumnWidth(col)">
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
            </el-table>
          </div>
          <div class="table-list-box">
            <h4 class="table-box-title">路径</h4>
            <el-table :data="authData.pathPrivileges" style="width: 100%" tooltip-effect="light" border :tooltip-options="{ popperClass: 'table-tooltip-max-width' }">
              <el-table-column label="路径名称" prop="path" align="center" min-width="193" show-overflow-tooltip />
              <el-table-column label="全选" align="center" width="193">
                <template #default="{ row, $index }">
                  <el-icon v-if="isView || !row.path" size="21">
                    <i-custom-correct style="transform: translateY(3px);" v-if="row.privileges.length >= pathPrivilegesEnumKeys.length" />
                  </el-icon>
                  <template v-else-if="row.path">
                    <!-- eslint-disable-next-line vue/max-len -->
                    <el-checkbox :checked="true" v-if="row.privileges.length >= pathPrivilegesEnumKeys.length" @change="val => handleCheckedPath(val, $index)" />
                    <el-checkbox :checked="false" v-else @change="val => handleCheckedPath(val, $index)" />
                  </template>
                </template>
              </el-table-column>
              <el-table-column v-for="(column, index) in pathPrivilegesEnumGroup" :label="column.group" :key="column.group + '_' + index + '_column'" align="center">
                <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :width="calcColumnWidth(col)">
                  <template #default="{ row, $index }">
                    <el-icon v-if="isView" size="21">
                      <i-custom-correct style="transform: translateY(3px);" v-if="row.privileges.includes(col.privileges)" />
                    </el-icon>
                    <template v-else-if="row.path">
                      <el-checkbox :checked="true" v-if="row.privileges.includes(col.privileges)" @change="val => handleCheckedPath(val, $index, col.privileges)" />
                      <el-checkbox :checked="false" v-else @change="val => handleCheckedPath(val, $index, col.privileges)" />
                    </template>
                  </template>
                </el-table-column>
              </el-table-column>
              <el-table-column label="操作" align="center" width="194" fixed="right">
                <template #default="{ row, $index }">
                  <el-button v-if="row.path" link @click="handleDelRow($index)" :disabled="isView">
                    <el-icon size="21"><i-custom-close /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-button v-if="!isView" style="width: 100%;" class="m-t-24" @click="handleAddRow" id="auth-role-path"><i-custom-add class="m-r-4" />添加路径</el-button>
          </div>
        </el-scrollbar>
      </el-main>

      <el-footer v-if="!isView">
        <div class="operate-buttons">
          <el-button @click="handleReset('edit')" id="auth-role-reset">重置</el-button>
          <el-button type="primary" @click="handleSave" :loading="saveLoading" id="auth-role-save">应用</el-button>
        </div>
      </el-footer>
    </el-container>

    <modal-path
      v-model:visible="pathVisible"
      :path-list="editPathList"
      @handleSave="handleSavePath"
    />

    <modal-add-user
      v-model:visible="userVisible"
      :selected="userList"
      @add-user="addUserConfirm"
    />

    <modal-preview-user
      v-model:visible="previewVisible"
      :name="previewUser"
    />
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { cloneDeep, difference } from 'lodash-es';
import type { CheckboxValueType } from 'element-plus';
import { useUserStore } from '@/stores/user.store';
import { AuthApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import RoleList from './components/role-list.vue';
import ModalPath from './components/modal-path.vue';
import ModalAddUser from './components/modal-add-user.vue';
import ModalPreviewUser from './components/modal-preview-user.vue';

const currentRole = ref('');
const pathVisible = ref(false);
const editPathList = ref<string[]>([]);
const intitalEntityVals = ref<string[]>([]);
const intitalPathVals = ref<Array<{ path: string, privileges: string[] }>>([]);
const pageType = ref<'edit' | 'view'>('view');
const userList = ref<string[]>([]);
let sourceUsers: string[] = [];
const userVisible = ref(false);
const previewVisible = ref(false);
const previewUser = ref('');
const loading = ref(true);
const saveLoading = ref(false);
const isView = computed(() => pageType.value === 'view');

const userStore = useUserStore();
const {
  entityPrivilegesEnumGroup,
  entityPrivilegesEnumKeys,
  pathPrivilegesEnumGroup,
  pathPrivilegesEnumKeys,
  canManageUser,
  canManageRole,
} = storeToRefs(userStore);

const { requestFn: getAuthByRole, data: authData } = useRequest(AuthApi.getAuthByRole, {
  initData: {
    roleName: '',
    entityPrivileges: [],
    pathPrivileges: [{ path: '', privileges: [] }],
  },
});
const { requestFn: getUserNamesByRoleName } = useRequest(AuthApi.getUserNamesByRoleName);
const { requestFn: updateAuthByRole } = useRequest(AuthApi.updateAuthByRole);
const { requestFn: updateRoleWithUsers } = useRequest(AuthApi.updateRoleWithUsers);

function getRoleUserList() {
  return getUserNamesByRoleName(currentRole.value).then((res) => {
    sourceUsers = cloneDeep(res.data || []);
    userList.value = res.data || [];
  });
}

function getRoleAuth() {
  return getAuthByRole(currentRole.value).then(() => {
    intitalEntityVals.value = cloneDeep(authData.value.entityPrivileges);
    intitalPathVals.value = cloneDeep(authData.value.pathPrivileges);
    if (authData.value.pathPrivileges.length === 0) {
      authData.value.pathPrivileges.push({ path: '', privileges: [] });
    }
  });
}

function getDetail() {
  loading.value = true;
  Promise.allSettled([
    getRoleUserList(),
    getRoleAuth(),
  ]).finally(() => {
    loading.value = false;
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
  if (authData.value.pathPrivileges.length === 0) {
    authData.value.pathPrivileges.push({ path: '', privileges: [] });
  }
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

function calcColumnWidth(child: Auth.PrivilegeEnum) {
  if (child.privileges.length > 0) {
    return child.privileges.length * 8 + 32;
  }
  return child.width;
}

function updateUsers() {
  const addUsers = difference(userList.value, sourceUsers);
  const cancelUsers = difference(sourceUsers, userList.value);
  return updateRoleWithUsers({
    roleName: currentRole.value,
    addUsers,
    cancelUsers,
  });
}

function updateAuth() {
  const pathPrivileges = authData.value.pathPrivileges.filter((item) => item.path);
  const cancelPathPrivileges: Array<{ path: string, privileges: string[] }> = [];
  const addPathPrivileges: Array<{ path: string, privileges: string[] }> = [];
  const initialPathKeys = intitalPathVals.value.map((data) => data.path) || [];
  const pathVals = pathPrivileges.map((data) => data.path) || [];
  const delArr = difference(initialPathKeys, pathVals);
  delArr.forEach((path) => {
    const findData = intitalPathVals.value.find((data) => data.path === path);
    if (findData) {
      cancelPathPrivileges.push({ ...findData });
    }
  });
  pathPrivileges.forEach((item) => {
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
    cancelPathPrivileges: cancelPathPrivileges.filter((item) => item.privileges.length > 0),
    addPathPrivileges: addPathPrivileges.filter((item) => item.privileges.length > 0),
  };
  return updateAuthByRole(data);
}

// 更新权限
function handleSave() {
  const pathPrivileges = authData.value.pathPrivileges.filter((item) => item.path);
  const flag = pathPrivileges.some((data) => !data.privileges.length);
  if (flag) {
    ElMessage.error('路径权限不允许为空，请选择权限后重新操作');
    return;
  }
  saveLoading.value = true;
  Promise.allSettled([
    updateUsers(),
    updateAuth(),
  ]).then((results) => {
    if (results.some((res) => res.status === 'rejected')) {
      pageType.value = 'edit';
      getDetail();
    } else {
      ElMessage.success('保存成功');
      pageType.value = 'view';
      getDetail();
    }
  }).finally(() => {
    saveLoading.value = false;
  });
}

// 关联用户
function handleAddUser() {
  userVisible.value = true;
}

// 删除关联用户
function handleDeleteUser(i: number) {
  ElMessageBox.confirm('是否删除该用户？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      userList.value.splice(i, 1);
    });
}

function addUserConfirm(vals: string[]) {
  userList.value = userList.value.concat(vals);
}

function showAuthDetail(user: string) {
  previewUser.value = user;
  previewVisible.value = true;
}

watch(
  () => currentRole.value,
  (val, old) => {
    if (val !== old) {
      pageType.value = 'view';
      authData.value.entityPrivileges = [];
      authData.value.pathPrivileges = [{ path: '', privileges: [] }];
      pathVisible.value = false;
      userVisible.value = false;
      userList.value = [];
      loading.value = true;
      saveLoading.value = false;
      if (val) {
        getDetail();
      } else {
        loading.value = false;
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
    display: flex;

    .tip-text {
      align-self: flex-end;
      margin: 0 0 0 12px;
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #808080;
      font-weight: 400;

      svg {
        color: #ccc;
        margin-right: 4px;
      }
    }
  }
}

.table-list-box{
  margin: 32px 16px 0;
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

.detail-user-list{
  margin: 18px 16px 32px;
  font-size: 14px;
  color: #131926;
  display: inline-flex;
  align-items: center;

  .el-tag{
    cursor: pointer;
  }

  .el-tag--info {
    background-color: #F7F8FC;
    color:#656A85;
    border: 0;
    border-radius: 2px;
    font-size: 12px;
    font-weight: 300;
  }

  .el-tag + .el-tag {
    margin: 0 0 0 8px;
  }
}
</style>
