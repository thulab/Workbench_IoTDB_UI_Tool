<template>
  <el-dialog
    title="新建角色"
    v-model="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" label-position="right" label-width="90px">
      <base-form-item label="角色名：" prop="name" :rules="requiredRules">
        <el-input v-model="formData.name" placeholder="请输入角色名" maxlength="20" show-word-limit />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { AuthApi } from '@/api';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);

const formRef = ref<FormInstance>();

const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: 'blur',
  },
  {
    min: 4,
    max: 20,
    message: '字符长度不小于4，请重新输入',
    trigger: 'blur',
  },
]);

const formData = reactive({
  name: '',
});

const { requestFn: saveRole, loading } = useRequest(AuthApi.saveRole);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      saveRole(formData.name).then(() => {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        emit('handleSave');
      });
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
    }
  },
);

</script>
