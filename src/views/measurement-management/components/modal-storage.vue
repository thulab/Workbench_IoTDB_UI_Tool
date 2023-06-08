<template>
  <el-dialog
    title="新建数据库"
    v-model="dialogVisible"
    width="480px"
    class="new-storage-container"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" class="source-form" label-position="left" label-width="120px">
      <el-form-item label="数据库名称:" prop="groupName">
        <el-input type="hidden" />
        <el-input v-model="formData.groupName" placeholder="请输入数据库名称" maxlength="59" show-word-limit>
          <template #prepend>root.</template>
        </el-input>
      </el-form-item>
      <el-form-item prop="ttl">
        <template #label><span style="margin-left: 9px;">数据保存时间:</span><el-tooltip effect="light" content="数据保存时间（TTL），到期后系统将自动删除数据，此处不填代表永久存储" placement="top"><i-custom-question /></el-tooltip>
        </template>
        <el-input type="hidden" />
        <el-input v-model="formData.ttl" min="0" max="9007199254740992" class="ttl-input">
          <template #append>
            <el-select v-model="formData.ttlUnit" style="width: 56px;" placeholder="">
              <el-option label="毫秒" value="millisecond" />
              <el-option label="秒" value="second" />
              <el-option label="分" value="minute" />
              <el-option label="小时" value="hour" />
              <el-option label="天" value="day" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveloading" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { StorageApi } from '@/api';

const props = defineProps<{
  serverId: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);

const formRef = ref<FormInstance>();
const rules = reactive({
  groupName: [
    {
      required: true,
      message: '请输入数据库名称',
      trigger: 'blur',
    },
    // {
    //   pattern: /^([`"'.a-zA-Z0-9_\u4e00-\u9fa5]*)$/,
    //   message: '请输入正确格式，只能由字母、数字、下划线以及UNICODE 中文字符组成',
    //   trigger: 'blur',
    // },
  ],
  ttl: [
    {
      required: false,
      pattern: /^[1-9]\d*$/,
      message: '存活时间只能为正整数',
      trigger: 'blur',
    },
  ],
});
const formData = reactive<{
  groupName: string | null;
  ttl: string | null;
  ttlUnit?: string;
}>({
  groupName: '',
  ttl: '',
  ttlUnit: 'day',
});
const { requestFn: saveStorageGroups, loading: saveloading } = useRequest(StorageApi.saveStorageGroups);

/**
 * new/edit storage
 */
const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (formData.ttl && +formData.ttl > 9007199254740992) {
        ElMessage.error('存活时间不能超过9007199254740992');
        return;
      }
      if (formData.ttl && !formData.ttlUnit) {
        ElMessage.error('存活时间和存活时间单位必须同时填写');
        return;
      }
      const reqObj = {
        groupName: `root.${formData.groupName}`,
        ttl: !formData.ttl ? undefined : +formData.ttl,
        ttlUnit: formData.ttlUnit || undefined,
      };
      saveStorageGroups(props.serverId, { ...reqObj }).then((res) => {
        if (res.code === 0) {
          ElMessage.success('创建成功！');
          dialogVisible.value = false;
          emit('handleSave');
        }
      });
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.ttlUnit = 'day';
    }
  },
);

</script>

<style scoped lang="scss">

.new-storage-container{
  position: relative;
}
</style>
