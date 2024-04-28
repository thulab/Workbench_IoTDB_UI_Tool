<template>
  <div class="side-list-box" v-loading="loading">
    <el-input :placeholder="t('search.templatePlaceholder')" v-model="filterText" size="small" @input="getQueryList" id="trend-template-search">
      <template #suffix>
        <i-custom-search-icon />
      </template>
    </el-input>

    <ul class="template-list">
      <template v-if="templateList.length">
        <li v-for="item in templateList" :key="item.id" :id="`trend-template-${item.id}`" class="template-item-box" @click="(e) => handleSelect(item, e)">
          <div class="template-item-text-box">
            <i-custom-template />
            <text-tooltip :content="item.queryName" class-name="template-item-text" />
          </div>
          <div class="item-edit-box" :id="`trend-template-rename-${item.id}`" @click="handleSqlCommand('rename', item)">
            <i-custom-edit class="item-edit" />
            <i-custom-edit class="item-edit-active" />
          </div>

          <div class="item-delete-box" :id="`trend-template-delete-${item.id}`" @click="handleSqlCommand('delete', item)">
            <i-custom-delete class="item-delete" />
            <i-custom-delete-active class="item-delete-active" />
          </div>
        </li>
      </template>
      <li v-else class="template-box-empty">{{ t('search.noTemplate') }}</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { SearchApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const emit = defineEmits(['handleOperate']);

const { t } = useI18n();
const filterText = ref('');
const templateList = ref<Search.SqlList[]>([]);
const { requestFn: getQuery, loading } = useRequest(SearchApi.getQuery);
const { requestFn: deleteQueryS } = useRequest(SearchApi.deleteQueryS);

// 获取列表数据
const getQueryList = debounce(() => {
  getQuery(filterText.value).then((res) => {
    if (res.code === 0) {
      templateList.value = res.data || [];
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
function handleSelect(data: Search.SqlList, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  emit('handleOperate', 'open', data);
}

const handleSqlCommand = (val: string, data: Search.SqlList) => {
  if (val === 'delete') {
    ElMessageBox.confirm(t('dataTrend.deleteTemplateTip'), t('common.notice'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: 'del-trend-template-confirm',
      cancelButtonClass: 'del-trend-template-cancel',
      type: 'warning',
      icon: ICustomMessageWarning,
    }).then(() => {
      deleteQueryS(`${data.id}`).then(() => {
        ElMessage({
          type: 'success',
          message: `${t('common.deleteSuccess')}`,
        });
        getQueryList();
        emit('handleOperate', val, data);
      });
    });
  } else {
    emit('handleOperate', val, data);
  }
};

onMounted(() => {
  getQueryList();
});

defineExpose({ getQueryList });
</script>

<style lang="scss" scoped>
.template-list {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  min-height: 200px;

  .template-item-box {
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

    .template-item-text-box {
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

  .template-box-empty {
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
}
</style>
