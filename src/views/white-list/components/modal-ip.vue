<template>
  <el-dialog
    :title="editData ? '编辑白名单' : '添加白名单'"
    v-model="dialogVisible"
    width="480px"
    class="new-storage-container"
    align-center
    :close-on-click-modal="false"
    id="white-list-modal"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" class="m-t-14" label-position="left" @submit.prevent>
      <base-form-item label="IP地址:" prop="ip">
        <el-input v-model.trim="formData.ip" placeholder="请输入IP地址" id="white-list-modal-ip" />
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer m-t-16">
        <el-button @click="dialogVisible = false" id="white-list-modal-cancel">取消</el-button>
        <el-button type="primary" :loading="saveloading" @click="handleConfirm" id="white-list-modal-confirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  editData: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const saveloading = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive({
  ip: '',
});

const ipRegExp = /^(?:(?:1[0-9][0-9]\.)|(?:2[0-4][0-9]\.)|(?:25[0-5]\.)|(?:[1-9][0-9]\.)|(?:[0-9/*]\.)){3}(?:(?:1[0-9][0-9])|(?:2[0-4][0-9])|(?:25[0-5])|(?:[1-9][0-9])|(?:[0-9/*]))$/;
const rules = reactive({
  ip: [
    {
      required: true,
      trigger: ['blur'],
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          return callback('请输入相应内容后进行操作');
        } if (!ipRegExp.test(value)) {
          return callback('IP地址输入规则有误，请重新输入');
        }
        return callback();
      },
    },
  ],
});

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      ElMessage.success('保存成功！');
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
      formData.ip = props.editData ? props.editData : '';
    }
  },
);

</script>

<style scoped lang="scss">

.new-storage-container{
  position: relative;
}
</style>
