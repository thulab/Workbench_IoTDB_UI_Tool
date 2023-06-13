<template>
  <el-container>
    <el-aside width="240px" class="list-wrapper">
      <list
        ref="roleListRef"
        @handleSelect="val => currentUser = val"
      />
    </el-aside>
    <el-container class="details-wrapper">
      <el-main class="p-0">
        <el-scrollbar>
          <h4>关联角色</h4>
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
        </el-scrollbar>
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
    />
  </el-container>
</template>

<script setup lang="ts">
import List from './components/user-list.vue';
import ModalPath from './components/modal-path.vue';

const listRef = ref<InstanceType<typeof List>>();
const currentUser = ref('');
const tableData = ref([]);
const pathVisible = ref(false);

function handleAddRow() {}

watch(
  () => currentUser.value,
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
.list-wrapper{
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.details-wrapper{
  // width: calc(100% - 256px);
  margin-left: 16px;

  // height: 100%;
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
