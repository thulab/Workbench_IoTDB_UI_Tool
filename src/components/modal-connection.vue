<template>
  <el-dialog
    title="实例管理"
    v-model="dialogVisible"
    width="748px"
    align-center
    :close-on-click-modal="false"
    id="connection-modal"
  >
    <el-container class="connection-wrapper">
      <el-aside width="240px" class="connection-list">
        <div class="connection-list-title">
          <h4>实例列表</h4>
          <div class="connection-operate-buttons">
            <el-button link class="m-r-8 border-refresh-icon" @click="getList" id="connection-side-refresh"><i-custom-refresh /></el-button>
            <el-button link style="margin: 0;" @click="handleAdd" id="connection-side-add"><i-custom-new-connection /></el-button>
          </div>
        </div>
      </el-aside>
      <el-main class="p-0">
        <h5>实例列表</h5>
        <el-form ref="formRef" :model="formData" :rules="rules" label-position="left" label-width="132px">
          <base-form-item label="实例名称:" prop="name">
            <el-input v-model="formData.name" placeholder="请输入实例名称" maxlength="50" show-word-limit id="connection-modalg-name" />
          </base-form-item>
        </el-form>
      </el-main>
    </el-container>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);

const formRef = ref<FormInstance>();
const rules = reactive({
  name: [
    {
      required: true,
      message: '请输入实例名称',
      trigger: 'blur',
    },
  ],
});
const formData = reactive({
  name: '',
});

function handleAdd() {}

// 获取实例列表
function getList() {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      ElMessage.success('创建成功！');
      dialogVisible.value = false;
      emit('handleSave');
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

<style scoped lang="scss">

.connection-list-title{
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
</style>
