import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type RuntimeEnvironment = {
  workbench: {
    realBaseUrl: string;
    devBaseUrl: string;
    devProxyApiUrl: string;
  };
  iotdb: {
    instanceName: string;
    host: string;
    port: number;
    username: string;
    password: string;
    model: 'tree' | 'table';
  };
  prometheus: {
    url: string;
    username: string;
    password: string;
  };
};

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const runtimeConfigPath = path.join(currentDirPath, '..', 'config', 'runtime-environment.json');
const runtimeConfig = JSON.parse(readFileSync(runtimeConfigPath, 'utf8')) as RuntimeEnvironment;

function parseUrlPort(url: string, fallbackPort: number) {
  try {
    const parsed = new URL(url);
    if (parsed.port) {
      return Number(parsed.port);
    }
    return parsed.protocol === 'https:' ? 443 : 80;
  } catch {
    return fallbackPort;
  }
}

export function getRuntimeEnvironment() {
  return runtimeConfig;
}

export function getRealWorkbenchBaseUrl() {
  return process.env.PLAYWRIGHT_REAL_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || runtimeConfig.workbench.realBaseUrl;
}

export function getDevWorkbenchBaseUrl() {
  return process.env.PLAYWRIGHT_DEV_BASE_URL || runtimeConfig.workbench.devBaseUrl;
}

export function getDevProxyApiUrl() {
  return process.env.CONFIG_API_PROXY || runtimeConfig.workbench.devProxyApiUrl;
}

export function getPlaywrightPort(realBackendRun: boolean) {
  if (process.env.PLAYWRIGHT_PORT) {
    return Number(process.env.PLAYWRIGHT_PORT);
  }

  if (realBackendRun) {
    return parseUrlPort(getRealWorkbenchBaseUrl(), 9190);
  }

  return parseUrlPort(getDevWorkbenchBaseUrl(), 8098);
}

export const localhostConnection = {
  name: runtimeConfig.iotdb.instanceName,
  host: runtimeConfig.iotdb.host,
  port: runtimeConfig.iotdb.port,
  username: runtimeConfig.iotdb.username,
  password: runtimeConfig.iotdb.password,
  model: runtimeConfig.iotdb.model,
  prometheusUrl: runtimeConfig.prometheus.url,
  prometheusUsername: runtimeConfig.prometheus.username,
  prometheusPassword: runtimeConfig.prometheus.password,
} as const;

export const enterpriseDbConfig = {
  host: runtimeConfig.iotdb.host,
  port: runtimeConfig.iotdb.port,
  username: runtimeConfig.iotdb.username,
  password: runtimeConfig.iotdb.password,
} as const;
