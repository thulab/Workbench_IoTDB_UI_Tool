import { defineStore } from 'pinia';
import IoTDBApi from '@/api/db.api';

const { data: schemaTreeData, requestFn: fetchDatabases } = useRequest(IoTDBApi.getDatabases);

export const useDbStore = defineStore('db', () => {
  const databases = ref<IoTDB.DatabaseRes>();
  const databaseNames = ref<string[]>([]);

  async function getDatabases() {
    await fetchDatabases();
    // console.log('=============Databases fetched res:', res);
    databases.value = schemaTreeData.value;
    console.log('=============Databases fetched:', databases.value);
  }

  const treeData = computed<Array<IoTDB.TreeNodeData>>(() => {
    const data: Array<IoTDB.TreeNodeData> = [];
    databases.value?.value.databases.forEach((db) => {
      const dbNode: IoTDB.TreeNodeData = {
        nodeName: db.database,
        nodeType: 'DATABASE',
        database: db.database,
        children: [],
      };
      db.tables.forEach((table) => {
        const tableNode: IoTDB.TreeNodeData = {
          nodeName: table.tableVO.tableName,
          parentName: db.database,
          database: db.database,
          nodeType: 'TABLE',
          comment: table.tableVO.comment === 'null' ? '' : table.tableVO.comment,
          ttl: table.tableVO.ttl,
          children: table.columnVOS.map((col) => ({
            nodeName: col.columnName,
            database: db.database,
            parentName: table.tableVO.tableName,
            comment: col.comment === 'null' ? '' : col.comment,
            dataType: col.dataType,
            cateGory: col.cateGory,
            nodeType: col.cateGory as IoTDB.TreeNodeData['nodeType'],
          })),
        };
        dbNode.children?.push(tableNode);
      });
      data.push(dbNode);
      databaseNames.value.push(db.database);
    });
    return data;
  });

  return {
    treeData,
    databaseNames,
    getDatabases,
  };
});

export default useDbStore;
