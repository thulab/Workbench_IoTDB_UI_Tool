<template>
  <div style="display: flex;">
    <el-input v-model="model" readonly placeholder="请选择测点" />
    <el-button type="primary" class="m-l-12" @click="()=>dialogVisible = true">选择</el-button>
    <el-dialog title="测点选择" v-model="dialogVisible" :close-on-click-modal="false">
      <el-form :model="formData" :inline="false" label-width="120px">
        <el-form-item label="选择存储组" prop="database">
          <el-select placeholder="请选择存储组" />
        </el-form-item>
        <el-form-item label="查询维度">
          <el-radio label="按设备查询" />
          <el-radio label="按物理量查询" />
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: {
  type: [Array<String>, String ],
  default: undefined,
} }>();
const model = useVModel(props, 'modelValue');
const dialogVisible = ref(false);
const formData = reactive({
  database: '',
  device: '',
  physical: '',
});
</script>
