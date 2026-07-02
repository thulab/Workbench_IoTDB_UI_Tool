import path from 'node:path';
import { spawn } from 'node:child_process';
import { getDevProxyApiUrl, getDevWorkbenchBaseUrl, getPlaywrightPort, getRealWorkbenchBaseUrl } from './runtime-config.mjs';

const repoRoot = process.cwd();
const reportScriptPath = path.join(repoRoot, 'tests', 'e2e', 'scripts', 'run-playwright-report.mjs');
const cleanupScriptPath = path.join(repoRoot, 'tests', 'e2e', 'scripts', 'run-real-cleanup.mjs');
const tscScriptPath = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const playwrightCliPath = path.join(repoRoot, 'node_modules', 'playwright', 'cli.js');
const realWorkbenchBaseUrl = getRealWorkbenchBaseUrl();
const devWorkbenchBaseUrl = getDevWorkbenchBaseUrl();
const devProxyApiUrl = getDevProxyApiUrl();
const directPort = String(getPlaywrightPort(true));
const devPort = String(getPlaywrightPort(false));

const moduleDefinitions = [
  {
    key: 'tree-instance',
    displayName: 'tree-instance',
    aliases: ['tree-instance', 'tree-instance-management', 'instance', 'instance-management'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts'],
  },
  {
    key: 'table-instance',
    displayName: 'table-instance',
    aliases: ['table-instance', 'table-instance-management'],
    specs: ['tests/e2e/Test_Cases/Table_Model/Instance_Management/instance-management.spec.ts'],
  },
  {
    key: 'tree-login',
    displayName: 'tree-login',
    aliases: ['tree-login', 'login'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts'],
  },
  {
    key: 'table-login',
    displayName: 'table-login',
    aliases: ['table-login'],
    specs: ['tests/e2e/Test_Cases/Table_Model/Instance_Login/login.spec.ts'],
  },
  {
    key: 'tree-dashboard',
    displayName: 'tree-dashboard',
    aliases: ['tree-dashboard', 'dashboard', 'home'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts'],
  },
  {
    key: 'table-dashboard',
    displayName: 'table-dashboard',
    aliases: ['table-dashboard'],
    specs: ['tests/e2e/Test_Cases/Table_Model/Instance_Dashboard/dashboard.spec.ts'],
  },
  {
    key: 'tree-measurement',
    displayName: 'tree-measurement',
    aliases: ['tree-measurement', 'tree-measurement-management', 'measurement', 'measurement-management'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts'],
  },
  {
    key: 'table-measurement',
    displayName: 'table-measurement',
    aliases: ['table-measurement', 'table-measurement-management', 'table-data', 'table-data-management'],
    specs: ['tests/e2e/Test_Cases/Table_Model/Table-Data/table-data.spec.ts'],
  },
  {
    key: 'tree-search',
    displayName: 'tree-search',
    aliases: ['tree-search', 'search', 'query'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts', 'tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts'],
  },
  {
    key: 'table-search',
    displayName: 'table-search',
    aliases: ['table-search'],
    specs: [],
  },
  {
    key: 'tree-sql',
    displayName: 'tree-sql',
    aliases: ['tree-sql', 'sql', 'sql-operation'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts'],
  },
  {
    key: 'table-sql',
    displayName: 'table-sql',
    aliases: ['table-sql', 'table-sql-operation'],
    specs: ['tests/e2e/Test_Cases/Table_Model/SQL_Search/sql-search.spec.ts'],
  },
  {
    key: 'tree-ai-analysis',
    displayName: 'tree-ai-analysis',
    aliases: ['tree-ai-analysis', 'ai-analysis', 'ai'],
    specs: [],
  },
  {
    key: 'table-ai-analysis',
    displayName: 'table-ai-analysis',
    aliases: ['table-ai-analysis', 'table-ai'],
    specs: [],
  },
  {
    key: 'tree-trend',
    displayName: 'tree-trend',
    aliases: ['tree-trend', 'trend', 'visualization', 'visual'],
    specs: [
      'tests/e2e/Test_Cases/Tree_Model/Trend/tree-running-trend.spec.ts',
      'tests/e2e/Test_Cases/Tree_Model/Trend/tree-history-trend.spec.ts',
      'tests/e2e/Test_Cases/Tree_Model/Trend/spectrum.spec.ts',
    ],
  },
  {
    key: 'table-trend',
    displayName: 'table-trend',
    aliases: ['table-trend', 'table-visualization', 'table-visual'],
    specs: [
      'tests/e2e/Test_Cases/Table_Model/Trend/table-running-trend.spec.ts',
      'tests/e2e/Test_Cases/Table_Model/Trend/table-history-trend.spec.ts',
    ],
  },
  {
    key: 'tree-view',
    displayName: 'tree-view',
    aliases: ['tree-view', 'view', 'calculate'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts'],
  },
  {
    key: 'table-view',
    displayName: 'table-view',
    aliases: ['table-view', 'table-calculate'],
    specs: [],
  },
  {
    key: 'tree-data-sync',
    displayName: 'tree-data-sync',
    aliases: ['tree-data-sync', 'data-sync', 'sync'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/Data_Sync/data-sync.spec.ts'],
  },
  {
    key: 'table-data-sync',
    displayName: 'table-data-sync',
    aliases: ['table-data-sync', 'table-sync'],
    specs: [],
  },
  {
    key: 'tree-auth',
    displayName: 'tree-auth',
    aliases: ['tree-auth', 'auth', 'permission', 'permission-management'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/System/Auth/User/user.spec.ts', 'tests/e2e/Test_Cases/Tree_Model/System/Auth/Role/role.spec.ts'],
  },
  {
    key: 'table-auth',
    displayName: 'table-auth',
    aliases: ['table-auth', 'table-permission', 'table-permission-management'],
    specs: ['tests/e2e/Test_Cases/Table_Model/System/Auth/User/table-user.spec.ts', 'tests/e2e/Test_Cases/Table_Model/System/Auth/Role/table-role.spec.ts'],
  },
  {
    key: 'tree-audit',
    displayName: 'tree-audit',
    aliases: ['tree-audit', 'audit', 'audit-log'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/System/Audit/audit.spec.ts'],
  },
  {
    key: 'table-audit',
    displayName: 'table-audit',
    aliases: ['table-audit', 'table-audit-log'],
    specs: [],
  },
  {
    key: 'tree-db-config',
    displayName: 'tree-db-config',
    aliases: ['tree-db-config', 'db-config', 'database-config', 'config'],
    specs: ['tests/e2e/Test_Cases/Tree_Model/System/Config/config.spec.ts'],
  },
  {
    key: 'table-db-config',
    displayName: 'table-db-config',
    aliases: ['table-db-config', 'table-database-config', 'table-config'],
    specs: [],
  },
];

const moduleDefinitionMap = new Map(moduleDefinitions.map((definition) => [definition.key, definition]));
const moduleAliasMap = new Map(moduleDefinitions.flatMap((definition) => definition.aliases.map((alias) => [alias, definition.key])));
const allModuleKeys = moduleDefinitions.map((definition) => definition.key);
const specialCommands = ['typecheck', 'search-cleanup', 'measurement-cleanup', 'calculate-cleanup', 'cleanup-all'];
const deprecatedPresetAliases = new Set(['full', 'full-real', 'full-dev', 'tree-full-real', 'tree-full-dev', 'table-full-real', 'table-full-dev', 'all-models-full-real', 'all-models-full-dev']);
const treeFullModules = ['tree-instance', 'tree-login', 'tree-dashboard', 'tree-measurement', 'tree-search', 'tree-sql', 'tree-trend', 'tree-view', 'tree-data-sync', 'tree-auth', 'tree-audit', 'tree-db-config'];
const tableFullModules = ['table-instance', 'table-login', 'table-dashboard', 'table-measurement', 'table-sql', 'table-trend', 'table-auth'];
const allModelsFullModules = [...treeFullModules, ...tableFullModules];
const presetModuleMap = {
  'tree-full': treeFullModules,
  'table-full': tableFullModules,
  'all-models-full': allModelsFullModules,
};
const runtimeTargets = new Set(['direct', 'real', '9190', 'dev', '8098']);

function printUsage() {
  console.log(`Usage:
  start.bat <module...|module1,module2,...> [direct|dev] [report|headed] [--plain] [--dry-run]
  ./start.sh <module...|module1,module2,...> [direct|dev] [report|headed] [--plain] [--dry-run]

Modules:
  tree-instance
  table-instance
  tree-login
  table-login
  tree-dashboard
  table-dashboard
  tree-measurement
  table-measurement
  tree-search
  table-search
  tree-sql
  table-sql
  tree-view
  table-view
  tree-auth
  table-auth
  tree-ai-analysis
  table-ai-analysis
  tree-trend
  table-trend
  tree-data-sync
  table-data-sync
  tree-audit
  table-audit
  tree-db-config
  table-db-config
  tree-full
  table-full
  all-models-full
  search-cleanup
  measurement-cleanup
  calculate-cleanup
  cleanup-all
  typecheck

  Examples:
    start.bat tree-instance direct
    start.bat table-instance direct
    start.bat tree-instance direct headed
    start.bat table-instance direct headed
    ./start.sh tree-instance direct
    ./start.sh table-instance direct
    start.bat tree-login,tree-instance,tree-dashboard direct headed
    start.bat tree-full direct
    start.bat tree-full dev headed
    start.bat table-full direct
    start.bat all-models-full direct
    ./start.sh all-models-full direct
    start.bat all-models-full direct report
    ./start.sh all-models-full direct report
    start.bat all-models-full dev headed
    ./start.sh all-models-full dev headed
    start.bat search-cleanup
    start.bat typecheck
  
Notes:
  direct  = connect directly to Workbench on ${realWorkbenchBaseUrl}
  dev     = open local frontend on ${devWorkbenchBaseUrl} and proxy API to ${devProxyApiUrl}
  report  = generate report without headed browser mode
  headed  = open browser and generate report
  --plain = run Playwright directly without the markdown/json report wrapper
  use explicit tree-* or table-* module names; legacy aliases like "instance" and "login" are no longer supported
  table-* modules without specs are recognized but will fail fast with "no automation spec implemented yet"
  tree-full / table-full / all-models-full can be combined with direct or dev runtime targets
  --dry-run = print resolved command without executing`);
}

function normalizeModuleToken(token) {
  return token.trim().toLowerCase();
}

function isLegacyAlias(moduleName) {
  return !moduleName.startsWith('tree-') && !moduleName.startsWith('table-') && moduleName !== 'all-models-full';
}

function parseArgs(argv) {
  const args = [...argv];
  const helpFlags = new Set(['help', '-h', '--help']);
  if (!args.length || args.some((arg) => helpFlags.has(arg.toLowerCase()))) {
    return { help: true };
  }

  let dryRun = false;
  let plain = false;
  const filteredArgs = [];
  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--plain') {
      plain = true;
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

  const deprecatedPreset = rawModules.find((moduleName) => deprecatedPresetAliases.has(moduleName));
  if (deprecatedPreset) {
    if (deprecatedPreset.startsWith('all-models-full')) {
      throw new Error(`The "${deprecatedPreset}" preset has been removed. Use "all-models-full" with an explicit runtime target, for example: all-models-full direct or all-models-full dev.`);
    }
    if (deprecatedPreset.startsWith('table-full')) {
      throw new Error(`The "${deprecatedPreset}" preset has been removed. Use "table-full" with an explicit runtime target, for example: table-full direct or table-full dev.`);
    }
    throw new Error(`The "${deprecatedPreset}" preset has been removed. Use "tree-full" with an explicit runtime target, for example: tree-full direct or tree-full dev.`);
  }

  const selectedSpecialCommand = rawModules.find((moduleName) => specialCommands.includes(moduleName));
  if (selectedSpecialCommand) {
    if (rawModules.length > 1) {
      throw new Error(`The "${selectedSpecialCommand}" command cannot be combined with other modules.`);
    }

    return {
      help: false,
      dryRun,
      plain,
      command: selectedSpecialCommand,
    };
  }

  const legacyAliasResolutions = [];
  const resolvedRawModules = rawModules.map((moduleName) => {
    const resolvedModuleName = moduleAliasMap.get(moduleName) ?? moduleName;
    if (resolvedModuleName !== moduleName && isLegacyAlias(moduleName)) {
      legacyAliasResolutions.push({
        input: moduleName,
        resolved: resolvedModuleName,
      });
    }
    return resolvedModuleName;
  });
  const uniqueModules = [];
  for (const moduleName of resolvedRawModules) {
    if (!uniqueModules.includes(moduleName)) {
      uniqueModules.push(moduleName);
    }
  }

  const allowedModules = new Set([...allModuleKeys, ...specialCommands, ...Object.keys(presetModuleMap)]);
  const invalidModules = uniqueModules.filter((moduleName) => !allowedModules.has(moduleName));
  if (invalidModules.length) {
    throw new Error(`Unsupported module(s): ${invalidModules.join(', ')}`);
  }

  if (legacyAliasResolutions.length) {
    const details = legacyAliasResolutions.map((item) => `${item.input} -> ${item.resolved}`).join(', ');
    throw new Error(`Legacy module aliases are no longer supported: ${details}. Use explicit tree-* or table-* module names.`);
  }

  const selectedPreset = uniqueModules.find((moduleName) => Object.prototype.hasOwnProperty.call(presetModuleMap, moduleName));
  if (selectedPreset && uniqueModules.length > 1) {
    throw new Error(`The "${selectedPreset}" preset cannot be combined with other modules.`);
  }

  const modules = selectedPreset ? [...presetModuleMap[selectedPreset]] : uniqueModules;
  const resolvedRuntimeTarget = runtimeTarget === 'real' || runtimeTarget === '9190' ? 'direct' : runtimeTarget === '8098' ? 'dev' : runtimeTarget;

  return {
    help: false,
    dryRun,
    plain,
    mode,
    legacyAliasResolutions,
    requestedModules: uniqueModules,
    modules,
    selectedPreset,
    runtimeTarget: resolvedRuntimeTarget || 'direct',
  };
}

function buildSpecList(modules) {
  const specs = [];
  for (const moduleName of modules) {
    const definition = moduleDefinitionMap.get(moduleName);
    if (!definition) {
      throw new Error(`Unsupported module "${moduleName}".`);
    }

    if (!definition.specs.length) {
      throw new Error(`The "${definition.displayName}" module is recognized, but no automation spec has been implemented yet.`);
    }

    for (const spec of definition.specs) {
      if (!specs.includes(spec)) {
        specs.push(spec);
      }
    }
  }
  return specs;
}

function buildReportKey(modules, mode, selectedPreset, runtimeTarget) {
  let baseKey = `${modules.join('-')}-real-report`;

  if (selectedPreset === 'tree-full') {
    baseKey = runtimeTarget === 'dev' ? 'tree-full-dev-report' : 'tree-full-report';
  } else if (selectedPreset === 'table-full') {
    baseKey = runtimeTarget === 'dev' ? 'table-full-dev-report' : 'table-full-report';
  } else if (selectedPreset === 'all-models-full') {
    baseKey = runtimeTarget === 'dev' ? 'all-models-full-dev-report' : 'all-models-full-report';
  }

  return mode === 'headed' ? baseKey.replace('-report', '-headed-report') : baseKey;
}

function buildReportCommandArgs(config) {
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

function buildPlainCommandArgs(config) {
  return [
    playwrightCliPath,
    'test',
    ...config.specs,
    '--project=chromium',
    '--workers=1',
    ...(config.mode === 'headed' ? ['--headed'] : []),
  ];
}

function buildRuntimeConfig(runtimeTarget) {
  const env = { ...process.env };

  if (runtimeTarget === 'dev') {
    env.PLAYWRIGHT_REAL_BACKEND = 'true';
    env.CONFIG_API_PROXY = devProxyApiUrl;
    env.PLAYWRIGHT_REAL_BASE_URL = realWorkbenchBaseUrl;
    env.PLAYWRIGHT_BASE_URL = devWorkbenchBaseUrl;
    env.PLAYWRIGHT_PORT = devPort;
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
  env.PLAYWRIGHT_REAL_BASE_URL = realWorkbenchBaseUrl;
  env.PLAYWRIGHT_BASE_URL = realWorkbenchBaseUrl;
  env.PLAYWRIGHT_PORT = directPort;
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

  if (parsed.command === 'search-cleanup' || parsed.command === 'measurement-cleanup' || parsed.command === 'calculate-cleanup' || parsed.command === 'cleanup-all') {
    const commandArgs = buildCleanupCommandArgs(parsed.command);

    console.log();
    console.log(`[E2E] command=${parsed.command}`);
    console.log(`[E2E] baseURL=${realWorkbenchBaseUrl}`);

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
  const reportKey = buildReportKey(parsed.modules, parsed.mode, parsed.selectedPreset, parsed.runtimeTarget);
  const runtime = buildRuntimeConfig(parsed.runtimeTarget);
  const commandArgs = parsed.plain
    ? buildPlainCommandArgs({
        specs,
        mode: parsed.mode,
      })
    : buildReportCommandArgs({
        specs,
        reportKey,
        mode: parsed.mode,
      });
  const requestedDisplayModules = parsed.requestedModules.map((moduleName) => moduleDefinitionMap.get(moduleName)?.displayName ?? moduleName).join(',');
  const executionMode = parsed.plain ? (parsed.mode === 'headed' ? 'headed-plain' : 'plain') : parsed.mode;

  console.log();
  console.log(`[E2E] modules=${parsed.requestedModules.join(',')}`);
  console.log(`[E2E] modulesDisplay=${requestedDisplayModules}`);
  console.log(`[E2E] mode=${executionMode}`);
  console.log(`[E2E] target=${runtime.runtimeTarget}`);
  console.log(`[E2E] baseURL=${runtime.baseURL}`);
  if (!parsed.plain) {
    console.log(`[E2E] reportKey=${reportKey}`);
  }
  console.log(`[E2E] specs=${specs.join(', ')}`);

  if (parsed.dryRun) {
    console.log('[E2E] dry-run=true');
    console.log(`[E2E] plain=${parsed.plain}`);
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
