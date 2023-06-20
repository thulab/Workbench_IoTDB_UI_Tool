<template>
  <el-dialog
    title="关联角色"
    v-model="dialogVisible"
    width="480px"
    class="add-role-modal"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData">
      <base-form-item label="关联角色：" prop="name" :rules="requiredRules" class="m-t-12 m-b-0">
        <el-select v-model="formData.name" style="width:100%" placeholder="请输入角色名称" filterable :loading="getRoleListLoading">
          <template #prefix>
            <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
          </template>
          <el-option v-for="item in roleList" :key="item" :label="item" :value="item" :disabled="selected.includes(item)">
            <div class="remote-select-search-text">
              <text-tooltip :content="item" />
            </div>
          </el-option>
        </el-select>
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer m-t-34">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { AuthApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  selected: string[];
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'add-role', name: string): void;
}>();

const { requestFn: getRoleList, data: roleList, loading: getRoleListLoading } = useRequest(AuthApi.getRoleList, {
  initData: [],
});

const dialogVisible = useVModel(props, 'visible', emit);

const formRef = ref<FormInstance>();

const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: 'change',
  },
]);

const formData = reactive({
  name: '',
});

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      dialogVisible.value = false;
      emit('add-role', formData.name);
    }
  });
};
onMounted(() => {
  getRoleList();
});

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      getRoleList();
      formRef.value?.resetFields();
    }
  },
);

</script>
<style lang="scss">
.add-role-modal{
  .el-dialog__body {
    padding-bottom: 0 !important;
  }

  .remote-select-search-text{
    display: flex;
    width: 200px;
  }
}
</style>
