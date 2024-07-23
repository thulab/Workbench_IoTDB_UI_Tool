<template>
  <ul class="context-menu-box">
    <li v-if="isShowDatabase" :id="`tree-node-dropdown-new-database-${nodePath}`" :class="['context-menu-item']" @click="handleCommand('database')">
      {{ t('measurement.newDataBase') }}
    </li>
    <li v-if="isShowMeasurement" :id="`tree-node-dropdown-new-measurement-${nodePath}`" :class="['context-menu-item']" @click="handleCommand('measurement')">
      {{ t('measurement.newMeasurement') }}
    </li>
    <li v-if="isShowDelete" :id="`tree-node-dropdown-delete-${nodePath}`" :class="['context-menu-item']" @click="handleCommand('delete')">
      {{ t('common.delete') }}
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  nodePath: string;
  isShowDatabase: boolean;
  isShowMeasurement: boolean;
  isShowDelete: boolean;
}>();

const emit = defineEmits<{
  (evnet: 'handleCommand', key: string): void;
}>();

const { t } = useI18n();

function handleCommand(key: string) {
  emit('handleCommand', key);
}
</script>
<style lang="scss" scoped>
.context-menu-box {
  position: absolute;
  z-index: 10;
  min-width: 72px;
  border: 1px solid #dfe1ed;
  background-color: #fff;
  border-radius: 2px;
  padding: 6px 0;
  box-sizing: border-box;
  display: block;
  top: -9999px;
  left: -9999px;
  box-shadow: 0 4.26px 14.2px 0 rgb(32 37 71 / 6%);
  overflow: hidden;

  .context-menu-item {
    width: 100%;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    color: #656a85;
    cursor: pointer;

    &:hover {
      background-color: #f7f8fc;
      color: #495ad4;
    }
  }

  .disabled-menu {
    opacity: 0.7;
    cursor: not-allowed;

    &:hover {
      background-color: #fff;
      color: #424561;
      opacity: 0.7;
    }
  }
}
</style>
