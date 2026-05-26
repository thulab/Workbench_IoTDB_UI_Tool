import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const runtimeConfigPath = path.join(currentDirPath, '..', 'config', 'runtime-environment.json');
const runtimeEnvironment = JSON.parse(readFileSync(runtimeConfigPath, 'utf8'));

function parseUrlPort(url, fallbackPort) {
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
  return runtimeEnvironment;
}

export function getRealWorkbenchBaseUrl(env = process.env) {
  return env.PLAYWRIGHT_REAL_BASE_URL || env.PLAYWRIGHT_BASE_URL || runtimeEnvironment.workbench.realBaseUrl;
}

export function getDevWorkbenchBaseUrl(env = process.env) {
  return env.PLAYWRIGHT_DEV_BASE_URL || runtimeEnvironment.workbench.devBaseUrl;
}

export function getDevProxyApiUrl(env = process.env) {
  return env.CONFIG_API_PROXY || runtimeEnvironment.workbench.devProxyApiUrl;
}

export function getPlaywrightPort(realBackendRun, env = process.env) {
  if (env.PLAYWRIGHT_PORT) {
    return Number(env.PLAYWRIGHT_PORT);
  }

  if (realBackendRun) {
    return parseUrlPort(getRealWorkbenchBaseUrl(env), 9190);
  }

  return parseUrlPort(getDevWorkbenchBaseUrl(env), 8098);
}

export function getLocalhostConnection() {
  return {
    name: runtimeEnvironment.iotdb.instanceName,
    host: runtimeEnvironment.iotdb.host,
    port: runtimeEnvironment.iotdb.port,
    username: runtimeEnvironment.iotdb.username,
    password: runtimeEnvironment.iotdb.password,
    model: runtimeEnvironment.iotdb.model,
    prometheusUrl: runtimeEnvironment.prometheus.url,
    prometheusUsername: runtimeEnvironment.prometheus.username,
    prometheusPassword: runtimeEnvironment.prometheus.password,
  };
}
