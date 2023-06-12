<template>
  <div class="role-page-container">
    <div class="role-list-wrapper">
      <role-list
        ref="roleListRef"
        @handleSelect="val => currentRole = val"
      />
    </div>
    <div class="role-details-wrapper">
      <h4>权限详情</h4>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column label="全选" align="center" width="60" />
        <el-table-column label="数据库管理" align="center">
          <el-table-column label="CREATE_DATABASE" align="center" width="180" />
        </el-table-column>
        <el-table-column label="时间序列管理" align="center">
          <el-table-column label="READ" align="center" width="70" />
          <el-table-column label="WRITE_SCHEMA" align="center" width="140" />
          <el-table-column label="WRITE_DATA" align="center" width="140" />
        </el-table-column>
        <el-table-column label="权限管理" align="center">
          <el-table-column label="MANAGE_USER" align="center" width="140" />
          <el-table-column label="MANAGE_ROLE" align="center" width="140" />
          <el-table-column label="ALTER_PASSWORD" align="center" width="160" />
        </el-table-column>
        <el-table-column label="高级功能" align="center">
          <el-table-column label="TRIGGER" align="center" width="140" />
          <el-table-column label="CQ" align="center" width="80" />
        </el-table-column>
        <el-table-column label="运维命令" align="center">
          <el-table-column label="MAINTAIN" align="center" width="140" />
        </el-table-column>
        <template #empty>
          <div class="table-empty-wrapper">
            <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
            <span class="data-empty-text">无数据</span>
          </div>
        </template>
      </el-table>

      <h4>路径</h4>
      <el-table :data="tableData" style="width: 100%" tooltip-effect="light">
        <el-table-column label="路径名称" align="center" width="150" show-overflow-tooltip />
        <el-table-column label="全选" align="center" width="60" />
        <el-table-column label="时间序列管理" align="center">
          <el-table-column label="READ" align="center" min-width="70" />
          <el-table-column label="WRITE_SCHEMA" align="center" min-width="140" />
          <el-table-column label="WRITE_DATA" align="center" min-width="140" />
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

      <div class="operate-buttons">
        <el-button>重置</el-button>
        <el-button type="primary">应用</el-button>
      </div>
    </div>

    <modal-path
      v-model:visible="pathVisible"
    />
  </div>
</template>

<script setup lang="ts">
import RoleList from './components/role-list.vue';
import ModalPath from './components/modal-path.vue';

const roleListRef = ref<InstanceType<typeof RoleList>>();
const currentRole = ref('');
const tableData = ref([]);
const pathVisible = ref(false);

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
  width: 240px;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.role-details-wrapper{
  width: calc(100% - 256px);
  margin-left: 256px;
  height: 100%;
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
