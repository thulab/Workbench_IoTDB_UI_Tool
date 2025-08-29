<template>
  <el-dialog :title="title" v-model="dialogVisible" width="1024px" class="preview-role-modal" align-center :close-on-click-modal="true" id="auth-preview-modal-user">
    <el-scrollbar :max-height="maxHeight" v-loading="dataPrivilegesLoading || globalPrivilegesLoading">
      <div class="detail-user-list m-b-[12px] flex items-center">
        <span class="fs-[14px] m-r-[24px]">{{ t('auth.relational.allScope') }}：</span>
        <template v-if="formData.canManageUser">
          <span class="flex items-center !m-r-[24px]">
            <i-custom-correct class="m-r-8" />
            {{ t('auth.relational.MANAGE_USER') }}
          </span>
        </template>
        <el-checkbox disabled v-model="formData.canManageUser" class="!m-r-[24px]" v-else>{{ t('auth.relational.MANAGE_USER') }}</el-checkbox>
        <template v-if="formData.canManageRole">
          <i-custom-correct class="m-r-8" />
          {{ t('auth.relational.MANAGE_ROLE') }}
        </template>
        <el-checkbox disabled v-model="formData.canManageRole" class="!m-l-0" v-else>{{ t('auth.relational.MANAGE_ROLE') }}</el-checkbox>
      </div>
      <div class="detail-user-list">
        <span class="fs-[14px]">{{ t('auth.relational.dataScope') }}：</span>
      </div>
      <div class="table-list-box">
        <div class="flex-justify-between">
          <div class="header-operate-buttons"></div>
        </div>
        <el-table :data="tableData" style="width: 100%" v-loading="dataPrivilegesLoading" tooltip-effect="light" border :tooltip-options="{ popperClass: 'table-tooltip-max-width' }">
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
                <i-custom-with-grant style="transform: translateY(3px)" v-if="row.grantedPrivileges.includes(col)" />
                <i-custom-correct style="transform: translateY(3px)" v-else-if="row.privileges.includes(col)" />
              </template>
            </el-table-column>
          </el-table-column>
        </el-table>
      </div>
    </el-scrollbar>
    <template #footer></template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { RelationalPrivilegesApi } from '@/api';
import { relationalDataScopePrivilegesEnum } from '@/constants';

const props = defineProps<{
  visible: boolean;
  name: string;
  type: 'user' | 'role';
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const { t, locale } = useI18n();
const maxHeight = computed(() => window.innerHeight - 100);

const dialogVisible = useVModel(props, 'visible', emit);

const title = computed(() => `${props.name} ${t('auth.detail')}`);

const {
  requestFn: getDataPrivileges,
  data: dataPrivileges,
  loading: dataPrivilegesLoading,
} = useRequest(props.type === 'user' ? RelationalPrivilegesApi.getDataPrivilegesByUserName : RelationalPrivilegesApi.getDataPrivilegesByRoleName, {
  initData: [],
});

const {
  requestFn: getGlobalPrivileges,
  data: globalPrivileges,
  loading: globalPrivilegesLoading,
} = useRequest(props.type === 'user' ? RelationalPrivilegesApi.getGlobalPrivilegesByUserName : RelationalPrivilegesApi.getGlobalPrivilegesByRoleName, {
  initData: [],
});

const formData = ref({
  canManageUser: false,
  canManageRole: false,
});

const tableData = computed(() => {
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
    };
  });
});

function getDetail() {
  Promise.allSettled([getDataPrivileges(props.name), getGlobalPrivileges(props.name)]).finally(() => {
    formData.value.canManageRole = globalPrivileges.value.some((item) => item.privilegeName === 'MANAGE_ROLE');
    formData.value.canManageUser = globalPrivileges.value.some((item) => item.privilegeName === 'MANAGE_USER');
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

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      getDetail();
    }
  },
);
</script>
<style lang="scss">
.preview-role-modal {
  .el-dialog__body {
    padding-bottom: 0 !important;
  }
}
</style>
<style lang="scss" scoped>
.preview-role-modal {
  :deep(.el-dialog__body) {
    padding-bottom: 0 !important;
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
}
</style>
