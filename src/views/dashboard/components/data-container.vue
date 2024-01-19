<template>
  <div class="data-empty-wrapper" v-if="isEmpty">
    <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
    <span class="data-empty-text">{{ t('common.noData') }}</span>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
defineProps<{
  isEmpty: boolean,
}>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.data-empty-wrapper{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .data-empty-img{
    width: 120px;
    height: 120px;
    margin-bottom: 16px;
  }

  .data-empty-text {
    font-size: 14px;
    color: #131926;
    line-height: 21px;
  }
}
</style>
