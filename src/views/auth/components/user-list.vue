<template>
  <div class="list-title">
    <h4>{{ t('auth.userList') }}</h4>
    <div class="operate-buttons">
      <auth-tooltip :is-disabled="canManageUser" :content="'common.userAuth'">
        <el-button link :disabled="!canManageUser" class="m-r-8 border-refresh-icon svg-button-hover-color" @click="getList()" id="auth-user-refresh"><i-custom-refresh /></el-button>
      </auth-tooltip>
      <auth-tooltip :is-disabled="canManageUser" :content="'common.userAuth'">
        <el-button link :disabled="!canManageUser" style="margin: 0" @click="handleAdd" id="auth-user-add"><i-custom-user-add /></el-button>
      </auth-tooltip>
    </div>
  </div>

  <ul class="list-box" v-loading="loading">
    <li v-for="(item, i) in list" :key="item.name" :class="['item-box', current === item.name ? 'item-box-active' : '']" :id="`auth-user-${i}`" @click="(e) => handleSelect(item.name, e)">
      <span class="item-text">
        <el-icon size="30">
          <i-custom-user-manager v-if="item.isManager" />
          <i-custom-user-normal v-else />
        </el-icon>
        <text-tooltip :content="t(item.name + (item.userId != null ? ` (${item.userId})` : ''))" />
      </span>
      <auth-tooltip :is-disabled="canManageUser || userName === item.name" :content="'common.userAuth'">
        <div class="item-edit-box" :style="{ cursor: !(canManageUser || userName === item.name) ? 'not-allowed' : 'pointer' }" :id="`auth-user-${i}-edit`" @click="handleEdit(item.name)">
          <i-custom-edit class="item-edit" />
          <i-custom-edit class="item-edit-active" />
        </div>
      </auth-tooltip>
      <popconfirm
        v-if="item.isManager === 0 && userName !== item.name"
        :confirm-button-text="t('common.confirm')"
        :cancel-button-text="t('common.cancel')"
        width="160px"
        :title="t('auth.deleteUserTip')"
        :icon="ICustomError"
        :cancel-button-id="`auth-user-${i}-del-cancel`"
        :confirm-button-id="`auth-user-${i}-del-confirm`"
        @confirm="handleDelete(item.name)"
      >
        <template #reference>
          <div class="item-delete-box" :id="`auth-user-${i}-del`">
            <i-custom-delete class="item-delete" />
            <i-custom-delete-active class="item-delete-active" />
          </div>
        </template>
      </popconfirm>
    </li>
  </ul>
  <modal-reset-password :title="t('auth.editUser')" :success-tip="t('auth.editUserSuccess')" :user-name="editUser" v-model:visible="modalVisible" />
  <modal-user v-model:visible="modalUserVisible" :user-list="list" @handle-save="(name) => getList(name)" />
</template>

<script setup lang="ts">
import { AuthApi } from '@/api';
import ModalResetPassword from '@/components/modal-reset-password.vue';
import ModalUser from './modal-user.vue';
import ICustomError from '~icons/custom/error.svg';
import type { DBUser } from '@/types';

const props = defineProps<{
  canManageUser: boolean;
  userName: string;
}>();

const emit = defineEmits<{
  (event: 'handleSelect', payload?: DBUser): void;
}>();

const { t } = useI18n();
const current = ref('');
const editUser = ref('');
const modalVisible = ref(false);
const modalUserVisible = ref(false);

const {
  requestFn: getUserList,
  data: list,
  loading,
} = useRequest(AuthApi.getUserList, {
  initData: [],
});
const { requestFn: deleteUser } = useRequest(AuthApi.deleteUser);

// 获取用户
function getList(name?: string) {
  getUserList().then(() => {
    current.value = name && list.value.some((item) => item.name === name) ? name : list.value[0]?.name || '';
  });
}

// 新增角色
function handleAdd() {
  modalUserVisible.value = true;
}

// 删除角色
function handleDelete(item: string) {
  deleteUser(item).then(() => {
    ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
    // 动画出现两遍，nexttick不好用
    setTimeout(() => {
      getList();
    }, 300);
  });
}

function handleEdit(item: string) {
  if (!(props.canManageUser || props.userName === item)) return;
  editUser.value = item;
  modalVisible.value = true;
}

const canStopPropagation = (e: HTMLElement): boolean => {
  const { classList } = e;

  if (
    classList.contains('item-edit-box') ||
    classList.contains('item-delete-box') ||
    classList.contains('item-edit') ||
    classList.contains('item-delete') ||
    classList.contains('item-edit-active') ||
    classList.contains('item-delete-active')
  ) {
    return true;
  }
  if ((e.tagName === 'path' || e.tagName === 'g') && e.parentElement) {
    return canStopPropagation(e.parentElement);
  }
  return false;
};
// 选择
function handleSelect(item: string, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  current.value = item;
}

onMounted(() => {
  getList();
});

watch(
  () => current.value,
  (val) => {
    emit(
      'handleSelect',
      list.value?.find((item) => item.name === val),
    );
  },
  {
    immediate: true,
  },
);

watch(
  () => list.value,
  (val) => {
    if (val.length === 0) {
      current.value = '';
    }
    if (!val.some((item) => item.name === current.value)) {
      current.value = val[0]?.name || '';
    }
  },
);

defineExpose({ getList });
</script>

<style lang="scss" scoped>
.list-title {
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

.list-box {
  height: calc(100% - 70px);
  overflow-y: auto;
}

.item-box {
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

  .item-text {
    width: 180px;
    display: inline-flex;
    line-height: 1.2;
    text-align: center;
    align-items: center;
  }

  .item-delete-box {
    position: absolute;
    top: 10px;
    right: 4px;
    display: none;

    svg {
      width: 16px;
      height: 16px;
    }

    .item-delete-active {
      display: none;
    }

    &:hover {
      .item-delete {
        display: none;
      }

      .item-delete-active {
        display: block;
      }
    }
  }

  .item-edit-box {
    position: absolute;
    top: 10px;
    right: 20px;
    display: none;

    svg {
      width: 16px;
      height: 16px;
    }

    .item-edit-active {
      display: none;

      :deep(path) {
        fill: #495ad4 !important;
      }
    }

    &:hover {
      .item-edit {
        display: none;
      }

      .item-edit-active {
        display: block;
      }
    }
  }

  &:hover {
    background-color: #f7f8fc;
    color: #495ad4;

    .item-delete-box {
      display: block;
    }

    .item-edit-box {
      display: block;
    }
  }
}

.item-box-active {
  background-color: #f7f8fc;
  color: #495ad4;
}
</style>
