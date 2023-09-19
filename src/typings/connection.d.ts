declare namespace Connection{
  export interface ConnectionItem {
    id?: number;
    type: number;
    name: string;
  }

  export interface ConnectionClusterData {
    hostAndPortVOS: Array<{ host: string, port: number | string }>;
    prometheusUrl: string;
  }

  export interface ConnectionDetail {
    id?: number | string;
    type: 0 | 1 | 2;
    name: string;
    username: string;
    password?: string;
    masterCluster: ConnectionClusterData;
    slaveCluster?: ConnectionClusterData;
  }
}
