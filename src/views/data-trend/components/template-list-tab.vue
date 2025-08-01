<template>
  <div class="side-list-box" v-loading="loading">
    <el-input :placeholder="t('search.templatePlaceholder')" v-model="filterText" size="small" @input="getQueryList" :id="`${source}-template-search`" style="padding: 2px 2px 0">
      <template #suffix>
        <i-custom-search-icon />
      </template>
    </el-input>

    <ul class="template-list">
      <template v-if="templateList.length">
        <li v-for="item in templateList" :key="item.id" :id="`${source}-template-${item.id}`" class="template-item-box" @click="(e) => handleSelect(item, e)">
          <div class="template-item-text-box">
            <i-custom-template />
            <text-tooltip :content="item.name" class-name="template-item-text" />
          </div>
          <div class="item-edit-box" :id="`${source}-template-rename-${item.id}`" @click="handleSqlCommand('rename', item)">
            <i-custom-edit class="item-edit" />
            <i-custom-edit class="item-edit-active" />
          </div>

          <div class="item-delete-box" :id="`${source}-template-delete-${item.id}`" @click="handleSqlCommand('delete', item)">
            <i-custom-delete class="item-delete" />
            <i-custom-delete-active class="item-delete-active" />
          </div>
        </li>
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
import type { TrendTemplate } from '@/types';

const props = withDefaults(
  defineProps<{
    source?: string;
    sqlDialect?: 'table' | '';
  }>(),
  {
    source: 'trend',
    sqlDialect: '',
  },
);

const emit = defineEmits(['handleOperate']);

const { t } = useI18n();
const filterText = ref('');
const templateList = ref<TrendTemplate[]>([]);
const { requestFn: getTrendTemplate, loading } = useRequest(SearchApi.getTrendTemplate);
const { requestFn: delTrendTemplate } = useRequest(SearchApi.delTrendTemplate);

// 获取列表数据
const getQueryList = debounce(() => {
  getTrendTemplate(filterText.value, props.source === 'trend' ? '' : props.sqlDialect === 'table' ? 'table-spectrum' : '').then((res) => {
    const data = res.data || [];
    templateList.value = data
      .filter((item: TrendTemplate) => (props.source === 'trend' ? item.type.indexOf('spectrum') === -1 : item.type.indexOf('spectrum') !== -1))
      .filter((item: TrendTemplate) => {
        if (props.sqlDialect === 'table') {
          return item.type.indexOf('table') !== -1;
        } else {
          return item.type.indexOf('table') === -1;
        }
      });
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
function handleSelect(data: TrendTemplate, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  emit('handleOperate', 'open', data);
}

const handleSqlCommand = (val: string, data: TrendTemplate) => {
  if (val === 'delete') {
    ElMessageBox.confirm(props.source === 'trend' ? t('dataTrend.deleteTemplateTip') : t('spectrum.deleteTemplateTip'), t('common.notice'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: `del-${props.source}-template-confirm`,
      cancelButtonClass: `del-${props.source}-template-cancel`,
      type: 'warning',
      icon: ICustomMessageWarning,
    }).then(() => {
      delTrendTemplate(+data.id).then(() => {
        ElMessage({
          type: 'success',
          message: `${t('common.deleteSuccess')}`,
        });
        getQueryList();
      });
    });
  } else {
    emit('handleOperate', val, data);
  }
};

onMounted(() => {
  getQueryList();
});

defineExpose({ templateList, getQueryList });
</script>

<style lang="scss" scoped>
.template-list {
  overflow-y: auto;
  height: calc(100% - 46px);
  margin: 16px 2px 0;

  .template-item-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24px;
    font-size: 12px;
    font-weight: 300;
    line-height: 1.2;
    color: #656a85;
    cursor: pointer;

    .template-item-text-box {
      display: flex;
      align-items: center;
      width: 160px;

      svg {
        margin-right: 8px;
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
      }
    }

    .item-delete-box {
      position: absolute;
      top: 4px;
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
      top: 4px;
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
