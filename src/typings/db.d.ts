declare namespace IoTDB {
  export interface TableVO {
    tableName: string;
    comment?: string;
    ttl: string;
    ttlUnit: string;
  }

  export interface ColumnVOS {
    columnName: string;
    comment?: string;
    cateGory: string;
    dataType: string;
  }

  export interface Table {
    tableVO: tableVO;
    columnVOS: ColumnVOS[];
  }

  export interface ValueRes {
    databases: Database[];
  }

  export interface DatabaseRes {
    sql: string;
    value: ValueRes;
  }

  export interface Database {
    database: string;
    tables: Table[];
  }

  export interface TreeNodeData {
    nodeName: string;
    parentName?: string;
    database?: string;
    comment?: string;
    ttl?: string;
    columnName?: string;
    cateGory?: string;
    dataType?: string;
    nodeType: 'DATABASE' | 'TABLE' | 'COLUMN' | 'TAG' | 'FIELD' | 'ATTRIBITE' | 'TIME' | 'TABLEDATA';
    children?: TreeNodeData[];
  }
}
