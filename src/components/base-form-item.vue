<!-- 自定义 form-item 用于解决 for 属性不生效 无法屏蔽无障碍模式的问题  -->
<template>
  <el-form-item>
    <template #label>
      <slot name="label"></slot>
    </template>
    <el-input type="hidden" />
    <slot></slot>
  </el-form-item>
</template>
