<template>
  <div class="search_div maxheight" v-loading="loading">
    <el-input :placeholder="t('search.templatePlaceholder')" v-model="filterText" size="small" @input="getQueryList" id="sql-search-template-search">
      <template #suffix>
        <i-custom-search-icon />
      </template>
    </el-input>

    <ul class="sql-list">
      <template v-if="sqlList.length">
        <li v-for="item in sqlList" :key="item.id" class="sql-item-box">
          <div class="sql-item-text-box">
            <i-custom-template />
            <text-tooltip :content="item.queryName" class-name="sql-item-text" />
          </div>
          <i-ep-more-filled @click="item.focused = true" v-if="!item.focused" :id="`sql-template-dropdown-${item.id}`" class="more-icon" />
          <el-dropdown v-else :id="`sql-template-dropdown-${item.id}`" class="more-icon" @command="val => handleSqlCommand(val, item)">
            <i-ep-more-filled />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="open" :id="`sql-template-dropdown-open-${item.id}`">{{ t('search.open') }}</el-dropdown-item>
                <el-dropdown-item command="rename" :id="`sql-template-dropdown-rename-${item.id}`">{{ t('search.rename') }}</el-dropdown-item>
                <el-dropdown-item command="delete" :id="`sql-template-dropdown-delete-${item.id}`">{{ t('common.delete') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </li>
      </template>
      <li v-else class="sql-item-box-empty">{{ t('search.noTemplate') }}</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { SearchApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const emit = defineEmits(['handleSqlOperate']);

const { t } = useI18n();
const filterText = ref('');
const sqlList = ref<Search.SqlList[]>([]);
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

const handleSqlCommand = (val: string, data: Search.SqlList) => {
  if (val === 'delete') {
    ElMessageBox.confirm('是否删除模板', t('common.notice'), {
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
          message: `${t('common.deleteSuccess')}!`,
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
  font-size: 14px;
  padding: 20px 0 0;
  background: #fff;

  &.maxheight {
    height: calc(100vh - 240px);
    overflow: auto;
  }
}

.sql-list {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  min-height: 200px;

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
    color: #656A85;

    &:hover {
      background-color: #f7fafc;
    }

    .sql-item-text-box{
      display: flex;
      align-items: center;
      width: 160px;

      svg {
        margin-right: 4px;
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
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

  .sql-item-box-empty{
    padding: 0 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656A85;
  }

  .sql-menu-list {
    display: none;
  }
}
</style>
