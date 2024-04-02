<template>
  <el-dialog
    :title="t('connection.connectionManagement')"
    v-model="dialogVisible"
    width="860px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    id="connection-modal"
    :before-close="handleClose"
  >
    <el-container class="connection-wrapper" v-loading="listLoading">
      <el-aside width="240px" class="connection-list-wrapper">
        <div class="connection-list-title">
          <h4>{{ t('connection.connectionList') }}</h4>
          <div>
            <el-button link class="m-r-8 svg-button-hover-color" @click="handleRefresh" id="connection-side-refresh"><i-custom-border-refresh /></el-button>
            <el-button link class="m-r-8 m-l-0 svg-button-hover-color" @click="handleGraph" id="connection-side-graph"><i-custom-graph /></el-button>
            <el-button link style="margin: 0" @click="handleAddConnection" id="connection-side-add"><i-custom-new-connection /></el-button>
          </div>
        </div>
        <el-input :placeholder="t('connection.namePlaceholder')" v-model="filterText" id="connection-list-input" @keyup.enter="handleFilter" class="connection-search-input">
          <template #prefix>
            <i-custom-search-icon class="remote-select-search-icon" />
          </template>
        </el-input>
        <div class="connection-list-box">
          <div class="list-empty-wrapper" v-if="!filterList.length">
            <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
            <span class="data-empty-text">{{ t('common.noData') }}</span>
          </div>
          <ul class="list-box" v-else>
            <li
              v-for="item in filterList"
              :key="item.id"
              :class="['connection-item-box', current === item.id ? 'connection-item-box-active' : '']"
              :id="`connection-item-${item.id === '' ? 'new' : item.id}`"
              @click="(e) => handleSelect(item, e)"
            >
              <span class="connection-item-text" :style="{ paddingLeft: item.id !== '' ? '' : '7px' }">
                <el-icon size="30" style="margin-right: 4px" v-if="item.id !== ''">
                  <i-custom-connection-cluster v-if="item.type === 1" />
                  <i-custom-connection-double-live v-else-if="item.type === 2" />
                  <i-custom-connection-stand-alone v-else />
                </el-icon>
                <text-tooltip :content="item.name" />
              </span>
              <popconfirm
                :confirm-button-text="t('common.confirm')"
                :cancel-button-text="t('common.cancel')"
                :title="t('connection.deleteTip')"
                v-if="item.id !== connectionStore.connectionInfo.data.id || route.name === 'Login'"
                :icon="ICustomError"
                width="200"
                :cancel-button-id="`connection-item-${item.id}-del-cancel`"
                :confirm-button-id="`connection-item-${item.id}-del-confirm`"
                @confirm="handleDelete(item)"
              >
                <template #reference>
                  <div class="connection-item-delete-box" :id="`connection-item-${item.id}-del`">
                    <i-custom-delete class="connection-item-delete" />
                    <i-custom-delete-active class="connection-item-delete-active" />
                  </div>
                </template>
              </popconfirm>
            </li>
          </ul>
        </div>
      </el-aside>
      <el-main class="connection-detail-wrapper" v-if="!filterList.length && editType !== 'add'" />
      <connection-form
        v-if="filterList.length || editType === 'add'"
        ref="connectionFormRef"
        v-model:edit-type="editType"
        v-model:detail-loading="detailLoading"
        :current="current"
        :is-toggle="isToggle"
        @handleRefreshList="getList"
      />
    </el-container>

    <modal-flow v-model:visible="flowVisible" :is-toggle="isToggle" @handleClose="getList" />
  </el-dialog>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { ConnectionApi } from '@/api';
import { useConnectionStore } from '@/stores';
import ModalFlow from '@/components/modal-flow.vue';
import ICustomError from '~icons/custom/error.svg';
import ConnectionForm from './connection/connection-form.vue';

const props = defineProps<{
  visible: boolean;
  isToggle?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleClose', id?: number): void;
}>();

const { t } = useI18n();
const route = useRoute();
const connectionStore = useConnectionStore();
const dialogVisible = useVModel(props, 'visible', emit);
const filterText = ref('');
const editType = ref<'add' | 'edit' | 'view'>('add');
const connectionFormRef = ref<InstanceType<typeof ConnectionForm>>();
const connectionList = ref<Connection.ConnectionItem[]>([]);
const filterList = ref<Connection.ConnectionItem[]>([]);
const current = ref<string | number>('');
const listLoading = ref(false);
const detailLoading = ref(false);
const flowVisible = ref(false);

const { requestFn: getConnectionList } = useRequest(ConnectionApi.getConnectionList);
const { requestFn: deleteConnection } = useRequest(ConnectionApi.deleteConnection);

function handleClose() {
  dialogVisible.value = false;
  emit('handleClose');
}

async function handleAddConnection() {
  if (editType.value === 'add' && filterList.value.length > 0) {
    const flag = await connectionFormRef.value?.handleChangeConnection();
    if (!flag) return;
    filterList.value.shift();
  }
  current.value = '';
  filterList.value.unshift({
    id: '',
    type: 0,
    name: t('connection.addConnection'),
    username: '',
  });
  editType.value = 'add';
  connectionFormRef.value?.handleChangeType(0);
  connectionFormRef.value?.resetOperateLoading();
}

// 获取实例列表
function getList(id?: number) {
  listLoading.value = true;
  detailLoading.value = true;
  getConnectionList()
    .then((res) => {
      const data = res.data || [];
      const standAloneList: Connection.ConnectionItem[] = [];
      const doubleLiveList: Connection.ConnectionItem[] = [];
      const clusterList: Connection.ConnectionItem[] = [];
      data.forEach((item) => {
        if (item.type === 1) {
          clusterList.push(item);
        } else if (item.type === 2) {
          doubleLiveList.push(item);
        } else {
          standAloneList.push(item);
        }
      });
      connectionList.value = [...standAloneList, ...clusterList, ...doubleLiveList];
      filterList.value = connectionList.value.filter((item) => item.name.includes(filterText.value));
      if (filterList.value.length) {
        const flag = !id && id !== 0 ? false : filterList.value.some((item) => +item.id === +id);
        current.value = flag ? id! : +filterList.value[0].id;
        connectionFormRef.value?.getDetail(current.value);
      } else {
        detailLoading.value = false;
      }
    })
    .finally(() => {
      listLoading.value = false;
    });
}

async function handleRefresh() {
  if (editType.value === 'add') {
    const flag = await connectionFormRef.value?.handleChangeConnection();
    if (!flag) return;
  }
  connectionFormRef.value?.resetOperateLoading();
  editType.value = 'edit';
  getList();
}

async function handleGraph() {
  if (editType.value === 'add') {
    const flag = await connectionFormRef.value?.handleChangeConnection();
    if (!flag) return;
  }
  flowVisible.value = true;
}

async function handleFilter() {
  if (editType.value === 'add') {
    const flag = await connectionFormRef.value?.handleChangeConnection();
    if (!flag) return;
  }
  editType.value = 'edit';
  filterList.value = connectionList.value.filter((item) => item.name.includes(filterText.value));
  if (filterList.value.length) {
    current.value = +filterList.value[0].id;
    connectionFormRef.value?.getDetail(current.value);
  }
}

const canStopPropagation = (e: HTMLElement): boolean => {
  const { classList } = e;

  if (classList.contains('connection-item-delete-box') || classList.contains('connection-item-delete') || classList.contains('connection-item-delete-active')) {
    return true;
  }
  if ((e.tagName === 'path' || e.tagName === 'g') && e.parentElement) {
    return canStopPropagation(e.parentElement);
  }
  return false;
};

function handleDelete(item: Connection.ConnectionItem) {
  if (item.id === '' && editType.value === 'add') {
    filterList.value.shift();
    connectionFormRef.value?.resetOperateLoading();
    editType.value = 'edit';
    getList();
    return;
  }
  deleteConnection(+item.id).then(() => {
    ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
    // 动画出现两遍，nexttick不好用
    setTimeout(() => {
      getList();
    }, 300);
  });
}

// 选择
async function handleSelect(item: Connection.ConnectionItem, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  if (editType.value === 'add' && item.id === '') return;
  if (editType.value === 'add') {
    const flag = await connectionFormRef.value?.handleChangeConnection();
    if (!flag) return;
    filterList.value.shift();
  } else if (editType.value === 'edit') {
    if (connectionFormRef.value?.isCanSave) {
      const flag = await connectionFormRef.value?.handleChangeConnection();
      if (!flag) return;
    }
  }
  connectionFormRef.value?.resetOperateLoading();
  current.value = +item.id;
  connectionFormRef.value?.getDetail(current.value);
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      editType.value = 'add';
      connectionFormRef.value?.handleChangeType(0);
      filterText.value = '';
      connectionList.value = [];
      filterList.value = [];
      current.value = '';
      listLoading.value = false;
      detailLoading.value = false;
      connectionFormRef.value?.resetOperateLoading();
      if (props.isToggle && connectionStore.connectionInfo.data.id) {
        getList(+connectionStore.connectionInfo.data.id);
      } else {
        getList();
      }
    }
  }
);
</script>

<style scoped lang="scss">
.connection-list-wrapper {
  height: 510px;
  border-radius: 6px;
  border: 1px solid #dfe1ed;
  margin-right: 8px;
}

.connection-list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 0;

  h4 {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }
}

.connection-search-input {
  padding: 20px 16px 16px;
}

.connection-list-box {
  border-radius: 2px;
  background: #fff;
  height: calc(100% - 104px);
  overflow-y: auto;

  .list-empty-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .data-empty-img {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
    }

    .data-empty-text {
      font-size: 14px;
      color: #131926;
      line-height: 21px;
    }
  }
}

.connection-item-box {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 300;
  color: #131926;
  padding-left: 8px;
  box-sizing: border-box;
  cursor: pointer;
  position: relative;

  .connection-item-text {
    width: 200px;
    display: inline-flex;
    align-items: center;
    line-height: 1.2;
  }

  .connection-item-delete-box {
    position: absolute;
    top: 10px;
    right: 4px;
    display: none;

    svg {
      width: 16px;
      height: 16px;
    }

    .connection-item-delete-active {
      display: none;
    }

    &:hover {
      .connection-item-delete {
        display: none;
      }

      .connection-item-delete-active {
        display: block;
      }
    }
  }

  &:hover {
    background-color: #f7f8fc;
    color: #495ad4;

    .connection-item-delete-box {
      display: block;
    }
  }
}

.connection-item-box-active {
  background-color: #f7f8fc;
  color: #495ad4;
}

.connection-detail-wrapper {
  width: 500px;
  height: 510px;
  border-radius: 6px;
  border: 1px solid #dfe1ed;
  padding: 0;
  display: flex;
  flex-direction: column;

  .connection-operate-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px 10px;
    flex: 0 0 28px;
  }

  .connection-detail-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }

  .el-scrollbar {
    padding: 0 9px;
  }
}
</style>
<style lang="scss">
.is-message-box {
  z-index: 9990 !important;
}
</style>
