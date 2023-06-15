<template>
  <el-container>
    <el-aside width="240px" class="list-wrapper">
      <list
        ref="listRef"
        @handle-select="val => currentUser = val"
      />
    </el-aside>
    <el-container class="details-wrapper">
      <el-header class="detail-title-box">
        <h4 class="detail-title-text">权限详情</h4>
        <el-button type="primary" v-if="canEdit">编辑</el-button>
      </el-header>
      <el-main class="p-x-16 p-t-0" v-loading="loading">
        <el-scrollbar>
          <div class="table-list-box" v-if="canEdit">
            <h4 class="table-box-title" style="display: inline-block;">关联角色：</h4>
            <el-tag>角色 1</el-tag>
          </div>
          <div class="table-list-box">
            <h4 class="table-box-title">全局</h4>
            <el-table :data="[authData.entityPrivileges]" style="width: 100%">
              <el-table-column label="全选" align="center" width="60">
                <template #default="{ row }">
                  <i-custom-correct v-if="row.length >= entityPrivilegesEnumKeys.length" />
                </template>
              </el-table-column>
              <el-table-column :label="group.group" v-for="group in entityPrivilegesEnumGroup" :key="group.group" align="center">
                <el-table-column :label="child.privileges" v-for="child in group.children" :key="child.privileges" align="center" :width="child.width">
                  <template #default="{ row }">
                    <i-custom-correct v-if="row.includes(child.privileges)" />
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
          <div class="table-list-box" v-if="canEdit">
            <h4 class="table-box-title">路径</h4>
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
          </div>
          <el-button style="width: 100%;" class="m-t-16" @click="handleAddRow" v-if="canEdit"><i-custom-add class="m-r-4" />添加路径</el-button>
        </el-scrollbar>
      </el-main>
      <el-footer>
        <div class="operate-buttons" v-if="canEdit">
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
import { AuthApi } from '@/api';
import List from './components/user-list.vue';
import ModalPath from './components/modal-path.vue';

const userStore = useUserStore();
const {
  entityPrivilegesEnumGroup,
  entityPrivilegesEnumKeys,
  pathPrivilegesEnumGroup,
  pathPrivilegesEnumKeys,
} = storeToRefs(userStore);

const listRef = ref<InstanceType<typeof List>>();
const currentUser = ref<Auth.DBUser>();
const tableData = ref([]);
const pathVisible = ref(false);
const canEdit = computed(() => currentUser.value?.isManager === 0);
const { requestFn: getUserAuth, data: authData, loading } = useRequest(AuthApi.getUserAuth, {
  initData: {
    userName: '',
    entityPrivileges: [],
    pathPrivileges: {},
    rolesToPrivileges: [],
  },
});

function handleAddRow() {}

function getDetail() {
  if (currentUser.value) {
    getUserAuth(currentUser.value.name).then(() => {
    // intitalEntityVals.value = authData.value.entityPrivileges;
    // intitalPathVals.value = authData.value.pathPrivileges;
    });
  }
}

watch(
  () => currentUser.value,
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
.list-wrapper{
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;
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

.details-wrapper{
  margin-left: 16px;
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
}

.operate-buttons{
  text-align: right;
  margin-top: 24px;
}
</style>
