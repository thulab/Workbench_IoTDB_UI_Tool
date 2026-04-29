import path from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = process.cwd();
const reportScriptPath = path.join(repoRoot, 'tests', 'e2e', 'scripts', 'run-playwright-report.mjs');
const orderedModules = ['login', 'instance', 'dashboard', 'measurement', 'query'];
const realFullModules = ['login', 'instance', 'dashboard', 'query'];
const presetModuleMap = {
  full: realFullModules,
  'full-real': realFullModules,
  'full-dev': [...orderedModules],
};
const moduleSpecMap = {
  login: ['tests/e2e/Instance_Login/login.spec.ts'],
  instance: ['tests/e2e/Instance_Management/instance-management.spec.ts'],
  dashboard: ['tests/e2e/Instance_Dashboard/dashboard.spec.ts'],
  measurement: ['tests/e2e/Measurement_Management/measurement-management.spec.ts'],
  query: [
    'tests/e2e/query/data-search.spec.ts',
    'tests/e2e/query/sql-search.spec.ts',
    'tests/e2e/query/statistic-search.spec.ts',
  ],
};

function printUsage() {
  console.log(`Usage:
  start.bat <module...|module1,module2,...> [report|headed] [--dry-run]
  ./start.sh <module...|module1,module2,...> [report|headed] [--dry-run]

Modules:
  login
  instance
  dashboard
  measurement
  query
  full
  full-real
  full-dev

Examples:
  start.bat login
  start.bat login headed
  start.bat measurement
  start.bat measurement headed
  start.bat login instance dashboard
  start.bat login instance dashboard measurement headed
  start.bat login,instance,dashboard,measurement headed
  start.bat full
  start.bat full headed
  start.bat full-real headed
  start.bat full-dev headed

Notes:
  report  = generate report without headed browser mode
  headed  = open browser and generate report
  full/full-real = run real Workbench modules on 127.0.0.1:9190
  full-dev = include measurement module and open local frontend on 127.0.0.1:8098
  --dry-run = print resolved command without executing`);
}

function normalizeModuleToken(token) {
  return token.trim().toLowerCase();
}

function parseArgs(argv) {
  const args = [...argv];
  const helpFlags = new Set(['help', '-h', '--help']);
  if (!args.length || args.some((arg) => helpFlags.has(arg.toLowerCase()))) {
    return { help: true };
  }

  let dryRun = false;
  const filteredArgs = [];
  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    filteredArgs.push(arg);
  }

  if (!filteredArgs.length) {
    return { help: true };
  }

  let mode = 'report';
  const lastArg = filteredArgs.at(-1)?.toLowerCase();
  if (lastArg === 'report' || lastArg === 'headed') {
    mode = lastArg;
    filteredArgs.pop();
  }

  if (!filteredArgs.length) {
    throw new Error('At least one module must be provided.');
  }

  const rawModules = filteredArgs
    .flatMap((arg) => arg.split(','))
    .map(normalizeModuleToken)
    .filter(Boolean);

  if (!rawModules.length) {
    throw new Error('At least one valid module must be provided.');
  }

  const uniqueModules = [];
  for (const moduleName of rawModules) {
    if (!uniqueModules.includes(moduleName)) {
      uniqueModules.push(moduleName);
    }
  }

  const allowedModules = new Set([...orderedModules, ...Object.keys(presetModuleMap)]);
  const invalidModules = uniqueModules.filter((moduleName) => !allowedModules.has(moduleName));
  if (invalidModules.length) {
    throw new Error(`Unsupported module(s): ${invalidModules.join(', ')}`);
  }

  const selectedPreset = uniqueModules.find((moduleName) => Object.prototype.hasOwnProperty.call(presetModuleMap, moduleName));
  if (selectedPreset && uniqueModules.length > 1) {
    throw new Error(`The "${selectedPreset}" preset cannot be combined with other modules.`);
  }

  const modules = selectedPreset ? [...presetModuleMap[selectedPreset]] : uniqueModules;

  return {
    help: false,
    dryRun,
    mode,
    requestedModules: uniqueModules,
    modules,
    selectedPreset,
  };
}

function buildSpecList(modules) {
  const specs = [];
  for (const moduleName of modules) {
    for (const spec of moduleSpecMap[moduleName]) {
      if (!specs.includes(spec)) {
        specs.push(spec);
      }
    }
  }
  return specs;
}

function buildReportKey(modules, mode, selectedPreset) {
  let baseKey = `${modules.join('-')}-real-report`;

  if (selectedPreset === 'full' || selectedPreset === 'full-real') {
    baseKey = 'real-full-report';
  } else if (selectedPreset === 'full-dev') {
    baseKey = 'dev-full-report';
  }

  return mode === 'headed' ? baseKey.replace('-report', '-headed-report') : baseKey;
}

function buildCommandArgs(config) {
  return [
    reportScriptPath,
    '--report-key',
    config.reportKey,
    ...config.specs.flatMap((spec) => ['--spec', spec]),
    '--project',
    'chromium',
    '--workers',
    '1',
    ...(config.mode === 'headed' ? ['--headed'] : []),
  ];
}

function buildRuntimeEnv(modules) {
  const env = { ...process.env };

  if (modules.includes('measurement')) {
    env.CONFIG_API_PROXY = env.CONFIG_API_PROXY || 'http://127.0.0.1:9190';
    env.PLAYWRIGHT_BASE_URL = env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8098';
    env.PLAYWRIGHT_PORT = env.PLAYWRIGHT_PORT || '8098';
    env.PLAYWRIGHT_SERVER_MODE = env.PLAYWRIGHT_SERVER_MODE || 'dev';
    env.PLAYWRIGHT_FORCE_WEBSERVER = 'true';
    delete env.PLAYWRIGHT_SKIP_WEBSERVER;
  }

  return env;
}

async function runCommand(commandArgs, runtimeEnv) {
  return await new Promise((resolve) => {
    const child = spawn(process.execPath, commandArgs, {
      cwd: repoRoot,
      env: runtimeEnv,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

try {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    printUsage();
    process.exit(1);
  }

  const specs = buildSpecList(parsed.modules);
  const reportKey = buildReportKey(parsed.modules, parsed.mode, parsed.selectedPreset);
  const runtimeEnv = buildRuntimeEnv(parsed.modules);
  const commandArgs = buildCommandArgs({
    specs,
    reportKey,
    mode: parsed.mode,
  });

  console.log();
  console.log(`[E2E] modules=${parsed.requestedModules.join(',')}`);
  console.log(`[E2E] mode=${parsed.mode}`);
  console.log(`[E2E] reportKey=${reportKey}`);
  console.log(`[E2E] specs=${specs.join(', ')}`);

  if (parsed.dryRun) {
    console.log('[E2E] dry-run=true');
    if (parsed.modules.includes('measurement')) {
      console.log(`[E2E] baseURL=${runtimeEnv.PLAYWRIGHT_BASE_URL}`);
      console.log(`[E2E] apiProxy=${runtimeEnv.CONFIG_API_PROXY}`);
      console.log(`[E2E] webServer=${runtimeEnv.PLAYWRIGHT_FORCE_WEBSERVER}`);
    }
    console.log(`[E2E] command=node ${commandArgs.join(' ')}`);
    process.exit(0);
  }

  console.log();
  const exitCode = await runCommand(commandArgs, runtimeEnv);
  process.exit(exitCode);
} catch (error) {
  console.error();
  console.error(`[E2E] ${error instanceof Error ? error.message : String(error)}`);
  console.error();
  printUsage();
  process.exit(1);
}
