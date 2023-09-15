<template>
  <el-dialog
    title="实例管理"
    v-model="dialogVisible"
    width="748px"
    align-center
    :close-on-click-modal="false"
    id="connection-modal"
  >
    <el-container class="connection-wrapper">
      <el-aside width="240px" class="connection-list-wrapper">
        <div class="connection-list-title">
          <h4>实例列表</h4>
          <div class="connection-operate-buttons">
            <el-button link class="m-r-8" @click="getList" id="connection-side-refresh"><i-custom-border-refresh /></el-button>
            <el-button link style="margin: 0;" @click="handleAdd" id="connection-side-add"><i-custom-new-connection /></el-button>
          </div>
        </div>
        <el-input placeholder="请输入实例名称" v-model="filterText" id="connection-list-input" @keyup.enter="handleFilter" />
        <div class="connection-list-box">
          <div class="list-empty-wrapper" v-if="!filterList.length">
            <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
            <span class="data-empty-text">暂无数据</span>
          </div>
          <ul class="list-box" v-else>
            <li v-for="item in filterList" :key="item.id" :class="['connection-item-box', current === item.id && 'connection-item-box-active']" @click="e => handleSelect(item, e)">
              <span class="connection-item-text"><text-tooltip :content="item.name" /></span>
              <div class="connection-item-delete-box" @click="handleDelete(item)">
                <i-custom-delete class="connection-item-delete" />
                <i-custom-delete-active class="connection-item-delete-active" />
              </div>
            </li>
          </ul>
        </div>
      </el-aside>
      <el-main class="p-0">
        <h5>实例列表</h5>
        <el-form ref="formRef" :model="formData" :rules="rules" label-position="left" label-width="132px">
          <base-form-item label="实例名称:" prop="name">
            <el-input v-model="formData.name" placeholder="请输入实例名称" maxlength="50" show-word-limit id="connection-modalg-name" />
          </base-form-item>
        </el-form>
      </el-main>
    </el-container>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import { ConnectionApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const props = defineProps<{
  visible: boolean;
  modelValue: Connection.ConnectionItem[];
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const filterText = ref('');
const formRef = ref<FormInstance>();
const rules = reactive({
  name: [
    {
      required: true,
      message: '请输入实例名称',
      trigger: 'blur',
    },
  ],
});
const formData = reactive({
  name: '',
});
const connectionList = useVModel(props, 'modelValue');
let filterList: Connection.ConnectionItem[] = cloneDeep(connectionList.value);
const current = ref<undefined | number>();

const { requestFn: getConnectionList } = useRequest(ConnectionApi.getConnectionList);
const { requestFn: deleteConnection } = useRequest(ConnectionApi.deleteConnection);

function handleAdd() {}

// 获取实例列表
function getList() {
  getConnectionList().then((res) => {
    connectionList.value = res.data || [];
    filterList = cloneDeep(connectionList.value);
    current.value = filterList[0].id;
  });
}

function handleFilter() {
  const res = connectionList.value.filter((item) => item.name.includes(filterText.value));
  filterList = cloneDeep(res);
}

const canStopPropagation = (e: HTMLElement):boolean => {
  const { classList } = e;

  if (classList.contains('connection-item-delete-box')
      || classList.contains('connection-item-delete')
      || classList.contains('connection-item-delete-active')) {
    return true;
  }
  if ((e.tagName === 'path' || e.tagName === 'g') && e.parentElement) {
    return canStopPropagation(e.parentElement);
  }
  return false;
};

function handleDelete(item: Connection.ConnectionItem) {
  ElMessageBox.confirm('是否删除该实例？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      deleteConnection(item.id).then(() => {
        ElMessage.success('删除成功');
        getList();
      });
    });
}

// 选择
function handleSelect(item: Connection.ConnectionItem, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  current.value = item.id;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      ElMessage.success('创建成功！');
      dialogVisible.value = false;
      emit('handleSave');
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
    }
  },
);

</script>

<style scoped lang="scss">
.connection-list-wrapper{
  height: 510px;
  border-radius: 6px;
  border: 1px solid #DFE1ED;
}

.connection-list-title{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 26px;

  h4{
    font-size: 14px;
    font-weight: 700;
    line-height: 20px;
    color: #495AD4;
  }
}

.connection-list-box{
  border-radius: 2px;
  background: #FFF;
  height: calc(100% - 82px);
  overflow-y: auto;

  .list-empty-wrapper{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .data-empty-img{
      width: 150px;
      height: 150px;
      margin-bottom: 16px;
    }

    .data-empty-text{
      font-size: 14px;
      color: #131926;
      line-height: 21px;
    }
  }
}

.connection-item-box{
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 300;
  color: #131926;
  padding-left: 16px;
  box-sizing: border-box;
  cursor: pointer;
  position: relative;

  .connection-item-text{
    width: 200px;
    display: inline-flex;
    line-height: 1.2;
  }

  .connection-item-delete-box{
    position: absolute;
    top: 10px;
    right: 4px;
    display: none;

    svg{
      width: 16px;
      height: 16px;
    }

    .connection-item-delete-active{
      display: none;
    }

    &:hover {
      .connection-item-delete{
        display: none;
      }

      .connection-item-delete-active{
        display: block;
      }
    }
  }

  &:hover{
    background-color: #F7F8FC;
    color: #495AD4;

    .connection-item-delete-box{
      display: block;
    }
  }
}

.connection-item-box-active{
  background-color: #F7F8FC;
  color: #495AD4;
}
</style>
