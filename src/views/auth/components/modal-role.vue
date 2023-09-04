<template>
  <el-dialog
    title="新建角色"
    v-model="dialogVisible"
    width="480px"
    align-center
    :close-on-click-modal="false"
    id="auth-role-modal"
  >
    <el-form ref="formRef" :model="formData" class="m-t-14 m-b-34">
      <base-form-item label="角色名：" prop="name" :rules="requiredRules">
        <el-input v-model="formData.name" placeholder="请输入角色名" maxlength="20" show-word-limit id="auth-role-modal-name" />
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="auth-role-modal-cancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm" id="auth-role-modal-confirm">确定</el-button>
      </div>
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
const formData = reactive({
  name: '',
});

const requiredRules = ref([
  {
    required: true,
    validator: (rule: any, value: any, callback: any) => {
      if (!value || !value.trim()) {
        return callback(new Error('请输入相应内容后进行操作'));
      } if (/[\u4e00-\u9fa5]+/.test(value)) {
        return callback(new Error('格式错误，不能包含中文'));
      }
      return callback();
    },
    trigger: 'blur',
  },
  {
    min: 4,
    max: 20,
    message: '字符长度不小于4，请重新输入',
    trigger: 'blur',
  },
]);

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
