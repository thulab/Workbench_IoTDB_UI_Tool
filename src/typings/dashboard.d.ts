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
    nodeRate: number;
  }

  export interface MetricCPURes {
    cpu: number;
    nodeType: string;
  }

  export interface MetricCPULoadRes {
    cpuLoad: number;
  }

  export interface MetricDiskRes {
    nodeType: string;
    diskTotal: number;
    diskUse: number;
    diskRatio: number;
    unit: string;
  }

  export interface MetricMemoryRes {
    nodeType: string;
    memoryTotal: number;
    memoryUse: number;
    memoryRatio: number;
    unit: string;
  }
}
