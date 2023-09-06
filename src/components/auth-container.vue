<template>
  <div>
    <div v-if="isAuth === false" class="auth-tip-container">
      <img src="@/assets/auth-tip.png" alt="" class="auth-tip-img">
      <span class="auth-tip-text">暂无权限</span>
    </div>
    <slot v-if="isAuth"></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isAuth: boolean;
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
