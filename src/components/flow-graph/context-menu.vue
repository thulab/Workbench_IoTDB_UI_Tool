<template>
  <ul class="context-menu-box">
    <li
      v-for="item in contextMenuList"
      :key="item.key"
      class="context-menu-item"
      @click="handleClickOperate(item.key)"
    >{{ item.label }}</li>
  </ul>
</template>

<script setup lang="ts">

const emit = defineEmits<{
  (evnet: 'handleClickOperate', key: string):void;
}>();

const contextMenuList = [
  { label: '复制', key: 'copy' },
  { label: '粘贴', key: 'paste' },
  { label: '撤销', key: 'undo' },
  { label: '恢复', key: 'redo' },
];

function handleClickOperate(key: string) {
  emit('handleClickOperate', key);
}
</script>
<style lang="scss" scoped>
.context-menu-box{
  position: absolute;
  z-index: 10;
  width: 64px;
  background-color: #fff;
  border-radius: 6px;
  display: block;
  top: -9999px;
  left: -9999px;
  box-shadow: 0 6px 16px 0 rgb(0 0 0 / 8%), 0 3px 6px -4px rgb(0 0 0 / 12%), 0 9px 28px 8px rgb(0 0 0 / 5%);
  overflow: hidden;

  .context-menu-item{
    width: 100%;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: #424561;
    cursor: pointer;

    &:hover{
      background-color: #495AD4;
      color: #fff;
    }
  }
}
</style>
