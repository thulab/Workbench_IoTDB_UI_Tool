import http from '@/utils/http';
import type { SynchronListData, SynchronData, PluginList, PipeMonitorParams, PipeMonitorData } from '@/types';

// 数据同步
class DataSyncApi {
  static getDataSynchronList(taskName: string): globalThis.HttpResponseP<SynchronListData[]> {
    return http.get('/synchron/getDataSynchronList', { params: { taskName } });
  }

  static startTaskByNames(taskNames: string[]): globalThis.HttpResponseP {
    return http.post('/synchron/startTaskByNames', { taskNames });
  }

  static stopTaskByNames(taskNames: string[]): globalThis.HttpResponseP {
    return http.post('/synchron/stopTaskByNames', { taskNames });
  }

  static deleteDataSynchronByNames(taskNames: string[]): globalThis.HttpResponseP {
    return http.post('/synchron/deleteDataSynchronByNames', { taskNames });
  }

  static saveSynchronTask(data: SynchronData): globalThis.HttpResponseP {
    return http.post('/synchron/saveSynchronTask', data);
  }

  static saveAdvancedTask(advancedTask: string): globalThis.HttpResponseP {
    return http.post('/synchron/saveAdvancedTask', { advancedTask });
  }

  static getTaskDetail(taskName: string): globalThis.HttpResponseP<SynchronData> {
    return http.get('/synchron/getTaskDetail', { params: { taskName } });
  }

  static getAdvancedTaskDetail(taskName: string): globalThis.HttpResponseP<{ name: string; advancedInput: string }> {
    return http.get('/synchron/getAdvancedTaskDetail', { params: { taskName } });
  }

  static getPilePluginsList(): globalThis.HttpResponseP<PluginList> {
    return http.get('/synchron/getPilePluginsList');
  }

  static getPipeMemoryCost(data: PipeMonitorParams): globalThis.HttpResponseP<PipeMonitorData[]> {
    return http.post('/synchron/getPipeMemoryCost', data);
  }

  static getPipeDelayTrend(data: PipeMonitorParams): globalThis.HttpResponseP<PipeMonitorData[]> {
    return http.post('/synchron/getPipeDelayTrend', data);
  }

  static getPipeEstimateRemainingTime(data: PipeMonitorParams): globalThis.HttpResponseP<{ remainTime: string; timeUnit: string }> {
    return http.post('/synchron/getPipeEstimateRemainingTime', data);
  }
}
export default DataSyncApi;
