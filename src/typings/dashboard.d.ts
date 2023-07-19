declare namespace Dashboard{

  export interface NodeItem {
    address: string;
    type: string;
    status: string;
    version: string;
    physicalMachine: string;
  }

  export interface SystemInfoRes {
    dataNodeRatio: string;
    configNodeRatio: string;
    active: boolean;
    expirationTime: string;
    databaseNum: number;
    deviceNum: number;
    measurementNum: NodeItem[];
  }

  export interface DiskIOUsedRateRes {
    diskName: string;
    dateNodeRate: number;
    configNodeRate: number;
  }

  export interface MetricCPURes {
    cpuDataNode: number;
    cpuConfigNode: number;
  }

  export interface MetricCPULoadRes {
    total: number;
    usedCPUNum: numer;
  }
}
