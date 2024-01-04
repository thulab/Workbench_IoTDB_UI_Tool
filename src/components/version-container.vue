<template>
  <el-container>
    <div v-if="isShow === false" class="auth-tip-container">
      <slot name="otherTip"></slot>
      <img src="@/assets/auth-tip.png" alt="" class="auth-tip-img">
      <span class="auth-tip-text">请升级至IoTDB V{{versitonTip || '1.3.0'}}及以上版本使用</span>
    </div>
    <slot v-if="isShow"></slot>
  </el-container>
</template>

<script setup lang="ts">
defineProps<{
  isShow: boolean;
  versitonTip?: string;
}>();

</script>

<style lang="scss" scoped>
.auth-tip-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 16px 0;
  box-sizing: border-box;
  background-color: #fff;
  position: relative;

  .auth-tip-img{
    width: 150px;
    height: 150px;
    margin-bottom: 16px;
  }

  .auth-tip-text{
    font-size: 14px;
    color: #131926;
    line-height: 21px;
  }
}
</style>
