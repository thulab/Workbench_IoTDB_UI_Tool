import { defineStore } from 'pinia';
import IoTDBApi from '@/api/db.api';

const { requestFn: fetchDatabases } = useRequest(IoTDBApi.getDatabases);

export const useDbStore = defineStore('db', () => {
  const databases = ref<IoTDB.Database[]>([]);

  async function getDatabases() {
    const res = await fetchDatabases();
    databases.value = res.data;
  }

  const treeData = computed<Array<IoTDB.TreeNodeData>>(() => {
    const data: Array<IoTDB.TreeNodeData> = [];
    databases.value.forEach((db) => {
      const dbNode: IoTDB.TreeNodeData = {
        nodeName: db.database,
        nodeType: 'DATABASE',
        children: [],
      };
      db.tables.forEach((table) => {
        const tableNode: IoTDB.TreeNodeData = {
          nodeName: table.tableVO.tableName,
          parentName: db.database,
          nodeType: 'TABLE',
          comment: table.tableVO.comment,
          ttl: table.tableVO.ttl,
          children: table.columns.map((col) => ({
            nodeName: col.columnName,
            parentName: table.tableVO.tableName,
            comment: col.comment,
            dataType: col.dataType,
            cateGory: col.cateGory,
            nodeType: col.cateGory as IoTDB.TreeNodeData['nodeType'],
          })),
        };
        dbNode.children?.push(tableNode);
      });
      data.push(dbNode);
    });
    data.push({
      nodeName: 'db1',
      parentName: '',
      nodeType: 'DATABASE',
      children: [
        {
          nodeName: 'table1',
          parentName: 'db1',
          nodeType: 'TABLE',
          comment: 'This is table 1',
          ttl: '300',
          children: [
            {
              nodeName: 'column1',
              parentName: 'table1',
              nodeType: 'TIME',
              comment: 'This is a time column',
              dataType: 'TIMESTAMP',
              cateGory: 'TIME',
            },
            {
              nodeName: 'column2',
              parentName: 'table1',
              nodeType: 'FIELD',
              comment: 'This is a field column',
              dataType: 'FIELD',
              cateGory: 'FIELD',
            },
          ],
        },
      ],
    });
    data.push({
      nodeName: 'db2',
      parentName: '',
      nodeType: 'DATABASE',
      children: [
        {
          nodeName: 'table2',
          parentName: 'db2',
          nodeType: 'TABLE',
          comment: 'This is table 2',
          ttl: '8900',
          children: [
            {
              nodeName: 'column1',
              parentName: 'table2',
              nodeType: 'FIELD',
            },
            {
              nodeName: 'column2',
              parentName: 'table2',
              nodeType: 'TIME',
            },
          ],
        },
      ],
    });
    return data;
  });

  return {
    treeData,
    databases,
    getDatabases,
  };
});

export default useDbStore;
