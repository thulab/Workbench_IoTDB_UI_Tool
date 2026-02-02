<template>
  <el-dialog :title="title" v-model="dialogVisible" width="1024px" class="preview-role-modal" align-center :close-on-click-modal="true" id="auth-preview-modal">
    <el-scrollbar :max-height="maxHeight">
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

      <div class="table-list-box">
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
import { useUserStore } from '@/stores';
import type { PrivilegeEnum } from '@/types';

const props = defineProps<{
  visible: boolean;
  name: string;
  entityPrivileges: string[];
  pathPrivileges: Array<{ path: string; privileges: string[] }>;
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

/**
 * 全局权限表格数据
 */
const entityTableData = computed(() => {
  const result = {
    privileges: props.entityPrivileges || [],
  };
  return [result];
});

const tableData = computed(() => {
  if (props.pathPrivileges.length === 0) {
    return [
      {
        path: '',
        privileges: [],
      },
    ];
  }
  return props.pathPrivileges;
});

function calcColumnWidth(child: PrivilegeEnum) {
  if (child.desc.length > 0) {
    return child.desc.length * 16 + 64;
  }
  return child.width;
}
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
    margin-top: 0;
    background-color: #f7f8fc;
    padding: 8px 16px 16px;

    .table-box-title {
      font-size: 12px;
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
