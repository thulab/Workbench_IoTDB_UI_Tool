<template>
  <el-dialog :title="title" v-model="dialogVisible" width="1024px" class="preview-role-modal" align-center :close-on-click-modal="true" id="auth-preview-modal-user">
    <el-scrollbar :max-height="maxHeight" v-loading="loading">
      <div class="table-list-box m-t-8">
        <h4 class="table-box-title">{{ t('common.allSituation') }}</h4>
        <el-table border :data="entityTableData" style="width: 100%">
          <el-table-column :label="t('common.allChoose')" align="center" width="90" fixed="left">
            <template #default="{ row }">
              <el-icon size="21">
                <i-custom-correct style="transform: translateY(3px)" v-if="row.privileges.length >= entityPrivilegesEnumKeys.length" />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column :label="group.group" v-for="group in entityPrivilegesEnumGroup" :key="group.group" align="center">
            <el-table-column :label="child.desc" v-for="child in group.children" :key="child.privileges" align="center" :width="calcColumnWidth(child)">
              <template #default="{ row }">
                <el-icon size="21">
                  <i-custom-correct style="transform: translateY(3px)" v-if="row.privileges.includes(child.privileges)" />
                </el-icon>
              </template>
            </el-table-column>
          </el-table-column>
        </el-table>
      </div>

      <div class="table-list-box" v-if="name !== 'root'">
        <h4 class="table-box-title">{{ t('auth.path') }}</h4>
        <el-table border :data="tableData" style="width: 100%" tooltip-effect="light">
          <el-table-column :label="t('auth.pathName')" prop="path" align="center" width="193" show-overflow-tooltip />
          <el-table-column :label="t('common.allChoose')" align="center" width="193">
            <template #default="{ row }">
              <el-icon size="21">
                <i-custom-correct style="transform: translateY(3px)" v-if="row.privileges.length >= pathPrivilegesEnumKeys.length" />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column v-for="(column, index) in pathPrivilegesEnumGroup" :label="column.group" :key="`${column.group}_${index}_column`" align="center">
            <el-table-column v-for="(col, ci) in column.children" :label="col.desc" :key="`${col.privileges}_${ci}_col`" :prop="col.privileges" align="center" :min-width="col.width || 180">
              <template #default="{ row }">
                <el-icon size="21">
                  <i-custom-correct style="transform: translateY(3px)" v-if="row.privileges.includes(col.privileges)" />
                </el-icon>
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
import { storeToRefs } from 'pinia';
import { union, difference } from 'lodash-es';
import { useUserStore } from '@/stores';
import { AuthApi } from '@/api';
import type { AuthByRoleRes, PrivilegeEnum } from '@/types';

const props = defineProps<{
  visible: boolean;
  name: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const { t } = useI18n();
const maxHeight = computed(() => window.innerHeight - 100);

const userStore = useUserStore();
const { entityPrivilegesEnumGroup, entityPrivilegesEnumKeys, pathPrivilegesEnumGroup, pathPrivilegesEnumKeys } = storeToRefs(userStore);

const dialogVisible = useVModel(props, 'visible', emit);

const title = computed(() => `${props.name} ${t('auth.detail')}`);

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

function getDetail() {
  getUserAuth(props.name);
}

/**
 * 全局权限表格数据
 */
const entityTableData = computed(() => {
  const roleEntityPrivileges: string[] = (authData.value.rolesToPrivileges || []).flatMap((item) => item.entityPrivileges);
  const result = union(authData.value.entityPrivileges, roleEntityPrivileges);
  return [{ privileges: result }];
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

function joinRolePathPrivileges(data: Array<{ path: string; privileges: string[] }>, role: { path: string; privileges: string[] }) {
  const path = data.find((pathItem) => pathItem.path === role.path);
  if (path) {
    path.privileges = union(path.privileges || [], role.privileges);
  }
}

const tableData = computed(() => {
  const rolePaths = rolePathPrivileges.value.map((item) => item.path);
  const userPrivileges = authData.value.pathPrivileges || [];
  difference(
    rolePaths,
    userPrivileges.map((item) => item.path),
  ).forEach((path) => {
    userPrivileges.push({ path, privileges: [] });
  });

  const result: Array<{ path: string; privileges: string[] }> = userPrivileges.map((item) => ({
    path: item.path,
    privileges: item.privileges,
  }));

  rolePathPrivileges.value?.forEach((item) => {
    joinRolePathPrivileges(result, item);
  });

  if (result.length === 0) {
    return [
      {
        path: '',
        privileges: [],
      },
    ];
  }
  return result;
});

function calcColumnWidth(child: PrivilegeEnum) {
  if (child.desc.length > 0) {
    return child.desc.length * 16 + 64;
  }
  return child.width;
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
