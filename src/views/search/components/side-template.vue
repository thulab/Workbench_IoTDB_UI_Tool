<template>
  <div class="search_div maxheight">
    <ul class="sql-list" v-loading="loading">
      <li v-for="item in sqlList" :key="item.id" class="sql-item-box">
        <text-tooltip :content="item.queryName" class-name="sql-item-text" />
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
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { SearchApi } from '@/api';

const props = defineProps<{
  serverId: string;
}>();

const emit = defineEmits(['handleSqlOperate']);

const loading = ref(false);
const sqlList = ref<Search.SqlList[]>([]);
const { requestFn: getQuery } = useRequest(SearchApi.getQuery);
const { requestFn: deleteQueryS } = useRequest(SearchApi.deleteQueryS);

// 获取列表数据
const getQueryList = async () => {
  loading.value = true;
  const res = await getQuery(props.serverId);
  loading.value = false;
  if (res.code === '0') {
    sqlList.value = res.data || [];
  }
};

const handleSqlCommand = (val: string, data: Search.SqlList) => {
  if (val === 'delete') {
    ElMessageBox.confirm('是否删除列表', '删除提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        deleteQueryS(props.serverId, `${data.id}`).then(() => {
          ElMessage({
            type: 'success',
            message: '删除成功!',
          });
        });
      });
    getQueryList();
    emit('handleSqlOperate', val, data);
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
  padding: 20px 20px 0;
  background: #fff;

  &.maxheight {
    height: calc(100vh - 289px);
    overflow: auto;
  }
}

.sql-list {
  display: flex;
  flex-direction: column;

  .sql-item-box {
    padding: 0 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;

    &:hover {
      background-color: #f7fafc;
    }

    .more-icon {
      cursor: pointer;
      margin-left: 12px;
      align-self: flex-end;

      svg:focus {
        outline: none;
      }
    }
  }

  .sql-menu-list {
    display: none;
  }
}
</style>
