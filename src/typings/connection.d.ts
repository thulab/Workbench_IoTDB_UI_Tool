declare namespace Connection {
  export interface ConnectionItem {
    id: number | string;
    type: number;
    name: string;
    username: string;
  }

  export interface ConnectionClusterData {
    hostAndPortVOS: Array<{ host: string; port: number | string }>;
    prometheusUrl: string;
    prometheusUsername?: string;
    prometheusPassword?: string;
  }

  export interface ConnectionDetail {
    id: number | string;
    type: 0 | 1 | 2;
    name: string;
    username: string;
    password?: string;
    masterCluster: ConnectionClusterData;
    slaveCluster?: ConnectionClusterData | null;
  }

  export interface PrometheusDetail {
    prometheusUrlMaster: string;
    prometheusUrlSlave: string;
    prometheusUsernameMaster?: string;
    prometheusPasswordMaster?: string;
    prometheusUsernameSlave?: string;
    prometheusPasswordSlave?: string;
    doubleAlive: boolean;
  }

  export interface SavePrometheusDetail {
    id: number | string;
    prometheusUrlMaster: string;
    prometheusUsernameMaster?: string;
    prometheusPasswordMaster?: string;
    prometheusUrlSlave: string;
    prometheusUsernameSlave?: string;
    prometheusPasswordSlave?: string;
  }
}
