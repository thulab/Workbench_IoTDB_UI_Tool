<template>
  <el-container>
    <el-aside width="240px" class="role-list-wrapper">
      <role-list
        ref="roleListRef"
        @handleSelect="val => currentRole = val"
      />
    </el-aside>
    <el-container class="role-details-wrapper p-0">
      <el-header class="detail-title-box">
        <h4 class="detail-title-text">权限详情</h4>
        <el-button type="primary">编辑</el-button>
      </el-header>
      <el-main class="p-x-16 p-t-0" style="overflow-x: hidden;">
        <div class="table-list-box">
          <h4 class="table-box-title">全局</h4>
          <el-table :data="authData.entityPrivileges.length ? [authData.entityPrivileges] : []" :loading="loading" style="width: 100%;" border ref="entityTableRef">
            <el-table-column label="全选" align="center" :width="60" :min-width="60" fixed="left">
              <template #default>
                <el-checkbox :checked="entityCheckAll" @change="val => handleCheckedEntity(val, 'all')" />
              </template>
            </el-table-column>
            <el-table-column v-for="(column, index) in entityPrivilegesEnumGroup" :label="column.group" :key="column.group + '_' + index + '_column'" align="center">
              <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :width="col.width || 180">
                <template #default="{ row, $index }">
                  <el-checkbox :checked="row.includes(col.privileges)" @change="val => handleCheckedEntity(val, 'row', $index)" />
                </template>
              </el-table-column>
            </el-table-column>
            <template #empty>
              <div class="table-empty-wrapper">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">无数据</span>
              </div>
            </template>
          </el-table>
        </div>

        <div class="table-list-box">
          <h4 class="table-box-title">路径</h4>
          <el-table :data="pathData" :loading="loading" style="width: 100%" tooltip-effect="light" border ref="pathTableRef">
            <el-table-column label="路径名称" align="center" width="160" show-overflow-tooltip />
            <el-table-column label="全选" align="center" width="60">
              <template #default>
                <el-checkbox :checked="pathCheckAll" />
              </template>
            </el-table-column>
            <el-table-column v-for="(column, index) in pathPrivilegesEnumGroup" :label="column.group" :key="column.group + '_' + index + '_column'" align="center">
              <el-table-column v-for="(col, ci) in column.children" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" :prop="col.privileges" align="center" :min-width="col.width || 180">
                <template #default="{ row }">
                  <el-checkbox :checked="row[col.privileges]" />
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="操作" align="center">
              <template #default="{ row }">
                <el-button>删除{{ row }}</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <div class="table-empty-wrapper">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">无数据</span>
              </div>
            </template>
          </el-table>
        </div>

        <el-button style="width: 100%;" class="m-t-16" @click="handleAddRow"><i-custom-add class="m-r-4" />添加路径</el-button>
      </el-main>

      <el-footer>
        <div class="operate-buttons">
          <el-button>重置</el-button>
          <el-button type="primary">应用</el-button>
        </div>
      </el-footer>
    </el-container>

    <modal-path
      v-model:visible="pathVisible"
      :path-list="[]"
    />
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { type CheckboxValueType, ElTable } from 'element-plus';
import { useUserStore } from '@/stores';
import { AuthApi } from '@/api';
import RoleList from './components/role-list.vue';
import ModalPath from './components/modal-path.vue';

const roleListRef = ref<InstanceType<typeof RoleList>>();
const entityTableRef = ref<InstanceType<typeof ElTable>>();
const pathTableRef = ref<InstanceType<typeof ElTable>>();
const currentRole = ref('');
const pathData = ref([]);
const pathVisible = ref(false);
const entityCheckAll = ref(false);
const pathCheckAll = ref(false);
const intitalEntityVals = ref<string[]>([]);
const intitalPathVals = ref({});

const userStore = useUserStore();
const {
  entityPrivilegesEnumGroup,
  pathPrivilegesEnumGroup,
} = storeToRefs(userStore);

const { requestFn: getAuthByRole, data: authData, loading } = useRequest(AuthApi.getAuthByRole, {
  initData: {
    roleName: '',
    entityPrivileges: [],
    pathPrivileges: {},
  },
});

function getDetail() {
  getAuthByRole(currentRole.value).then(() => {
    if (authData.value.entityPrivileges.length === 0) {
      authData.value.entityPrivileges.push('CREATE_DATABASE');
    }
    nextTick(() => {
      entityTableRef.value?.doLayout();
    });

    intitalEntityVals.value = authData.value.entityPrivileges;
    intitalPathVals.value = authData.value.pathPrivileges;
  });
}

function handleAddRow() {}

function handleCheckedEntity(val: CheckboxValueType, type: string, index?: number) {
  console.log(val, type, index);
}

watch(
  () => currentRole.value,
  (val, old) => {
    if (val !== old) {
      if (!val) {
        console.log('空页面');
      } else {
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
</style>
