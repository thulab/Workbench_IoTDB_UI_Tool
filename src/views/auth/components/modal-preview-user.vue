<template>
  <el-dialog
    :title="title"
    v-model="dialogVisible"
    width="1024px"
    class="preview-role-modal"
    align-center
    :close-on-click-modal="true"
    id="auth-preview-modal-user"
  >
    <el-scrollbar :max-height="maxHeight" v-loading="loading">
      <div class="table-list-box m-t-8">
        <h4 class="table-box-title">全局</h4>
        <el-table :data="entityTableData" style="width: 100%;" border>
          <el-table-column label="全选" align="center" width="58" fixed="left">
            <template #default="{ row }">
              <el-icon size="21">
                <i-custom-correct style="transform: translateY(3px);" v-if="row.privileges.length >= entityPrivilegesEnumKeys.length" />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column :label="group.group" v-for="group in entityPrivilegesEnumGroup" :key="group.group" align="center">
            <el-table-column :label="child.privileges" v-for="child in group.children" :key="child.privileges" align="center" :width="calcColumnWidth(child)">
              <template #default="{ row }">
                <el-icon size="21">
                  <i-custom-correct style="transform: translateY(3px);" v-if="row.privileges.includes(child.privileges)" />
                </el-icon>
              </template>
            </el-table-column>
          </el-table-column>
        </el-table>
      </div>

      <div class="table-list-box">
        <h4 class="table-box-title">路径</h4>
        <el-table :data="tableData" style="width: 100%" tooltip-effect="light" border>
          <el-table-column label="路径名称" prop="path" align="center" width="193" show-overflow-tooltip />
          <el-table-column label="全选" align="center" width="193">
            <template #default="{ row }">
              <el-icon size="21">
                <i-custom-correct style="transform: translateY(3px);" v-if="row.privileges.length >= pathPrivilegesEnumKeys.length" />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column v-for="(column, index) in pathPrivilegesEnumGroup" :label="column.group" :key="column.group + '_' + index + '_column'" align="center">
            <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :min-width="col.width || 180">
              <template #default="{ row }">
                <el-icon size="21">
                  <i-custom-correct style="transform: translateY(3px);" v-if="row.privileges.includes(col.privileges)" />
                </el-icon>
              </template>
            </el-table-column>
          </el-table-column>
        </el-table>
      </div>
    </el-scrollbar>
    <template #footer>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { union, flatten } from 'lodash-es';
import { useUserStore } from '@/stores';
import { AuthApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  name: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const maxHeight = computed(() => window.innerHeight - 100);

const userStore = useUserStore();
const {
  entityPrivilegesEnumGroup,
  entityPrivilegesEnumKeys,
  pathPrivilegesEnumGroup,
  pathPrivilegesEnumKeys,
} = storeToRefs(userStore);

const dialogVisible = useVModel(props, 'visible', emit);

const title = computed(() => `${props.name}权限详情`);

const { requestFn: getUserAuth, data: authData, loading } = useRequest(AuthApi.getUserAuth, {
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
  const roleEntityPrivileges: string[][] = [];
  if (authData.value.rolesToPrivileges.length) {
    authData.value.rolesToPrivileges.forEach((item) => {
      roleEntityPrivileges.push(item.entityPrivileges || []);
    });
  }
  const result = union(authData.value.entityPrivileges, flatten(roleEntityPrivileges));
  return [{ privileges: result }];
});

// TODO 待处理合并
const tableData = computed(() => [{
  path: '',
  privileges: [],
}]);

function calcColumnWidth(child: Auth.PrivilegeEnum) {
  if (child.privileges.length > 0) {
    return child.privileges.length * 8 + 32;
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
}
</style>
