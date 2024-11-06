<template>
  <el-dialog :title="t('measurement.tagDetail')" class="tag-modal" v-model="dialogVisible" width="480px" align-center :close-on-click-modal="false" id="tag-modal-database">
    <el-text id="tag-modal-detail">
      {{ description }}
    </el-text>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  measurement: string;
  description: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave'): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const saveloading = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive<{
  description: string;
}>({
  description: '',
});

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      saveloading.value = false;
      formRef.value?.resetFields();
      formData.description = props.description || '';
    }
  }
);
</script>
<style lang="scss">
.tag-modal {
  height: 200px;
  max-height: 200px;
}
</style>
