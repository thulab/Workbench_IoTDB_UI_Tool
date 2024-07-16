<template>
  <version-container :is-show="showAuthMenu">
    <el-container>
      <el-aside width="240px" class="role-list-wrapper">
        <role-list :can-manage-role="canManageRole" @handleSelect="(val) => (currentRole = val)" />
      </el-aside>
      <el-container class="role-details-wrapper">
        <el-main class="p-0" v-loading="loading">
          <el-scrollbar>
            <div class="detail-title-box">
              <h4 class="detail-title-text">{{ t('auth.userDetail') }}</h4>
              <auth-tooltip v-if="isView" :is-disabled="canManageRole" :content="'common.roleAuth'">
                <el-button type="primary" :disabled="!currentRole || !canManageRole" @click="pageType = 'edit'" id="auth-role-edit">{{ t('common.edit') }}</el-button>
              </auth-tooltip>
              <el-button type="primary" v-else @click="handleReset('view')" id="auth-role-view">{{ t('common.exitEdit') }}</el-button>
            </div>
            <div class="detail-user-list">
              <span class="p-t-4">{{ t('auth.havingUser') }}：</span>
              <div class="detail-user-box">
                <el-tag :closable="!isView" type="info" v-for="(item, index) in userList" :key="item" @close="handleDeleteUser(index)" @click="showAuthDetail(item)" :id="`auth-user-${item}-${index}`">
                  {{ item }}
                </el-tag>
                <auth-tooltip :is-disabled="canManageUser" :content="'common.userAuth'">
                  <el-button link :disabled="!canManageUser" @click="handleAddUser" v-if="!isView" id="auth-user-add-role" :class="['m-l-8', 'p-0', !canManageUser ? '' : 'svg-button-hover-color']">
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
            <div class="table-list-box">
              <h4 class="table-box-title">{{ t('common.allSituation') }}</h4>
              <el-table :data="[authData.entityPrivileges]" style="width: 100%" border>
                <el-table-column :label="t('common.allChoose')" align="center" width="90" fixed="left">
                  <template #default="{ row }">
                    <el-icon v-if="isView" size="21">
                      <i-custom-correct style="transform: translateY(3px)" v-if="row.length >= entityPrivilegesEnumKeys.length" />
                    </el-icon>
                    <template v-else>
                      <el-checkbox :checked="true" v-if="row.length >= entityPrivilegesEnumKeys.length" @change="(val) => handleCheckedEntity(val)" id="role-auth-entity-all" />
                      <el-checkbox :checked="false" v-else @change="(val) => handleCheckedEntity(val)" id="role-auth-entity-all" />
                    </template>
                  </template>
                </el-table-column>
                <el-table-column v-for="(column, index) in entityPrivilegesEnumGroup" :label="column.group" :key="`${column.group}_${index}_column`" align="center">
                  <el-table-column v-for="(col, ci) in column.children" :label="col.desc" :key="`${col.privileges}_${ci}_col`" :prop="col.privileges" align="center" :width="calcColumnWidth(col)">
                    <template #default="{ row }">
                      <el-icon v-if="isView" size="21">
                        <i-custom-correct style="transform: translateY(3px)" v-if="row.includes(col.privileges)" />
                      </el-icon>
                      <template v-else>
                        <el-checkbox :checked="true" v-if="row.includes(col.privileges)" @change="(val) => handleCheckedEntity(val, col.privileges)" :id="`role-auth-entity-${col.privileges}`" />
                        <el-checkbox :checked="false" v-else @change="(val) => handleCheckedEntity(val, col.privileges)" :id="`role-auth-entity-${col.privileges}`" />
                      </template>
                    </template>
                  </el-table-column>
                </el-table-column>
              </el-table>
            </div>
            <div class="table-list-box">
              <h4 class="table-box-title">{{ t('auth.path') }}</h4>
              <el-table :data="authData.pathPrivileges" style="width: 100%" tooltip-effect="light" border :tooltip-options="{ popperClass: 'table-tooltip-max-width' }">
                <el-table-column :label="t('auth.pathName')" prop="path" align="center" min-width="193" show-overflow-tooltip />
                <el-table-column :label="t('common.allChoose')" align="center" width="193">
                  <template #default="{ row, $index }">
                    <el-icon v-if="isView || !row.path" size="21">
                      <i-custom-correct style="transform: translateY(3px)" v-if="row.privileges.length >= pathPrivilegesEnumKeys.length" />
                    </el-icon>
                    <template v-else-if="row.path">
                      <!-- eslint-disable-next-line vue/max-len -->
                      <el-checkbox
                        :checked="true"
                        v-if="row.privileges.length >= pathPrivilegesEnumKeys.length"
                        @change="(val) => handleCheckedPath(val, $index)"
                        :id="`role-auth-path-all-${$index}`"
                      />
                      <el-checkbox :checked="false" v-else @change="(val) => handleCheckedPath(val, $index)" :id="`role-auth-path-all-${$index}`" />
                    </template>
                  </template>
                </el-table-column>
                <el-table-column v-for="(column, index) in pathPrivilegesEnumGroup" :label="column.group" :key="`${column.group}_${index}_column`" align="center">
                  <el-table-column v-for="(col, ci) in column.children" :label="col.desc" :key="`${col.privileges}_${ci}_col`" :prop="col.privileges" align="center" :width="calcColumnWidth(col)">
                    <template #default="{ row, $index }">
                      <el-icon v-if="isView" size="21">
                        <i-custom-correct style="transform: translateY(3px)" v-if="row.privileges.includes(col.privileges)" />
                      </el-icon>
                      <template v-else-if="row.path">
                        <el-checkbox
                          :checked="true"
                          v-if="row.privileges.includes(col.privileges)"
                          @change="(val) => handleCheckedPath(val, $index, col.privileges)"
                          :id="`role-auth-path-${col.privileges}-${$index}`"
                        />
                        <el-checkbox :checked="false" v-else @change="(val) => handleCheckedPath(val, $index, col.privileges)" :id="`role-auth-path-${col.privileges}-${$index}`" />
                      </template>
                    </template>
                  </el-table-column>
                </el-table-column>
                <el-table-column :label="t('common.operation')" align="center" width="194" fixed="right">
                  <template #default="{ row, $index }">
                    <el-button v-if="row.path" link @click="handleDelRow($index)" :disabled="isView" :class="isView ? '' : 'svg-button-hover-color'">
                      <el-icon size="21"><i-custom-close /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-button v-if="!isView" style="width: 100%" class="m-t-24 svg-button-hover-color" @click="handleAddRow" id="auth-role-path">
                <i-custom-add class="m-r-4" />
                {{ t('auth.addPath') }}
              </el-button>
            </div>
          </el-scrollbar>
        </el-main>

        <el-footer v-if="!isView">
          <div class="operate-buttons">
            <el-button @click="handleReset('edit')" id="auth-role-reset">{{ t('common.reset') }}</el-button>
            <el-button type="primary" @click="handleSave" :loading="saveLoading" id="auth-role-save">{{ t('common.apply') }}</el-button>
          </div>
        </el-footer>
      </el-container>

      <modal-path v-model:visible="pathVisible" :path-list="editPathList" @handleSave="handleSavePath" />

      <modal-add-user v-model:visible="userVisible" :selected="userList" @add-user="addUserConfirm" />

      <modal-preview-user v-model:visible="previewVisible" :name="previewUser" />
    </el-container>
  </version-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { cloneDeep, difference } from 'lodash-es';
import type { CheckboxValueType } from 'element-plus';
import { useUserStore, useConnectionStore } from '@/stores';
import { AuthApi } from '@/api';
import { iotdbShowAuth } from '@/utils/auth';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import RoleList from './components/role-list.vue';
import ModalPath from './components/modal-path.vue';
import ModalAddUser from './components/modal-add-user.vue';
import ModalPreviewUser from './components/modal-preview-user.vue';

const { t, locale } = useI18n();
const currentRole = ref('');
const pathVisible = ref(false);
const editPathList = ref<string[]>([]);
const intitalEntityVals = ref<string[]>([]);
const intitalPathVals = ref<Array<{ path: string; privileges: string[] }>>([]);
const pageType = ref<'edit' | 'view'>('view');
const userList = ref<string[]>([]);
let sourceUsers: string[] = [];
const userVisible = ref(false);
const previewVisible = ref(false);
const previewUser = ref('');
const loading = ref(true);
const saveLoading = ref(false);
const isView = computed(() => pageType.value === 'view');

const connectionStore = useConnectionStore();
const userStore = useUserStore();
const { entityPrivilegesEnumGroup, entityPrivilegesEnumKeys, pathPrivilegesEnumGroup, pathPrivilegesEnumKeys, canManageUser, canManageRole } = storeToRefs(userStore);

const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion));

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
  if (!canManageUser.value) return [];
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
  Promise.allSettled([getRoleUserList(), getRoleAuth()]).finally(() => {
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
function handleCheckedEntity(val: CheckboxValueType, auth?: string) {
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
function handleCheckedPath(val: CheckboxValueType, index: number, auth?: string) {
  if (!auth) {
    authData.value.pathPrivileges.splice(index, 1, { path: authData.value.pathPrivileges[index].path, privileges: val ? [...pathPrivilegesEnumKeys.value] : [] });
  } else {
    const data: { path: string; privileges: string[] } = { ...authData.value.pathPrivileges[index] };
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
  if (child.desc.length > 0) {
    if (locale.value === 'en') {
      return child.desc.length * 8 + 64;
    }
    return child.desc.length * 16 + 64;
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
  const cancelPathPrivileges: Array<{ path: string; privileges: string[] }> = [];
  const addPathPrivileges: Array<{ path: string; privileges: string[] }> = [];
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
    ElMessage.error({ message: t('auth.pathEmptyTip'), grouping: true });
    return;
  }
  saveLoading.value = true;
  Promise.allSettled([updateUsers(), updateAuth()])
    .then((results) => {
      if (results.some((res) => res.status === 'rejected')) {
        pageType.value = 'edit';
        getDetail();
      } else {
        ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
        pageType.value = 'view';
        getDetail();
      }
    })
    .finally(() => {
      saveLoading.value = false;
    });
}

// 关联用户
function handleAddUser() {
  userVisible.value = true;
}

// 删除关联用户
function handleDeleteUser(i: number) {
  ElMessageBox.confirm(t('auth.deleteUser'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-user-confirm',
    cancelButtonClass: 'del-user-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
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
  }
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

.role-list-wrapper {
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.role-details-wrapper {
  margin-left: 16px;
  background-color: #fff;
  border-radius: 6px;
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

.table-list-box {
  margin: 32px 16px 0;
  background-color: #f7f8fc;
  padding: 8px 16px 16px;

  .table-box-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
    margin-bottom: 8px;
  }

  :deep(.el-table) {
    --el-table-border: 1px solid #dfe1ed;
    --el-table-border-color: #dfe1ed;
  }

  :deep(.el-table th.el-table__cell) {
    background-color: #fff !important;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #424561;
  }
}

.operate-buttons {
  text-align: right;
  margin-top: 24px;
}

.detail-user-list {
  margin: 18px 16px 32px;
  font-size: 14px;
  color: #131926;
  display: flex;

  .el-tag {
    cursor: pointer;
    margin: 0 8px 8px 0;
  }

  .detail-user-box {
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
</style>
