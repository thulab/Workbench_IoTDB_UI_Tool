import path from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = process.cwd();
const reportScriptPath = path.join(repoRoot, 'tests', 'e2e', 'scripts', 'run-playwright-report.mjs');
const cleanupScriptPath = path.join(repoRoot, 'tests', 'e2e', 'scripts', 'run-real-cleanup.mjs');
const tscScriptPath = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const orderedModules = ['login', 'instance', 'dashboard', 'measurement', 'search', 'sql', 'calculate'];
const specialCommands = ['typecheck', 'search-cleanup', 'measurement-cleanup', 'calculate-cleanup', 'cleanup-all'];
const fullModules = ['login', 'instance', 'dashboard', 'measurement', 'search', 'sql', 'calculate'];
const presetModuleMap = {
  full: fullModules,
  'full-real': fullModules,
  'full-dev': [...fullModules],
};
const moduleSpecMap = {
  login: ['tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts'],
  instance: ['tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts'],
  dashboard: ['tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts'],
  measurement: ['tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts'],
  search: [
    'tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts',
    'tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts',
  ],
  sql: ['tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts'],
  calculate: ['tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts'],
};
const runtimeTargets = new Set(['direct', 'real', '9190', 'dev', '8098']);

function printUsage() {
  console.log(`Usage:
  start.bat <module...|module1,module2,...> [direct|dev] [report|headed] [--dry-run]
  ./start.sh <module...|module1,module2,...> [direct|dev] [report|headed] [--dry-run]

Modules:
  login
  instance
  dashboard
  measurement
  search
  sql
  calculate
  search-cleanup
  measurement-cleanup
  calculate-cleanup
  cleanup-all
  typecheck
  full
  full-real
  full-dev

Examples:
  start.bat login
  start.bat login direct
  start.bat login headed
  start.bat measurement direct
  start.bat search direct
  start.bat sql direct
  start.bat calculate direct
  start.bat measurement dev
  start.bat measurement headed
  start.bat login instance dashboard calculate
  start.bat login instance dashboard measurement calculate direct headed
  start.bat login,instance,dashboard,measurement,calculate direct headed
  start.bat full
  start.bat full headed
  start.bat full-real headed
  start.bat full-dev headed
  start.bat search-cleanup
  start.bat measurement-cleanup
  start.bat calculate-cleanup
  start.bat cleanup-all
  start.bat typecheck
  start.bat typecheck --dry-run

Notes:
  direct  = connect directly to Workbench on 127.0.0.1:9190
  dev     = open local frontend on 127.0.0.1:8098 and proxy API to 127.0.0.1:9190
  report  = generate report without headed browser mode
  headed  = open browser and generate report
  search-cleanup / measurement-cleanup / calculate-cleanup / cleanup-all = cleanup-only commands for real 127.0.0.1:9190 data
  typecheck = run TypeScript check for Playwright and tests/e2e via tsconfig.e2e.json
  full/full-real = run all modules including SQL and Calculate in direct mode on 127.0.0.1:9190
  full-dev = run all modules including SQL and Calculate in dev mode on 127.0.0.1:8098
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

  let runtimeTarget = null;
  const moduleArgs = [];
  for (const arg of filteredArgs) {
    const normalizedArg = arg.toLowerCase();
    if (runtimeTargets.has(normalizedArg)) {
      if (runtimeTarget) {
        throw new Error(`Only one runtime target can be provided, but received "${runtimeTarget}" and "${arg}".`);
      }
      runtimeTarget = normalizedArg;
      continue;
    }

    moduleArgs.push(arg);
  }

  if (!moduleArgs.length) {
    throw new Error('At least one module must be provided.');
  }

  const rawModules = moduleArgs
    .flatMap((arg) => arg.split(','))
    .map(normalizeModuleToken)
    .filter(Boolean);

  if (!rawModules.length) {
    throw new Error('At least one valid module must be provided.');
  }

  const selectedSpecialCommand = rawModules.find((moduleName) => specialCommands.includes(moduleName));
  if (selectedSpecialCommand) {
    if (rawModules.length > 1) {
      throw new Error(`The "${selectedSpecialCommand}" command cannot be combined with other modules.`);
    }

    return {
      help: false,
      dryRun,
      command: selectedSpecialCommand,
    };
  }

  const uniqueModules = [];
  for (const moduleName of rawModules) {
    if (!uniqueModules.includes(moduleName)) {
      uniqueModules.push(moduleName);
    }
  }

  const allowedModules = new Set([...orderedModules, ...specialCommands, ...Object.keys(presetModuleMap)]);
  const invalidModules = uniqueModules.filter((moduleName) => !allowedModules.has(moduleName));
  if (invalidModules.length) {
    throw new Error(`Unsupported module(s): ${invalidModules.join(', ')}`);
  }

  const selectedPreset = uniqueModules.find((moduleName) => Object.prototype.hasOwnProperty.call(presetModuleMap, moduleName));
  if (selectedPreset && uniqueModules.length > 1) {
    throw new Error(`The "${selectedPreset}" preset cannot be combined with other modules.`);
  }

  const modules = selectedPreset ? [...presetModuleMap[selectedPreset]] : uniqueModules;
  const resolvedRuntimeTarget =
    runtimeTarget === 'real' || runtimeTarget === '9190'
      ? 'direct'
      : runtimeTarget === '8098'
        ? 'dev'
        : runtimeTarget;

  if (selectedPreset === 'full-dev' && resolvedRuntimeTarget === 'direct') {
    throw new Error('The "full-dev" preset cannot run in direct mode. Use "full" or "full-real" instead.');
  }

  if ((selectedPreset === 'full' || selectedPreset === 'full-real') && resolvedRuntimeTarget === 'dev') {
    throw new Error(`The "${selectedPreset}" preset is fixed to direct mode. Use "full-dev" for local frontend mode.`);
  }

  return {
    help: false,
    dryRun,
    mode,
    requestedModules: uniqueModules,
    modules,
    selectedPreset,
    runtimeTarget: resolvedRuntimeTarget || (selectedPreset === 'full-dev' ? 'dev' : 'direct'),
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

function buildRuntimeConfig(runtimeTarget) {
  const env = { ...process.env };

  if (runtimeTarget === 'dev') {
    env.PLAYWRIGHT_REAL_BACKEND = 'true';
    env.CONFIG_API_PROXY = 'http://127.0.0.1:9190';
    env.PLAYWRIGHT_REAL_BASE_URL = 'http://127.0.0.1:9190';
    env.PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:8098';
    env.PLAYWRIGHT_PORT = '8098';
    env.PLAYWRIGHT_SERVER_MODE = 'dev';
    env.PLAYWRIGHT_FORCE_WEBSERVER = 'true';
    delete env.PLAYWRIGHT_SKIP_WEBSERVER;
    return {
      env,
      runtimeTarget,
      baseURL: env.PLAYWRIGHT_BASE_URL,
      apiProxy: env.CONFIG_API_PROXY,
      webServer: 'enabled',
    };
  }

  env.PLAYWRIGHT_REAL_BACKEND = 'true';
  env.PLAYWRIGHT_REAL_BASE_URL = 'http://127.0.0.1:9190';
  env.PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:9190';
  env.PLAYWRIGHT_PORT = '9190';
  env.PLAYWRIGHT_SKIP_WEBSERVER = 'true';
  delete env.PLAYWRIGHT_FORCE_WEBSERVER;
  delete env.PLAYWRIGHT_SERVER_MODE;
  delete env.CONFIG_API_PROXY;

  return {
    env,
    runtimeTarget,
    baseURL: env.PLAYWRIGHT_BASE_URL,
    apiProxy: 'none',
    webServer: 'disabled',
  };
}

function buildTypecheckCommandArgs() {
  return [tscScriptPath, '-p', 'tsconfig.e2e.json', '--noEmit'];
}

function buildCleanupCommandArgs(command) {
  if (command === 'search-cleanup') {
    return [cleanupScriptPath, 'search'];
  }

  if (command === 'measurement-cleanup') {
    return [cleanupScriptPath, 'measurement'];
  }

  if (command === 'calculate-cleanup') {
    return [cleanupScriptPath, 'calculate'];
  }

  return [cleanupScriptPath, 'all'];
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

  if (parsed.command === 'typecheck') {
    const commandArgs = buildTypecheckCommandArgs();

    console.log();
    console.log('[E2E] command=typecheck');

    if (parsed.dryRun) {
      console.log('[E2E] dry-run=true');
      console.log(`[E2E] command=node ${commandArgs.join(' ')}`);
      process.exit(0);
    }

    console.log();
    const exitCode = await runCommand(commandArgs, process.env);
    process.exit(exitCode);
  }

  if (
    parsed.command === 'search-cleanup'
    || parsed.command === 'measurement-cleanup'
    || parsed.command === 'calculate-cleanup'
    || parsed.command === 'cleanup-all'
  ) {
    const commandArgs = buildCleanupCommandArgs(parsed.command);

    console.log();
    console.log(`[E2E] command=${parsed.command}`);
    console.log(`[E2E] baseURL=http://127.0.0.1:9190`);

    if (parsed.dryRun) {
      console.log('[E2E] dry-run=true');
      console.log(`[E2E] command=node ${commandArgs.join(' ')}`);
      process.exit(0);
    }

    console.log();
    const exitCode = await runCommand(commandArgs, process.env);
    process.exit(exitCode);
  }

  const specs = buildSpecList(parsed.modules);
  const reportKey = buildReportKey(parsed.modules, parsed.mode, parsed.selectedPreset);
  const runtime = buildRuntimeConfig(parsed.runtimeTarget);
  const commandArgs = buildCommandArgs({
    specs,
    reportKey,
    mode: parsed.mode,
  });

  console.log();
  console.log(`[E2E] modules=${parsed.requestedModules.join(',')}`);
  console.log(`[E2E] mode=${parsed.mode}`);
  console.log(`[E2E] target=${runtime.runtimeTarget}`);
  console.log(`[E2E] baseURL=${runtime.baseURL}`);
  console.log(`[E2E] reportKey=${reportKey}`);
  console.log(`[E2E] specs=${specs.join(', ')}`);

  if (parsed.dryRun) {
    console.log('[E2E] dry-run=true');
    console.log(`[E2E] apiProxy=${runtime.apiProxy}`);
    console.log(`[E2E] webServer=${runtime.webServer}`);
    console.log(`[E2E] command=node ${commandArgs.join(' ')}`);
    process.exit(0);
  }

  console.log();
  const exitCode = await runCommand(commandArgs, runtime.env);
  process.exit(exitCode);
} catch (error) {
  console.error();
  console.error(`[E2E] ${error instanceof Error ? error.message : String(error)}`);
  console.error();
  printUsage();
  process.exit(1);
}
