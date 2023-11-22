<template>
  <ul class="context-menu-box">
    <li
      v-for="item in contextMenuList"
      :key="item.key"
      :class="['context-menu-item', { 'disabled-menu': disabledKey(item.key) }]"
      @click="handleClickOperate(item.key)"
    >{{ item.label }}</li>
  </ul>
</template>

<script setup lang="ts">

const props = defineProps<{
  contextMenuType: string;
}>();

const emit = defineEmits<{
  (evnet: 'handleClickOperate', key: string):void;
}>();

const contextMenuList = [
  { label: '复制', key: 'copy' },
  { label: '粘贴', key: 'paste' },
  { label: '撤销', key: 'undo' },
  { label: '恢复', key: 'redo' },
  { label: '删除节点', key: 'del' },
  { label: '删除边', key: 'delEdge' },
];

const disabledKey = (key: string) => {
  if (key === 'paste') {
    return false;
  }
  if (key === 'del') {
    return props.contextMenuType !== 'node';
  }
  if (key === 'delEdge') {
    return props.contextMenuType !== 'edge';
  }
  return false;
};

function handleClickOperate(key: string) {
  const flag = disabledKey(key);
  if (flag) return;
  emit('handleClickOperate', key);
}
</script>
<style lang="scss" scoped>
.context-menu-box{
  position: absolute;
  z-index: 10;
  width: 72px;
  border: 1px solid #DFE1ED;
  background-color: #fff;
  border-radius: 2px;
  padding: 11px 0;
  box-sizing: border-box;
  display: block;
  top: -9999px;
  left: -9999px;
  box-shadow: 0 4.26px 14.2px 0 rgb(32 37 71 / 6%);
  overflow: hidden;

  .context-menu-item{
    width: 100%;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    color: #424561;
    cursor: pointer;

    &:hover{
      background-color: #F7F8FC;
      color: #495AD4;
    }
  }

  .disabled-menu{
    opacity: 0.7;
    cursor: not-allowed;

    &:hover{
      background-color: #fff;
      color: #424561;
      opacity: 0.7;
    }
  }
}
</style>
