import http from '@/utils/http';
import type { SystemInfoRes, MetricMemoryRes, MetricDiskRes, DiskIOUsedRateRes, MetricCPURes, MetricCPULoadRes, ActiveData } from '@/types';

// 首页
class DashboardApi {
  // 获取系统信息
  static getSystemInfo(orderBy: string[], asc: string[]): globalThis.HttpResponseP<SystemInfoRes> {
    return http.post('/home/getSystemInfo', { orderBy, asc });
  }

  // 内存
  static getMetricMemory(nodeID: string, nodeType: string, isMaster: boolean): globalThis.HttpResponseP<MetricMemoryRes> {
    return http.get('/home/getMetricMemory', { params: { nodeID, nodeType, isMaster } });
  }

  // 内存-all
  static getMetricAllMemory(isMaster: boolean): globalThis.HttpResponseP<MetricMemoryRes[]> {
    return http.get('/home/getAllMetricMemory', { params: { isMaster } });
  }

  // 获取每秒写入点数信息
  static getMetricInsertNumPerSecond(isMaster: boolean): globalThis.HttpResponseP<number> {
    return http.get('/home/getMetricInsertNumPerSecond', { params: { isMaster } });
  }

  // 文件数
  static getMetricFileCount(nodeID: string, nodeType: string, isMaster: boolean): globalThis.HttpResponseP<number> {
    return http.get('/home/getMetricFileCount', { params: { nodeID, nodeType, isMaster } });
  }

  // 文件数-all
  static getMetricAllFileCount(isMaster: boolean): globalThis.HttpResponseP<number> {
    return http.get('/home/getMetricAllFileCount', { params: { isMaster } });
  }

  // disk
  static getMetricDisk(nodeID: string, isMaster: boolean): globalThis.HttpResponseP<MetricDiskRes> {
    return http.get('/home/getMetricDisk', { params: { nodeID, isMaster } });
  }

  // disk-all
  static getMetricAllDisk(isMaster: boolean): globalThis.HttpResponseP<MetricDiskRes> {
    return http.get('/home/getMetricAllDisk', { params: { isMaster } });
  }

  // 获取磁盘I/O繁忙速率信息
  static getMetricDiskIOUsedRate(nodeID: string, isMaster: boolean): globalThis.HttpResponseP<DiskIOUsedRateRes[]> {
    return http.get('/home/getMetricDiskIOUsedRate', { params: { nodeID, isMaster } });
  }

  // CPU
  static getMetricCPU(nodeID: string, nodeType: string, isMaster: boolean): globalThis.HttpResponseP<MetricCPURes> {
    return http.get('/home/getMetricCPU', { params: { nodeID, nodeType, isMaster } });
  }

  // CPU-all
  static getMetricAllCPU(isMaster: boolean): globalThis.HttpResponseP<MetricCPURes[]> {
    return http.get('/home/getMetricAllCPU', { params: { isMaster } });
  }

  // CPU负载
  static getMetricCPULoad(nodeID: string, nodeType: string, isMaster: boolean): globalThis.HttpResponseP<MetricCPULoadRes> {
    return http.get('/home/getMetricCPULoad', { params: { nodeID, nodeType, isMaster } });
  }

  static getActiveInfo(isMaster: boolean): globalThis.HttpResponseP<ActiveData> {
    return http.get('/home/getActivationInfo', { params: { isMaster } });
  }

  // 获取机器码
  static getMachineCode(isMaster: boolean): globalThis.HttpResponseP<string> {
    return http.get('/home/getMachineCode', { params: { isMaster } });
  }

  // 激活
  static toActive(license: string, isMaster: boolean): globalThis.HttpResponseP<string> {
    return http.post('/home/active', { license, isMaster });
  }
}
export default DashboardApi;
