declare namespace Dashboard{

  export interface NodeItem {
    address: string;
    type: string;
    status: string;
    version: string;
    physicalMachine: string;
  }

  export interface SystemData {
    dataNodeRatio: string;
    configNodeRatio: string;
    active: boolean;
    expirationTime: string;
    databaseNum: number;
    deviceNum: number;
    measurementNum: number;
  }

  export interface SystemInfoRes extends SystemData {
    nodes: NodeItem[];
  }

  export interface DiskIOUsedRateRes {
    diskName: string;
    dateNodeRate: number;
    configNodeRate: number;
  }

  export interface MetricCPURes {
    cpu: number;
    nodeType: string;
  }

  export interface MetricCPULoadRes {
    total: number;
    usedCPUNum: numer;
  }
}
