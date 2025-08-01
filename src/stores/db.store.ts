import { defineStore } from 'pinia';
import IoTDBApi from '@/api/db.api';
import { useConnectionStore } from './connection.store';
import type { TableTreeNodeData, DatabaseRes } from '@/types';

const { data: schemaTreeData, requestFn: fetchDatabases } = useRequest(IoTDBApi.getDatabases);

export const useDbStore = defineStore('db', () => {
  const databases = ref<DatabaseRes>();
  const databaseNames = ref<string[]>([]);
  const connectionStore = useConnectionStore();
  const firstLoad = ref(true);
  const activeKeyList = ref<string[]>([]);

  async function getDatabases() {
    if (connectionStore.isTableModel && firstLoad.value) {
      firstLoad.value = false;
      await fetchDatabases();
      databaseNames.value = [];
      databases.value = schemaTreeData.value;
    }
  }

  const treeData = computed<Array<TableTreeNodeData>>(() => {
    const data: Array<TableTreeNodeData> = [];
    databases.value?.value.databases.forEach((db) => {
      const dbNode: TableTreeNodeData = {
        id: db.database,
        nodeName: db.database,
        nodeType: 'DATABASE',
        database: db.database,
        children: [],
      };
      db.tables?.forEach((table) => {
        const tableNode: TableTreeNodeData = {
          id: `${db.database}-${table.tableVO.tableName}`,
          nodeName: table.tableVO.tableName,
          parentName: db.database,
          database: db.database,
          nodeType: 'TABLE',
          comment: table.tableVO.comment === 'null' ? '' : table.tableVO.comment,
          ttl: table.tableVO.ttl,
          children: table.columnVOS
            .map((col) => ({
              id: `${db.database}-${table.tableVO.tableName}-${col.columnName}`,
              nodeName: col.columnName,
              database: db.database,
              parentName: table.tableVO.tableName,
              comment: col.comment === 'null' ? '' : col.comment,
              dataType: col.dataType,
              cateGory: col.cateGory,
              nodeType: col.cateGory as TableTreeNodeData['nodeType'],
            }))
            .sort((a, b) => {
              // 定义排序优先级
              const categoryOrder = ['TIME', 'TAG', 'ATTRIBUTE', 'FIELD'];
              // 获取两个元素的类别索引
              const indexA = categoryOrder.indexOf(a.cateGory);
              const indexB = categoryOrder.indexOf(b.cateGory);
              // 如果类别不同，按类别优先级排序
              if (indexA !== indexB) {
                return indexA - indexB;
              }
              // 如果类别相同，按nodeName字母排序
              return a.nodeName.localeCompare(b.nodeName);
            }),
        };
        dbNode.children?.push(tableNode);
      });
      data.push(dbNode);
      databaseNames.value.push(db.database);
    });
    if (!activeKeyList.value.length && databaseNames.value.length) {
      const [firstDatabase] = databaseNames.value;
      activeKeyList.value = [firstDatabase];
    }
    return data;
  });

  function setFirstLoad(value: boolean) {
    firstLoad.value = value;
  }

  function setActiveList(activeKeyVal: string[]) {
    activeKeyList.value = activeKeyVal;
  }

  watch(
    () => connectionStore.isTableModel,
    async () => {
      await getDatabases();
    },
  );

  return {
    firstLoad,
    treeData,
    databaseNames,
    activeKeyList,
    getDatabases,
    setFirstLoad,
    setActiveList,
  };
});

export default useDbStore;
