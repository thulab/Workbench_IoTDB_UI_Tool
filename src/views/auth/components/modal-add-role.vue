<template>
  <el-dialog :title="t('auth.relateRole')" v-model="dialogVisible" width="480px" class="add-role-modal" align-center :close-on-click-modal="false" id="auth-user-add-role-modal">
    <el-form ref="formRef" :model="formData" @submit.prevent>
      <base-form-item :label="`${t('auth.relateRole')}：`" prop="name" class="m-t-12 m-b-0">
        <el-select
          v-model="formData.name"
          style="width: 100%"
          :placeholder="t('auth.rolePlaceholder')"
          collapse-tags
          multiple
          filterable
          :loading="loading"
          id="auth-user-add-role-modal-select-name"
          @change="handleChangeSelect"
          ref="roleSelectRef"
        >
          <template #prefix>
            <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
          </template>
          <el-option v-for="item in roleList" :key="item" :label="item" :value="item" :id="`auth-user-add-role-modal-select-name-select-${item}`" :disabled="isCanSelect(item)">
            <div class="remote-select-search-text">
              <text-tooltip :content="item" />
            </div>
          </el-option>
        </el-select>
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer m-t-34">
        <el-button @click="dialogVisible = false" id="auth-user-add-role-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="formData.name.length === 0" @click="handleConfirm" id="auth-user-add-role-modal-confirm">{{ t('common.confirm') }}</el-button>
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
  (event: 'add-role', name: string[]): void;
}>();

const { requestFn: getList, loading } = useRequest(AuthApi.getRoleList);

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);

const formData = reactive<{ name: string[] }>({
  name: [],
});
const roleList = ref<string[]>([]);
const roleSelectRef = ref<InstanceType<typeof ElSelect>>();

function getRoleList() {
  getList().then((res) => {
    roleList.value = res.data.map((item) => item);
    roleList.value.unshift(t('common.all'));
  });
}

function handleChangeSelect(vals: string[]) {
  if (vals.includes(t('common.all'))) {
    formData.name = roleList.value.filter((item) => !props.selected.includes(item));
    formData.name.shift();
    roleSelectRef.value?.blur();
  }
}

function isCanSelect(item: string) {
  if (item === t('common.all')) {
    return roleList.value.length === props.selected.length + 1;
  }
  return props.selected.includes(item);
}

const handleConfirm = () => {
  dialogVisible.value = false;
  emit('add-role', formData.name);
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formData.name = [];
      getRoleList();
    }
  },
);
</script>
<style lang="scss">
.add-role-modal {
  .el-dialog__body {
    padding-bottom: 0 !important;
  }

  .remote-select-search-text {
    display: flex;
    width: 200px;
  }
}
</style>
