<template>
  <version-container :is-show="showAuthMenu">
    <el-container>
      <el-aside :width="sideWidth + 'px'" class="list-wrapper overflow-hidden" style="position: relative">
        <user-list ref="listRef" :can-manage-user="effectiveCanManageUser" :user-name="userName" @handle-select="(val) => (currentUser = val)" />
        <div
          style="height: 100%; width: 4px; background-color: transparent; position: absolute; top: 0; right: 0; transform: translateX(2px); cursor: ew-resize"
          @pointerdown="(e) => onSliderPointerDown(e)"
        ></div>
      </el-aside>
      <el-container class="details-wrapper">
        <el-main class="p-0" v-loading="loading">
          <el-scrollbar>
            <div class="detail-title-box" v-if="!isManager">
              <h4 class="detail-title-text">{{ t('auth.roleDetail') }}</h4>
            </div>
            <div class="detail-role-list" v-if="!isManager">
              <span class="p-t-4">{{ t('auth.havingRole') }}：</span>
              <div class="detail-role-box">
                <el-tag
                  :closable="isEdit"
                  type="info"
                  v-for="(item, index) in selectRoleList"
                  :key="item"
                  @close="handleDeleteRole(index)"
                  @click="showRoleDetail(item)"
                  :id="`auth-user-role-${item}-${index}`"
                >
                  {{ item }}
                </el-tag>
                <auth-tooltip :is-disabled="effectiveCanManageRole" :content="'common.roleAuth'">
                  <div>
                    <el-button link :disabled="!currentUser || !effectiveCanManageRole" v-if="!isEdit" @click="operationType = 'edit'" id="auth-role-edit">
                      <el-icon size="24px"><i-custom-edit /></el-icon>
                    </el-button>
                    <template v-else>
                      <el-button link :disabled="!effectiveCanManageRole" @click="addRole" id="auth-user-add-role" :class="['m-l-8', 'p-0', !effectiveCanManageRole ? '' : 'svg-button-hover-color']">
                        <el-icon size="24px"><i-custom-user-role-add /></el-icon>
                      </el-button>
                      <el-button :disabled="!effectiveCanManageRole" @click="operationType = 'view'" id="auth-user-add-role-exit" :class="['m-l-8', 'p-0']"> {{ t('common.exitEdit') }} </el-button>
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
            <div class="detail-role-list">
              <span class="fs-[14px] m-r-[24px]">{{ t('auth.relational.allScope') }}：</span>
              <template v-if="isManager">
                <span class="flex items-center !m-r-[24px]">
                  <i-custom-correct class="m-r-8" />
                  {{ t('auth.relational.MANAGE_USER') }}
                </span>
              </template>
              <el-tooltip v-else :content="t('auth.relational.editTip')" :disabled="!formData.canManageUserByRole" effect="light" placement="top">
                <el-checkbox
                  :disabled="!canManageUser || isManager || !!formData.canManageUserByRole || (isSelfUser && selfRevokedManageUser)"
                  v-model="formData.canManageUser"
                  @change="handleAllScopeChange('MANAGE_USER')"
                  >{{ t('auth.relational.MANAGE_USER') }}</el-checkbox
                >
              </el-tooltip>

              <template v-if="isManager">
                <span class="flex items-center !m-r-[24px]">
                  <i-custom-correct class="m-r-8" />
                  {{ t('auth.relational.MANAGE_ROLE') }}
                </span>
              </template>
              <el-tooltip v-else :content="t('auth.relational.editTip')" :disabled="!formData.canManageRoleByRole" effect="light" placement="top">
                <el-checkbox
                  :disabled="!canManageRole || isManager || !!formData.canManageRoleByRole || (isSelfUser && selfRevokedManageRole)"
                  v-model="formData.canManageRole"
                  @change="handleAllScopeChange('MANAGE_ROLE')"
                  >{{ t('auth.relational.MANAGE_ROLE') }}</el-checkbox
                >
              </el-tooltip>
            </div>
            <div class="detail-role-list">
              <span class="fs-[14px]">{{ t('auth.relational.dataScope') }}：</span>
            </div>
            <div class="table-list-box">
              <el-table :data="tableData" style="width: 100%" v-loading="anyLoading" tooltip-effect="light" border :tooltip-options="{ popperClass: 'table-tooltip-max-width' }">
                <el-table-column :label="t('auth.relational.scope')" prop="scope" align="center" :width="193">
                  <template #default="{ row }">
                    <span class="flex items-center justify-center">
                      <i-custom-role v-if="row.role"></i-custom-role>
                      <text-tooltip :content="row.scope" />
                    </span>
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
                      <span class="flex items-center justify-center">
                        <i-custom-with-grant style="transform: translateY(3px)" v-if="row.grantedPrivileges.includes(col)" />
                        <i-custom-correct style="transform: translateY(3px)" v-else-if="row.privileges.includes(col)" />
                      </span>
                    </template>
                  </el-table-column>
                </el-table-column>
                <el-table-column :label="t('common.operation')" align="center" v-if="canEdit" width="194" fixed="right">
                  <template #default="{ row, $index }">
                    <el-tooltip :content="t('auth.relational.editTip')" :disabled="!row.role" effect="light" placement="top">
                      <el-button link @click="handleEditRow($index)" :disabled="!!row.role" :class="'svg-button-hover-color'">
                        <el-icon size="21"><i-custom-edit /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip :content="t('auth.relational.editTip')" :disabled="!row.role" effect="light" placement="top">
                      <el-button link @click="handleDeleteRow($index)" :disabled="!!row.role" :class="'svg-button-hover-color'">
                        <el-icon size="21"><i-custom-close /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </template>
                </el-table-column>
              </el-table>

              <el-button v-if="effectiveCanManageUser && !isManager" style="width: 100%" class="svg-button-hover-color m-t-[8px]" @click="handleAddRow" id="auth-role-path">
                <i-custom-add class="m-r-4" />
                {{ t('auth.relational.addScope') }}
              </el-button>
            </div>
          </el-scrollbar>
        </el-main>
      </el-container>

      <modal-add-scope v-model:visible="addScopeVisible" type="user" :current-data="currentRow" :name="currentUser?.name!" @handleSave="handleSaveDataPrivileges" />
      <modal-add-role v-model:visible="bindRoleVisible" :current-user="currentUser?.name!" :selected="selectRoleList" @add-role="handleAddRoleConfirm" />
      <modal-preview v-model:visible="previewVisible" type="role" :name="previewRole!" />
    </el-container>
  </version-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore, useConnectionStore } from '@/stores';
import { RelationalPrivilegesApi } from '@/api';
import { iotdbShowAuth } from '@/utils/auth';
import { relationalDataScopePrivilegesEnum } from '@/constants';
import UserList from './components/table/user-list.vue';
import ModalAddScope from './components/table/modal-add-scope.vue';
import ModalAddRole from './components/table/modal-add-role.vue';
import ModalPreview from './components/table/modal-preview.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import type { IoTDBUserVo, DataPrivilege, UpdateDataPrivilegeAo } from '@/types';

const { t, locale } = useI18n();
const connectionStore = useConnectionStore();
const userStore = useUserStore();
const { canManageUserWithTableModel: canManageUser, canManageRoleWithTableModel: canManageRole } = storeToRefs(userStore);
const userName = computed(() => userStore.userInfo.name);

const listRef = ref<InstanceType<typeof UserList>>();
const currentUser = ref<IoTDBUserVo>();
const addScopeVisible = ref(false);
const bindRoleVisible = ref(false);
const previewVisible = ref(false);
const previewRole = ref<string | undefined>(undefined);

const sideWidth = ref<number>(240);

// const { maxTableHeight } = useTableHeight(540);
// const minHeight = computed(() => {
//   if (maxTableHeight.value < 300) {
//     return 300;
//   }
//   return maxTableHeight.value;
// });
const isManager = computed(() => currentUser.value?.isManager === 1);
const canEdit = computed(() => currentUser.value?.isManager === 0);
const operationType = ref<'view' | 'edit'>('view');
const loading = ref(true);
const isEdit = computed(() => operationType.value === 'edit');
const currentRow = ref<DataPrivilege | null>(null);

const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion));

const {
  requestFn: getDataPrivileges,
  data: dataPrivileges,
  loading: dataPrivilegesLoading,
} = useRequest(RelationalPrivilegesApi.getDataPrivilegesByUserName, {
  initData: [],
});

const {
  requestFn: getGlobalPrivileges,
  data: globalPrivileges,
  loading: globalPrivilegesLoading,
} = useRequest(RelationalPrivilegesApi.getGlobalPrivilegesByUserName, {
  initData: [],
});

const {
  requestFn: getRoleNames,
  data: selectRoleList,
  loading: rolesLoading,
} = useRequest(RelationalPrivilegesApi.getRoleNamesByUserName, {
  initData: [],
});

const { requestFn: grantGlobalPrivilege, loading: grantGlobalPrivilegeLoading } = useRequest(RelationalPrivilegesApi.grantGlobalPrivilegeToUser);

const { requestFn: revokeGlobalPrivilege, loading: revokeGlobalPrivilegeLoading } = useRequest(RelationalPrivilegesApi.revokeGlobalPrivilegeFromUser);

const { requestFn: revokeRoleFromUser, loading: revokeRoleFromUserLoading } = useRequest(RelationalPrivilegesApi.revokeRoleFromUser);

const { requestFn: updateDataPrivilege, loading: updateDataPrivilegeLoading } = useRequest(RelationalPrivilegesApi.updateDataPrivilegeByUserName);

const anyLoading = computed(() => {
  return (
    loading.value ||
    dataPrivilegesLoading.value ||
    globalPrivilegesLoading.value ||
    rolesLoading.value ||
    revokeRoleFromUserLoading.value ||
    grantGlobalPrivilegeLoading.value ||
    revokeGlobalPrivilegeLoading.value ||
    updateDataPrivilegeLoading.value
  );
});
const formData = ref({
  canManageUser: false,
  canManageRole: false,
  canManageUserByRole: false,
  canManageRoleByRole: false,
});
const hasGlobalPrivilegesLoaded = ref(false);
const isSelfUser = computed(() => currentUser.value?.name === userName.value);
const effectiveCanManageUser = computed(() => {
  if (!canManageUser.value) return false;
  if (isSelfUser.value && hasGlobalPrivilegesLoaded.value) {
    return formData.value.canManageUser;
  }
  return true;
});
const effectiveCanManageRole = computed(() => {
  if (!canManageRole.value) return false;
  if (isSelfUser.value && hasGlobalPrivilegesLoaded.value) {
    return formData.value.canManageRole;
  }
  return true;
});
const selfRevokedManageUser = ref(false);
const selfRevokedManageRole = ref(false);

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

function onSliderPointerDown(event: PointerEvent) {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = sideWidth.value || 240;

  function onPointerMove(e: PointerEvent) {
    const deltaX = e.clientX - startX;
    const newWidth = Math.min(Math.max(200, startWidth + deltaX), 600);
    sideWidth.value = newWidth;
  }

  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function getDetail() {
  if (currentUser.value && currentUser.value.name) {
    loading.value = true;
    hasGlobalPrivilegesLoaded.value = false;
    const requests: Promise<unknown>[] = [];
    if (canManageRole.value) {
      requests.push(getRoleNames(currentUser.value.name));
    } else {
      selectRoleList.value = [];
    }
    if (canManageUser.value || isSelfUser.value) {
      requests.push(getDataPrivileges(currentUser.value.name));
    } else {
      dataPrivileges.value = [];
    }
    requests.push(getGlobalPrivileges(currentUser.value.name));
    Promise.allSettled(requests).finally(() => {
      formData.value.canManageRole = globalPrivileges.value.some((item) => item.privilegeName === 'MANAGE_ROLE');
      formData.value.canManageRoleByRole = globalPrivileges.value.some((item) => item.privilegeName === 'MANAGE_ROLE' && !!item.role);
      formData.value.canManageUser = globalPrivileges.value.some((item) => item.privilegeName === 'MANAGE_USER');
      formData.value.canManageUserByRole = globalPrivileges.value.some((item) => item.privilegeName === 'MANAGE_USER' && !!item.role);
      hasGlobalPrivilegesLoaded.value = true;
      loading.value = false;
    });
  }
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
  getDataPrivileges(currentUser.value!.name!).then(() => {});
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
      name: currentUser.value!.name!,
      scopes: [tableData.value[index]!.scope!],
      grantDataPrivileges: [],
      revokeDataPrivileges: [{ privilegeName: 'ALL' }],
    };
    updateDataPrivilege(data).then((res) => {
      ElMessage.success({ message: t('common.submitSuccess'), grouping: true });
      getDataPrivileges(currentUser.value!.name!).then(() => {});
    });
  });
}

function addRole() {
  bindRoleVisible.value = true;
}
function handleAddRoleConfirm(_roleNames: string[]) {
  bindRoleVisible.value = false;
  getRoleNames(currentUser.value!.name!);
  getDetail();
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
    revokeRoleFromUser({
      userName: currentUser.value!.name!,
      relateRoles: [selectRoleList.value[index]!],
    }).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      selectRoleList.value.splice(index, 1);
      getDetail();
    });
  });
}
function showRoleDetail(role: string) {
  previewRole.value = role;
  previewVisible.value = true;
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

const refreshSelfGlobalPrivileges = () => {
  if (isSelfUser.value) {
    userStore.loadPrivileges(true);
  }
};

const handleAllScopeChange = (auth: string) => {
  const isGrant = auth === 'MANAGE_USER' ? formData.value.canManageUser : formData.value.canManageRole;
  if (isGrant) {
    grantGlobalPrivilege({
      name: currentUser.value!.name!,
      privilegeName: auth,
      grantOption: true,
    }).then(() => {
      ElMessage.success({ message: t('common.editSuccess'), grouping: true });
      refreshSelfGlobalPrivileges();
    });
  } else {
    revokeGlobalPrivilege({
      name: currentUser.value!.name!,
      privilegeName: auth,
    }).then(() => {
      ElMessage.success({ message: t('common.editSuccess'), grouping: true });
      if (isSelfUser.value) {
        if (auth === 'MANAGE_USER') {
          selfRevokedManageUser.value = true;
          listRef.value?.getList();
        } else if (auth === 'MANAGE_ROLE') {
          selfRevokedManageRole.value = true;
        }
      }
      refreshSelfGlobalPrivileges();
    });
  }
};

function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://timecho.com/docs/UserGuide/latest-Table/User-Manual/Authority-Management.html');
  } else {
    window.open('https://timecho.com/docs/zh/UserGuide/latest-Table/User-Manual/Authority-Management.html');
  }
}

watch(
  () => formData.value.canManageUser,
  (val) => {
    if (val) {
      selfRevokedManageUser.value = false;
    }
  },
);

watch(
  () => formData.value.canManageRole,
  (val) => {
    if (val) {
      selfRevokedManageRole.value = false;
    }
  },
);

watch(
  () => isSelfUser.value,
  (val) => {
    if (!val) {
      selfRevokedManageUser.value = false;
      selfRevokedManageRole.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => currentUser.value,
  (val, old) => {
    if (val !== old) {
      operationType.value = 'view';
      dataPrivileges.value = [];
      globalPrivileges.value = [];
      addScopeVisible.value = false;
      bindRoleVisible.value = false;
      selectRoleList.value = [];
      hasGlobalPrivilegesLoaded.value = false;
      loading.value = true;
      if (val) {
        getDetail();
      } else {
        loading.value = false;
        selectRoleList.value = [];
        dataPrivileges.value = [];
        globalPrivileges.value = [];
        hasGlobalPrivilegesLoaded.value = false;
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
  padding: 0 8px;
  box-sizing: border-box;

  .detail-title-text {
    font-size: 12px;
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
  margin: 8px;
  display: flex;
  font-size: 12px;
  align-items: center;

  .el-tag {
    cursor: pointer;
    margin: 0 8px 0 0;
  }

  .detail-role-box {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
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
  margin-left: 8px;
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
  margin-top: 0;
  background-color: #f7f8fc;
  padding: 8px;

  .table-box-title {
    font-size: 12px;
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
