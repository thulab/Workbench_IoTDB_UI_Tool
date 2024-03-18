<template>
  <el-dialog :title="t('auth.relateUser')" v-model="dialogVisible" width="480px" class="add-user-modal" align-center :close-on-click-modal="false" id="auth-role-add-user-modal">
    <el-form ref="formRef" :model="formData" @submit.prevent>
      <base-form-item :label="`${t('auth.relateUser')}：`" prop="name" class="m-t-12 m-b-0">
        <el-select
          v-model="formData.name"
          style="width: 100%"
          :placeholder="t('auth.userPlaceholder')"
          collapse-tags
          multiple
          filterable
          :loading="loading"
          id="auth-role-add-user-modal-select-name"
          @change="handleChangeSelect"
          ref="userSelectRef"
        >
          <template #prefix>
            <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
          </template>
          <el-option v-for="item in userList" :key="item" :label="item" :value="item" :id="`auth-role-add-user-modal-select-name-select-${item}`" :disabled="isCanSelect(item)">
            <div class="remote-select-search-text">
              <text-tooltip :content="item" />
            </div>
          </el-option>
        </el-select>
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer m-t-34">
        <el-button @click="dialogVisible = false" id="auth-role-add-user-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="formData.name.length === 0" @click="handleConfirm" id="auth-role-add-user-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { ElSelect } from 'element-plus';
import { AuthApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  selected: string[];
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'add-user', name: string[]): void;
}>();

const { requestFn: getList, loading } = useRequest(AuthApi.getUserList);

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formData = reactive<{ name: string[] }>({
  name: [],
});
const userList = ref<string[]>([]);
const userSelectRef = ref<InstanceType<typeof ElSelect>>();

const handleConfirm = () => {
  dialogVisible.value = false;
  emit('add-user', formData.name);
};

function getUserList() {
  getList().then((res) => {
    userList.value = res.data.map((item) => item.name);
    userList.value.unshift(t('common.all'));
  });
}

function handleChangeSelect(vals: string[]) {
  if (vals.includes(t('common.all'))) {
    formData.name = userList.value.filter((item) => !props.selected.includes(item));
    formData.name.shift();
    userSelectRef.value?.blur();
  }
}

function isCanSelect(item: string) {
  if (item === t('common.all')) {
    return userList.value.length === props.selected.length + 1;
  }
  return props.selected.includes(item);
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formData.name = [];
      getUserList();
    }
  }
);
</script>
<style lang="scss">
.add-user-modal {
  .el-dialog__body {
    padding-bottom: 0 !important;
  }

  .remote-select-search-text {
    display: flex;
    width: 200px;
  }
}
</style>
