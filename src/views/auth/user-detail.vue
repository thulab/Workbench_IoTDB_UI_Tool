<template>
  <el-container>
    <el-aside width="240px" class="list-wrapper">
      <list
        ref="listRef"
        :can-manage-user="canManageUser"
        :can-alter-pwd="canAlterPwd"
        :user-name="userName"
        @handle-select="val => currentUser = val"
      />
    </el-aside>
    <el-container class="details-wrapper">
      <el-main class="p-0" v-loading="loading || roleLoading">
        <el-scrollbar>
          <div class="detail-title-box" v-if="!isManager">
            <h4 class="detail-title-text">角色详情</h4>
            <el-button type="primary" v-if="canEdit && !isEdit" @click="pageType = 'edit'" id="auth-user-edit">编辑</el-button>
            <el-button type="primary" v-else-if="isEdit" @click="handleReset('view')" id="auth-user-view">退出编辑</el-button>
          </div>
          <div class="detail-role-list" v-if="!isManager">
            拥有角色：<el-tag :closable="isEdit" type="info" v-for="(item, index,) in authData.rolesToPrivileges" :key="item.roleName" @close="handleDeleteRole(index)" @click="showRoleDetail(item)" :id="`auth-user-role-${item.roleName}-${index}`">{{ item.roleName }}</el-tag>
            <auth-tooltip :is-disabled="canManageRole">
              <el-button link :disabled="!canManageRole" @click="addRole()" v-if="isEdit" id="auth-user-add-role">
                <el-icon size="24px" class="m-l-16"><i-custom-user-role-add /></el-icon>
              </el-button>
            </auth-tooltip>
          </div>
          <div class="detail-title-box">
            <h4 class="detail-title-text">权限详情</h4>
          </div>
          <div class="table-list-box m-x-16">
            <h4 class="table-box-title">全局</h4>
            <el-table :data="entityTableData" style="width: 100%">
              <el-table-column label="全选" align="center" width="60">
                <template #default="{ row }">
                  <el-icon v-if="!isEdit" class="moveDown3" size="21">
                    <i-custom-correct v-if="row.allChecked" />
                  </el-icon>
                  <template v-else>
                    <el-checkbox
                      v-if="row.privileges.length >= entityPrivilegesEnumKeys.length"
                      :checked="true"
                      :disabled="row.rolePrivileges.length >= entityPrivilegesEnumKeys.length"
                      @change="e=>handleAllCheckedEntity(row, false)"
                    />
                    <el-checkbox
                      v-else
                      :checked="false"
                      @change="e=>handleAllCheckedEntity(row, true)"
                    />
                  </template>
                </template>
              </el-table-column>
              <el-table-column :label="group.group" v-for="group in entityPrivilegesEnumGroup" :key="group.group" align="center">
                <el-table-column :label="child.privileges" v-for="child in group.children" :key="child.privileges" align="center" :width="calcColumnWidth(child)">
                  <template #default="{ row }">
                    <el-icon v-if="!isEdit" class="move-down3" size="21">
                      <i-custom-correct v-if="row.privileges.includes(child.privileges)" />
                    </el-icon>
                    <template v-else>
                      <el-tooltip
                        v-if="row.privileges.includes(child.privileges)"
                        placement="top-start"
                        effect="light"
                        trigger="hover"
                        content="该权限为角色所有，如需修改请修改角色权限"
                        :disabled="!row.rolePrivileges.includes(child.privileges)"
                        popper-class="tooltip-box-width"
                      >
                        <el-checkbox
                          :checked="true"
                          :disabled="row.rolePrivileges.includes(child.privileges)"
                          @change="handleCheckedEntity(row, child.privileges, false)" />
                      </el-tooltip>
                      <el-checkbox :checked="false" v-else @change="handleCheckedEntity(row, child.privileges, true)" />
                    </template>
                  </template>
                </el-table-column>
              </el-table-column>
            </el-table>
          </div>
          <div class="table-list-box  m-x-16 m-b-16" v-if="canEdit">
            <h4 class="table-box-title">路径</h4>
            <el-table :data="tableData" style="width: 100%" tooltip-effect="light" :tooltip-options="{ popperClass: 'table-tooltip-max-width' }">
              <el-table-column label="路径名称" align="center" width="193" prop="path" show-overflow-tooltip />
              <el-table-column label="全选" align="center" width="193">
                <template #default="{ row }">
                  <el-icon v-if="!isEdit || !row.path" class="moveDown3" size="21">
                    <i-custom-correct v-if="row.allChecked" />
                  </el-icon>
                  <template v-else>
                    <el-checkbox
                      v-if="row.privileges.length >= pathPrivilegesEnumKeys.length"
                      :checked="true"
                      :disabled="row.rolePrivileges.length >= pathPrivilegesEnumKeys.length"
                      @change="e=>handleAllCheckedPath(row, false)"
                    />
                    <el-checkbox
                      v-else
                      :checked="false"
                      @change="e=>handleAllCheckedPath(row, true)"
                    />
                  </template>
                </template>
              </el-table-column>
              <el-table-column v-for="(group, index) in pathPrivilegesEnumGroup" :label="group.group" :key="group.group + '_' + index + '_column'" align="center">
                <el-table-column v-for="(child, childIndex) in group.children" :label="child.privileges" :key="child.privileges + '_' + childIndex + '_col'" :prop="child.privileges" align="center" :width="calcColumnWidth(child)">
                  <template #default="{ row }">
                    <el-icon v-if="!isEdit || !row.path" class="move-down3" size="21">
                      <i-custom-correct v-if="row.privileges.includes(child.privileges)" />
                    </el-icon>
                    <template v-else>
                      <el-tooltip
                        v-if="row.privileges.includes(child.privileges)"
                        placement="top-start"
                        effect="light"
                        trigger="hover"
                        content="该权限为角色所有，如需修改请修改角色权限"
                        :disabled="!row.rolePrivileges.includes(child.privileges)"
                        popper-class="tooltip-box-width"
                      >
                        <el-checkbox
                          :checked="true"
                          :disabled="row.rolePrivileges.includes(child.privileges)"
                          @change="handleCheckedPath(row, child.privileges, false)" />
                      </el-tooltip>
                      <el-checkbox :checked="false" v-else @change="handleCheckedPath(row, child.privileges, true)" />
                    </template>
                  </template>
                </el-table-column>
              </el-table-column>
              <el-table-column label="操作" align="center">
                <template #default="{ row }">
                  <el-button link @click="handleDelRow(row)" v-if="row.path" :disabled="pageType === 'view' || row.rolePrivileges.length > 0">
                    <el-icon size="24"><i-custom-close /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button style="width: 100%;" class="m-t-24" @click="handleAddRow" v-if="canEdit && isEdit" id="auth-user-path"><i-custom-add class="m-r-4" />添加路径</el-button>
          </div>
        </el-scrollbar>
      </el-main>
      <el-footer v-if="canEdit && isEdit">
        <div class="operate-buttons">
          <el-button @click="handleReset('edit')" id="auth-user-reset">重置</el-button>
          <el-button type="primary" @click="handleSave" :loading="saveLoading" id="auth-user-save">应用</el-button>
        </div>
      </el-footer>
    </el-container>

    <modal-path
      v-model:visible="pathVisible"
      :path-list="editPathList"
      @handle-save="handleSavePath"
    />
    <modal-add-role v-model:visible="addRoleVisible" :selected="selectRoleList" @add-role="handleAddRole" />
    <modal-preview-role
      v-if="currentRole"
      v-model:visible="previewRoleVisible"
      :name="currentRole.roleName"
      :entity-privileges="currentRole.entityPrivileges || []"
      :path-privileges="currentRole.pathPrivileges || []" />
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores';
import { AuthApi } from '@/api';
import { cloneDeep, union, difference } from 'lodash-es';
import List from './components/user-list.vue';
import ModalPath from './components/modal-path.vue';
import ModalAddRole from './components/modal-add-role.vue';
import ModalPreviewRole from './components/modal-preview-role.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const userStore = useUserStore();
const {
  entityPrivilegesEnumGroup,
  entityPrivilegesEnumKeys,
  pathPrivilegesEnumGroup,
  pathPrivilegesEnumKeys,
  canManageUser,
  canManageRole,
  canAlterPwd,
} = storeToRefs(userStore);
const userName = computed(() => userStore.userInfo.name);

const listRef = ref<InstanceType<typeof List>>();
const currentUser = ref<Auth.DBUser>();
const pathVisible = ref(false);
const addRoleVisible = ref(false);
const previewRoleVisible = ref(false);
// const { maxTableHeight } = useTableHeight(540);
// const minHeight = computed(() => {
//   if (maxTableHeight.value < 300) {
//     return 300;
//   }
//   return maxTableHeight.value;
// });
const isManager = computed(() => currentUser.value?.isManager === 1);
const canEdit = computed(() => currentUser.value?.isManager === 0);
const pageType = ref<'view' | 'edit'>('view');
const isEdit = computed(() => pageType.value === 'edit');
const { requestFn: getUserAuth, data: authData, loading } = useRequest(AuthApi.getUserAuth, {
  initData: {
    userName: '',
    entityPrivileges: [],
    pathPrivileges: [],
    rolesToPrivileges: [],
  },
});
const selectRoleList = computed(() => authData.value.rolesToPrivileges.map((item) => item.roleName) || []);

const { requestFn: updateUserAuth, loading: saveLoading } = useRequest(AuthApi.updateUserAuth);

const currentRole = ref<Auth.AuthByRoleRes | undefined>(undefined);

const { requestFn: getRoleAuth, loading: roleLoading } = useRequest(AuthApi.getAuthByRole);

/**
 * 原数据，编辑前的数据
 */
const sourceData: {
  role: string[];
  entityPrivileges: string[];
  pathPrivileges: Array<{ path: string, privileges: string[] }>
} = {
  role: [],
  entityPrivileges: [],
  pathPrivileges: [],
};

const entityUserPrivileges = ref<string[]>([]);
const pathUserPrivileges = ref<{ path: string, privileges: string[] }[]>([]);

/**
 * 全局权限表格数据，包含用户和用户所有角色的权限
 */
const entityTableData = computed(() => {
  const result: Auth.UserEditAuthInfo = {
    userPrivileges: entityUserPrivileges.value,
    rolePrivileges: (authData.value.rolesToPrivileges || []).flatMap((item) => item.entityPrivileges),
    allChecked: false,
    privileges: [],
  };
  result.privileges = union(result.userPrivileges, result.rolePrivileges);
  if (result.privileges.length >= entityPrivilegesEnumKeys.value.length) {
    result.allChecked = true;
  }
  return [result];
});

/**
 * 将角色的路径权限合并到一起
 * @param data 合并完的结果
 * @param role 要合并的角色
 */
function mergeRolePathPrivileges(data: Array<{ path: string, privileges: string[] }>, role: Auth.AuthByRoleRes) {
  role.pathPrivileges.forEach((item) => {
    const path = data.find((pathItem) => pathItem.path === item.path);
    if (!path) {
      data.push({
        path: item.path,
        privileges: item.privileges,
      });
    } else {
      path.privileges = union(path.privileges, item.privileges);
    }
  });
}

/**
 * 角色路径权限，合并到一起。独立计算属性（计算属性有缓存，角色不变，这里就不变）
 */
const rolePathPrivileges = computed(() => {
  const result: Array<{ path: string, privileges: string[] }> = [];
  authData.value.rolesToPrivileges?.forEach((role) => {
    mergeRolePathPrivileges(result, role);
  });
  return result;
});
function joinRolePathPrivileges(data: Auth.UserEditPathAuthInfo[], rolePathAuth: { path: string, privileges: string[] }) {
  const path = data.find((pathItem) => pathItem.path === rolePathAuth.path);
  if (path) {
  //   data.push({
  //     path: rolePathAuth.path,
  //     userSourceData: {
  //       path: rolePathAuth.path,
  //       privileges: [],
  //     },
  //     allChecked: rolePathAuth.privileges.length >= pathPrivilegesEnumKeys.value.length,
  //     rolePrivileges: rolePathAuth.privileges,
  //     privileges: rolePathAuth.privileges,
  //   });
  // } else {
    path.rolePrivileges = union(path.rolePrivileges, rolePathAuth.privileges);
    path.privileges = union(path.userSourceData?.privileges || [], path.rolePrivileges);
    if (path.privileges.length >= pathPrivilegesEnumKeys.value.length) {
      path.allChecked = true;
    }
  }
}
/**
 * 路径权限表格数据，没有数据时，添加一行空数据
 */
const tableData = computed<Auth.UserEditPathAuthInfo[]>(() => {
  const result = pathUserPrivileges.value.map((item) => ({
    path: item.path,
    userSourceData: item,
    rolePrivileges: [],
    allChecked: item.privileges.length >= pathPrivilegesEnumKeys.value.length,
    privileges: union(item.privileges, []),
  } as Auth.UserEditPathAuthInfo));
  rolePathPrivileges.value?.forEach((item) => {
    joinRolePathPrivileges(result, item);
  });
  if (result.length === 0) {
    result.push({
      path: '',
      userSourceData: {
        path: '',
        privileges: [],
      },
      rolePrivileges: [],
      allChecked: false,
      privileges: [],
    });
  }
  return result;
});

const editPathList = computed(() => tableData.value.map((item) => item.path!).filter((item) => item));
function handleAllCheckedEntity(row: Auth.UserEditAuthInfo, value: boolean) {
  if (value) {
    // 赋予其 除角色权限外的所有权限
    entityUserPrivileges.value = difference(entityPrivilegesEnumKeys.value, row.rolePrivileges);
  } else {
    entityUserPrivileges.value = [];
  }
}
function handleCheckedEntity(row: Auth.UserEditAuthInfo, privilege: string, checked: boolean) {
  if (checked) {
    row.userPrivileges.push(privilege);
  } else {
    row.userPrivileges.splice(row.userPrivileges.indexOf(privilege), 1);
  }
}

function handleAllCheckedPath(row: Auth.UserEditPathAuthInfo, value: boolean) {
  if (value) {
    // 赋予其 除角色权限外的所有权限
    console.log(difference(pathPrivilegesEnumKeys.value, row.rolePrivileges));
    row.userSourceData.privileges = difference(pathPrivilegesEnumKeys.value, row.rolePrivileges);
  } else {
    row.userSourceData.privileges = [];
  }
}
function handleCheckedPath(row: Auth.UserEditPathAuthInfo, privilege: string, checked: boolean) {
  if (checked) {
    row.userSourceData.privileges.push(privilege);
  } else {
    row.userSourceData.privileges.splice(row.userSourceData.privileges.indexOf(privilege), 1);
  }
}
function handleAddRow() {
  pathVisible.value = true;
}
// 保存路径
function handleSavePath(path: string) {
  authData.value.pathPrivileges.push({ path, privileges: [] });
}
function handleDelRow(row: Auth.UserEditPathAuthInfo) {
  const index = pathUserPrivileges.value.findIndex((item) => (item.path === row.path));
  pathUserPrivileges.value.splice(index, 1);
}

function getDetail() {
  if (currentUser.value) {
    getUserAuth(currentUser.value.name).then(() => {
      sourceData.role = authData.value.rolesToPrivileges?.map((item) => item.roleName) || [];
      sourceData.entityPrivileges = cloneDeep(authData.value.entityPrivileges || []);
      sourceData.pathPrivileges = cloneDeep(authData.value.pathPrivileges || []);
      entityUserPrivileges.value = authData.value.entityPrivileges || [];
      const rolePaths = rolePathPrivileges.value.map((item) => item.path);
      const userPrivileges = authData.value.pathPrivileges || [];
      difference(rolePaths, userPrivileges.map((item) => item.path)).forEach((path) => {
        userPrivileges.push({ path, privileges: [] });
      });
      pathUserPrivileges.value = userPrivileges;
    });
  }
}
function addRole() {
  addRoleVisible.value = true;
}
function handleAddRole(roleNames: string[]) {
  addRoleVisible.value = false;
  roleNames.forEach((roleName) => {
    getRoleAuth(roleName).then((res) => {
      const rolePaths = res.data.pathPrivileges.map((item) => item.path);
      difference(rolePaths, pathUserPrivileges.value.map((item) => item.path)).forEach((path) => {
        pathUserPrivileges.value.push({ path, privileges: [] });
      });
      authData.value.rolesToPrivileges.push(res.data);
    });
  });
}
function handleDeleteRole(index: number) {
  ElMessageBox.confirm('是否删除该角色？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      authData.value.rolesToPrivileges.splice(index, 1);
    });
}
function showRoleDetail(role: Auth.AuthByRoleRes) {
  currentRole.value = role;
  previewRoleVisible.value = true;
}

// 重置
function handleReset(type:'view' | 'edit') {
  pageType.value = type;
  getDetail();
}

function calcColumnWidth(child: Auth.PrivilegeEnum) {
  if (child.privileges.length > 0) {
    return child.privileges.length * 8 + 32;
  }
  return child.width;
}

// 更新权限
function handleSave() {
  const flag = tableData.value.filter((item) => item.path).some((data) => (!data.privileges.length));
  if (flag) {
    ElMessage.error('路径权限不允许为空，请选择权限后重新操作');
    return;
  }
  const currentRoleNames = authData.value.rolesToPrivileges.map((item) => item.roleName);
  const addRoles = difference(currentRoleNames, sourceData.role);
  const cancelRoles = difference(sourceData.role, currentRoleNames);

  const cancelPathPrivileges: Array<{ path: string, privileges: string[] }> = [];
  const addPathPrivileges: Array<{ path: string, privileges: string[] }> = [];

  const sourcePaths = sourceData.pathPrivileges.map((data) => data.path) || [];
  const currentPaths = pathUserPrivileges.value.map((data) => data.path) || [];
  const delArr = difference(sourcePaths, currentPaths);
  delArr.forEach((path) => {
    const findData = sourceData.pathPrivileges.find((data) => data.path === path);
    if (findData) {
      cancelPathPrivileges.push({ ...findData });
    }
  });

  pathUserPrivileges.value.forEach((item) => {
    const sourcePrivileges = sourceData.pathPrivileges.find((data) => data.path === item.path);
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

  const addEntityPrivileges = difference(entityUserPrivileges.value, sourceData.entityPrivileges);
  const cancelEntityPrivileges = difference(sourceData.entityPrivileges, entityUserPrivileges.value);

  const data = {
    userName: currentUser.value!.name,
    addRoles,
    cancelRoles,
    cancelEntityPrivileges,
    addEntityPrivileges,
    cancelPathPrivileges: cancelPathPrivileges.filter((item) => item.privileges.length > 0),
    addPathPrivileges: addPathPrivileges.filter((item) => item.privileges.length > 0),
  };
  updateUserAuth(data).then(() => {
    ElMessage.success('保存成功');
    pageType.value = 'view';
    if (userName.value === currentUser.value?.name) {
      userStore.loadPrivileges(true);
    }
    getDetail();
  }).catch(() => {
    pageType.value = 'edit';
    getDetail();
  });
}

watch(
  () => currentUser.value,
  (val, old) => {
    if (val !== old) {
      if (val) {
        pageType.value = 'view';
        getDetail();
      }
    }
  },
  {
    immediate: true,
  },
);
</script>

<style lang="scss" scoped>
.list-wrapper{
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
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

.detail-role-list{
  margin: 12px 16px;
  height: 28px;
  display: inline-flex;
  font-size: 14px;
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

.details-wrapper{
  margin-left: 16px;
  background-color: #fff;
  border-radius: 6px;

  :deep(.el-table th.el-table__cell) {
    background-color: #fff !important;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #424561;
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
}

.move-down3{
  transform: translateY(3px);
}

.operate-buttons{
  text-align: right;
  margin-top: 24px;
}
</style>
