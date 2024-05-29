<template>
  <el-container class="iotdb-config-detail-wrapper">
    <el-header class="search-form-wrapper p-x-0" style="height: auto">
      <el-form :model="searchFormData" ref="searchFormRef" label-position="left" size="default" inline @submit.prevent>
        <base-form-item label="" prop="name">
          <el-input v-model="searchFormData.name" :placeholder="t('iotdbConfig.searchPlaceholder')" style="width: 346px" id="iotdbConfig-search-name">
            <template #prefix>
              <i-custom-search-icon class="remote-select-search-icon" />
            </template>
          </el-input>
        </base-form-item>
      </el-form>
      <div class="search-form-buttons">
        <el-button type="primary" @click="handleSearch" id="iotdbConfig-search-search">{{ t('common.query') }}</el-button>
      </div>
    </el-header>
    <el-main class="p-0">
      <div class="page-table-details">
        <div class="page-table-title-box">
          <h4 class="page-table-title">{{ t('iotdbConfig.configList') }}</h4>
          <div class="operate-buttons">
            <span class="page-tip-text">{{ t('iotdbConfig.configFile') }}</span>
            <span class="page-content-text">{{ 'iotdb-1.3.1.2-bin/conf/iotdb-confignode.properties' }}</span>
            <el-button link class="m-l-16 svg-button-hover-color" @click="handleDoc" id="iotdbConfig-doc">
              <el-icon size="24"><i-custom-model-doc /></el-icon>
            </el-button>
            <el-button link class="svg-button-hover-color" @click="handleRefresh" id="iotdbConfig-refresh">
              <el-icon size="24"><i-custom-refresh /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="page-table-box">
          <!-- @sort-change="({ column, prop, order }) => handleSortChange({ column, prop, order })" -->
          <el-table
            :data="tableDataPagination"
            v-loading="loading"
            style="width: 100%"
            border
            :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 48"
            tooltip-effect="light"
            :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
            ref="tableRef"
            :default-sort="{ prop: 'name', order: 'ascending' }"
          >
            <el-table-column :label="t('iotdbConfig.confitTitle')" prop="name" sortable :sort-orders="['ascending', 'descending']" width="20%" align="center" />
            <el-table-column :label="t('iotdbConfig.configDesc')" prop="name1" width="40%" align="center" />
            <el-table-column :label="t('iotdbConfig.cofigEffective')" prop="name2" width="20%" align="center" />
            <el-table-column :label="t('iotdbConfig.configContent')" prop="name3" width="20%" align="center">
              <template #default="{ row }">
                <div class="view-config-box" v-if="!row.editable">
                  <span>{{ row.name3 }}</span>
                  <el-button link :class="['m-l-8', 'svg-button-hover-color']" @click="handleEdit(row)" :id="`iotdb-config-edit-${row.name}`">
                    <i-custom-edit />
                  </el-button>
                </div>
                <div class="edit-config-box" v-else>
                  <el-input v-model.trim="row.name3" style="flex: 1" :id="`iotdb-config-edit-${row.name}-input`" placeholder="" />
                  <el-button link :class="['m-l-16', 'svg-button-hover-color']" @click="handleEditConfirm(row)" :id="`iotdb-config-confirm-${row.name}`">
                    <el-icon size="16"><i-custom-confirm /></el-icon>
                  </el-button>
                  <el-button link :class="['m-l-12', 'svg-button-hover-color']" @click="handleEditCancen(row)" :id="`iotdb-config-cancel-${row.name}`">
                    <el-icon size="16"><i-custom-close-deep /></el-icon>
                  </el-button>
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

          <el-pagination
            v-if="totalCount > 0"
            v-model:currentPage="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            class="m-t-20"
            layout="prev, pager, next, sizes, jumper"
            background
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCount"
            @size-change="onChangePageSize"
            @current-change="onChangePage"
          />
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const { t, locale } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const { maxTableHeight } = useTableHeight(300);
const searchFormRef = ref<FormInstance>();
const searchFormData = reactive({
  name: '',
  orderBy: 'name',
  asc: 'asc',
});
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const loading = ref(false);
const tableData = ref({
  list: [
    { name: 'cn_internal_address', name1: '用于集群内部RPC通信', name2: '重启生效', name3: '127.0.0.1' },
    { name: 'cn_internal_port', name1: '用于集群内部RPC通信端口号', name2: '重启生效', name3: '10710' },
    {
      name: 'cn_seed_config_node2',
      name1:
        '对于启动的第一个 ConfigNode, cn_seed_config_node 指向它自己的内部地址：内部端口号。对于其他要加入集群的 ConfigNode, cn_seed_config_node 指向任何正在运行的 ConfigNode 的内部地址：内部端口号。',
      name2: '首次启动后不可修改',
      name3: '127.0.0.1',
    },
  ],
});
const userName = computed(() => userStore.userInfo.name);
const showConfigMenu = computed(() => userName.value === 'root');

const tableDataPagination = computed(() => tableData.value.list.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize) as Record<string, any>[]);

function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://timecho.com/docs/UserGuide/latest/Reference/Common-Config-Manual.html');
  } else {
    window.open('https://timecho.com/docs/zh/UserGuide/latest/Reference/Common-Config-Manual.html');
  }
}

function getListData() {}

// 刷新
function handleRefresh() {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleSortChange({ column, prop, order }: SortMethod<any>) {
  searchFormData.asc = order === 'ascending' ? 'asc' : 'desc';
  searchFormData.orderBy = prop;
  getListData();
}

function handleReset() {
  searchFormData.name = '';
  searchFormData.asc = 'asc';
  searchFormData.orderBy = 'name';
}

// 查询
function handleSearch() {
  pagination.pageNum = 1;
  getListData();
}

function onChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
}

function onChangePage(page: number) {
  pagination.pageNum = page;
}

function handleOtherConfirm() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(t('iotdbConfig.continueTip'), t('common.notice'), {
      confirmButtonText: t('common.continue'),
      cancelButtonText: t('common.giveup'),
      confirmButtonClass: 'iotdb-config-continue-confirm',
      cancelButtonClass: 'iotdb-config-continue-cancel',
      type: 'warning',
      icon: ICustomMessageWarning,
      closeOnClickModal: false,
      closeOnPressEscape: false,
    })
      .then(() => resolve(false))
      .catch(() => resolve(true));
  });
}

async function handleEdit(row: any) {
  const flag = await handleOtherConfirm();
  console.log(row, flag, 'llll');
}

function handleEditConfirm(row: any) {
  console.log(row, 'llll');
}

function handleEditCancen(row: any) {
  console.log(row, 'llll');
}

watch(
  () => showConfigMenu.value,
  (val) => {
    if (!val) {
      router.push({ name: 'Dashboard' });
    } else {
      handleReset();
      handleSearch();
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.iotdb-config-detail-wrapper {
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  padding: 26px 16px 16px 14px;
}

.page-table-details {
  padding: 16px 16px 10px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.page-table-title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 12px;

  .page-table-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }

  .page-tip-text {
    font-size: 12px;
    font-weight: 400;
    line-height: 12px;
    color: #131926;
  }

  .page-content-text {
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #424561;
  }
}

.view-config-box,
.edit-config-box {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
