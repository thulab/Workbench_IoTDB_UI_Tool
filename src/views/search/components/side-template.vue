<template>
  <div class="search_div maxheight">
    <el-input placeholder="请输入模板名称" v-model="filterText" size="small" @input="getQueryList">
      <template #suffix>
        <i-custom-search-icon />
      </template>
    </el-input>

    <ul class="sql-list" :loading="loading">
      <template v-if="sqlList.length">
        <li v-for="item in sqlList" :key="item.id" class="sql-item-box">
          <div class="sql-item-text-box">
            <i-custom-template />
            <text-tooltip :content="item.queryName" class-name="sql-item-text" />
          </div>
          <el-dropdown class="more-icon" @command="val => handleSqlCommand(val, item)">
            <i-ep-more-filled />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="open">打开</el-dropdown-item>
                <el-dropdown-item command="rename">重命名</el-dropdown-item>
                <el-dropdown-item command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </li>
      </template>
      <li v-else class="sql-item-box-empty">暂无模板</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';
import { debounce } from 'lodash-es';
import { SearchApi } from '@/api';
// eslint-disable-next-line import/extensions
import ICustomMessageWarning from '~icons/custom/message-warning';

const props = defineProps<{
  serverId: number;
}>();

const emit = defineEmits(['handleSqlOperate']);

const filterText = ref('');
const loading = ref(false);
const sqlList = ref<Search.SqlList[]>([]);
const { requestFn: getQuery } = useRequest(SearchApi.getQuery);
const { requestFn: deleteQueryS } = useRequest(SearchApi.deleteQueryS);

// 获取列表数据
const getQueryList = debounce(async () => {
  loading.value = true;
  const res = await getQuery(props.serverId, filterText.value);
  loading.value = false;
  if (res.code === 0) {
    sqlList.value = res.data || [];
  }
}, 500);

const handleSqlCommand = (val: string, data: Search.SqlList) => {
  if (val === 'delete') {
    ElMessageBox.confirm('是否删除模板', '注意', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      icon: markRaw(ICustomMessageWarning),
    }).then(() => {
      deleteQueryS(props.serverId, `${data.id}`).then(() => {
        ElMessage({
          type: 'success',
          message: '删除成功!',
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
    height: calc(100vh - 289px);
    overflow: auto;
  }
}

.sql-list {
  display: flex;
  flex-direction: column;
  margin-top: 12px;

  .sql-item-box {
    padding: 0 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
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
      }
    }

    .more-icon {
      cursor: pointer;
      margin-left: 12px;

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
    justify-content: space-between;
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
