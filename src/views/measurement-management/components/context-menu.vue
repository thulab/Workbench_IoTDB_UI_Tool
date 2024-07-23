<template>
  <ul class="context-menu-box">
    <auth-tooltip v-if="isShowDatabase" :is-disabled="canManageDatabase" :content="'common.databaseAuth'">
      <li :id="`tree-node-dropdown-new-database-${clickedNodeData.nodePath}`" :class="['context-menu-item', { 'disabled-menu': !canManageDatabase }]" @click="handleCommand('database')">
        {{ t('measurement.newDataBase') }}
      </li>
    </auth-tooltip>
    <auth-tooltip v-if="isShowMeasurement" :is-disabled="canWriteSchemaByPath" :content="'common.schemaAuthAnother'">
      <li :id="`tree-node-dropdown-new-measurement-${clickedNodeData.nodePath}`" :class="['context-menu-item', { 'disabled-menu': !canWriteSchemaByPath }]" @click="handleCommand('measurement')">
        {{ t('measurement.newMeasurement') }}
      </li>
    </auth-tooltip>
    <el-tooltip placement="top-start" effect="light" trigger="hover" :content="deleteTip" :disabled="deleteTipDisabled" popper-class="tooltip-box-width">
      <li :id="`tree-node-dropdown-delete-${clickedNodeData.nodePath}`" :class="['context-menu-item', { 'disabled-menu': !deleteTipDisabled }]" @click="handleCommand('delete')">
        {{ t('common.delete') }}
      </li>
    </el-tooltip>
  </ul>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores';
import { getPathAuthList } from '@/utils/auth';

const props = defineProps<{
  clickedNodeData: StorageDevice.TreeNodeData;
}>();

const emit = defineEmits<{
  (evnet: 'handleCommand', key: string): void;
}>();

const { t } = useI18n();
const userStore = useUserStore();
const { canManageDatabase, userAllEntityPrivileges, userAllPathPrivileges } = storeToRefs(userStore);

const isShowDatabase = computed(() => {
  return props.clickedNodeData.node === 'root' || props.clickedNodeData.nodeType === 'SG INTERNAL';
});
const isShowMeasurement = computed(() => {
  return props.clickedNodeData.nodeType !== 'TIMESERIES' && props.clickedNodeData.nodePath !== 'root.__system';
});

const canWriteSchemaByPath = computed(() => {
  if (userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  if (!props.clickedNodeData.nodePath) return false;
  const authList = getPathAuthList(props.clickedNodeData.nodePath, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('WRITE_SCHEMA');
  }
  return false;
});

const deleteTip = computed(() => {
  if (props.clickedNodeData.nodeType === 'DATABASE' && !canManageDatabase.value) {
    return t('common.databaseAuth');
  }
  if (!canWriteSchemaByPath.value) {
    return t('common.schemaAuthAnother');
  }
  return '';
});

const deleteTipDisabled = computed(() => {
  if (props.clickedNodeData.nodeType === 'DATABASE' && canManageDatabase.value) {
    return true;
  }
  if (canWriteSchemaByPath.value) {
    return true;
  }
  return false;
});

function handleCommand(key: string) {
  if ((key === 'database' && canManageDatabase.value) || (key === 'measurement' && canWriteSchemaByPath.value) || (key === 'delete' && deleteTipDisabled.value)) {
    emit('handleCommand', key);
  }
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
