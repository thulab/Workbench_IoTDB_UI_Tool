<template>
  <div class="database-detail-wrapper">
    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px); align-items: center">
        <i-custom-field class="m-r-8" />
        <text-tooltip :content="`${currentNode?.nodeName}`" />
      </div>
      <span class="m-l-8">{{ t('dataManage.schema') }}</span>
    </h4>
    <div class="database-info-box">
      <ul class="database-info-list">
        <li class="database-info-item" id="device-total-li">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.ttl') }}：</span>
          {{ databaseInfos?.ttl ? databaseInfos?.ttl : '-' }}
          <el-icon
            size="24"
            class="m-r-6 svg-button-hover-color"
            style="cursor: pointer"
            @click="
              modalTtlVisible = true;
              ttlType = 'db';
            "
          >
            <i-custom-edit />
          </el-icon>
        </li>
        <li class="database-info-item" id="measurement-total-li">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.partitionInterval') }}：</span>
          {{ databaseInfos?.partitionInterval }} {{ databaseInfos?.partitionIntervalUnit }}
        </li>
        <li class="database-info-item" id="measurement-total-li">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.schemaDuplicate') }}：</span>
          {{ databaseInfos?.schemaDuplicate }}
        </li>
        <li class="database-info-item" id="measurement-total-li">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.dataDuplicate') }}：</span>
          {{ databaseInfos?.dataDuplicate }}
        </li>
        <li class="database-info-item" id="measurement-total-li">
          <span class="database-info-item-label" id="measurement-total-span">{{ t('dataManage.tables') }}：</span>
          {{ currentNode?.children?.length || 0 }}
        </li>
      </ul>
    </div>

    <div class="search-form-container">
      <div class="search-form-box">
        <el-input v-model="searchKeyword" :placeholder="searchPlaceholder" @keyup.enter="handleRefresh" id="mesaurement-search" style="width: 340px">
          <template #prefix>
            <i-custom-search-icon class="remote-select-search-icon" @click="handleRefresh" />
          </template>
          <template #prepend>
            <el-select v-model="searchType" style="width: 88px" placeholder="" id="measurement-search-type" class="measurement-search-type-select">
              <el-option :label="t('dataManage.tableName')" value="tableName" id="measurement-search-type-name" />
              <el-option :label="t('dataManage.comment')" value="comment" id="measurement-search-type-description" />
            </el-select>
          </template>
        </el-input>
      </div>

      <div class="search-form-buttons">
        <el-button type="primary" id="table-add">
          {{ t('common.add') }}
        </el-button>
        <el-button type="primary" id="mesaurement-batch-del">
          {{ t('common.batchDelete') }}
        </el-button>
        <el-button link @click="handleRefresh" id="mesaurement-refresh" class="svg-button-hover-color">
          <i-custom-refresh style="width: 24px; height: 24px" />
        </el-button>
      </div>
    </div>

    <div class="storage-table-box">
      <el-table
        :data="currentNode?.children || []"
        style="width: 100%"
        :height="maxTableHeight"
        :max-height="maxTableHeight"
        tooltip-effect="light"
        ref="tableRef"
        :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column :label="t('dataManage.tableName')" prop="nodeName" :show-overflow-tooltip="true" />
        <el-table-column :label="t('dataManage.comment')" prop="comment" :show-overflow-tooltip="true" />
        <el-table-column label="TTL(ms)" prop="ttl" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <div class="row-description-box">
              <div class="row-description-text">
                <text-tooltip :content="row.ttl || ''" />
              </div>
              <div class="edit-box flex-align-center" @click="handleEditTableTTL(row)">
                <i-custom-edit-normal class="edit-icon" />
                <i-custom-edit-active class="edit-icon-active" />
              </div>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-wrapper">
            <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
            <span class="data-empty-text">{{ t('common.noData') }}</span>
          </div>
        </template>
      </el-table>
    </div>

    <div class="sql-statement">
      <div>sql语句</div>
      <el-icon size="24" class="svg-button-hover-color copy-icon"><i-custom-copy /></el-icon>
    </div>
    <modal-ttl v-model:visible="modalTtlVisible" :current-node="currentNode" :current-table="currentTable" :type="ttlType" :key="modalTTLNum" @handle-save="handleRefresh()" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { StorageApi } from '@/api';
import { useTableHeight } from '@/composition-api';
import ModalTtl from './modal-ttl.vue';

const props = defineProps<{
  currentNode: IoTDB.TreeNodeData;
}>();

const { t } = useI18n();
const route = useRoute();
const { requestFn: getDatabaseInfo } = useRequest(StorageApi.getDatabaseInfoTable);
const searchKeyword = ref((route.query.databaseSearch as string) || '');
const databaseInfos = ref<StorageDevice.DatabaseInfo | null>(null);
const searchType = ref('tableName');
const searchPlaceholder = computed(() => (searchType.value === 'tableName' ? t('dataManage.tableNamePlaceholder') : t('dataManage.commentPlaceholder')));
const { maxTableHeight } = useTableHeight(370);
const modalTtlVisible = ref(false);
const currentTable = ref<IoTDB.TreeNodeData>();
const modalTTLNum = ref(0);
const ttlType = ref('db'); // 'db' or 'table'

// 存储组详细信息
function getDatabaseDetail(data: string) {
  getDatabaseInfo(data).then((res) => {
    if (res?.code === 0) {
      databaseInfos.value = res.data;
    }
  });
}

onMounted(() => {
  getDatabaseDetail(props.currentNode?.nodeName || '');
});

function handleEditTableTTL(row: IoTDB.TreeNodeData) {
  ttlType.value = 'table';
  currentTable.value = row;
  modalTtlVisible.value = true;
  modalTTLNum.value++;
}

watch(
  () => props.currentNode,
  (newNode) => {
    if (newNode) {
      getDatabaseDetail(newNode.nodeName);
    }
  }
);

function handleRefresh() {
  getDatabaseDetail(props.currentNode?.nodeName || '');
}
</script>
<style lang="scss" scoped>
.database-detail-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.info-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
  padding: 14px 0 6px 16px;
  border-bottom: 1px solid #dfe1ed;
  display: flex;
  align-items: center;
}

.database-info-box {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
}

.database-info-list {
  flex: 1;
}

.database-info-item {
  font-size: 12px;
  line-height: 1.2;
  color: #656a85;
  margin: 0 36px 0 0;
  display: inline-flex;
  align-items: center;

  &:last-child {
    margin-right: 0;
  }

  .database-info-item-label {
    color: #131926;
    position: relative;
    margin-right: 4px;
    white-space: nowrap;
  }
}

.search-form-container {
  display: flex;
  justify-content: space-between;
  padding: 16px;

  .search-form-box {
    display: flex;
    align-items: center;
  }

  .measurement-search-type-select {
    :deep(.el-select__wrapper) {
      text-align: center;
    }
  }
}

.storage-table-box {
  margin: 0 16px 16px;
  padding: 16px;
  background-color: #f7f8fc;
}

.sql-statement {
  padding: 16px;
  font-size: 12px;
  border: 1px solid #dfe1ed;
  border-radius: 6px;
  height: 60px;
  margin: 0 160px;
  position: relative;

  .copy-icon {
    position: absolute;
    right: 8px;
    bottom: 8px;
    cursor: pointer;
  }
}

.row-description-box {
  display: flex;
  align-items: center;

  .row-description-text {
    max-width: 120px;
    display: flex;
  }

  .edit-box {
    flex: 0 0 16px;
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    .edit-icon-active {
      display: none;
    }

    &:hover {
      .edit-icon {
        display: none;
      }

      .edit-icon-active {
        display: block;
      }
    }
  }
}
</style>
