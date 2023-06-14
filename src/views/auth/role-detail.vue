<template>
  <el-container>
    <el-aside width="240px" class="role-list-wrapper">
      <role-list
        ref="roleListRef"
        @handleSelect="val => currentRole = val"
      />
    </el-aside>
    <el-container class="role-details-wrapper">
      <el-main class="p-0">
        <h4>权限详情</h4>
        <el-table :data="tableData" style="width: 100%" border>
          <el-table-column label="全选" align="center" width="60" />
          <el-table-column v-for="(column, index) in entityPrivilegesLabel" :label="column" :key="column + '_' + index + '_column'" align="center">
            <el-table-column v-for="(col, ci) in entityColPrivilegesLabel(column)" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" align="center" :min-width="col.width || 180" />
          </el-table-column>
          <template #empty>
            <div class="table-empty-wrapper">
              <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
              <span class="data-empty-text">无数据</span>
            </div>
          </template>
        </el-table>

        <h4>路径</h4>
        <el-table :data="tableData" style="width: 100%" tooltip-effect="light" border>
          <el-table-column label="路径名称" align="center" width="160" show-overflow-tooltip />
          <el-table-column label="全选" align="center" width="60" />
          <el-table-column v-for="(column, index) in pathPrivilegesLabel" :label="column" :key="column + '_' + index + '_column'" align="center">
            <el-table-column v-for="(col, ci) in pathColPrivilegesLabel(column)" :label="col.privileges" :key="col.privileges + '_' + ci + '_col'" align="center" :min-width="col.width || 180" />
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
import { useUserStore } from '@/stores';
import RoleList from './components/role-list.vue';
import ModalPath from './components/modal-path.vue';

const roleListRef = ref<InstanceType<typeof RoleList>>();
const currentRole = ref('');
const tableData = ref([]);
const pathVisible = ref(false);

const userStore = useUserStore();
const {
  entityPrivilegesConfig,
  entityPrivilegesKeys: entityPrivilegesLabel,
  pathPrivilegesConfig,
  pathPrivilegesKeys: pathPrivilegesLabel,
} = storeToRefs(userStore);

const entityColPrivilegesLabel = computed(() => function (data: string) {
  return (entityPrivilegesConfig.value && entityPrivilegesConfig.value[data]) || [];
});

const pathColPrivilegesLabel = computed(() => function (data: string) {
  return (pathPrivilegesConfig.value && pathPrivilegesConfig.value[data]) || [];
});

function handleAddRow() {}

watch(
  () => currentRole.value,
  (val, old) => {
    if (val !== old) {
      if (!val) {
        console.log('空页面');
      } else {
        console.log('获取数据');
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
  padding: 8px 16px;
  box-sizing: border-box;
}

.operate-buttons{
  text-align: right;
  margin-top: 24px;
}
</style>
