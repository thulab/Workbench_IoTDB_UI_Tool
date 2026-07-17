import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import JSZip from 'jszip';
import YAML from 'yaml';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const repoRoot = path.resolve(currentDirPath, '..', '..', '..');
const runtimeDir = path.join(repoRoot, '.e2e-runtime');
const downloadsDir = path.join(runtimeDir, 'downloads');
const servicesDir = path.join(runtimeDir, 'services');
const logsDir = path.join(runtimeDir, 'logs');
const runtimeConfigPath = path.join(repoRoot, 'tests', 'e2e', 'config', 'runtime-environment.json');
const isWindows = process.platform === 'win32';

const defaults = {
  workbenchUrl: 'https://cloud.tsinghua.edu.cn/f/68d07f1776244c2c9946/?dl=1',
  iotdbUrl: 'https://dlcdn.apache.org/iotdb/2.0.10/apache-iotdb-2.0.10-all-bin.zip',
  prometheusLinuxUrl: 'https://github.com/prometheus/prometheus/releases/download/v3.5.5/prometheus-3.5.5.linux-amd64.tar.gz',
  prometheusWindowsUrl: 'https://github.com/prometheus/prometheus/releases/download/v3.5.5/prometheus-3.5.5.windows-amd64.zip',
  workbenchBaseUrl: 'http://127.0.0.1:9190',
  iotdbHost: '127.0.0.1',
  iotdbPort: 6667,
  iotdbUsername: 'root',
  iotdbPassword: 'root',
  prometheusUrl: '127.0.0.1:9090',
  prometheusConfigNodeTargets: ['127.0.0.1:9091'],
  prometheusDataNodeTargets: ['127.0.0.1:9092'],
  iotdbSystemProperties: {
    cn_metric_reporter_list: 'PROMETHEUS',
    dn_metric_reporter_list: 'PROMETHEUS',
    trusted_uri_pattern: '.*',
    enable_audit_log: 'true',
    pipe_air_gap_receiver_enabled: 'true',
    pipe_air_gap_receiver_port: '9780',
  },
};

function parseArgs(argv) {
  const options = {
    downloadOnly: false,
    noStart: false,
    noConfig: false,
    forceDownload: false,
    forceExtract: false,
    skipPrometheus: false,
  };

  for (const arg of argv) {
    if (arg === '--download-only') options.downloadOnly = true;
    else if (arg === '--no-start') options.noStart = true;
    else if (arg === '--no-config') options.noConfig = true;
    else if (arg === '--force-download') options.forceDownload = true;
    else if (arg === '--force-extract') options.forceExtract = true;
    else if (arg === '--skip-prometheus') options.skipPrometheus = true;
    else if (arg === '-h' || arg === '--help') options.help = true;
    else throw new Error(`Unsupported argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  node tests/e2e/scripts/setup-e2e-env.mjs [options]

Options:
  --download-only     Download packages only, do not extract/start/configure.
  --no-start          Download and extract, but do not start services.
  --no-config         Do not update tests/e2e/config/runtime-environment.json.
  --force-download    Re-download packages even if files already exist.
  --force-extract     Re-extract packages even if extraction markers exist.
  --skip-prometheus   Skip Prometheus download/extract/start.

Environment overrides:
  SETUP_WORKBENCH_URL
  SETUP_IOTDB_URL
  SETUP_PROMETHEUS_URL
  SETUP_WORKBENCH_BASE_URL
  SETUP_IOTDB_HOST
  SETUP_IOTDB_PORT
  SETUP_IOTDB_USERNAME
  SETUP_IOTDB_PASSWORD
  SETUP_PROMETHEUS_URL_VALUE
  SETUP_PROMETHEUS_CONFIGNODE_TARGETS
  SETUP_PROMETHEUS_DATANODE_TARGETS
  SETUP_IOTDB_PIPE_AIR_GAP_RECEIVER_PORT
`);
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function getConfig() {
  const current = existsSync(runtimeConfigPath) ? JSON.parse(readFileSync(runtimeConfigPath, 'utf8')) : {};
  const prometheusUrl = process.env.SETUP_PROMETHEUS_URL || (isWindows ? defaults.prometheusWindowsUrl : defaults.prometheusLinuxUrl);
  return {
    workbenchUrl: process.env.SETUP_WORKBENCH_URL || defaults.workbenchUrl,
    iotdbUrl: process.env.SETUP_IOTDB_URL || defaults.iotdbUrl,
    prometheusUrl,
    workbenchBaseUrl: process.env.SETUP_WORKBENCH_BASE_URL || current.workbench?.realBaseUrl || defaults.workbenchBaseUrl,
    iotdbHost: process.env.SETUP_IOTDB_HOST || current.iotdb?.host || defaults.iotdbHost,
    iotdbPort: Number(process.env.SETUP_IOTDB_PORT || current.iotdb?.port || defaults.iotdbPort),
    iotdbUsername: process.env.SETUP_IOTDB_USERNAME || current.iotdb?.username || defaults.iotdbUsername,
    iotdbPassword: process.env.SETUP_IOTDB_PASSWORD || current.iotdb?.password || defaults.iotdbPassword,
    prometheusRuntimeUrl: process.env.SETUP_PROMETHEUS_URL_VALUE || current.prometheus?.url || defaults.prometheusUrl,
    prometheusConfigNodeTargets: parseTargets(process.env.SETUP_PROMETHEUS_CONFIGNODE_TARGETS, defaults.prometheusConfigNodeTargets),
    prometheusDataNodeTargets: parseTargets(process.env.SETUP_PROMETHEUS_DATANODE_TARGETS, defaults.prometheusDataNodeTargets),
    iotdbSystemProperties: {
      ...defaults.iotdbSystemProperties,
      pipe_air_gap_receiver_port: process.env.SETUP_IOTDB_PIPE_AIR_GAP_RECEIVER_PORT || defaults.iotdbSystemProperties.pipe_air_gap_receiver_port,
    },
  };
}

function parseTargets(value, fallback) {
  if (!value) return fallback;
  const targets = value
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean);
  return targets.length > 0 ? targets : fallback;
}

async function downloadFile(url, targetPath, forceDownload) {
  if (existsSync(targetPath) && !forceDownload) {
    console.log(`[setup] skip download: ${targetPath}`);
    return;
  }

  console.log(`[setup] download: ${url}`);
  ensureDir(path.dirname(targetPath));
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${url} (${response.status} ${response.statusText})`);
  }
  await pipeline(response.body, createWriteStream(targetPath));
  console.log(`[setup] saved: ${targetPath}`);
}

function markerPath(targetDir) {
  return path.join(targetDir, '.setup-extracted');
}

async function extractZip(zipPath, targetDir, forceExtract) {
  const marker = markerPath(targetDir);
  if (existsSync(marker) && !forceExtract) {
    console.log(`[setup] skip extract: ${targetDir}`);
    return;
  }

  console.log(`[setup] extract zip: ${zipPath}`);
  ensureDir(targetDir);
  const zip = await JSZip.loadAsync(readFileSync(zipPath));
  const targetRoot = path.resolve(targetDir);

  for (const entry of Object.values(zip.files)) {
    if (entry.name.startsWith('__MACOSX/')) continue;
    const outputPath = path.resolve(targetDir, entry.name);
    if (!outputPath.startsWith(`${targetRoot}${path.sep}`) && outputPath !== targetRoot) {
      throw new Error(`Unsafe zip entry path: ${entry.name}`);
    }

    if (entry.dir) {
      ensureDir(outputPath);
      continue;
    }

    ensureDir(path.dirname(outputPath));
    const content = await entry.async('nodebuffer');
    writeFileSync(outputPath, content);
  }

  writeFileSync(marker, new Date().toISOString(), 'utf8');
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || repoRoot,
      shell: false,
      stdio: options.stdio || 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function extractTarGz(tarPath, targetDir, forceExtract) {
  const marker = markerPath(targetDir);
  if (existsSync(marker) && !forceExtract) {
    console.log(`[setup] skip extract: ${targetDir}`);
    return;
  }

  console.log(`[setup] extract tar.gz: ${tarPath}`);
  ensureDir(targetDir);
  await runCommand('tar', ['-xzf', tarPath, '-C', targetDir]);
  writeFileSync(marker, new Date().toISOString(), 'utf8');
}

function walkFiles(dir, predicate, maxDepth = 8, depth = 0) {
  if (!existsSync(dir) || depth > maxDepth) return [];
  const results = [];
  for (const item of readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkFiles(fullPath, predicate, maxDepth, depth + 1));
    } else if (predicate(fullPath, item)) {
      results.push(fullPath);
    }
  }
  return results;
}

function findFirst(root, names) {
  const normalizedNames = new Set(names.map((name) => name.toLowerCase()));
  return walkFiles(root, (_fullPath, fileName) => normalizedNames.has(fileName.toLowerCase()))[0];
}

function serviceRoot(extractDir) {
  const entries = existsSync(extractDir) ? readdirSync(extractDir).map((entry) => path.join(extractDir, entry)) : [];
  const dirs = entries.filter((entry) => statSync(entry).isDirectory() && path.basename(entry) !== '__MACOSX');
  if (dirs.length === 1) return dirs[0];
  return extractDir;
}

function processCommandForScript(scriptPath) {
  if (scriptPath.endsWith('.bat') || scriptPath.endsWith('.cmd')) {
    return { command: 'cmd.exe', args: ['/c', scriptPath] };
  }
  if (scriptPath.endsWith('.sh')) {
    return { command: 'bash', args: [scriptPath] };
  }
  if (scriptPath.endsWith('.jar')) {
    return { command: 'java', args: ['-jar', scriptPath] };
  }
  return { command: scriptPath, args: [] };
}

function startDetached(name, command, args, cwd) {
  ensureDir(logsDir);
  const outPath = path.join(logsDir, `${name}.out.log`);
  const errPath = path.join(logsDir, `${name}.err.log`);
  const out = createWriteStream(outPath, { flags: 'a' });
  const err = createWriteStream(errPath, { flags: 'a' });
  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: ['ignore', out, err],
    windowsHide: true,
  });
  child.unref();
  console.log(`[setup] started ${name}: pid=${child.pid}, logs=${outPath}`);
}

function updatePropertiesFile(filePath, values) {
  const existing = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  const usedKeys = new Set();
  const nextLines = lines.map((line) => {
    const match = line.match(/^(\s*#?\s*)([A-Za-z0-9_.-]+)(\s*=)(.*)$/);
    if (!match) return line;

    const key = match[2];
    if (!Object.prototype.hasOwnProperty.call(values, key)) return line;

    usedKeys.add(key);
    return `${key}=${values[key]}`;
  });

  for (const [key, value] of Object.entries(values)) {
    if (!usedKeys.has(key)) nextLines.push(`${key}=${value}`);
  }

  writeFileSync(filePath, `${nextLines.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
}

function updateIoTDBSystemConfig(iotdbRoot, config) {
  const configFile = findFirst(iotdbRoot, ['iotdb-system.properties']);
  if (!configFile) {
    console.warn(`[setup] IoTDB system config not found under ${iotdbRoot}. Update conf/iotdb-system.properties manually.`);
    return false;
  }

  updatePropertiesFile(configFile, config.iotdbSystemProperties);
  console.log(`[setup] updated IoTDB system config: ${configFile}`);
  return true;
}

function startIoTDB(iotdbDir, config) {
  const root = serviceRoot(iotdbDir);
  const script = findFirst(root, isWindows ? ['start-standalone.bat'] : ['start-standalone.sh']);
  if (!script) {
    console.warn(`[setup] IoTDB start script not found under ${root}. Start IoTDB manually.`);
    return false;
  }
  updateIoTDBSystemConfig(root, config);
  const { command, args } = processCommandForScript(script);
  startDetached('iotdb', command, args, root);
  return true;
}

function updatePrometheusConfig(prometheusRoot, executable, config) {
  const existingConfig = findFirst(prometheusRoot, ['prometheus.yml']);
  const configPath = existingConfig || path.join(path.dirname(executable), 'prometheus.yml');
  const current = existsSync(configPath)
    ? YAML.parse(readFileSync(configPath, 'utf8')) || {}
    : {
        global: {
          scrape_interval: '15s',
          evaluation_interval: '15s',
        },
      };

  const existingScrapeConfigs = Array.isArray(current.scrape_configs) ? current.scrape_configs : [];
  const nextScrapeConfigs = existingScrapeConfigs.filter((job) => !['confignode', 'datanode'].includes(job?.job_name));

  nextScrapeConfigs.push(
    {
      job_name: 'confignode',
      static_configs: [
        {
          targets: config.prometheusConfigNodeTargets,
        },
      ],
      honor_labels: true,
    },
    {
      job_name: 'datanode',
      static_configs: [
        {
          targets: config.prometheusDataNodeTargets,
        },
      ],
      honor_labels: true,
    },
  );

  const next = {
    ...current,
    scrape_configs: nextScrapeConfigs,
  };
  writeFileSync(configPath, YAML.stringify(next), 'utf8');
  console.log(`[setup] updated Prometheus config: ${configPath}`);
  return configPath;
}

function startPrometheus(prometheusDir, config) {
  const root = serviceRoot(prometheusDir);
  const executable = findFirst(root, isWindows ? ['prometheus.exe'] : ['prometheus']);
  if (!executable) {
    console.warn(`[setup] Prometheus executable not found under ${root}. Start Prometheus manually.`);
    return false;
  }
  const configPath = updatePrometheusConfig(root, executable, config);
  startDetached('prometheus', executable, [`--config.file=${configPath}`, '--web.listen-address=127.0.0.1:9090'], path.dirname(executable));
  return true;
}

function startWorkbench(workbenchDir) {
  const root = serviceRoot(workbenchDir);
  const script = findFirst(
    root,
    isWindows
      ? ['start.bat', 'startup.bat', 'workbench.bat', 'run.bat']
      : ['start.sh', 'startup.sh', 'workbench.sh', 'run.sh'],
  );
  const jar = script
    ? undefined
    : walkFiles(root, (_fullPath, fileName) => fileName.toLowerCase().endsWith('.jar') && fileName.toLowerCase().includes('workbench'))[0];
  const startup = script || jar;

  if (!startup) {
    console.warn(`[setup] Workbench start script not found under ${root}. Start Workbench manually.`);
    return false;
  }

  const { command, args } = processCommandForScript(startup);
  startDetached('workbench', command, args, path.dirname(startup));
  return true;
}

function updateRuntimeConfig(config) {
  const current = JSON.parse(readFileSync(runtimeConfigPath, 'utf8'));
  const next = {
    ...current,
    workbench: {
      ...current.workbench,
      realBaseUrl: config.workbenchBaseUrl,
      devProxyApiUrl: config.workbenchBaseUrl,
    },
    iotdb: {
      ...current.iotdb,
      instanceName: current.iotdb?.instanceName || 'localhost',
      host: config.iotdbHost,
      port: config.iotdbPort,
      username: config.iotdbUsername,
      password: config.iotdbPassword,
      defaultModel: current.iotdb?.defaultModel || 'tree',
      supportedModels: ['tree', 'table'],
    },
    prometheus: {
      ...current.prometheus,
      url: config.prometheusRuntimeUrl,
    },
  };
  writeFileSync(runtimeConfigPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`[setup] updated runtime config: ${runtimeConfigPath}`);
}

function waitForTcp(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function waitForHttp(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function healthCheck(config, skipPrometheus) {
  console.log('[setup] health check starts');
  const checks = [
    ['IoTDB', await waitForTcp(config.iotdbHost, config.iotdbPort, 3_000)],
    ['Workbench', await waitForHttp(config.workbenchBaseUrl, 5_000)],
  ];
  if (!skipPrometheus) {
    const prometheusUrl = config.prometheusRuntimeUrl.startsWith('http')
      ? config.prometheusRuntimeUrl
      : `http://${config.prometheusRuntimeUrl}`;
    checks.push(['Prometheus', await waitForHttp(`${prometheusUrl.replace(/\/$/, '')}/-/ready`, 5_000)]);
  }

  for (const [name, ok] of checks) {
    console.log(`[setup] ${name}: ${ok ? 'reachable' : 'not reachable yet'}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const config = getConfig();
  ensureDir(downloadsDir);
  ensureDir(servicesDir);
  ensureDir(logsDir);

  const workbenchArchive = path.join(downloadsDir, 'workbench.zip');
  const iotdbArchive = path.join(downloadsDir, 'apache-iotdb-2.0.10-all-bin.zip');
  const prometheusArchive = path.join(downloadsDir, isWindows ? 'prometheus-3.5.5.windows-amd64.zip' : 'prometheus-3.5.5.linux-amd64.tar.gz');

  await downloadFile(config.workbenchUrl, workbenchArchive, options.forceDownload);
  await downloadFile(config.iotdbUrl, iotdbArchive, options.forceDownload);
  if (!options.skipPrometheus) {
    await downloadFile(config.prometheusUrl, prometheusArchive, options.forceDownload);
  }

  if (options.downloadOnly) {
    console.log('[setup] download-only finished');
    return;
  }

  const workbenchDir = path.join(servicesDir, 'workbench');
  const iotdbDir = path.join(servicesDir, 'iotdb');
  const prometheusDir = path.join(servicesDir, 'prometheus');

  await extractZip(workbenchArchive, workbenchDir, options.forceExtract);
  await extractZip(iotdbArchive, iotdbDir, options.forceExtract);
  if (!options.skipPrometheus) {
    if (prometheusArchive.endsWith('.zip')) {
      await extractZip(prometheusArchive, prometheusDir, options.forceExtract);
    } else {
      await extractTarGz(prometheusArchive, prometheusDir, options.forceExtract);
    }
  }

  if (!options.noConfig) {
    updateRuntimeConfig(config);
  }

  if (!options.noStart) {
    startIoTDB(iotdbDir, config);
    if (!options.skipPrometheus) startPrometheus(prometheusDir, config);
    startWorkbench(workbenchDir);
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    await healthCheck(config, options.skipPrometheus);
  }

  console.log('[setup] finished');
}

main().catch((error) => {
  console.error(`[setup] ${error.stack || error.message}`);
  process.exitCode = 1;
});
