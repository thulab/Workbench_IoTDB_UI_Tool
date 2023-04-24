<template>
  <div>
    home page
    <el-button @click="showBox">clice me</el-button>
  </div>
</template>

<script lang="ts" setup>
ElMessage.success('hello world');
const showBox = () => {
  ElMessageBox.alert('hello world');
};
</script>
