<template>
  <el-dialog :title="t('auth.relational.dataScope')" v-model="dialogVisible" width="680px" align-center :close-on-click-modal="false" id="auth-path-modal">
    <template v-if="step === 0">
      <div class="flex w-[100%] gap-[8px] max-w-[100%]">
        <div class="flex flex-col flex-2 bg-[#F7F8FC] p-x-[16px] p-y-[8px]">
          <h4 class="c-[var(--el-color-primary)] font-normal text-[14px]">{{ t('auth.relational.scope') }}</h4>
          <div class="flex gap-[8px]">
            <el-scrollbar class="flex-1" height="348px" v-loading="dbStore.databaseLoading">
              <ul class="leading-[28px] p-t-[4px]">
                <li
                  class="flex items-center cursor-pointer"
                  :class="{ 'is-active': currentDatabase === '*' }"
                  @click="
                    () => {
                      currentDatabase = '*';
                      selectedAllTables = false;
                      selectedTables = [];
                    }
                  "
                >
                  <el-icon size="18px"><i-custom-tree-db /></el-icon> {{ t('common.all') }}
                </li>
                <li
                  class="flex items-center cursor-pointer max-w-[150px]"
                  v-for="(item, index) in databaseOptions"
                  :key="index"
                  :class="{ 'is-active': currentDatabase === item }"
                  @click="
                    () => {
                      currentDatabase = item!;
                      selectedAllTables = false;
                      selectedTables = [];
                    }
                  "
                >
                  <el-icon size="18px"><i-custom-tree-db /></el-icon><text-tooltip :content="item!" />
                </li>
              </ul>
            </el-scrollbar>
            <el-scrollbar class="flex-1" height="348px">
              <ul class="leading-[28px] p-t-[4px]">
                <li class="flex items-center">
                  <el-checkbox v-model="selectedAllTables">
                    <span class="leading-[28px] flex items-center">
                      <el-icon size="18px"><i-custom-table /></el-icon> {{ t('common.all') }}
                    </span>
                  </el-checkbox>
                </li>
                <el-checkbox-group v-model="selectedTables">
                  <li class="flex items-center" v-for="(item, index) in tableOptions" :key="index">
                    <el-checkbox :disabled="selectedAllTables" :value="item.nodeName">
                      <span class="leading-[28px] flex items-center max-w-[150px]">
                        <el-icon size="18px"><i-custom-table /></el-icon> <text-tooltip :content="item.nodeName + (item.comment ? `(${item.comment})` : '')"></text-tooltip>
                      </span>
                    </el-checkbox>
                  </li>
                </el-checkbox-group>
              </ul>
            </el-scrollbar>
          </div>
        </div>
        <div class="flex flex-col flex-1 bg-[#F7F8FC] p-x-[16px] p-y-[8px]">
          <h4 class="c-[var(--el-color-primary)] font-normal text-[14px]">{{ t('auth.relational.selectedScope') }}</h4>
          <el-scrollbar class="flex-1" height="348px">
            <ul class="leading-[28px] p-t-[4px]">
              <li class="flex items-center" v-if="selectedAllTables">
                <span class="leading-[28px] flex items-center max-w-[180px]">
                  <el-icon size="18px"><i-custom-table /></el-icon> {{ currentDatabase }}.*
                </span>
              </li>
              <template v-else>
                <li class="flex items-center" v-for="(item, index) in selectedTables" :key="index">
                  <span class="leading-[28px] flex items-center max-w-[180px]">
                    <el-icon size="18px"><i-custom-table /></el-icon> <text-tooltip :content="currentDatabase + '.' + item" />
                  </span>
                </li>
              </template>
            </ul>
          </el-scrollbar>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-col w-[100%] max-w-[100%]">
        <h4 class="c-[var(--el-color-primary)] font-normal text-[14px] m-b-[8px]">{{ t('auth.relational.type') }}</h4>
        <div class="border-[1px] border-solid border-b-0 border-[#dfe1ed] border">
          <el-table :data="privilegeData" class="w-[100%]">
            <el-table-column :label="t('auth.relational.type')" width="120" align="center" prop="typeDisplay" />
            <el-table-column :label="t('auth.relational.isEnable')" align="center" width="100" prop="isEnable">
              <template v-slot="{ row: item, $index }">
                <template v-if="$index !== 0 && privilegeData[0]!.isEnable">
                  <el-checkbox :checked="true" disabled></el-checkbox>
                </template>
                <el-checkbox v-else v-model="item.isEnable" @change="handleEnableChanged(item)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('auth.relational.canGrant')" align="center" width="100" prop="canGrant">
              <template v-slot="{ row: item, $index }">
                <template v-if="$index !== 0 && privilegeData[0]!.canGrant">
                  <el-checkbox :checked="true" disabled></el-checkbox>
                </template>
                <el-checkbox v-else v-model="item.canGrant" :disabled="!item.isEnable" />
              </template>
            </el-table-column>
            <el-table-column :label="t('auth.relational.desc')" prop="desc" />
          </el-table>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" v-if="step === 1" @click="() => (step = 0)" id="auth-path-modal-confirm">{{ t('common.pre') }}</el-button>
        <el-button @click="dialogVisible = false" id="auth-path-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" v-if="step === 0" @click="() => (step = 1)" :disabled="!selectedAllTables && selectedTables.length === 0" id="auth-path-modal-confirm">{{
          t('common.next')
        }}</el-button>
        <el-button type="primary" v-if="step === 1" @click="handleConfirm" :loading="loading" id="auth-path-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { useDbStore } from '@/stores';
import { RelationalPrivilegesApi } from '@/api';
import type { UpdateDataPrivilegeAo, DataPrivilege } from '@/types';

const props = defineProps<{
  visible: boolean;
  type: 'user' | 'role';
  name: string;
  currentData: DataPrivilege | null;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', payload: string | undefined): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const { t } = useI18n();

const dbStore = useDbStore();
const currentDatabase = ref('*');
const selectedAllTables = ref(false);
const selectedTables = ref<string[]>([]);

const databaseOptions = computed(() => {
  return dbStore.treeData.map((db) => db.database) || [];
});

const tableOptions = computed(() => {
  if (!currentDatabase.value || currentDatabase.value === '*') return [];
  return dbStore.treeData.find((db) => db.database === currentDatabase.value)?.children || [];
});

const step = ref(0);

const { requestFn: updateDataPrivilege, loading } = useRequest(props.type === 'role' ? RelationalPrivilegesApi.updateDataPrivilegeByRoleName : RelationalPrivilegesApi.updateDataPrivilegeByUserName);

const privilegeData = reactive([
  {
    type: 'all',
    typeDisplay: t('auth.relational.all'),
    isEnable: false,
    canGrant: false,
    desc: t('auth.relational.allDesc'),
  },
  {
    type: 'CREATE',
    typeDisplay: t('auth.relational.CREATE'),
    isEnable: false,
    canGrant: false,
    desc: t('auth.relational.CREATEDesc'),
  },
  {
    type: 'DROP',
    typeDisplay: t('auth.relational.DROP'),
    isEnable: false,
    canGrant: false,
    desc: t('auth.relational.DROPDesc'),
  },
  {
    type: 'ALTER',
    typeDisplay: t('auth.relational.ALTER'),
    isEnable: false,
    canGrant: false,
    desc: t('auth.relational.ALTERDesc'),
  },
  {
    type: 'SELECT',
    typeDisplay: t('auth.relational.SELECT'),
    isEnable: false,
    canGrant: false,
    desc: t('auth.relational.SELECTDesc'),
  },
  {
    type: 'INSERT',
    typeDisplay: t('auth.relational.INSERT'),
    isEnable: false,
    canGrant: false,
    desc: t('auth.relational.INSERTDesc'),
  },
  {
    type: 'DELETE',
    typeDisplay: t('auth.relational.DELETE'),
    isEnable: false,
    canGrant: false,
    desc: t('auth.relational.DELETEDesc'),
  },
]);

const savePrivilege = () => {
  const data: UpdateDataPrivilegeAo = {
    name: props.name,
    scopes: selectedAllTables.value ? [`${currentDatabase.value}.*`] : selectedTables.value.map((table) => `"${currentDatabase.value}"."${table}"`),
    grantDataPrivileges: privilegeData[0]!.isEnable
      ? [{ privilegeName: 'ALL', grantOption: privilegeData[0]!.canGrant }]
      : privilegeData.filter((item) => item.isEnable).map((item) => ({ privilegeName: item.type, grantOption: item.canGrant })),
    revokeDataPrivileges: [],
  };
  updateDataPrivilege(data).then((res) => {
    ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
    dialogVisible.value = false;
    emit('handleSave', res.sql);
  });
};

const handleConfirm = () => {
  if (privilegeData.every((item) => !item.isEnable)) {
    ElMessage.error({ message: t('auth.relational.selectPrivilegeTip'), grouping: true });
    return;
  }
  if (props.currentData && props.currentData.scope) {
    // 先移除旧的权限，再处理本次操作的权限
    const oldData: UpdateDataPrivilegeAo = {
      name: props.name,
      scopes: [props.currentData.scope],
      grantDataPrivileges: [],
      revokeDataPrivileges: [{ privilegeName: 'ALL' }],
    };
    updateDataPrivilege(oldData).then(() => {
      savePrivilege();
    });
  } else {
    savePrivilege();
  }
};

const handleEnableChanged = (item: { type: string; isEnable: boolean; canGrant: boolean }) => {
  if (item.type === 'all' && item.isEnable) {
    privilegeData.forEach((privilege) => {
      privilege.isEnable = true;
    });
  } else if (item.type === 'all' && !item.isEnable) {
    privilegeData.forEach((privilege) => {
      privilege.isEnable = false;
      privilege.canGrant = false;
    });
  } else {
    if (!item.isEnable) {
      privilegeData[0]!.isEnable = false;
      privilegeData[0]!.canGrant = false;
      item.canGrant = false;
    }
  }
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        if (!props.currentData) {
          step.value = 0;
          currentDatabase.value = '*';
          selectedAllTables.value = false;
          selectedTables.value = [];
          privilegeData.forEach((item) => {
            item.isEnable = false;
            item.canGrant = false;
          });
        } else {
          step.value = 0;
          if (props.currentData.scope) {
            const scopes = props.currentData.scope.split(',');
            if (scopes.length === 1 && scopes[0]!.endsWith('.*')) {
              const db = scopes[0]!.slice(0, -2).replace(/"/g, '');
              currentDatabase.value = db;
              selectedAllTables.value = true;
              selectedTables.value = [];
            } else {
              const tables: string[] = [];
              let dbName = '';
              scopes.forEach((scope) => {
                const [db, table] = scope.split('.');
                dbName = db!.replace(/"/g, '');
                tables.push(table!.replace(/"/g, ''));
              });
              currentDatabase.value = dbName;
              selectedAllTables.value = false;
              selectedTables.value = tables;
            }
          } else {
            currentDatabase.value = '*';
            selectedAllTables.value = false;
            selectedTables.value = [];
          }
          privilegeData.forEach((item) => {
            item.isEnable = props.currentData?.privileges?.includes(item.type) || false;
            item.canGrant = props.currentData?.grantedPrivileges?.includes(item.type) || false;
          });
        }
      });
      dbStore.getDatabases();
    }
  },
);
</script>

<style lang="scss" scoped>
.is-active {
  background-color: var(--el-color-primary-light-9);
}
</style>
