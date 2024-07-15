declare namespace Dashboard {
  export interface NodeItem {
    nodeID: string;
    address: string;
    type: string;
    status: string;
    version: string;
    physicalMachine: string;
  }

  export interface SystemNumberData {
    databaseNum: number;
    deviceNum: number;
    measurementNum: number;
  }

  export interface SystemData {
    aiNodeRatio: string;
    dataNodeRatio: string;
    configNodeRatio: string;
    active: boolean | null;
    expirationTime: string | null;
  }

  export interface ClusterNodeData {
    dataNodeRatio: string;
    configNodeRatio: string;
    active: boolean | null;
    expirationTime: string | null;
    nodes: NodeItem[];
  }

  export interface SystemInfoRes {
    databaseNum: number;
    deviceNum: number;
    measurementNum: number;
    masterNodeInfo: ClusterNodeData;
    slaveNodeInfo: ClusterNodeData | null;
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
    diskTotal: number | null;
    totalUnit: string;
    diskUse: number;
    useUnit: string;
    diskUseRatio: number;
    ioTDBUse: number;
    ioTDBUnit: string;
    ioTDBUseRatio: number;
    diskRemain: number;
    diskRemainUnit: string;
  }

  export interface MetricMemoryRes {
    nodeType: string;
    memoryTotal: number;
    memoryUse: number;
    memoryRatio: number;
    unit: string;
  }

  export interface ActiveData {
    activationTime: string;
    datanodeNum: string;
    cpuNum: string;
    deviceNum: string;
    measurementNum: string;
    ainodeNum: string;
  }
}
