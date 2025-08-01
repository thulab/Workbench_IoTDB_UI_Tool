<template>
  <version-container :is-show="showAuthMenu">
    <el-container>
      <el-aside width="240px" class="list-wrapper">
        <list ref="listRef" :can-manage-user="canManageUser" :user-name="userName" @handle-select="(val) => (currentUser = val)" />
      </el-aside>
      <el-container class="details-wrapper">
        <el-main class="p-0" v-loading="loading || roleLoading">
          <el-scrollbar>
            <div class="detail-title-box" v-if="!isManager">
              <h4 class="detail-title-text">{{ t('auth.roleDetail') }}</h4>
              <auth-tooltip :is-disabled="canManageUser" :content="'common.userAuth'" v-if="canEdit && !isEdit">
                <el-button type="primary" :disabled="!canManageUser" @click="pageType = 'edit'" id="auth-user-edit">{{ t('common.edit') }}</el-button>
              </auth-tooltip>
              <el-button type="primary" v-else-if="isEdit" @click="handleReset('view')" id="auth-user-view">{{ t('common.exitEdit') }}</el-button>
            </div>
            <div class="detail-role-list" v-if="!isManager">
              <span class="p-t-4">{{ t('auth.havingRole') }}：</span>
              <div class="detail-role-box">
                <el-tag
                  :closable="isEdit"
                  type="info"
                  v-for="(item, index) in authData.rolesToPrivileges"
                  :key="item.roleName"
                  @close="handleDeleteRole(index)"
                  @click="showRoleDetail(item)"
                  :id="`auth-user-role-${item.roleName}-${index}`"
                >
                  {{ item.roleName }}
                </el-tag>
                <auth-tooltip :is-disabled="canManageRole" :content="'common.roleAuth'">
                  <el-button link :disabled="!canManageRole" @click="addRole()" v-if="isEdit" id="auth-user-add-role" :class="['m-l-8', 'p-0', !canManageRole ? '' : 'svg-button-hover-color']">
                    <el-icon size="24px"><i-custom-user-role-add /></el-icon>
                  </el-button>
                </auth-tooltip>
              </div>
            </div>
            <div class="detail-title-box">
              <h4 class="detail-title-text">
                {{ t('auth.detail') }}
                <span class="tip-text">
                  <i-custom-info-warning />
                  {{ t('auth.removeAuthTip') }}
                </span>
              </h4>
            </div>
            <div class="table-list-box m-x-16">
              <div class="flex-justify-between">
                <h4 class="table-box-title">{{ t('common.allSituation') }}</h4>
                <div class="header-operate-buttons">
                  <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('auth.docTip')" popper-class="tooltip-box-width">
                    <el-button link class="m-r-4" style="margin-top: -4px" @click="handleDoc" id="user-doc">
                      <el-icon size="24"><i-custom-model-doc /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
              <el-table :data="entityTableData" style="width: 100%">
                <el-table-column :label="t('common.allChoose')" align="center" width="60">
                  <template #default="{ row }">
                    <el-icon v-if="!isEdit" class="moveDown3" size="21">
                      <i-custom-correct v-if="row.allChecked" />
                    </el-icon>
                    <template v-else>
                      <el-checkbox
                        v-if="row.privileges.length >= entityPrivilegesEnumKeys.length"
                        :checked="true"
                        :disabled="row.rolePrivileges.length >= entityPrivilegesEnumKeys.length"
                        @change="(e) => handleAllCheckedEntity(row, false)"
                        id="user-auth-entity-all"
                      />
                      <el-checkbox v-else :checked="false" @change="(e) => handleAllCheckedEntity(row, true)" id="user-auth-entity-all" />
                    </template>
                  </template>
                </el-table-column>
                <el-table-column :label="group.group" v-for="group in entityPrivilegesEnumGroup" :key="group.group" align="center">
                  <el-table-column :label="child.desc" v-for="child in group.children" :key="child.privileges" align="center" :width="calcColumnWidth(child)">
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
                            :id="`user-auth-entity-${child.privileges}`"
                            :disabled="row.rolePrivileges.includes(child.privileges)"
                            @change="handleCheckedEntity(row, child.privileges, false)"
                          />
                        </el-tooltip>
                        <el-checkbox :checked="false" v-else @change="handleCheckedEntity(row, child.privileges, true)" :id="`user-auth-entity-${child.privileges}`" />
                      </template>
                    </template>
                  </el-table-column>
                </el-table-column>
              </el-table>
            </div>
            <div class="table-list-box m-x-16 m-b-16" v-if="canEdit">
              <div class="flex-justify-between">
                <h4 class="table-box-title">{{ t('auth.path') }}</h4>
                <div class="header-operate-buttons">
                  <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('auth.docTip')" popper-class="tooltip-box-width">
                    <el-button link class="m-r-4" style="margin-top: -4px" @click="handleDoc" id="user-path-doc">
                      <el-icon size="24"><i-custom-model-doc /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
              <el-table :data="tableData" style="width: 100%" tooltip-effect="light" :tooltip-options="{ popperClass: 'table-tooltip-max-width' }">
                <el-table-column :label="t('auth.pathName')" align="center" min-width="193" prop="path" show-overflow-tooltip />
                <el-table-column :label="t('common.allChoose')" align="center" width="60">
                  <template #default="{ row, $index }">
                    <el-icon v-if="!isEdit || !row.path" class="moveDown3" size="21">
                      <i-custom-correct v-if="row.allChecked" />
                    </el-icon>
                    <template v-else>
                      <el-checkbox
                        v-if="row.privileges.length >= pathPrivilegesEnumKeys.length"
                        :checked="true"
                        :disabled="row.rolePrivileges.length >= pathPrivilegesEnumKeys.length"
                        :id="`user-auth-path-all-${$index}`"
                        @change="(e) => handleAllCheckedPath(row, false)"
                      />
                      <el-checkbox v-else :checked="false" :id="`user-auth-path-all-${$index}`" @change="(e) => handleAllCheckedPath(row, true)" />
                    </template>
                  </template>
                </el-table-column>
                <el-table-column v-for="(group, index) in pathPrivilegesEnumGroup" :label="group.group" :key="`${group.group}_${index}_column`" align="center">
                  <el-table-column
                    v-for="(child, childIndex) in group.children"
                    :label="child.desc"
                    :key="`${child.privileges}_${childIndex}_col`"
                    :prop="child.privileges"
                    align="center"
                    :width="calcColumnWidth(child)"
                  >
                    <template #default="{ row, $index }">
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
                            :id="`user-auth-path-${child.privileges}-${$index}`"
                            @change="handleCheckedPath(row, child.privileges, false)"
                          />
                        </el-tooltip>
                        <el-checkbox :checked="false" v-else @change="handleCheckedPath(row, child.privileges, true)" :id="`user-auth-path-${child.privileges}-${$index}`" />
                      </template>
                    </template>
                  </el-table-column>
                </el-table-column>
                <el-table-column :label="t('common.operation')" align="center" width="80" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      link
                      @click="handleDelRow(row)"
                      v-if="row.path"
                      :disabled="pageType === 'view' || row.rolePrivileges.length > 0"
                      :class="pageType === 'view' || row.rolePrivileges.length > 0 ? '' : 'svg-button-hover-color'"
                    >
                      <el-icon size="24"><i-custom-close /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button style="width: 100%" class="m-t-24 svg-button-hover-color" @click="handleAddRow" v-if="canEdit && isEdit" id="auth-user-path">
                <i-custom-add class="m-r-4" />
                {{ t('auth.addPath') }}
              </el-button>
            </div>
          </el-scrollbar>
        </el-main>
        <el-footer v-if="canEdit && isEdit">
          <div class="operate-buttons">
            <el-button @click="handleReset('edit')" id="auth-user-reset">{{ t('common.reset') }}</el-button>
            <el-button type="primary" @click="handleSave" :loading="saveLoading" id="auth-user-save">{{ t('common.apply') }}</el-button>
          </div>
        </el-footer>
      </el-container>

      <modal-path v-model:visible="pathVisible" :path-list="editPathList" @handle-save="handleSavePath" />
      <modal-add-role v-model:visible="addRoleVisible" :selected="selectRoleList" @add-role="handleAddRole" />
      <modal-preview-role
        v-if="currentRole"
        v-model:visible="previewRoleVisible"
        :name="currentRole.roleName"
        :entity-privileges="currentRole.entityPrivileges || []"
        :path-privileges="currentRole.pathPrivileges || []"
      />
    </el-container>
  </version-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore, useConnectionStore } from '@/stores';
import { AuthApi } from '@/api';
import { iotdbShowAuth } from '@/utils/auth';
import { cloneDeep, union, difference } from 'lodash-es';
import List from './components/user-list.vue';
import ModalPath from './components/modal-path.vue';
import ModalAddRole from './components/modal-add-role.vue';
import ModalPreviewRole from './components/modal-preview-role.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import type { DBUser, AuthByRoleRes, UserEditPathAuthInfo, UserEditAuthInfo, PrivilegeEnum } from '@/types';

const { t, locale } = useI18n();
const connectionStore = useConnectionStore();
const userStore = useUserStore();
const { entityPrivilegesEnumGroup, entityPrivilegesEnumKeys, pathPrivilegesEnumGroup, pathPrivilegesEnumKeys, canManageUser, canManageRole } = storeToRefs(userStore);
const userName = computed(() => userStore.userInfo.name);

const listRef = ref<InstanceType<typeof List>>();
const currentUser = ref<DBUser>();
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

const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion));

const {
  requestFn: getUserAuth,
  data: authData,
  loading,
} = useRequest(AuthApi.getUserAuth, {
  initData: {
    userName: '',
    entityPrivileges: [],
    pathPrivileges: [],
    rolesToPrivileges: [],
  },
});
const selectRoleList = computed(() => authData.value?.rolesToPrivileges?.map((item) => item.roleName) || []);

const { requestFn: updateUserAuth, loading: saveLoading } = useRequest(AuthApi.updateUserAuth);

const currentRole = ref<AuthByRoleRes | undefined>(undefined);

const { requestFn: getRoleAuth, loading: roleLoading } = useRequest(AuthApi.getAuthByRole);

/**
 * 原数据，编辑前的数据
 */
const sourceData: {
  role: string[];
  entityPrivileges: string[];
  pathPrivileges: Array<{ path: string; privileges: string[] }>;
} = {
  role: [],
  entityPrivileges: [],
  pathPrivileges: [],
};

const entityUserPrivileges = ref<string[]>([]);
const pathUserPrivileges = ref<{ path: string; privileges: string[] }[]>([]);

/**
 * 全局权限表格数据，包含用户和用户所有角色的权限
 */
const entityTableData = computed(() => {
  const result: UserEditAuthInfo = {
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
function mergeRolePathPrivileges(data: Array<{ path: string; privileges: string[] }>, role: AuthByRoleRes) {
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
  const result: Array<{ path: string; privileges: string[] }> = [];
  authData.value.rolesToPrivileges?.forEach((role) => {
    mergeRolePathPrivileges(result, role);
  });
  return result;
});
function joinRolePathPrivileges(data: UserEditPathAuthInfo[], rolePathAuth: { path: string; privileges: string[] }) {
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
const tableData = computed<UserEditPathAuthInfo[]>(() => {
  const result = pathUserPrivileges.value.map(
    (item) =>
      ({
        path: item.path,
        userSourceData: item,
        rolePrivileges: [],
        allChecked: item.privileges.length >= pathPrivilegesEnumKeys.value.length,
        privileges: union(item.privileges, []),
      }) as UserEditPathAuthInfo,
  );
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

const editPathList = computed(() => tableData.value.map((item) => item.path).filter((item) => item));
function handleAllCheckedEntity(row: UserEditAuthInfo, value: boolean) {
  if (value) {
    // 赋予其 除角色权限外的所有权限
    entityUserPrivileges.value = difference(entityPrivilegesEnumKeys.value, row.rolePrivileges);
  } else {
    entityUserPrivileges.value = [];
  }
}
function handleCheckedEntity(row: UserEditAuthInfo, privilege: string, checked: boolean) {
  if (checked) {
    row.userPrivileges.push(privilege);
  } else {
    row.userPrivileges.splice(row.userPrivileges.indexOf(privilege), 1);
  }
}

function handleAllCheckedPath(row: UserEditPathAuthInfo, value: boolean) {
  if (value) {
    // 赋予其 除角色权限外的所有权限
    row.userSourceData.privileges = difference(pathPrivilegesEnumKeys.value, row.rolePrivileges);
  } else {
    row.userSourceData.privileges = [];
  }
}
function handleCheckedPath(row: UserEditPathAuthInfo, privilege: string, checked: boolean) {
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
function handleDelRow(row: UserEditPathAuthInfo) {
  const index = pathUserPrivileges.value.findIndex((item) => item.path === row.path);
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
      difference(
        rolePaths,
        userPrivileges.map((item) => item.path),
      ).forEach((path) => {
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
      difference(
        rolePaths,
        pathUserPrivileges.value.map((item) => item.path),
      ).forEach((path) => {
        pathUserPrivileges.value.push({ path, privileges: [] });
      });
      authData.value.rolesToPrivileges.push(res.data);
    });
  });
}
function handleDeleteRole(index: number) {
  ElMessageBox.confirm(t('auth.deleteRole'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-role-confirm',
    cancelButtonClass: 'del-role-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    authData.value.rolesToPrivileges.splice(index, 1);
  });
}
function showRoleDetail(role: AuthByRoleRes) {
  currentRole.value = role;
  previewRoleVisible.value = true;
}

// 重置
function handleReset(type: 'view' | 'edit') {
  pageType.value = type;
  getDetail();
}

function calcColumnWidth(child: PrivilegeEnum) {
  if (child.desc.length > 0) {
    if (locale.value === 'en') {
      return child.desc.length * 8 + 8;
    }
    return child.desc !== '运维' ? child.desc.length * 12 + 24 : child.desc.length * 16 * 2;
  }
  return child.width;
}

// 更新权限
function handleSave() {
  const flag = tableData.value.filter((item) => item.path).some((data) => !data.privileges.length);
  if (flag) {
    ElMessage.error({ message: t('auth.pathEmptyTip'), grouping: true });
    return;
  }
  const currentRoleNames = authData.value.rolesToPrivileges.map((item) => item.roleName);
  const addRoles = difference(currentRoleNames, sourceData.role);
  const cancelRoles = difference(sourceData.role, currentRoleNames);

  const cancelPathPrivileges: Array<{ path: string; privileges: string[] }> = [];
  const addPathPrivileges: Array<{ path: string; privileges: string[] }> = [];

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
  updateUserAuth(data)
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      pageType.value = 'view';
      if (userName.value === currentUser.value?.name) {
        userStore.loadPrivileges(true);
      }
      getDetail();
    })
    .catch(() => {
      pageType.value = 'edit';
      getDetail();
    });
}
function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://www.timecho.com/docs/UserGuide/latest/User-Manual/Authority-Management.html');
  } else {
    window.open('https://www.timecho.com/docs/zh/UserGuide/latest/User-Manual/Authority-Management.html');
  }
}

watch(
  () => currentUser.value,
  (val, old) => {
    if (val !== old) {
      if (val) {
        pageType.value = 'view';
        entityUserPrivileges.value = [];
        pathUserPrivileges.value = [{ path: '', privileges: [] }];
        sourceData.role = [];
        sourceData.entityPrivileges = [];
        sourceData.pathPrivileges = [];
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
.list-wrapper {
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.detail-title-box {
  height: 48px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dfe1ed;
  padding: 0 16px;
  box-sizing: border-box;

  .detail-title-text {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
    display: flex;

    .tip-text {
      align-self: flex-end;
      margin: 0 0 0 12px;
      display: flex;
      font-size: 12px;
      color: #808080;
      font-weight: 400;

      svg {
        color: #ccc;
        margin: 2px 4px 0 0;
      }
    }
  }
}

.detail-role-list {
  margin: 12px 16px;
  display: flex;
  font-size: 14px;

  .el-tag {
    cursor: pointer;
    margin: 0 8px 8px 0;
  }

  .detail-role-box {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
  }

  .el-tag--info {
    background-color: #f7f8fc;
    color: #656a85;
    border: 0;
    border-radius: 2px;
    font-size: 12px;
    font-weight: 300;
  }
}

.details-wrapper {
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

.table-list-box {
  margin-top: 32px;
  background-color: #f7f8fc;
  padding: 8px 16px 16px;

  .table-box-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
    margin-bottom: 8px;
  }

  :deep(.el-table .cell) {
    padding: 0 !important;
  }
}

.move-down3 {
  transform: translateY(3px);
}

.operate-buttons {
  text-align: right;
  margin-top: 24px;
}
</style>
