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
            </div>
            <div class="detail-user-list">
              <span class="p-t-4">{{ t('auth.havingUser') }}：</span>
              <div class="detail-user-box">
                <el-tag :closable="isEdit" type="info" v-for="(item, index) in userList" :key="item" @close="handleDeleteUser(index)" @click="showAuthDetail(item)" :id="`auth-user-${item}-${index}`">
                  {{ item }}
                </el-tag>
                <auth-tooltip :is-disabled="canManageRole" :content="'common.roleAuth'">
                  <div>
                    <el-button link :disabled="!currentRole || !canManageRole" v-if="!isEdit" @click="operationType = 'edit'" id="auth-role-edit">
                      <el-icon size="24px"><i-custom-edit /></el-icon>
                    </el-button>
                    <template v-else>
                      <el-button link :disabled="!canManageRole" @click="handleAddUser" id="auth-user-add-role" :class="['m-l-8', 'p-0', !canManageUser ? '' : 'svg-button-hover-color']">
                        <el-icon size="24px"><i-custom-user-role-add /></el-icon>
                      </el-button>
                      <el-button :disabled="!canManageRole" @click="operationType = 'view'" id="auth-user-add-role-exit" :class="['m-l-8', 'p-0']"> {{ t('common.exitEdit') }} </el-button>
                    </template>
                  </div>
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
              <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('auth.docTip')" popper-class="tooltip-box-width">
                <el-button link class="m-r-4" style="margin-top: -4px" @click="handleDoc" id="role-path-doc">
                  <el-icon size="24"><i-custom-model-doc /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
            <div class="detail-user-list">
              <span class="fs-[14px] m-r-[24px]">{{ t('auth.relational.allScope') }}：</span>
              <template v-if="!formData.canManageRole">
                <span class="flex items-center !m-r-[24px]">
                  <i-custom-correct class="m-r-8" />
                  {{ t('auth.relational.MANAGE_USER') }}
                </span>
              </template>
              <el-checkbox :disabled="!canManageRole" v-else v-model="formData.canManageUser" @change="handleAllScopeChange('MANAGE_USER')">{{ t('auth.relational.MANAGE_USER') }}</el-checkbox>
              <template v-if="!formData.canManageRole">
                <span class="flex items-center !m-r-[24px]">
                  <i-custom-correct class="m-r-8" />
                  {{ t('auth.relational.MANAGE_ROLE') }}
                </span>
              </template>
              <el-checkbox :disabled="!canManageRole" v-else v-model="formData.canManageRole" @change="handleAllScopeChange('MANAGE_ROLE')">{{ t('auth.relational.MANAGE_ROLE') }}</el-checkbox>
            </div>
            <div class="detail-user-list">
              <span class="fs-[14px]">{{ t('auth.relational.dataScope') }}：</span>
            </div>
            <div class="table-list-box">
              <el-table :data="tableData" style="width: 100%" v-loading="anyLoading" tooltip-effect="light" border :tooltip-options="{ popperClass: 'table-tooltip-max-width' }">
                <el-table-column :label="t('auth.relational.scope')" prop="scope" align="center" :width="193">
                  <template #default="{ row }">
                    <text-tooltip :content="row.scope" />
                  </template>
                </el-table-column>
                <el-table-column :label="t('auth.relational.type')" align="center">
                  <el-table-column
                    v-for="(col, ci) in relationalDataScopePrivilegesEnum"
                    :label="t(`auth.relational.${col}`)"
                    :key="`${col}_${ci}_col`"
                    :prop="col"
                    align="center"
                    :width="calcColumnWidth(col)"
                  >
                    <template #default="{ row }">
                      <i-custom-with-grant style="transform: translateY(3px)" v-if="row.grantedPrivileges.includes(col)" />
                      <i-custom-correct style="transform: translateY(3px)" v-else-if="row.privileges.includes(col)" />
                    </template>
                  </el-table-column>
                </el-table-column>
                <el-table-column :label="t('common.operation')" align="center" width="194" fixed="right">
                  <template #default="{ $index }">
                    <el-button link @click="handleEditRow($index)" :class="'svg-button-hover-color'">
                      <el-icon size="21"><i-custom-edit /></el-icon>
                    </el-button>
                    <el-button link @click="handleDeleteRow($index)" :class="'svg-button-hover-color'">
                      <el-icon size="21"><i-custom-close /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-button v-if="canManageRole" style="width: 100%" class="m-t-24 svg-button-hover-color" @click="handleAddRow" id="auth-role-path">
                <i-custom-add class="m-r-4" />
                {{ t('auth.relational.addScope') }}
              </el-button>
            </div>
          </el-scrollbar>
        </el-main>
      </el-container>

      <modal-add-scope v-model:visible="addScopeVisible" :type="'role'" :current-data="currentRow" :name="currentRole" @handleSave="handleSaveDataPrivileges" />

      <modal-add-user v-model:visible="bindUserVisible" :current-role="currentRole" :selected="userList" @add-user="addUserConfirm" />

      <modal-preview v-model:visible="previewVisible" type="user" :name="previewUser" />
    </el-container>
  </version-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore, useConnectionStore } from '@/stores';
import { RelationalPrivilegesApi } from '@/api';
import { iotdbShowAuth } from '@/utils/auth';
import { relationalDataScopePrivilegesEnum } from '@/constants';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import RoleList from './components/table/role-list.vue';
import ModalAddScope from './components/table/modal-add-scope.vue';
import ModalAddUser from './components/table/modal-add-user.vue';
import ModalPreview from './components/table/modal-preview.vue';
import type { UpdateDataPrivilegeAo, DataPrivilege } from '@/types';

const { t, locale } = useI18n();
const currentRole = ref('');
const addScopeVisible = ref(false);

const operationType = ref<'edit' | 'view'>('view');

const userList = ref<string[]>([]);
const bindUserVisible = ref(false);
const previewVisible = ref(false);
const previewUser = ref('');
const loading = ref(true);
const isEdit = computed(() => operationType.value === 'edit');
const currentRow = ref<DataPrivilege | null>(null);

const connectionStore = useConnectionStore();
const userStore = useUserStore();
const { canManageUserWithTableModel: canManageUser, canManageRoleWithTableModel: canManageRole } = storeToRefs(userStore);

const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion));

const {
  requestFn: getDataPrivileges,
  data: dataPrivileges,
  loading: dataPrivilegesLoading,
} = useRequest(RelationalPrivilegesApi.getDataPrivilegesByRoleName, {
  initData: [],
});

const {
  requestFn: getGlobalPrivileges,
  data: globalPrivileges,
  loading: globalPrivilegesLoading,
} = useRequest(RelationalPrivilegesApi.getGlobalPrivilegesByRoleName, {
  initData: [],
});

const { requestFn: getUserNames, loading: usersLoading } = useRequest(RelationalPrivilegesApi.getUserNamesByRoleName, {
  initData: [],
});

const { requestFn: grantGlobalPrivilege, loading: grantGlobalPrivilegeLoading } = useRequest(RelationalPrivilegesApi.grantGlobalPrivilegeToRole);

const { requestFn: revokeGlobalPrivilege, loading: revokeGlobalPrivilegeLoading } = useRequest(RelationalPrivilegesApi.revokeGlobalPrivilegeFromRole);

const { requestFn: revokeRoleFromUser, loading: revokeRoleFromUserLoading } = useRequest(RelationalPrivilegesApi.revokeRoleFromUser);

const { requestFn: updateDataPrivilege, loading: updateDataPrivilegeLoading } = useRequest(RelationalPrivilegesApi.updateDataPrivilegeByRoleName);

const anyLoading = computed(() => {
  return (
    loading.value ||
    dataPrivilegesLoading.value ||
    globalPrivilegesLoading.value ||
    usersLoading.value ||
    revokeRoleFromUserLoading.value ||
    grantGlobalPrivilegeLoading.value ||
    revokeGlobalPrivilegeLoading.value ||
    updateDataPrivilegeLoading.value
  );
});
const formData = ref({
  canManageUser: false,
  canManageRole: false,
});
const tableData = computed<DataPrivilege[]>(() => {
  return dataPrivileges.value.map((item) => {
    const privileges = item.dataPrivileges?.map((privilege) => privilege.privilegeName) || [];
    const grantedPrivileges = item.dataPrivileges?.filter((privilege) => privilege.grantOption).map((privilege) => privilege.privilegeName) || [];
    let role = '';
    if (item.dataPrivileges?.length) {
      role = item.dataPrivileges[0]!.role || '';
    }
    return {
      scope: item.scope,
      role,
      privileges,
      grantedPrivileges,
    } as DataPrivilege;
  });
});
function getRoleUserList() {
  if (!canManageUser.value) return [];
  return getUserNames(currentRole.value).then((res) => {
    userList.value = res.data || [];
  });
}

function getDetail() {
  loading.value = true;
  Promise.allSettled([getRoleUserList(), getDataPrivileges(currentRole.value), getGlobalPrivileges(currentRole.value)]).finally(() => {
    formData.value.canManageRole = globalPrivileges.value.some((item) => item.privilegeName === 'MANAGE_ROLE');
    formData.value.canManageUser = globalPrivileges.value.some((item) => item.privilegeName === 'MANAGE_USER');

    loading.value = false;
  });
}

// 添加行
function handleAddRow() {
  addScopeVisible.value = true;
}
function handleEditRow(index: number) {
  currentRow.value = tableData.value[index]!;
  addScopeVisible.value = true;
}

// 保存路径
function handleSaveDataPrivileges(sql?: string) {
  getDataPrivileges(currentRole.value).then(() => {});
}

// 删除某一行的数据权限
function handleDeleteRow(index: number) {
  ElMessageBox.confirm(t('auth.relational.deleteDataAuthTip'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-user-confirm',
    cancelButtonClass: 'del-user-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    const data: UpdateDataPrivilegeAo = {
      name: currentRole.value,
      scopes: [tableData.value[index]!.scope!],
      grantDataPrivileges: [],
      revokeDataPrivileges: [{ privilegeName: 'ALL' }],
    };
    updateDataPrivilege(data).then((res) => {
      ElMessage.success({ message: t('common.submitSuccess'), grouping: true });
      getDataPrivileges(currentRole.value).then(() => {});
    });
  });
}

function calcColumnWidth(child: string) {
  const desc = t(`auth.relational.${child}`);
  if (desc.length > 0) {
    if (locale.value === 'en') {
      return desc.length * 8 + 8;
    }
  }
  return 7 * 16 + 8;
}

const handleAllScopeChange = (auth: string) => {
  const isGrant = auth === 'MANAGE_USER' ? formData.value.canManageUser : formData.value.canManageRole;
  if (isGrant) {
    grantGlobalPrivilege({
      name: currentRole.value,
      privilegeName: auth,
      grantOption: true,
    }).then(() => {
      ElMessage.success({ message: t('common.editSuccess'), grouping: true });
    });
  } else {
    revokeGlobalPrivilege({
      name: currentRole.value,
      privilegeName: auth,
    }).then(() => {
      ElMessage.success({ message: t('common.editSuccess'), grouping: true });
    });
  }
};

// 关联用户
function handleAddUser() {
  bindUserVisible.value = true;
}

// 删除关联用户
function handleDeleteUser(index: number) {
  ElMessageBox.confirm(t('auth.deleteUser'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'del-user-confirm',
    cancelButtonClass: 'del-user-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    revokeRoleFromUser({
      userName: userList.value[index],
      relateRoles: [currentRole.value],
    }).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      userList.value.splice(index, 1);
    });
  });
}

function addUserConfirm(vals: string[]) {
  getRoleUserList();
}

function showAuthDetail(user: string) {
  previewUser.value = user;
  previewVisible.value = true;
}

function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://timecho.com/docs/UserGuide/latest-Table/User-Manual/Authority-Management.html');
  } else {
    window.open('https://timecho.com/docs/zh/UserGuide/latest-Table/User-Manual/Authority-Management.html');
  }
}

watch(
  () => currentRole.value,
  (val, old) => {
    if (val !== old) {
      operationType.value = 'view';
      dataPrivileges.value = [];
      globalPrivileges.value = [];
      addScopeVisible.value = false;
      bindUserVisible.value = false;
      userList.value = [];
      loading.value = true;
      if (val) {
        getDetail();
      } else {
        loading.value = false;
        userList.value = [];
        dataPrivileges.value = [];
        globalPrivileges.value = [];
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
  margin: 4px 16px;
  background-color: #f7f8fc;
  padding: 16px;

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

  :deep(.el-table .cell) {
    padding: 0 !important;
  }
}

.operate-buttons {
  text-align: right;
  margin-top: 24px;
}

.detail-user-list {
  margin: 12px 16px;
  font-size: 14px;
  color: #131926;
  display: flex;
  line-height: 28px;
  align-items: center;

  .el-tag {
    cursor: pointer;
    margin: 0 8px 0 0;
  }

  .detail-user-box {
    flex: 1;
    display: flex;
    align-items: center;
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
