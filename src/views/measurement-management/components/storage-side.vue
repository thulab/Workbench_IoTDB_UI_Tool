<template>
  <div class="storage-list-title">
    <h4>{{ t('measurement.databaseTitle') }}</h4>
    <div class="storage-operate-buttons">
      <el-button link class="m-r-8 border-refresh-icon" @click="getStorageList()" id="mesaurement-side-refresh"><i-custom-refresh /></el-button>
      <auth-tooltip :is-disabled="canManageDatabase">
        <el-button link style="margin: 0" :disabled="!canManageDatabase" @click="handleAddStorage" id="mesaurement-side-add"><i-custom-new-storage /></el-button>
      </auth-tooltip>
    </div>
  </div>

  <auth-container :is-auth="canReadWriteSchema" style="height: calc(100% - 70px)">
    <ul class="storage-list-box" v-loading="storageLoading">
      <template v-if="storageList.length">
        <li v-for="(item, i) in storageList" :key="item" :class="['storage-item-box', currentStorage === item ? 'storage-item-box-active' : '']" @click="(e) => handleSelectStorage(item, e)">
          <span class="storage-item-text"><text-tooltip :content="item" /></span>
          <auth-tooltip :is-disabled="canManageDatabase">
            <div
              class="storage-item-delete-box"
              :style="{ cursor: item === 'root.__system' || !canManageDatabase ? 'not-allowed' : 'pointer' }"
              :id="`mesaurement-side-${i}-del`"
              @click="handleDeleteStorage(item)"
            >
              <i-custom-delete class="storage-item-delete" />
              <i-custom-delete-active class="storage-item-delete-active" />
            </div>
          </auth-tooltip>
        </li>
      </template>
      <li v-else class="item-box-empty">{{ t('common.noData') }}</li>
    </ul>
  </auth-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { StorageApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const props = defineProps<{
  canReadWriteSchema: boolean;
  canManageDatabase: boolean;
}>();

const emit = defineEmits<{
  (event: 'handleAddStorage'): void;
  (event: 'handleSelectStorage', payload: string): void;
}>();

const route = useRoute();
const { t } = useI18n();
const storageList = ref<string[]>([]);
const currentStorage = ref((route.query.databse as string) || '');

const { requestFn: getGroup, loading: storageLoading } = useRequest(StorageApi.getStorageGroups);
const { requestFn: deleteStorageGroups } = useRequest(StorageApi.deleteStorageGroups);

// 获取数据库
function getStorageList(isInitial?: boolean, current?: string) {
  getGroup({}).then((res) => {
    let data = res.data?.pathNames || [];
    if (data.some((s) => s === 'root.__system')) {
      data = data.filter((item) => item !== 'root.__system');
      data.push('root.__system');
    }
    storageList.value = data;
    if (route.query.databse && isInitial) {
      currentStorage.value = route.query.databse as string;
    } else if (current && storageList.value.some((database) => database === current)) {
      currentStorage.value = current;
    } else {
      currentStorage.value = storageList.value[0] || '';
    }
  });
}

// 新增数据库
function handleAddStorage() {
  emit('handleAddStorage');
}

const canStopPropagation = (e: HTMLElement): boolean => {
  const { classList } = e;

  if (classList.contains('storage-item-delete-box') || classList.contains('storage-item-delete') || classList.contains('storage-item-delete-active')) {
    return true;
  }
  if ((e.tagName === 'path' || e.tagName === 'g') && e.parentElement) {
    return canStopPropagation(e.parentElement);
  }
  return false;
};

// 删除数据库
function handleDeleteStorage(item: string) {
  if (!props.canManageDatabase) return;
  if (item === 'root.__system') return;
  ElMessageBox.confirm(t('measurement.deleteDatabaseTip'), t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'mesaurement-side-del-confirm',
    cancelButtonClass: 'mesaurement-side-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    deleteStorageGroups(item).then((res) => {
      if (res.code === 0) {
        ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
        getStorageList();
      }
    });
  });
}

// 选择
function handleSelectStorage(item: string, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  currentStorage.value = item;
}

onMounted(() => {
  if (!props.canReadWriteSchema) return;
  getStorageList(true);
});

watch(
  () => currentStorage.value,
  (val) => {
    emit('handleSelectStorage', val);
  },
  {
    immediate: true,
  }
);

watch(
  () => props.canReadWriteSchema,
  (val) => {
    if (val) {
      getStorageList();
    }
  },
  {
    immediate: true,
  }
);

defineExpose({ getStorageList });
</script>

<style lang="scss" scoped>
.storage-list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 26px;

  h4 {
    font-size: 14px;
    font-weight: 700;
    line-height: 20px;
    color: #495ad4;
  }
}

.el-button.border-refresh-icon {
  border-radius: 4px;
  border: 1px solid #dfe1ed !important;
  width: 24px;
  height: 24px !important;

  &:hover,
  &:focus {
    border-color: #dfe1ed !important;
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

.storage-list-box {
  height: calc(100% - 70px);
  overflow-y: auto;
}

.storage-item-box {
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

  .storage-item-text {
    width: 200px;
    display: inline-flex;
    line-height: 1.2;
  }

  .storage-item-delete-box {
    position: absolute;
    top: 10px;
    right: 4px;
    display: none;

    svg {
      width: 16px;
      height: 16px;
    }

    .storage-item-delete-active {
      display: none;
    }

    &:hover {
      .storage-item-delete {
        display: none;
      }

      .storage-item-delete-active {
        display: block;
      }
    }
  }

  &:hover {
    background-color: #f7f8fc;
    color: #495ad4;

    .storage-item-delete-box {
      display: block;
    }
  }
}

.storage-item-box-active {
  background-color: #f7f8fc;
  color: #495ad4;
}

.item-box-empty {
  padding: 0 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 12px;
  font-weight: 300;
  line-height: 12px;
  color: #656a85;
  margin: 200px 0 0;
}
</style>
