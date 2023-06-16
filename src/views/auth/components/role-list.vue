<template>
  <div class="list-title">
    <h4>角色列表</h4>
    <div class="operate-buttons">
      <el-button link class="m-r-8 border-refresh-icon" @click="getList"><i-custom-refresh /></el-button>
      <el-button link style="margin: 0;" @click="handleAdd"><i-custom-new-role /></el-button>
    </div>
  </div>

  <ul class="list-box" v-loading="loading">
    <template v-if="list.length">
      <li v-for="item in list" :key="item" :class="['item-box', current === item && 'item-box-active']" @click="handleSelect(item)">
        <span class="item-text"><text-tooltip :content="item" /></span>
        <el-popconfirm
          confirm-button-text="确定"
          cancel-button-text="取消"
          title="删除角色后相关联的用户权限将立即消失，是否删除该角色？"
          :icon="ICustomError"
          width="300"
          @confirm="handleDelete(item)"
        >
          <template #reference>
            <div class="item-delete-box">
              <i-custom-delete class="item-delete" />
              <i-custom-delete-active class="item-delete-active" />
            </div>
          </template>
        </el-popconfirm>
      </li>
    </template>
    <li v-else class="item-box-empty">暂无角色</li>
  </ul>

  <modal-role
    v-model:visible="dialogVisible"
    @handle-save="getList"
  />
</template>

<script setup lang="ts">
import { AuthApi } from '@/api';
import ICustomError from '~icons/custom/error.svg';
import modalRole from './modal-role.vue';

const emit = defineEmits<{
  (event: 'handleSelect', payload: string): void;
}>();

const list = ref<string[]>([]);
const current = ref('');
const dialogVisible = ref(false);

const { requestFn: getRoleList, loading } = useRequest(AuthApi.getRoleList);
const { requestFn: deleteRole } = useRequest(AuthApi.deleteRole);

// 获取角色
function getList() {
  getRoleList().then((res) => {
    list.value = res.data || [];
    current.value = list.value[0] || '';
  });
}

// 新增角色
function handleAdd() {
  dialogVisible.value = true;
}

// 删除角色
function handleDelete(item: string) {
  deleteRole(item).then(() => {
    ElMessage.success('删除成功');
    getList();
  });
}

// 选择
function handleSelect(item: string) {
  current.value = item;
}

onMounted(() => {
  getList();
});

watch(
  () => current.value,
  (val) => {
    emit('handleSelect', val);
  },
  {
    immediate: true,
  },
);

defineExpose({ getList });
</script>

<style lang="scss" scoped>
.list-title{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 26px;

  h4{
    font-size: 14px;
    font-weight: 700;
    line-height: 20px;
    color: #495AD4;
  }
}

.el-button.border-refresh-icon{
  border-radius: 4px;
  border: 1px solid #DFE1ED !important;
  width: 24px;
  height: 24px !important;

  &:hover, &:focus{
    border-color: #DFE1ED !important;
  }

  svg{
    width: 18px;
    height: 18px;
  }
}

.list-box{
  height: calc(100% - 70px);
  overflow-y: auto;
}

.item-box{
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 300;
  color: #131926;
  padding-left: 16px;
  box-sizing: border-box;
  cursor: pointer;
  position: relative;

  .item-text{
    width: 200px;
    display: inline-flex;
    line-height: 1.2;
  }

  .item-delete-box{
    position: absolute;
    top: 10px;
    right: 4px;
    display: none;

    svg{
      width: 16px;
      height: 16px;
    }

    .item-delete-active{
      display: none;
    }

    &:hover {
      .item-delete{
        display: none;
      }

      .item-delete-active{
        display: block;
      }
    }
  }

  &:hover{
    background-color: #F7F8FC;
    color: #495AD4;

    .item-delete-box{
      display: block;
    }
  }
}

.item-box-empty{
  padding: 0 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 12px;
  font-weight: 300;
  line-height: 12px;
  color: #656A85;
  margin-top: 174px;
}

.item-box-active{
  background-color: #F7F8FC;
  color: #495AD4;
}
</style>
