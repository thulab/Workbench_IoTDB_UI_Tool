<template>
  <div class="search_div max-height" v-loading="loading">
    <el-input :placeholder="t('search.templatePlaceholder')" v-model="filterText" size="small" @input="getQueryList" id="sql-search-template-search">
      <template #suffix>
        <i-custom-search-icon />
      </template>
    </el-input>

    <ul class="sql-list">
      <template v-if="sqlList.length">
        <el-scrollbar :max-height="'calc(100vh - 220px)'">
          <li v-for="item in sqlList" :key="item.id" :id="`sql-template-${item.id}`" class="sql-item-box" @click="(e) => handleSelect(item, e)">
            <div class="sql-item-text-box">
              <i-custom-template />
              <text-tooltip :content="item.queryName" class-name="sql-item-text" />
            </div>
            <div class="item-edit-box" :id="`sql-template-rename-${item.id}`" @click="handleSqlCommand('rename', item)">
              <i-custom-edit class="item-edit" />
              <i-custom-edit class="item-edit-active" />
            </div>

            <div class="item-delete-box" :id="`sql-template-delete-${item.id}`" @click="handleSqlCommand('delete', item)">
              <i-custom-delete class="item-delete" />
              <i-custom-delete-active class="item-delete-active" />
            </div>
            <!-- <i-ep-more-filled @click="item.focused = true" v-if="!item.focused" :id="`sql-template-dropdown-${item.id}`" class="more-icon" />
          <el-dropdown v-else :id="`sql-template-dropdown-${item.id}`" class="more-icon" @command="(val) => handleSqlCommand(val, item)">
            <i-ep-more-filled />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="open" :id="`sql-template-dropdown-open-${item.id}`">{{ t('search.open') }}</el-dropdown-item>
                <el-dropdown-item command="rename" :id="`sql-template-dropdown-rename-${item.id}`">{{ t('search.rename') }}</el-dropdown-item>
                <el-dropdown-item command="delete" :id="`sql-template-dropdown-delete-${item.id}`">{{ t('common.delete') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown> -->
          </li>
        </el-scrollbar>
      </template>
      <div class="list-empty-wrapper" v-else>
        <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
        <span class="data-empty-text">{{ t('common.noData') }}</span>
      </div>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { SearchApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import type { SqlList } from '@/types';

const emit = defineEmits(['handleSqlOperate']);

const { t } = useI18n();
const filterText = ref('');
const sqlList = ref<SqlList[]>([]);
const { requestFn: getQuery, loading } = useRequest(SearchApi.getQuery);
const { requestFn: deleteQueryS } = useRequest(SearchApi.deleteQueryS);

// 获取列表数据
const getQueryList = debounce(() => {
  getQuery(filterText.value).then((res) => {
    if (res.code === 0) {
      sqlList.value = res.data || [];
    }
  });
}, 500);

const canStopPropagation = (e: HTMLElement): boolean => {
  const { classList } = e;

  if (
    classList.contains('item-edit-box') ||
    classList.contains('item-delete-box') ||
    classList.contains('item-edit') ||
    classList.contains('item-delete') ||
    classList.contains('item-edit-active') ||
    classList.contains('item-delete-active')
  ) {
    return true;
  }
  if ((e.tagName === 'path' || e.tagName === 'g') && e.parentElement) {
    return canStopPropagation(e.parentElement);
  }
  return false;
};

// 选择
function handleSelect(data: SqlList, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  emit('handleSqlOperate', 'open', data);
}

const handleSqlCommand = (val: string, data: SqlList) => {
  if (val === 'delete') {
    ElMessageBox.confirm(t('search.deleteTemplateTip'), t('common.notice'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: 'del-sql-template-confirm',
      cancelButtonClass: 'del-sql-template-cancel',
      type: 'warning',
      icon: ICustomMessageWarning,
    }).then(() => {
      deleteQueryS(`${data.id}`).then(() => {
        ElMessage({
          type: 'success',
          message: `${t('common.deleteSuccess')}`,
        });
        getQueryList();
        emit('handleSqlOperate', val, data);
      });
    });
  } else {
    emit('handleSqlOperate', val, data);
  }
};

onMounted(() => {
  getQueryList();
});

defineExpose({ getQueryList });
</script>

<style lang="scss" scoped>
.search_div {
  font-size: 12px;
  padding: 8px 0 0;
  background: #fff;

  &.maxheight {
    height: calc(100vh - 210px);
  }
}

.sql-list {
  margin-top: 12px;
  overflow-y: auto;
  height: calc(100% - 40px);

  .sql-item-box {
    padding: 0 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    font-size: 12px;
    font-weight: 300;
    line-height: 1.2;
    color: #656a85;
    cursor: pointer;

    .sql-item-text-box {
      display: flex;
      align-items: center;
      width: 200px;

      svg {
        margin-right: 4px;
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
      }
    }

    .item-delete-box {
      position: absolute;
      top: 10px;
      right: 4px;
      display: none;

      svg {
        width: 16px;
        height: 16px;
      }

      .item-delete-active {
        display: none;
      }

      &:hover {
        .item-delete {
          display: none;
        }

        .item-delete-active {
          display: block;
        }
      }
    }

    .item-edit-box {
      position: absolute;
      top: 10px;
      right: 20px;
      display: none;

      svg {
        width: 16px;
        height: 16px;
      }

      .item-edit-active {
        display: none;

        :deep(path) {
          fill: #495ad4 !important;
        }
      }

      &:hover {
        .item-edit {
          display: none;
        }

        .item-edit-active {
          display: block;
        }
      }
    }

    &:hover {
      background-color: #f7f8fc;
      color: #495ad4;

      .item-delete-box {
        display: block;
      }

      .item-edit-box {
        display: block;
      }
    }

    .more-icon {
      cursor: pointer;
      margin-left: 12px;
      font-size: 14px;

      svg {
        // transform: rotate(90deg);
      }

      svg:focus {
        outline: none;
      }
    }
  }

  .sql-item-box-empty {
    padding: 0 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656a85;
  }

  .sql-menu-list {
    display: none;
  }
}
</style>
