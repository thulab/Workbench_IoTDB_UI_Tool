<template>
  <div class="storage-list-title">
    <h4>数据库</h4>
    <div class="storage-operate-buttons">
      <el-button link class="m-r-8 border-refresh-icon" @click="getStorageList"><i-custom-refresh /></el-button>
      <el-button link style="margin: 0;" @click="handleAddStorage"><i-custom-new-storage /></el-button>
    </div>
  </div>

  <ul class="storage-list-box" :loading="storageLoading">
    <li v-for="item in storageList" :key="item" :class="['storage-item-box', currentStorage === item && 'storage-item-box-active']" @click="handleSelectStorage(item)">
      <span class="storage-item-text"><text-tooltip :content="item" /></span>
      <div class="storage-item-delete-box" @click="handleDeleteStorage(item)">
        <i-custom-delete class="storage-item-delete" />
        <i-custom-delete-active class="storage-item-delete-active" />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { StorageApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const props = defineProps<{
  serverId: number;
}>();

const emit = defineEmits<{
  (event: 'handleAddStorage'): void;
  (event: 'handleSelectStorage', payload: string): void;
}>();

const storageList = ref<string[]>([]);
const currentStorage = ref('');

const { requestFn: getGroup, loading: storageLoading } = useRequest(StorageApi.getStorageGroups);
const { requestFn: deleteStorageGroups } = useRequest(StorageApi.deleteStorageGroups);

// 获取数据库
function getStorageList() {
  getGroup({ serverId: props.serverId }).then((res) => {
    storageList.value = res.data?.pathNames || [];
    currentStorage.value = storageList.value[0] || '';
  });
}

// 新增数据库
function handleAddStorage() {
  emit('handleAddStorage');
}

// 删除数据库
function handleDeleteStorage(item: string) {
  ElMessageBox.confirm('此操作会删除数据库下全部测点和数据，是否删除？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      deleteStorageGroups(props.serverId, item).then((res) => {
        if (res.code === 0) {
          ElMessage.success('删除存储组成功');
          getStorageList();
        }
      });
    });
}

// 选择
function handleSelectStorage(item: string) {
  currentStorage.value = item;
}

onMounted(() => {
  getStorageList();
});

watch(
  () => currentStorage.value,
  (val) => {
    emit('handleSelectStorage', val);
  },
  {
    immediate: true,
  },
);

defineExpose({ getStorageList });
</script>

<style lang="scss" scoped>
.storage-list-title{
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

.border-refresh-icon{
  border-radius: 4px;
  border: 1px solid #DFE1ED;

  &:hover{
    border-color: #DFE1ED !important;
  }

  svg{
    width: 18px;
    height: 18px;
  }
}

.storage-list-box{
  height: calc(100% - 70px);
  overflow-y: auto;
}

.storage-item-box{
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

  .storage-item-text{
    max-width: 156px;
  }

  .storage-item-delete-box{
    position: absolute;
    top: 10px;
    right: 4px;
    display: none;

    svg{
      width: 16px;
      height: 16px;
    }

    .storage-item-delete-active{
      display: none;
    }

    &:hover {
      .storage-item-delete{
        display: none;
      }

      .storage-item-delete-active{
        display: block;
      }
    }
  }

  &:hover{
    background-color: #F7F8FC;
    color: #495AD4;

    .storage-item-delete-box{
      display: block;
    }
  }
}

.storage-item-box-active{
  background-color: #F7F8FC;
  color: #495AD4;
}
</style>
